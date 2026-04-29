import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { demoWriteBlock } from '@/lib/demo-guard'

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { phone, email, city, country } = body

  const service = createServiceClient()

  // Get org from org_users
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const blocked = demoWriteBlock(orgUser.organization_id)
  if (blocked) return blocked

  const { error } = await service
    .from('organizations')
    .update({ phone, email, city, country })
    .eq('id', orgUser.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
