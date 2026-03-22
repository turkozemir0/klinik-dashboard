import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const { token, user_id } = await request.json()
  if (!token || !user_id) return NextResponse.json({ error: 'token ve user_id zorunlu' }, { status: 400 })

  const service = getServiceClient()

  const { data: tokenData, error: tokenError } = await service
    .from('invite_tokens')
    .select('id, organization_id, is_used, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (tokenError) return NextResponse.json({ error: `DB hatası: ${tokenError.message}` }, { status: 500 })
  if (!tokenData) return NextResponse.json({ error: 'Token bulunamadı' }, { status: 404 })
  if (tokenData.is_used) return NextResponse.json({ error: 'Token zaten kullanılmış' }, { status: 400 })
  if (new Date(tokenData.expires_at) < new Date()) return NextResponse.json({ error: 'Token süresi dolmuş' }, { status: 400 })

  // Mark token as used
  await service
    .from('invite_tokens')
    .update({ is_used: true, used_by: user_id, used_at: new Date().toISOString() })
    .eq('id', tokenData.id)

  // Add org_user
  const { error: orgUserError } = await service
    .from('org_users')
    .insert({ organization_id: tokenData.organization_id, user_id, role: 'admin' })

  if (orgUserError) return NextResponse.json({ error: `org_users hatası: ${orgUserError.message}` }, { status: 500 })

  // Set org status — only downgrade if not already completed (migration case)
  const { data: org } = await service
    .from('organizations')
    .select('onboarding_status')
    .eq('id', tokenData.organization_id)
    .maybeSingle()

  if (org?.onboarding_status !== 'completed') {
    await service
      .from('organizations')
      .update({ status: 'onboarding', onboarding_status: 'in_progress' })
      .eq('id', tokenData.organization_id)
  }

  const redirect = org?.onboarding_status === 'completed' ? '/dashboard' : '/onboarding'
  return NextResponse.json({ ok: true, redirect })
}
