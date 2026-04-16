import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getUser(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return orgUser ? { userId: user.id, orgId: orgUser.organization_id } : null
}

// PUT /api/pipelines/[id]/leads/[leadId] — assign lead to a stage in this pipeline
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; leadId: string } }
) {
  const supabase = createClient()
  const auth = await getUser(supabase)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { stage_id } = body
  if (!stage_id) return NextResponse.json({ error: 'stage_id required' }, { status: 400 })

  const sb = getServiceClient()

  // Verify pipeline belongs to org
  const { data: pipeline } = await sb
    .from('pipelines')
    .select('organization_id')
    .eq('id', params.id)
    .single()

  if (!pipeline || pipeline.organization_id !== auth.orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verify lead belongs to org
  const { data: lead } = await sb
    .from('leads')
    .select('organization_id')
    .eq('id', params.leadId)
    .single()

  if (!lead || lead.organization_id !== auth.orgId) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Upsert lead_pipeline_stages
  const { error } = await sb
    .from('lead_pipeline_stages')
    .upsert(
      {
        lead_id: params.leadId,
        pipeline_id: params.id,
        stage_id,
        moved_at: new Date().toISOString(),
        moved_by: auth.userId,
      },
      { onConflict: 'lead_id,pipeline_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/pipelines/[id]/leads/[leadId] — remove lead from pipeline
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; leadId: string } }
) {
  const supabase = createClient()
  const auth = await getUser(supabase)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  const { data: pipeline } = await sb
    .from('pipelines')
    .select('organization_id')
    .eq('id', params.id)
    .single()

  if (!pipeline || pipeline.organization_id !== auth.orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await sb
    .from('lead_pipeline_stages')
    .delete()
    .eq('lead_id', params.leadId)
    .eq('pipeline_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
