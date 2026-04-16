import { CachedOrg } from './types'

const TTL_MS = 5 * 60 * 1000 // 5 dakika
const cache = new Map<string, CachedOrg>()

export function getFromCache(orgId: string): CachedOrg | null {
  return cache.get(orgId) ?? null
}

export function setCache(orgId: string, planId: string, status: string) {
  cache.set(orgId, { planId, status, fetchedAt: Date.now() })
}

export function invalidateCache(orgId: string) {
  cache.delete(orgId)
}

export function isExpired(cached: CachedOrg): boolean {
  return Date.now() - cached.fetchedAt > TTL_MS
}
