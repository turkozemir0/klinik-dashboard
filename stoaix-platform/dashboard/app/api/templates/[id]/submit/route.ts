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

  // Submit to Meta Graph API
  const metaRes = await fetch(`${GRAPH}/${waCreds.waba_id}/message_templates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${waCreds.access_token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      name:       template.name,
      language:   template.language,
      category:   template.category,
      components: template.components,
    }),
  })

  const metaData = await metaRes.json()

  if (!metaRes.ok || metaData.error) {
    const msg = metaData.error?.message ?? 'Meta API hatası'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Update template status
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
