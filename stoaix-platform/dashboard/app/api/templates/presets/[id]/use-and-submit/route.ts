import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GRAPH = 'https://graph.facebook.com/v19.0'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 2000

// ─── POST /api/templates/presets/[id]/use-and-submit ────────────────────────
// Copies a preset to the org (draft) then immediately submits to Meta.
// Combines /use + /submit in a single step for workflow activation UX.

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })
  if (!['admin', 'patron', 'yönetici'].includes(orgUser.role)) {
    return NextResponse.json({ error: 'Yetki yetersiz' }, { status: 403 })
  }

  // 1. Fetch the preset
  const { data: preset } = await service
    .from('message_templates')
    .select('*')
    .eq('id', params.id)
    .eq('is_preset', true)
    .single()

  if (!preset) return NextResponse.json({ error: 'Preset bulunamadı' }, { status: 404 })

  // 2. Copy preset to org (same logic as /use)
  let name = preset.name.replace(/^(dental|hair|aesthetics|general)_/, '')

  const { data: existing } = await service
    .from('message_templates')
    .select('name')
    .eq('organization_id', orgUser.organization_id)
    .like('name', `${name}%`)

  if (existing && existing.length > 0) {
    name = `${name}_${existing.length + 1}`
  }

  const { data: template, error: insertError } = await service
    .from('message_templates')
    .insert({
      organization_id: orgUser.organization_id,
      name,
      language:   preset.language,
      category:   preset.category,
      components: preset.components,
      status:     'draft',
      is_preset:  false,
      sector:     preset.sector,
      purpose:    preset.purpose,
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Bu isimde bir template zaten var' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // 3. Get WhatsApp credentials
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const waCreds = (org?.channel_config as any)?.whatsapp?.credentials
  if (!waCreds?.waba_id || !waCreds?.access_token) {
    // WA not connected — template stays as draft, return with warning
    return NextResponse.json({
      template,
      warning: 'WhatsApp bağlı değil. Template taslak olarak kaydedildi. WhatsApp bağlandıktan sonra Templates sayfasından Meta\'ya gönderebilirsiniz.',
    }, { status: 201 })
  }

  // 4. Submit to Meta (same logic as /submit)
  const EXAMPLE_VALUES = ['Max', '25.04.2026', '14:00', 'Beispiel', 'Muster']
  const componentsWithExamples = (template.components as any[]).map((comp: any) => {
    if (comp.type !== 'BODY' || !comp.text) return comp
    const vars = comp.text.match(/\{\{\d+\}\}/g)
    if (!vars || vars.length === 0) return comp
    if (comp.example) return comp
    return {
      ...comp,
      example: { body_text: [vars.map((_: any, i: number) => EXAMPLE_VALUES[i] ?? `Example${i + 1}`)] },
    }
  })

  const payload = {
    name:       template.name,
    language:   template.language,
    category:   template.category,
    components: componentsWithExamples,
  }

  let lastError: any = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt))
    }

    const metaRes = await fetch(`${GRAPH}/${waCreds.waba_id}/message_templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waCreds.access_token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    })

    const metaData = await metaRes.json()

    if (metaRes.ok && !metaData.error) {
      const { data: updated } = await service
        .from('message_templates')
        .update({
          status:          'pending',
          meta_template_id: metaData.id ?? null,
          rejection_reason: null,
          updated_at:      new Date().toISOString(),
        })
        .eq('id', template.id)
        .select()
        .single()

      return NextResponse.json({ template: updated, meta_id: metaData.id }, { status: 201 })
    }

    lastError = metaData.error
    console.error(`[presets/use-and-submit] Meta error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, JSON.stringify(metaData.error))

    const isTransient = metaData.error?.code === 1 || metaData.error?.code === 2 || metaData.error?.is_transient
    if (!isTransient) break
  }

  // Meta submission failed — template stays as draft
  const errCode = lastError?.code
  const errSubcode = lastError?.error_subcode
  const errUserMsg = lastError?.error_user_msg
  const errMsg = lastError?.message ?? 'Meta API hatası'

  let userMessage: string
  if (lastError?.is_transient || errCode === 1) {
    userMessage = 'Meta sunucuları geçici olarak yanıt vermiyor. Template taslak olarak kaydedildi.'
  } else if (errSubcode === 2388024) {
    userMessage = 'Bu isimde ve dilde bir template Meta\'da zaten mevcut. Template taslak olarak kaydedildi.'
  } else if (errCode === 100) {
    userMessage = errUserMsg || `Geçersiz parametre: ${errMsg}`
  } else if (errCode === 190) {
    userMessage = 'WhatsApp erişim anahtarı geçersiz. Template taslak olarak kaydedildi.'
  } else {
    userMessage = errUserMsg || errMsg
  }

  return NextResponse.json({
    template,
    warning: userMessage,
  }, { status: 201 })
}
