import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveOrgId(req: NextRequest): Promise<string | null> {
  const server = createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return null

  // Super admin → org_id query param veya ilk aktif org
  const { data: sa } = await server
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (sa) {
    const orgId = req.nextUrl.searchParams.get('org_id')
    if (orgId) return orgId
    const { data: firstOrg } = await server
      .from('organizations')
      .select('id')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return firstOrg?.id ?? null
  }

  const { data: ou } = await server
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return ou?.organization_id ?? null
}

export async function GET(req: NextRequest) {
  const orgId = await resolveOrgId(req)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  const [{ data: pb }, { data: org }] = await Promise.all([
    sb.from('agent_playbooks')
      .select('id, routing_rules')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .in('channel', ['voice', 'all'])
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from('organizations')
      .select('working_hours')
      .eq('id', orgId)
      .maybeSingle(),
  ])

  const raw = pb?.routing_rules
  const routing_rules = Array.isArray(raw) || !raw
    ? { transfer_numbers: {}, rules: Array.isArray(raw) ? raw : [] }
    : raw

  return NextResponse.json({
    playbook_id: pb?.id ?? null,
    routing_rules,
    working_hours: org?.working_hours ?? {},
  })
}

export async function PATCH(req: NextRequest) {
  const orgId = await resolveOrgId(req)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { routing_rules, working_hours } = body as {
    routing_rules?: object
    working_hours?: object
  }

  const sb = getServiceClient()
  const errors: string[] = []

  if (routing_rules !== undefined) {
    const { data: pb } = await sb
      .from('agent_playbooks')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .in('channel', ['voice', 'all'])
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pb) {
      const { error } = await sb
        .from('agent_playbooks')
        .update({ routing_rules, updated_at: new Date().toISOString() })
        .eq('id', pb.id)
      if (error) errors.push('playbook: ' + error.message)
    } else {
      errors.push('Aktif voice playbook bulunamadı')
    }
  }

  if (working_hours !== undefined) {
    const { error } = await sb
      .from('organizations')
      .update({ working_hours })
      .eq('id', orgId)
    if (error) errors.push('org: ' + error.message)
  }

  if (errors.length) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
