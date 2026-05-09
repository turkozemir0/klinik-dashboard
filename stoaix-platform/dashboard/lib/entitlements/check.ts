import { EntitlementResult, ALLOW_ALL, DENY_ALL } from './types'
import { getFromCache, setCache, isExpired } from './cache'
import { fetchSubscription, fetchOverride, fetchPlanEntitlement, fetchAllOverrides, fetchAllPlanEntitlements } from './resolver'
import { featureKeyToMetric, FEATURE_METRIC_MAP } from './registry'
import { getUsage, getAllUsage, currentBillingPeriod } from './usage'

export async function checkEntitlement(
  orgId: string,
  featureKey: string
): Promise<EntitlementResult> {
  try {
    // 1. Cache'den plan/status bilgisi
    const cached = getFromCache(orgId)

    // 2. Cache güncel → DB'ye gitme (legacy olmayan)
    if (cached && !isExpired(cached) && cached.planId !== 'legacy') {
      if (['suspended', 'canceled'].includes(cached.status)) return DENY_ALL
    }

    // 3. DB'den subscription çek
    const sub = await fetchSubscription(orgId)

    if (!sub) {
      setCache(orgId, 'legacy', 'legacy')
      return ALLOW_ALL
    }

    setCache(orgId, sub.plan_id, sub.status)

    if (['suspended', 'canceled'].includes(sub.status)) return DENY_ALL

    // 4. Override > Plan default (legacy dahil — per-org limit desteği)
    const override = await fetchOverride(orgId, featureKey)

    // Legacy + override yoksa → sınırsız
    if (sub.plan_id === 'legacy' && !override) return ALLOW_ALL

    const planEnt = await fetchPlanEntitlement(sub.plan_id, featureKey)
    const effective = override ?? planEnt

    if (!effective || !effective.enabled) {
      // Legacy plan'da entitlement tanımlı değilse yine izin ver
      if (sub.plan_id === 'legacy') return ALLOW_ALL
      return DENY_ALL
    }

    // 5. Limitsiz feature
    if (effective.limit_value === null) return ALLOW_ALL

    // 6. Metered feature — kullanım kontrolü
    const metric = featureKeyToMetric(featureKey)
    const used = metric
      ? await getUsage(orgId, metric, currentBillingPeriod())
      : 0

    return {
      enabled: true,
      limit: effective.limit_value,
      used,
      remaining: effective.limit_value - used,
    }
  } catch (err) {
    // Hata durumunda KİLİTLEME — izin ver
    console.error('[entitlement] check failed, allowing:', featureKey, err)
    return ALLOW_ALL
  }
}

// Batch: tüm feature'ları tek seferde kontrol et (~4 sorgu vs ~115)
export async function checkAllEntitlements(
  orgId: string
): Promise<Record<string, EntitlementResult>> {
  const featureKeys = Object.keys(FEATURE_METRIC_MAP)
  const allAllow = Object.fromEntries(featureKeys.map(k => [k, ALLOW_ALL]))
  const allDeny = Object.fromEntries(featureKeys.map(k => [k, DENY_ALL]))

  try {
    // 1. Subscription çek
    const cached = getFromCache(orgId)
    let planId: string
    let status: string

    if (cached && !isExpired(cached) && cached.planId !== 'legacy') {
      planId = cached.planId
      status = cached.status
    } else {
      const sub = await fetchSubscription(orgId)
      if (!sub) {
        setCache(orgId, 'legacy', 'legacy')
        return allAllow
      }
      planId = sub.plan_id
      status = sub.status
      setCache(orgId, planId, status)
    }

    if (['suspended', 'canceled'].includes(status)) return allDeny

    // 2. Batch fetch: overrides + plan entitlements + usage
    const [overrides, planEnts, usageRows] = await Promise.all([
      fetchAllOverrides(orgId),
      fetchAllPlanEntitlements(planId),
      getAllUsage(orgId),
    ])

    // Legacy + override yoksa → tüm feature'lar sınırsız
    if (planId === 'legacy' && overrides.length === 0) return allAllow

    // Map'lere çevir
    const overrideMap = new Map(
      overrides
        .filter(o => !o.expires_at || new Date(o.expires_at) >= new Date())
        .map(o => [o.feature_key, { enabled: o.enabled as boolean, limit_value: o.limit_override as number | null }])
    )
    const planEntMap = new Map(
      planEnts.map(p => [p.feature_key, { enabled: p.enabled as boolean, limit_value: p.limit_value as number | null }])
    )
    const usageMap = new Map(
      usageRows.map(u => [u.metric, u.used_value as number])
    )

    // 3. Feature'ları hesapla
    const result: Record<string, EntitlementResult> = {}
    for (const featureKey of featureKeys) {
      const override = overrideMap.get(featureKey)
      const planEnt = planEntMap.get(featureKey)
      const effective = override ?? planEnt

      if (!effective || !effective.enabled) {
        // Legacy plan'da tanımsız feature → izin ver
        result[featureKey] = planId === 'legacy' ? ALLOW_ALL : DENY_ALL
        continue
      }
      if (effective.limit_value === null) {
        result[featureKey] = ALLOW_ALL
        continue
      }

      const metric = featureKeyToMetric(featureKey)
      const used = metric ? (usageMap.get(metric) ?? 0) : 0
      result[featureKey] = {
        enabled: true,
        limit: effective.limit_value,
        used,
        remaining: effective.limit_value - used,
      }
    }
    return result
  } catch (err) {
    console.error('[entitlement] batch check failed, allowing all:', err)
    return allAllow
  }
}

// Basit boolean kontrol (limit önemli değilse)
export async function hasFeature(
  orgId: string,
  featureKey: string
): Promise<boolean> {
  const result = await checkEntitlement(orgId, featureKey)
  return result.enabled
}
