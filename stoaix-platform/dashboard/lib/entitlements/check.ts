import { EntitlementResult, ALLOW_ALL, DENY_ALL } from './types'
import { getFromCache, setCache, isExpired } from './cache'
import { fetchSubscription, fetchOverride, fetchPlanEntitlement } from './resolver'
import { featureKeyToMetric } from './registry'
import { getUsage, currentBillingPeriod } from './usage'

export async function checkEntitlement(
  orgId: string,
  featureKey: string
): Promise<EntitlementResult> {
  try {
    // 1. Cache'den plan/status bilgisi
    const cached = getFromCache(orgId)

    // 2. Legacy bypass — her şey açık
    if (cached?.planId === 'legacy') return ALLOW_ALL

    // 3. Cache güncel → DB'ye gitme
    if (cached && !isExpired(cached)) {
      if (['suspended', 'canceled'].includes(cached.status)) return DENY_ALL
      // Cache sadece plan/status tutar, feature detayı için DB'ye gidiyoruz
    }

    // 4. DB'den subscription çek
    const sub = await fetchSubscription(orgId)

    if (!sub) {
      // Subscription yoksa legacy gibi davran (eski müşteri güvencesi)
      setCache(orgId, 'legacy', 'legacy')
      return ALLOW_ALL
    }

    setCache(orgId, sub.plan_id, sub.status)

    if (sub.plan_id === 'legacy') return ALLOW_ALL
    if (['suspended', 'canceled'].includes(sub.status)) return DENY_ALL

    // 5. Override > Plan default
    const override = await fetchOverride(orgId, featureKey)
    const planEnt = await fetchPlanEntitlement(sub.plan_id, featureKey)
    const effective = override ?? planEnt

    if (!effective || !effective.enabled) return DENY_ALL

    // 6. Limitsiz feature
    if (effective.limit_value === null) return ALLOW_ALL

    // 7. Metered feature — kullanım kontrolü
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

// Basit boolean kontrol (limit önemli değilse)
export async function hasFeature(
  orgId: string,
  featureKey: string
): Promise<boolean> {
  const result = await checkEntitlement(orgId, featureKey)
  return result.enabled
}
