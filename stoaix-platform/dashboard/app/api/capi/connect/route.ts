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

  // Entitlement check
  const ent = await checkEntitlement(orgId, 'meta_capi')
  if (!ent.enabled) return NextResponse.json({ error: 'Feature not available' }, { status: 403 })

  const body = await req.json()
  const { pixel_id, access_token } = body

  if (!pixel_id || !access_token)
    return NextResponse.json({ error: 'pixel_id and access_token required' }, { status: 400 })

  // Validate token by querying the pixel
  const validateUrl = `${META_GRAPH_URL}/${pixel_id}?fields=name,id&access_token=${access_token}`
  const validateRes = await fetch(validateUrl)
  if (!validateRes.ok) {
    const errBody = await validateRes.json().catch(() => null)
    return NextResponse.json({
      error: 'Invalid Pixel ID or token',
      detail: errBody?.error?.message || `HTTP ${validateRes.status}`,
    }, { status: 400 })
  }

  // Save to channel_config.meta_capi
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
      setup_method: 'manual',
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
