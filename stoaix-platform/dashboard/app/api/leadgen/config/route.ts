import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── GET /api/leadgen/config ────────────────────────────────────────────────
// Returns active_form_ids from channel_config.meta_leadgen
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const config = (org?.channel_config ?? {}) as any
  return NextResponse.json({
    active_form_ids: config?.meta_leadgen?.active_form_ids ?? [],
  })
}

// ─── PATCH /api/leadgen/config ──────────────────────────────────────────────
// Body: { form_ids: ["123", "456"] } — max 5
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const { form_ids } = body ?? {}
  if (!Array.isArray(form_ids)) {
    return NextResponse.json({ error: 'form_ids array olmalı' }, { status: 400 })
  }
  if (form_ids.length > 5) {
    return NextResponse.json({ error: 'En fazla 5 form seçilebilir' }, { status: 400 })
  }
  // Validate each ID is a numeric string
  if (form_ids.some((id: any) => typeof id !== 'string' || !/^\d+$/.test(id))) {
    return NextResponse.json({ error: 'Geçersiz form ID formatı' }, { status: 400 })
  }

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const allowedRoles = ['admin', 'patron', 'yönetici']
  if (!allowedRoles.includes(orgUser.role)) {
    return NextResponse.json({ error: 'Yetki yetersiz' }, { status: 403 })
  }

  // Fetch current config to merge (preserve Instagram/WA/etc credentials)
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const currentConfig = (org?.channel_config ?? {}) as any
  const currentLeadgen = currentConfig.meta_leadgen ?? {}

  // connected_at logic:
  // - If form_ids is non-empty and no connected_at exists → set connected_at now
  // - If form_ids is empty → reset connected_at and last_sync_at
  let connected_at = currentLeadgen.connected_at ?? null
  let last_sync_at = currentLeadgen.last_sync_at ?? null

  if (form_ids.length > 0 && !connected_at) {
    connected_at = new Date().toISOString()
  } else if (form_ids.length === 0) {
    connected_at = null
    last_sync_at = null
  }

  const updatedConfig = {
    ...currentConfig,
    meta_leadgen: {
      ...currentLeadgen,
      active_form_ids: form_ids,
      connected_at,
      last_sync_at,
    },
  }

  const { error: updateError } = await service
    .from('organizations')
    .update({ channel_config: updatedConfig })
    .eq('id', orgUser.organization_id)

  if (updateError) {
    console.error('[leadgen/config] DB update error:', updateError)
    return NextResponse.json({ error: 'Kayıt başarısız' }, { status: 500 })
  }

  return NextResponse.json({ active_form_ids: form_ids })
}
