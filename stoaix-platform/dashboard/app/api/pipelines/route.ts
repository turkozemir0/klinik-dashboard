import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { checkEntitlement } from '@/lib/entitlements'

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

// GET /api/pipelines — list all pipelines with stages
export async function GET() {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()
  const { data: pipelines, error } = await sb
    .from('pipelines')
    .select('*, stages:pipeline_stages(id, pipeline_id, name, color, position, maps_to_status, is_system)')
    .eq('organization_id', orgId)
    .order('position', { ascending: true })
    .order('position', { foreignTable: 'pipeline_stages', ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pipelines: pipelines ?? [] })
}

// POST /api/pipelines — create a new custom pipeline
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Entitlement check
  const ent = await checkEntitlement(orgId, 'multi_pipeline')
  if (!ent.enabled) {
    return NextResponse.json({ error: 'upgrade_required', feature: 'multi_pipeline' }, { status: 403 })
  }

  // Limit check
  if (ent.limit !== null) {
    const sb = getServiceClient()
    const { count } = await sb
      .from('pipelines')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    if ((count ?? 0) >= ent.limit) {
      return NextResponse.json({ error: 'usage_limit_exceeded', limit: ent.limit }, { status: 403 })
    }
  }

  const body = await request.json()
  const { name, description, color } = body
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const sb = getServiceClient()

  // Get max position
  const { data: existing } = await sb
    .from('pipelines')
    .select('position')
    .eq('organization_id', orgId)
    .order('position', { ascending: false })
    .limit(1)

  const position = (existing?.[0]?.position ?? -1) + 1

  const { data, error } = await sb
    .from('pipelines')
    .insert({
      organization_id: orgId,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || '#6366f1',
      is_default: false,
      position,
    })
    .select('*, stages:pipeline_stages(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pipeline: data }, { status: 201 })
}
