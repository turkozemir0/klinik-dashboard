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

// ─── POST /api/templates/[id]/submit ─────────────────────────────────────────
// Submits a draft template to Meta for approval.
// Requires org to have channel_config.whatsapp.credentials.waba_id + access_token.

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

  // Fetch template
  const { data: template } = await service
    .from('message_templates')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .single()

  if (!template) return NextResponse.json({ error: 'Template bulunamadı' }, { status: 404 })
  if (template.status !== 'draft' && template.status !== 'rejected') {
    return NextResponse.json({ error: 'Sadece taslak veya reddedilen templateler gönderilebilir' }, { status: 400 })
  }

  // Get WhatsApp credentials
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const waCreds = (org?.channel_config as any)?.whatsapp?.credentials
  if (!waCreds?.waba_id || !waCreds?.access_token) {
    return NextResponse.json({
      error: 'WhatsApp bağlı değil veya WABA ID eksik. Önce WhatsApp hesabınızı bağlayın.'
    }, { status: 400 })
  }

  // Auto-add example values for components with variables (Meta requires this)
  const EXAMPLE_VALUES = ['Max', '25.04.2026', '14:00', 'Beispiel', 'Muster']
  const componentsWithExamples = (template.components as any[]).map((comp: any) => {
    if (comp.type !== 'BODY' || !comp.text) return comp
    const vars = comp.text.match(/\{\{\d+\}\}/g)
    if (!vars || vars.length === 0) return comp
    if (comp.example) return comp // already has examples
    return {
      ...comp,
      example: { body_text: [vars.map((_: any, i: number) => EXAMPLE_VALUES[i] ?? `Beispiel${i + 1}`)] },
    }
  })

  const payload = {
    name:       template.name,
    language:   template.language,
    category:   template.category,
    components: componentsWithExamples,
  }

  // Submit with retry for transient errors
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
      // Success — update template status
      const { data: updated } = await service
        .from('message_templates')
        .update({
          status:          'pending',
          meta_template_id: metaData.id ?? null,
          rejection_reason: null,
          updated_at:      new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single()

      return NextResponse.json({ template: updated, meta_id: metaData.id })
    }

    lastError = metaData.error
    console.error(`[templates/submit] Meta error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, JSON.stringify(metaData.error))

    // Only retry on transient errors (code 1 or 2)
    const isTransient = metaData.error?.code === 1 || metaData.error?.code === 2 || metaData.error?.is_transient
    if (!isTransient) break
  }

  // All retries failed — return user-friendly error
  const errCode = lastError?.code
  const errSubcode = lastError?.error_subcode
  const errUserMsg = lastError?.error_user_msg
  const errMsg = lastError?.message ?? 'Meta API hatası'

  let userMessage: string
  if (lastError?.is_transient || errCode === 1) {
    userMessage = 'Meta sunucuları geçici olarak yanıt vermiyor. Lütfen birkaç dakika sonra tekrar deneyin.'
  } else if (errSubcode === 2388024) {
    userMessage = 'Bu isimde ve dilde bir template Meta\'da zaten mevcut. Lütfen farklı bir isim kullanın.'
  } else if (errCode === 100) {
    userMessage = errUserMsg || `Geçersiz parametre: ${errMsg}`
  } else if (errCode === 190) {
    userMessage = 'WhatsApp erişim anahtarı geçersiz veya süresi dolmuş. Lütfen WhatsApp bağlantınızı yenileyin.'
  } else {
    userMessage = errUserMsg || errMsg
  }

  return NextResponse.json({ error: userMessage, retryable: lastError?.is_transient ?? false }, { status: 400 })
}
