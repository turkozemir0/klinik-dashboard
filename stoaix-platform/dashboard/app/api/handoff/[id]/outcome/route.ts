import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveOrgIdAndRole(): Promise<{ orgId: string | null; role: string | null }> {
  const server = createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { orgId: null, role: null }

  const { data: sa } = await server
    .from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()
  if (sa) {
    const { data: firstOrg } = await server
      .from('organizations').select('id').eq('status', 'active')
      .order('created_at', { ascending: true }).limit(1).maybeSingle()
    return { orgId: firstOrg?.id ?? null, role: 'admin' }
  }

  const { data: ou } = await server
    .from('org_users').select('organization_id, role').eq('user_id', user.id).maybeSingle()
  return { orgId: ou?.organization_id ?? null, role: ou?.role ?? null }
}

// PATCH — handoff_logs outcome güncelle
// Body: { outcome: 'converted'|'no_answer'|'lost'|'in_progress', notes?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { orgId, role } = await resolveOrgIdAndRole()
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Sadece admin/yönetici/satisci günceller
  if (!['admin', 'yönetici', 'satisci'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as {
    outcome?: string
    notes?: string
  }

  const validOutcomes = ['converted', 'no_answer', 'lost', 'in_progress']
  if (body.outcome && !validOutcomes.includes(body.outcome)) {
    return NextResponse.json({ error: 'Geçersiz outcome değeri' }, { status: 400 })
  }

  const sb = getServiceClient()

  const updates: Record<string, any> = {}
  if (body.outcome !== undefined) {
    updates.handoff_outcome = body.outcome
    updates.outcome_at      = new Date().toISOString()
  }
  if (body.notes !== undefined) updates.outcome_notes = body.notes

  const { error } = await sb
    .from('handoff_logs')
    .update(updates)
    .eq('id', params.id)
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
