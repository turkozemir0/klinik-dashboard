import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function fetchSubscription(orgId: string) {
  const sb = getServiceClient()
  const { data } = await sb
    .from('org_subscriptions')
    .select('plan_id, status')
    .eq('organization_id', orgId)
    .single()
  return data
}

export async function fetchOverride(orgId: string, featureKey: string) {
  const sb = getServiceClient()
  const { data } = await sb
    .from('org_entitlement_overrides')
    .select('enabled, limit_override, expires_at')
    .eq('organization_id', orgId)
    .eq('feature_key', featureKey)
    .single()

  if (!data) return null

  // Süresi dolmuş override'ı yok say
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  return {
    enabled: data.enabled as boolean,
    limit_value: data.limit_override as number | null,
  }
}

export async function fetchPlanEntitlement(planId: string, featureKey: string) {
  const sb = getServiceClient()
  const { data } = await sb
    .from('plan_entitlements')
    .select('enabled, limit_value')
    .eq('plan_id', planId)
    .eq('feature_key', featureKey)
    .single()
  return data
}
