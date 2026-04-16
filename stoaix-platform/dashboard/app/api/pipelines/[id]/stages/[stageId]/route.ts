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

// PATCH /api/pipelines/[id]/stages/[stageId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
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

  const body = await request.json()
  const updates: Record<string, any> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.color !== undefined) updates.color = body.color
  if (body.position !== undefined) updates.position = body.position

  const { data, error } = await sb
    .from('pipeline_stages')
    .update(updates)
    .eq('id', params.stageId)
    .eq('pipeline_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ stage: data })
}

// DELETE /api/pipelines/[id]/stages/[stageId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
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

  // Verify stage is not system stage
  const { data: stage } = await sb
    .from('pipeline_stages')
    .select('is_system, position')
    .eq('id', params.stageId)
    .eq('pipeline_id', params.id)
    .single()

  if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 })
  if (stage.is_system) return NextResponse.json({ error: 'Cannot delete system stage' }, { status: 400 })

  // Move leads in this stage to the first stage of the pipeline (position=0)
  const { data: firstStage } = await sb
    .from('pipeline_stages')
    .select('id')
    .eq('pipeline_id', params.id)
    .neq('id', params.stageId)
    .order('position', { ascending: true })
    .limit(1)
    .single()

  if (firstStage) {
    await sb
      .from('lead_pipeline_stages')
      .update({ stage_id: firstStage.id, moved_at: new Date().toISOString() })
      .eq('pipeline_id', params.id)
      .eq('stage_id', params.stageId)
  }

  const { error } = await sb
    .from('pipeline_stages')
    .delete()
    .eq('id', params.stageId)
    .eq('pipeline_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
