import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/org/members — Org üyeleri (atama dropdown için)
export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = getServiceClient()

  // Get all members of the org
  const { data: members, error } = await service
    .from('org_users')
    .select('user_id, role')
    .eq('organization_id', orgUser.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get user emails from auth
  const userIds = (members ?? []).map(m => m.user_id)
  const memberList = []

  for (const m of members ?? []) {
    const { data: authUser } = await service.auth.admin.getUserById(m.user_id)
    memberList.push({
      user_id: m.user_id,
      role: m.role,
      email: authUser?.user?.email ?? m.user_id,
      name: authUser?.user?.user_metadata?.full_name ?? authUser?.user?.email ?? m.user_id,
    })
  }

  return NextResponse.json(memberList)
}
