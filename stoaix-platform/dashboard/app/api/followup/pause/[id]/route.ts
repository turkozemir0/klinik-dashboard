import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveOrgId(): Promise<string | null> {
  const server = createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return null

  const { data: sa } = await server
    .from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()
  if (sa) {
    const { data: firstOrg } = await server
      .from('organizations').select('id').eq('status', 'active')
      .order('created_at', { ascending: true }).limit(1).maybeSingle()
    return firstOrg?.id ?? null
  }

  const { data: ou } = await server
    .from('org_users').select('organization_id').eq('user_id', user.id).maybeSingle()
  return ou?.organization_id ?? null
}

// PATCH — is_paused toggle (true | false)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const orgId = await resolveOrgId()
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { is_paused: boolean }
  if (typeof body.is_paused !== 'boolean') {
    return NextResponse.json({ error: 'is_paused (boolean) zorunlu' }, { status: 400 })
  }

  const sb = getServiceClient()

  // Güvenlik: sadece bu org'un taskını güncelle; herhangi bir task_type allowed
  const { error } = await sb
    .from('follow_up_tasks')
    .update({ is_paused: body.is_paused })
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .eq('status', 'pending') // sadece pending task'lar pause edilebilir

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, is_paused: body.is_paused })
}
