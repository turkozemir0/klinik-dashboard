import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'
import { META_GRAPH_URL } from '@/lib/meta-api'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const server = createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await server
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser || !['admin', 'patron', 'yönetici'].includes(orgUser.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgId = orgUser.organization_id

  const ent = await checkEntitlement(orgId, 'meta_capi')
  if (!ent.enabled) return NextResponse.json({ error: 'Feature not available' }, { status: 403 })

  const body = await req.json()
  const { access_token, pixel_id } = body

  // If pixel_id provided → user already selected from list, save directly
  if (pixel_id && access_token) {
    const sb = getServiceClient()
    const { data: org } = await sb
      .from('organizations')
      .select('channel_config')
      .eq('id', orgId)
      .single()

    const existingConfig = org?.channel_config || {}
    const updatedConfig = {
      ...existingConfig,
      meta_capi: {
        active: true,
        setup_method: 'oauth',
        pixel_id,
        access_token,
        connected_at: new Date().toISOString(),
      },
    }

    const { error } = await sb
      .from('organizations')
      .update({ channel_config: updatedConfig })
      .eq('id', orgId)

    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
    return NextResponse.json({ success: true, pixel_id })
  }

  // Otherwise: discover pixels from ad accounts
  if (!access_token)
    return NextResponse.json({ error: 'access_token required' }, { status: 400 })

  // Exchange short-lived token for long-lived
  const exchangeUrl = `${META_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${access_token}`
  const exchangeRes = await fetch(exchangeUrl)
  const exchangeBody = await exchangeRes.json()
  const longToken = exchangeBody.access_token || access_token

  // Discover ad accounts + pixels
  const discoverUrl = `${META_GRAPH_URL}/me/adaccounts?fields=id,name,adspixels{id,name}&access_token=${longToken}`
  const discoverRes = await fetch(discoverUrl)
  if (!discoverRes.ok) {
    return NextResponse.json({ error: 'Failed to discover ad accounts' }, { status: 400 })
  }

  const discoverBody = await discoverRes.json()
  const pixels: { id: string; name: string; ad_account: string }[] = []

  for (const account of discoverBody.data || []) {
    for (const pixel of account.adspixels?.data || []) {
      pixels.push({ id: pixel.id, name: pixel.name, ad_account: account.name })
    }
  }

  if (pixels.length === 0)
    return NextResponse.json({ error: 'No pixels found in your ad accounts' }, { status: 404 })

  // Single pixel → auto-connect
  if (pixels.length === 1) {
    const sb = getServiceClient()
    const { data: org } = await sb
      .from('organizations')
      .select('channel_config')
      .eq('id', orgId)
      .single()

    const existingConfig = org?.channel_config || {}
    const updatedConfig = {
      ...existingConfig,
      meta_capi: {
        active: true,
        setup_method: 'oauth',
        pixel_id: pixels[0].id,
        access_token: longToken,
        connected_at: new Date().toISOString(),
      },
    }

    const { error } = await sb
      .from('organizations')
      .update({ channel_config: updatedConfig })
      .eq('id', orgId)

    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
    return NextResponse.json({ success: true, pixel_id: pixels[0].id })
  }

  // Multiple pixels → return list for user selection
  return NextResponse.json({
    success: false,
    needs_selection: true,
    pixels,
    long_token: longToken,
  })
}
