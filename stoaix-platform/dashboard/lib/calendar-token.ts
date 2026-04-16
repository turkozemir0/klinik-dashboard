import { createClient as sbAdmin } from '@supabase/supabase-js'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function refreshToken(orgId: string, cal: any): Promise<string | null> {
  if (!cal?.refresh_token) return null
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: cal.refresh_token,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const newExpiry = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : undefined

  const service = getServiceClient()
  const { data: org } = await service
    .from('organizations').select('channel_config').eq('id', orgId).single()
  const cc = (org?.channel_config ?? {}) as Record<string, unknown>
  await service.from('organizations').update({
    channel_config: {
      ...cc,
      calendar: {
        ...cal,
        access_token: data.access_token,
        ...(newExpiry ? { token_expiry: newExpiry } : {}),
      },
    },
  }).eq('id', orgId)

  return data.access_token
}

export async function getValidToken(orgId: string, cal: any): Promise<string | null> {
  if (!cal?.access_token) return null
  if (cal.token_expiry && new Date(cal.token_expiry) <= new Date(Date.now() + 60_000)) {
    return refreshToken(orgId, cal)
  }
  return cal.access_token
}

export async function getOrgCalendar(userId: string) {
  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users').select('organization_id').eq('user_id', userId).maybeSingle()
  if (!orgUser) return null
  const { data: org } = await service
    .from('organizations').select('channel_config').eq('id', orgUser.organization_id).single()
  return { orgId: orgUser.organization_id, cal: (org?.channel_config as any)?.calendar, org }
}

export async function updateLastSynced(orgId: string, cal: any) {
  const service = getServiceClient()
  const { data: org } = await service
    .from('organizations').select('channel_config').eq('id', orgId).single()
  const cc = (org?.channel_config ?? {}) as Record<string, unknown>
  const now = new Date().toISOString()
  await service.from('organizations').update({
    channel_config: {
      ...cc,
      calendar: { ...cal, last_synced_at: now },
    },
  }).eq('id', orgId)
  return now
}
