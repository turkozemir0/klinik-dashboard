import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/calendar/callback?code=...&state=...
// Google redirects here after user grants consent.
// Exchanges code for tokens, saves to organizations.channel_config.calendar
// Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_APP_URL
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code        = searchParams.get('code')
  const state       = searchParams.get('state')
  const oauthError  = searchParams.get('error')

  // User denied or Google returned an error (state may be missing, fall back to settings)
  const fallbackBase = '/dashboard/integrations'
  if (oauthError || !code || !state) {
    const reason = oauthError ?? 'cancelled'
    return NextResponse.redirect(new URL(`${fallbackBase}?calendar_error=${reason}`, req.url))
  }

  // Decode state to get org_id + redirect_to
  let orgId: string
  let redirectBase: string = fallbackBase
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
    orgId = decoded.org_id
    if (!orgId) throw new Error('no org_id in state')
    if (decoded.redirect_to) redirectBase = decoded.redirect_to
  } catch {
    return NextResponse.redirect(new URL(`${fallbackBase}?calendar_error=invalid_state`, req.url))
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
  const redirectUri  = `${appUrl}/api/calendar/callback`

  // Exchange authorization code for access + refresh tokens
  let accessToken:  string
  let refreshToken: string | undefined
  let tokenExpiry:  string | undefined

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('[calendar/callback] token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL(`${redirectBase}?calendar_error=token_exchange`, req.url))
    }

    const tokenData = await tokenRes.json()
    accessToken  = tokenData.access_token
    refreshToken = tokenData.refresh_token
    tokenExpiry  = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : undefined
  } catch (err) {
    console.error('[calendar/callback] fetch error:', err)
    return NextResponse.redirect(new URL(`${redirectBase}?calendar_error=token_exchange`, req.url))
  }

  // Merge tokens into channel_config.calendar (preserve existing fields like calendar_id)
  const service = getServiceClient()

  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  if (!org) {
    return NextResponse.redirect(new URL(`${redirectBase}?calendar_error=org_not_found`, req.url))
  }

  const channelConfig  = (org.channel_config ?? {}) as Record<string, unknown>
  const existingCal    = (channelConfig.calendar ?? {}) as Record<string, unknown>

  const updatedCalendar: Record<string, unknown> = {
    ...existingCal,
    provider:     'google',
    access_token: accessToken,
    ...(tokenExpiry  ? { token_expiry:  tokenExpiry  } : {}),
    ...(refreshToken ? { refresh_token: refreshToken } : {}),
  }

  const { error: updateErr } = await service
    .from('organizations')
    .update({ channel_config: { ...channelConfig, calendar: updatedCalendar } })
    .eq('id', orgId)

  if (updateErr) {
    console.error('[calendar/callback] db update failed:', updateErr)
    return NextResponse.redirect(new URL(`${redirectBase}?calendar_error=save_failed`, req.url))
  }

  // Redirect back to admin — modal will show "Google Takvim bağlı" on next open
  return NextResponse.redirect(new URL(`${redirectBase}?calendar_connected=${orgId}`, req.url))
}
