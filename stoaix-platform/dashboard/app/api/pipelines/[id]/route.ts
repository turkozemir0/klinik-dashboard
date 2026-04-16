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

// PATCH /api/pipelines/[id] — rename / recolor a pipeline
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  // Verify ownership
  const { data: pipeline } = await sb
    .from('pipelines')
    .select('organization_id, is_default')
    .eq('id', params.id)
    .single()

  if (!pipeline || pipeline.organization_id !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const updates: Record<string, any> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.color !== undefined) updates.color = body.color

  const { data, error } = await sb
    .from('pipelines')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pipeline: data })
}

// DELETE /api/pipelines/[id] — delete a custom pipeline
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  const { data: pipeline } = await sb
    .from('pipelines')
    .select('organization_id, is_default')
    .eq('id', params.id)
    .single()

  if (!pipeline || pipeline.organization_id !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (pipeline.is_default) {
    return NextResponse.json({ error: 'Cannot delete default pipeline' }, { status: 400 })
  }

  const { error } = await sb
    .from('pipelines')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
