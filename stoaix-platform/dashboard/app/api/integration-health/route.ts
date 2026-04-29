import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIntegrationHealth } from '@/lib/integration-health'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const health = await getIntegrationHealth(orgUser.organization_id)
  return NextResponse.json(health)
}
