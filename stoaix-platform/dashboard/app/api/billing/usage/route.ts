import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { currentBillingPeriod } from '@/lib/entitlements'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/billing/usage — Aylık kullanım sayaçları (sidebar + usage sayfası için)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const period = currentBillingPeriod()
  const { data: counters } = await service
    .from('usage_counters')
    .select('metric, used_value')
    .eq('organization_id', orgUser.organization_id)
    .eq('billing_period', period)

  const usage: Record<string, number> = {}
  for (const row of counters ?? []) {
    usage[row.metric] = row.used_value
  }

  return NextResponse.json({ period, usage })
}
