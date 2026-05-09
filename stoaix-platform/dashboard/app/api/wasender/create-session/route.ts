import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const WASENDER_API_BASE = 'https://www.wasenderapi.com/api'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (orgUser.role !== 'admin' && orgUser.role !== 'patron') {
    return NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli' }, { status: 403 })
  }

  let phone_number = ''
  try {
    const body = await request.json()
    phone_number = body.phone_number ?? ''
  } catch { /* no body */ }

  if (!phone_number) {
    return NextResponse.json({ error: 'Telefon numarası zorunlu' }, { status: 400 })
  }

  const pat = process.env.WASENDER_PAT
  if (!pat) return NextResponse.json({ error: 'WASENDER_PAT env var eksik' }, { status: 500 })

  const webhookUrl = process.env.NEXT_PUBLIC_WASENDER_WEBHOOK_URL
  if (!webhookUrl) return NextResponse.json({ error: 'Webhook URL yapılandırılmamış' }, { status: 500 })

  const { data: org } = await service
    .from('organizations')
    .select('name, channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const currentConfig = (org?.channel_config ?? {}) as any

  // Delete existing wasender session if present
  const existingSessionId = currentConfig?.whatsapp?.credentials?.session_id
  if (currentConfig?.whatsapp?.provider === 'wasender' && existingSessionId) {
    await fetch(`${WASENDER_API_BASE}/whatsapp-sessions/${existingSessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${pat}` },
    }).catch(() => {})
  }

  // Create new session
  const createRes = await fetch(`${WASENDER_API_BASE}/whatsapp-sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${org?.name ?? 'Org'} WhatsApp`,
      phone_number,
      account_protection: false,
      log_messages: false,
      webhook_url: `${webhookUrl}?org_id=${orgUser.organization_id}`,
      webhook_enabled: true,
      webhook_events: ['messages.received', 'messages.upsert', 'session.status', 'qrcode.updated', 'message.sent'],
    }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    console.error('[wasender/create-session] WasenderAPI error:', createRes.status, errText)
    return NextResponse.json({ error: `WasenderAPI ${createRes.status}: ${errText}` }, { status: 502 })
  }

  const sessionData = await createRes.json()
  // API returns { success: true, data: { id, api_key, webhook_secret, ... } }
  const sessionPayload = sessionData.data ?? sessionData
  const session_id = sessionPayload.id ?? sessionPayload.session_id
  const api_key = sessionPayload.api_key ?? sessionPayload.apiKey
  const webhook_secret = sessionPayload.webhook_secret ?? sessionPayload.webhookSecret ?? null

  if (!session_id || !api_key) {
    console.error('[wasender/create-session] Missing session fields:', sessionData)
    return NextResponse.json({ error: 'Session verisi eksik' }, { status: 502 })
  }

  const { error: updateErr } = await service
    .from('organizations')
    .update({
      channel_config: {
        ...currentConfig,
        whatsapp: {
          active: false,
          provider: 'wasender',
          credentials: {
            session_id,
            api_key,
            webhook_secret,
            status: 'disconnected',
          },
        },
      },
    })
    .eq('id', orgUser.organization_id)

  if (updateErr) {
    console.error('[wasender/create-session] db update failed:', updateErr)
    return NextResponse.json({ error: 'Config güncellenemedi' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, session_id })
}
