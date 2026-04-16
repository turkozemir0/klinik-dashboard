import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/instagram/callback?code=...&state=...
// Meta redirects here after user grants consent.
// Exchanges code for long-lived page token, saves to organizations.channel_config.instagram
// Required env vars: META_APP_ID, META_APP_SECRET, NEXT_PUBLIC_APP_URL
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code       = searchParams.get('code')
  const state      = searchParams.get('state')
  const oauthError = searchParams.get('error')

  const fallbackBase = '/dashboard/integrations'

  if (oauthError || !code || !state) {
    const reason = oauthError ?? 'cancelled'
    return NextResponse.redirect(new URL(`${fallbackBase}?instagram_error=${reason}`, req.url))
  }

  let orgId: string
  let redirectBase: string = fallbackBase
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
    orgId = decoded.org_id
    if (!orgId) throw new Error('no org_id in state')
    if (decoded.redirect_to) redirectBase = decoded.redirect_to
  } catch {
    return NextResponse.redirect(new URL(`${fallbackBase}?instagram_error=invalid_state`, req.url))
  }

  const appId      = process.env.META_APP_ID!
  const appSecret  = process.env.META_APP_SECRET!
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
  const redirectUri = `${appUrl}/api/instagram/callback`

  // Step 1: Exchange code for short-lived user token
  let shortLivedToken: string
  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code })
    )
    if (!tokenRes.ok) {
      console.error('[instagram/callback] short-lived token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=token_exchange`, req.url))
    }
    const tokenData = await tokenRes.json()
    shortLivedToken = tokenData.access_token
  } catch (err) {
    console.error('[instagram/callback] fetch error (short-lived):', err)
    return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=token_exchange`, req.url))
  }

  // Step 2: Exchange short-lived for long-lived user token (60 days)
  let longLivedToken: string
  try {
    const llRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: shortLivedToken })
    )
    if (!llRes.ok) {
      console.error('[instagram/callback] long-lived token exchange failed:', await llRes.text())
      return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=token_exchange`, req.url))
    }
    const llData = await llRes.json()
    longLivedToken = llData.access_token
  } catch (err) {
    console.error('[instagram/callback] fetch error (long-lived):', err)
    return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=token_exchange`, req.url))
  }

  // Step 3: Get pages + linked Instagram business account
  let igUserId: string
  let fbPageId: string
  let pageToken: string
  let username: string
  try {
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${longLivedToken}`
    )
    if (!pagesRes.ok) {
      console.error('[instagram/callback] pages fetch failed:', await pagesRes.text())
      return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=pages_fetch`, req.url))
    }
    const pagesData = await pagesRes.json()
    const pages: any[] = pagesData.data ?? []

    // Find first page with a linked Instagram business account
    const page = pages.find((p) => p.instagram_business_account?.id)
    if (!page) {
      return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=no_instagram_account`, req.url))
    }

    igUserId  = page.instagram_business_account.id  // Instagram Business Account ID (for webhook matching)
    fbPageId  = page.id                             // Facebook Page ID (for /subscribed_apps)
    pageToken = page.access_token   // page token fetched via long-lived user token — never expires
    username  = page.instagram_business_account.username ?? ''
  } catch (err) {
    console.error('[instagram/callback] fetch error (pages):', err)
    return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=pages_fetch`, req.url))
  }

  // Step 4: Save to DB — merge into channel_config.instagram
  const service = getServiceClient()

  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  if (!org) {
    return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=org_not_found`, req.url))
  }

  const channelConfig = (org.channel_config ?? {}) as Record<string, unknown>

  const updatedInstagram = {
    active: true,
    credentials: {
      page_id:      igUserId,   // Instagram Business Account ID — used for webhook matching
      fb_page_id:   fbPageId,   // Facebook Page ID — used for subscribed_apps subscription
      access_token: pageToken,
      username,
      connected_at: new Date().toISOString(),
    },
  }

  const { error: updateErr } = await service
    .from('organizations')
    .update({ channel_config: { ...channelConfig, instagram: updatedInstagram } })
    .eq('id', orgId)

  if (updateErr) {
    console.error('[instagram/callback] db update failed:', updateErr)
    return NextResponse.redirect(new URL(`${redirectBase}?instagram_error=save_failed`, req.url))
  }

  // Step 5: Auto-subscribe page to webhook messages
  try {
    const appUrl2 = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
    await fetch(`${appUrl2}/api/admin/instagram/subscribe`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ org_id: orgId }),
    })
  } catch (err) {
    console.warn('[instagram/callback] auto-subscribe failed (non-fatal):', err)
  }

  return NextResponse.redirect(new URL(`${redirectBase}?instagram=connected`, req.url))
}
