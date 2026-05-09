import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = getServiceClient()

  const { data: orgUser } = await svc
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgId = orgUser?.organization_id

  if (!orgId) {
    const { data: sa } = await svc.from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()
    if (!sa) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data: firstOrg } = await svc.from('organizations').select('id').eq('status', 'active').limit(1).maybeSingle()
    orgId = firstOrg?.id
  }

  if (!orgId) return NextResponse.json({ leads: [], count: 0 })

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '0', 10)
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = 50
  const offset = page * limit

  // If search query, find matching contact IDs first
  let contactIdFilter: string[] | null = null
  if (q.length >= 2) {
    const pattern = `%${q}%`
    const { data: matched } = await svc
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .or(`full_name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`)
      .limit(200)
    contactIdFilter = (matched ?? []).map((c: any) => c.id)
    if (contactIdFilter.length === 0) return NextResponse.json({ leads: [], count: 0 })
  }

  let query = svc
    .from('leads')
    .select(
      'id, status, qualification_score, collected_data, created_at, contact_id, contacts(full_name, phone, email, metadata)',
      { count: 'exact' }
    )
    .eq('organization_id', orgId)
    .eq('source_channel', 'web_form')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (contactIdFilter !== null) {
    query = query.in('contact_id', contactIdFilter)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[web-forms] query error:', error)
    return NextResponse.json({ error: 'Sorgu hatası' }, { status: 500 })
  }

  const leads = (data ?? []).map((row: any) => {
    const contact = row.contacts ?? {}
    const metadata = contact.metadata ?? {}
    return {
      id: row.id,
      status: row.status,
      qualification_score: row.qualification_score,
      collected_data: row.collected_data ?? {},
      created_at: row.created_at,
      full_name: contact.full_name ?? null,
      phone: contact.phone ?? null,
      email: contact.email ?? null,
      city: metadata.city ?? row.collected_data?.sehir ?? row.collected_data?.city ?? null,
      country: metadata.country ?? row.collected_data?.ulke ?? row.collected_data?.country ?? null,
    }
  })

  return NextResponse.json({ leads, count: count ?? 0 })
}
