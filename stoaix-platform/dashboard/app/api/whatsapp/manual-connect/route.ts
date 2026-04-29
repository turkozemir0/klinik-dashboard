import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GRAPH = 'https://graph.facebook.com/v19.0'

// ─── POST /api/whatsapp/manual-connect ────────────────────────────────────────
// Body: { phone_number_id: string, access_token: string, waba_id?: string }
// Validates credentials against Meta Graph API, saves to channel_config.whatsapp

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const { phone_number_id, access_token, waba_id } = body ?? {}
  if (!phone_number_id || !access_token) {
    return NextResponse.json({ error: 'phone_number_id ve access_token zorunlu' }, { status: 400 })
  }

  const service = getServiceClient()

  // Auth check: only admin/patron
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })
  if (orgUser.role !== 'admin' && orgUser.role !== 'patron') {
    return NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli' }, { status: 403 })
  }

  // Validate credentials: fetch phone number info from Meta
  const phoneRes = await fetch(
    `${GRAPH}/${phone_number_id}?fields=display_phone_number,verified_name&access_token=${access_token}`
  )
  const phoneData = await phoneRes.json()

  if (!phoneRes.ok || phoneData.error) {
    const msg = phoneData.error?.message ?? 'Geçersiz Phone Number ID veya Access Token'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const phoneNumber = phoneData.display_phone_number ?? ''

  // Resolve WABA ID if not provided
  let resolvedWabaId = waba_id
  if (!resolvedWabaId) {
    // Try to get WABA from the phone number's business account
    const bizRes = await fetch(
      `${GRAPH}/me/businesses?fields=whatsapp_business_accounts{id,phone_numbers{id}}&access_token=${access_token}`
    )
    if (bizRes.ok) {
      const bizData = await bizRes.json()
      for (const biz of bizData.data ?? []) {
        for (const waba of biz.whatsapp_business_accounts?.data ?? []) {
          const phones: any[] = waba.phone_numbers?.data ?? []
          if (phones.some((p: any) => p.id === phone_number_id)) {
            resolvedWabaId = waba.id
            break
          }
        }
        if (resolvedWabaId) break
      }
    }
  }

  // Fetch current channel_config to merge
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const currentConfig = (org?.channel_config ?? {}) as any
  const updatedConfig = {
    ...currentConfig,
    whatsapp: {
      active:   true,
      provider: 'whatsapp_cloud',
      credentials: {
        phone_number_id,
        waba_id:      resolvedWabaId ?? null,
        access_token,
        phone_number: phoneNumber,
      },
    },
  }

  const { error: updateError } = await service
    .from('organizations')
    .update({ channel_config: updatedConfig })
    .eq('id', orgUser.organization_id)

  if (updateError) {
    console.error('[whatsapp/manual-connect] DB update error:', updateError)
    return NextResponse.json({ error: 'Kayıt başarısız' }, { status: 500 })
  }

  // Subscribe WABA to our app so webhooks are delivered
  if (resolvedWabaId) {
    try {
      const subRes = await fetch(`${GRAPH}/${resolvedWabaId}/subscribed_apps`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${access_token}` },
      })
      if (!subRes.ok) {
        console.error('[whatsapp/manual-connect] subscribed_apps failed:', await subRes.text())
      }
    } catch (e) {
      console.error('[whatsapp/manual-connect] subscribed_apps error:', e)
    }
  }

  return NextResponse.json({
    ok:              true,
    phone_number:    phoneNumber,
    phone_number_id,
    waba_id:         resolvedWabaId ?? null,
  })
}
