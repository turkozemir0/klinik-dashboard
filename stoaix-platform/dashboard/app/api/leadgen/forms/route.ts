import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GRAPH = 'https://graph.facebook.com/v19.0'

// ─── GET /api/leadgen/forms ─────────────────────────────────────────────────
// Lists all leadgen forms for the org's Facebook Page.
export async function GET() {
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

  const allowedRoles = ['admin', 'patron', 'yönetici', 'satisci']
  if (!allowedRoles.includes(orgUser.role)) {
    return NextResponse.json({ error: 'Yetki yetersiz' }, { status: 403 })
  }

  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const config = (org?.channel_config ?? {}) as any
  const igCreds = config?.instagram?.credentials
  if (!igCreds?.access_token || !igCreds?.fb_page_id) {
    return NextResponse.json({ error: 'instagram_not_connected' }, { status: 400 })
  }

  const { access_token, fb_page_id } = igCreds

  const res = await fetch(
    `${GRAPH}/${fb_page_id}/leadgen_forms?fields=id,name,status,leads_count,locale&access_token=${access_token}`
  )
  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[leadgen/forms] Meta API error:', data.error)
    return NextResponse.json(
      { error: data.error?.message ?? 'Meta API hatası' },
      { status: res.status === 401 ? 401 : 502 }
    )
  }

  return NextResponse.json({ forms: data.data ?? [] })
}
