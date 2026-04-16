import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { checkEntitlement } from '@/lib/entitlements'
import { FEATURE_METRIC_MAP } from '@/lib/entitlements/registry'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/billing/limits — Tüm feature entitlements (settings modüller sekmesi + sidebar için)
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

  const orgId = orgUser.organization_id

  // Subscription bilgisi
  const { data: sub } = await service
    .from('org_subscriptions')
    .select('plan_id, status, trial_ends_at, current_period_end, grace_period_ends_at, cancel_at_period_end')
    .eq('organization_id', orgId)
    .maybeSingle()

  // Tüm feature'ları kontrol et
  const featureKeys = Object.keys(FEATURE_METRIC_MAP)
  const entitlements: Record<string, any> = {}

  await Promise.all(
    featureKeys.map(async (key) => {
      const ent = await checkEntitlement(orgId, key)
      entitlements[key] = ent
    })
  )

  return NextResponse.json({
    plan_id: sub?.plan_id ?? null,       // null = henüz plan seçilmemiş (legacy değil)
    status: sub?.status ?? 'no_plan',
    trial_ends_at: sub?.trial_ends_at ?? null,
    current_period_end: sub?.current_period_end ?? null,
    grace_period_ends_at: sub?.grace_period_ends_at ?? null,
    cancel_at_period_end: sub?.cancel_at_period_end ?? false,
    entitlements,
  })
}
