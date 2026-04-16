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

async function verifyPipelineOwnership(sb: ReturnType<typeof getServiceClient>, pipelineId: string, orgId: string) {
  const { data } = await sb
    .from('pipelines')
    .select('organization_id, is_default')
    .eq('id', pipelineId)
    .single()
  return data?.organization_id === orgId ? data : null
}

// GET /api/pipelines/[id]/stages
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()
  const pipeline = await verifyPipelineOwnership(sb, params.id, orgId)
  if (!pipeline) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await sb
    .from('pipeline_stages')
    .select('*')
    .eq('pipeline_id', params.id)
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ stages: data ?? [] })
}

// POST /api/pipelines/[id]/stages — add a stage to a custom pipeline
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()
  const pipeline = await verifyPipelineOwnership(sb, params.id, orgId)
  if (!pipeline) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (pipeline.is_default) {
    return NextResponse.json({ error: 'Cannot add stages to default pipeline' }, { status: 400 })
  }

  const body = await request.json()
  const { name, color } = body
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  // Get max position
  const { data: existing } = await sb
    .from('pipeline_stages')
    .select('position')
    .eq('pipeline_id', params.id)
    .order('position', { ascending: false })
    .limit(1)

  const position = (existing?.[0]?.position ?? -1) + 1

  const { data, error } = await sb
    .from('pipeline_stages')
    .insert({
      pipeline_id: params.id,
      name: name.trim(),
      color: color || '#6b7280',
      position,
      is_system: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ stage: data }, { status: 201 })
}
