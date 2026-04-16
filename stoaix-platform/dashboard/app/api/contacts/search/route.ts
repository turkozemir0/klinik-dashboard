import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'

// GET /api/contacts/search?q=PHONE_OR_NAME
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
    const ent = await checkEntitlement(orgId, 'leads_manage')
    if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'leads_manage' }, { status: 403 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])



  let query = supabase
    .from('contacts')
    .select('id, full_name, phone, leads!leads_contact_id_fkey(id)')
    .or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`)
    .limit(10)

  if (orgId) {
    query = query.eq('organization_id', orgId)
  }

  const { data: contacts, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = (contacts ?? []).map((c: any) => ({
    contact_id: c.id,
    lead_id: c.leads?.[0]?.id ?? null,
    full_name: c.full_name,
    phone: c.phone,
  }))

  return NextResponse.json(results)
}
