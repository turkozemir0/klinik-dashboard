import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'

// GET /api/leads/kanban?status=new&q=xxx&page=0
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser && !superAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgId = orgUser?.organization_id
  if (orgId) {
    const ent = await checkEntitlement(orgId, 'leads_kanban')
    if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'leads_kanban' }, { status: 403 })
  }

  const sp = request.nextUrl.searchParams
  const status = sp.get('status')
  const q = sp.get('q')?.trim() ?? ''
  const page = parseInt(sp.get('page') ?? '0', 10)
  const PAGE = 30

  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })



  let contactIds: string[] | null = null

  // Arama varsa önce contacts tablosunda eşleşenleri bul
  if (q.length >= 1) {
    let cq = supabase
      .from('contacts')
      .select('id')
      .or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(500)
    if (orgId) cq = cq.eq('organization_id', orgId)

    const { data: contacts } = await cq
    contactIds = contacts?.map((c: any) => c.id) ?? []

    // Eşleşme yoksa boş döndür
    if (contactIds.length === 0) {
      return NextResponse.json({ leads: [], count: 0 })
    }
  }

  const from = page * PAGE
  const to = from + PAGE - 1

  let query = supabase
    .from('leads')
    .select(
      'id,qualification_score,status,source_channel,collected_data,updated_at,contact_id,contacts(phone,full_name)',
      { count: 'exact' }
    )
    .eq('status', status)
    .order('qualification_score', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (orgId) query = query.eq('organization_id', orgId)
  if (contactIds !== null) query = query.in('contact_id', contactIds)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: data ?? [], count: count ?? 0 })
}
