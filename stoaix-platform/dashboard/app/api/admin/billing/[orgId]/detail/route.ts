import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const service = getServiceClient()
  const { data } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

// GET — Org billing detayı: org + sub + overrides + features + entitlements
export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = getServiceClient()

  const [orgRes, subRes, overridesRes, featuresRes] = await Promise.all([
    service
      .from('organizations')
      .select('id, name, slug, sector, status')
      .eq('id', params.orgId)
      .single(),
    service
      .from('org_subscriptions')
      .select('organization_id, plan_id, status, stripe_customer_id, current_period_end, trial_ends_at')
      .eq('organization_id', params.orgId)
      .maybeSingle(),
    service
      .from('org_entitlement_overrides')
      .select('id, feature_key, enabled, limit_override, reason, expires_at, created_at')
      .eq('organization_id', params.orgId)
      .order('feature_key', { ascending: true }),
    service
      .from('features')
      .select('key, module, name, is_boolean, usage_metric')
      .order('module', { ascending: true }),
  ])

  if (orgRes.error || !orgRes.data) {
    return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })
  }

  const planId = subRes.data?.plan_id ?? 'legacy'

  // Plan entitlements'ı çek (eğer plan_entitlements tablosu varsa)
  let entitlements: any[] = []
  if (planId && planId !== 'legacy') {
    const { data: ents } = await service
      .from('plan_entitlements')
      .select('feature_key, enabled, limit_value')
      .eq('plan_id', planId)
    entitlements = ents ?? []
  }

  return NextResponse.json({
    org: orgRes.data,
    sub: subRes.data,
    overrides: overridesRes.data ?? [],
    features: featuresRes.data ?? [],
    entitlements,
  })
}
