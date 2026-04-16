import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const service = getServiceClient()
  const { data } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

// GET /api/calendar/auth?org_id=<uuid>  (super admin — any org)
// GET /api/calendar/auth                 (org user — own org)
// Redirects to Google OAuth consent screen.
// Required env vars: GOOGLE_CLIENT_ID, NEXT_PUBLIC_APP_URL
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const service = getServiceClient()
  const paramOrgId = req.nextUrl.searchParams.get('org_id')

  let orgId: string | null = null
  const isAdmin = await isSuperAdmin(user.id)

  if (isAdmin) {
    // Super admin: use org_id from query param
    orgId = paramOrgId
  } else {
    // Org user: use their own org
    const { data: orgUser } = await service
      .from('org_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle()
    orgId = orgUser?.organization_id ?? null
  }

  if (!orgId) return NextResponse.json({ error: 'org_id bulunamadı' }, { status: 400 })

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'GOOGLE_CLIENT_ID yapılandırılmamış' }, { status: 500 })

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
  const redirectUri = `${appUrl}/api/calendar/callback`

  // state = base64url(JSON) — callback uses this to know which org to update + where to redirect
  const redirectTo = isAdmin ? '/admin' : '/dashboard/settings'
  const state = Buffer.from(JSON.stringify({ org_id: orgId, redirect_to: redirectTo })).toString('base64url')

  const authParams = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    access_type:   'offline',
    prompt:        'consent',   // force refresh_token every time
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${authParams}`)
}
