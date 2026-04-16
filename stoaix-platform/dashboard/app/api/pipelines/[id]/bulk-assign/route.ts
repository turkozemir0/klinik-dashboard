import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/pipelines/[id]/bulk-assign
// Body: { stage_id: string, lead_ids: string[] }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = orgUser.organization_id

  const body = await request.json()
  const { stage_id, lead_ids } = body

  if (!stage_id || typeof stage_id !== 'string') {
    return NextResponse.json({ error: 'stage_id required' }, { status: 400 })
  }
  if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids must be a non-empty array' }, { status: 400 })
  }
  if (lead_ids.length > 200) {
    return NextResponse.json({ error: 'Maximum 200 leads per bulk operation' }, { status: 400 })
  }

  const sb = getServiceClient()

  // Verify pipeline belongs to org
  const { data: pipeline } = await sb
    .from('pipelines')
    .select('organization_id')
    .eq('id', params.id)
    .single()

  if (!pipeline || pipeline.organization_id !== orgId) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 })
  }

  // Verify stage belongs to pipeline
  const { data: stage } = await sb
    .from('pipeline_stages')
    .select('id')
    .eq('id', stage_id)
    .eq('pipeline_id', params.id)
    .single()

  if (!stage) {
    return NextResponse.json({ error: 'Stage not found in this pipeline' }, { status: 404 })
  }

  // Bulk upsert lead_pipeline_stages
  const rows = lead_ids.map((lead_id: string) => ({
    lead_id,
    pipeline_id: params.id,
    stage_id,
    moved_at: new Date().toISOString(),
    moved_by: user.id,
  }))

  const { error } = await sb
    .from('lead_pipeline_stages')
    .upsert(rows, { onConflict: 'lead_id,pipeline_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: lead_ids.length })
}
