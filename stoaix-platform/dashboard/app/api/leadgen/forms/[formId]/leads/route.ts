import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GRAPH = 'https://graph.facebook.com/v19.0'

// ─── GET /api/leadgen/forms/[formId]/leads ──────────────────────────────────
// Lists leads for a specific form.
// Query params: ?after=cursor&limit=25
export async function GET(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  const formId = params.formId
  if (!/^\d+$/.test(formId)) {
    return NextResponse.json({ error: 'Geçersiz form ID' }, { status: 400 })
  }

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
  if (!igCreds?.access_token) {
    return NextResponse.json({ error: 'instagram_not_connected' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const after = searchParams.get('after') ?? ''
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '25', 10) || 25, 1), 100)

  let url = `${GRAPH}/${formId}/leads?fields=id,created_time,field_data,ad_name,campaign_name&limit=${limit}&access_token=${igCreds.access_token}`
  if (after) url += `&after=${encodeURIComponent(after)}`

  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[leadgen/leads] Meta API error:', data.error)
    return NextResponse.json(
      { error: data.error?.message ?? 'Meta API hatası' },
      { status: res.status === 401 ? 401 : 502 }
    )
  }

  return NextResponse.json({
    leads: data.data ?? [],
    paging: data.paging ?? null,
  })
}
