export interface EntitlementResult {
  enabled: boolean
  limit: number | null      // null = unlimited
  used: number | null       // null = not tracked
  remaining: number | null  // null = unlimited
}

export interface CachedOrg {
  planId: string
  status: string
  fetchedAt: number
}

export const ALLOW_ALL: EntitlementResult = {
  enabled: true,
  limit: null,
  used: null,
  remaining: null,
}

export const DENY_ALL: EntitlementResult = {
  enabled: false,
  limit: null,
  used: null,
  remaining: null,
}
