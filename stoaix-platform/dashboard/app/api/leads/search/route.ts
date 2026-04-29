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

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const svc = getServiceClient()

  // Get user's org
  const { data: orgUser } = await svc
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgId = orgUser?.organization_id

  if (!orgId) {
    const { data: sa } = await svc.from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()
    if (!sa) return NextResponse.json({ results: [] })
    // Super admin: use first active org
    const { data: firstOrg } = await svc.from('organizations').select('id').eq('status', 'active').limit(1).maybeSingle()
    orgId = firstOrg?.id
  }

  if (!orgId) return NextResponse.json({ results: [] })

  const pattern = `%${q}%`

  // Find matching contact IDs
  const { data: matchedContacts } = await svc
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .or(`full_name.ilike.${pattern},phone.ilike.${pattern}`)
    .limit(20)

  const contactIds = (matchedContacts ?? []).map(c => c.id)
  if (contactIds.length === 0) return NextResponse.json({ results: [] })

  // Fetch leads for those contacts
  const { data: leads } = await svc
    .from('leads')
    .select('id, qualification_score, status, source_channel, contact:contacts(id, full_name, phone)')
    .eq('organization_id', orgId)
    .in('contact_id', contactIds)
    .order('created_at', { ascending: false })
    .limit(8)

  return NextResponse.json({
    results: (leads ?? []).map((l: any) => ({
      id: l.id,
      name: l.contact?.full_name || null,
      phone: l.contact?.phone || null,
      score: l.qualification_score,
      status: l.status,
      channel: l.source_channel,
    })),
  })
}
