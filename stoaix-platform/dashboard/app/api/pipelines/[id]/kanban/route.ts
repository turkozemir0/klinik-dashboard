import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getOrgId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return orgUser?.organization_id ?? null
}

// GET /api/pipelines/[id]/kanban?stage_id=xxx&q=&page=0
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  // Verify pipeline belongs to org
  const { data: pipeline } = await sb
    .from('pipelines')
    .select('organization_id')
    .eq('id', params.id)
    .single()

  if (!pipeline || pipeline.organization_id !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const sp = request.nextUrl.searchParams
  const stageId = sp.get('stage_id')
  const q = sp.get('q')?.trim() ?? ''
  const page = parseInt(sp.get('page') ?? '0', 10)
  const PAGE = 20

  if (!stageId) return NextResponse.json({ error: 'stage_id required' }, { status: 400 })

  let leadIds: string[] | null = null

  if (q.length >= 1) {
    const { data: contacts } = await sb
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(500)

    const cIds = contacts?.map((c: any) => c.id) ?? []
    if (cIds.length === 0) return NextResponse.json({ leads: [], count: 0 })

    const { data: matchingLeads } = await sb
      .from('leads')
      .select('id')
      .eq('organization_id', orgId)
      .in('contact_id', cIds)
      .limit(500)

    leadIds = matchingLeads?.map((l: any) => l.id) ?? []
    if (leadIds.length === 0) return NextResponse.json({ leads: [], count: 0 })
  }

  const from = page * PAGE
  const to = from + PAGE - 1

  let query = sb
    .from('lead_pipeline_stages')
    .select(
      'lead_id, leads(id, qualification_score, collected_data, updated_at, status, source_channel, contacts(phone, full_name))',
      { count: 'exact' }
    )
    .eq('pipeline_id', params.id)
    .eq('stage_id', stageId)
    .range(from, to)

  if (leadIds !== null) query = query.in('lead_id', leadIds)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const leads = (data ?? []).map((row: any) => row.leads).filter(Boolean)

  return NextResponse.json({ leads, count: count ?? 0 })
}
