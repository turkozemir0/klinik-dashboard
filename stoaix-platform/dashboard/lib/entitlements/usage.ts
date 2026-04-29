import { createClient } from '@supabase/supabase-js'
import { invalidateCache } from './cache'
import { featureKeyToMetric } from './registry'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Format: '2026-04'
export function currentBillingPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function incrementUsage(
  orgId: string,
  featureKey: string,
  amount = 1
): Promise<void> {
  const metric = featureKeyToMetric(featureKey)
  if (!metric) return

  const period = currentBillingPeriod()
  const sb = getServiceClient()

  await sb.rpc('increment_usage', {
    p_org_id: orgId,
    p_period: period,
    p_metric: metric,
    p_amount: amount,
  })

  invalidateCache(orgId)
}

export async function decrementUsage(
  orgId: string,
  featureKey: string,
  amount = 1
): Promise<void> {
  const metric = featureKeyToMetric(featureKey)
  if (!metric) return

  const period = currentBillingPeriod()
  const sb = getServiceClient()

  await sb.rpc('decrement_usage', {
    p_org_id: orgId,
    p_period: period,
    p_metric: metric,
    p_amount: amount,
  })

  invalidateCache(orgId)
}

export async function getUsage(
  orgId: string,
  metric: string,
  period?: string
): Promise<number> {
  const sb = getServiceClient()
  const billingPeriod = period ?? currentBillingPeriod()

  const { data } = await sb
    .from('usage_counters')
    .select('used_value')
    .eq('organization_id', orgId)
    .eq('billing_period', billingPeriod)
    .eq('metric', metric)
    .single()

  return data?.used_value ?? 0
}

// Batch version: all usage counters in one query (for /api/billing/limits)
export async function getAllUsage(orgId: string, period?: string) {
  const sb = getServiceClient()
  const billingPeriod = period ?? currentBillingPeriod()
  const { data } = await sb
    .from('usage_counters')
    .select('metric, used_value')
    .eq('organization_id', orgId)
    .eq('billing_period', billingPeriod)
  return data ?? []
}
