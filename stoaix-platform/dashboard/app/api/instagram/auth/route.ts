import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/instagram/auth
// Redirects org user to Meta OAuth consent screen.
// Required env vars: META_APP_ID, NEXT_PUBLIC_APP_URL
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const orgId = orgUser?.organization_id
  if (!orgId) return NextResponse.json({ error: 'org_id bulunamadı' }, { status: 400 })

  const appId = process.env.META_APP_ID
  if (!appId) return NextResponse.json({ error: 'META_APP_ID yapılandırılmamış' }, { status: 500 })

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
  const redirectUri = `${appUrl}/api/instagram/callback`

  const state = Buffer.from(JSON.stringify({ org_id: orgId, redirect_to: '/dashboard/settings' })).toString('base64url')

  const authParams = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    scope:         'instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_read_engagement,pages_show_list,business_management,leads_retrieval,pages_manage_ads',
    response_type: 'code',
    state,
  })

  return NextResponse.redirect(`https://www.facebook.com/dialog/oauth?${authParams}`)
}
