import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — Admin toggle setup_included for an org
export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: admin } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { setup_included } = await req.json()

  const { error } = await service
    .from('organizations')
    .update({ setup_included: !!setup_included })
    .eq('id', params.orgId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
