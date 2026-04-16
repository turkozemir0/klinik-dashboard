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

// Exchange short-lived code for a long-lived user access token.
async function exchangeCode(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id:     process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    code,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/callback`,
  })
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`)
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.access_token
}

// Discover WABA ID and phone number ID from the user's businesses.
// Returns the first connected WhatsApp phone number.
async function discoverPhoneNumber(
  accessToken: string,
  wabaIdHint?: string
): Promise<{ wabaId: string; phoneNumberId: string; phoneNumber: string }> {
  // If we already have both IDs from the Embedded Signup session event, use them
  // Otherwise query the user's business portfolios
  if (!wabaIdHint) {
    const bizRes = await fetch(
      `${GRAPH}/me/businesses?fields=whatsapp_business_accounts{id,phone_numbers{id,display_phone_number}}&access_token=${accessToken}`
    )
    const bizData = await bizRes.json()
    const businesses: any[] = bizData.data ?? []

    for (const biz of businesses) {
      const wabas: any[] = biz.whatsapp_business_accounts?.data ?? []
      for (const waba of wabas) {
        const phones: any[] = waba.phone_numbers?.data ?? []
        if (phones.length > 0) {
          return {
            wabaId:        waba.id,
            phoneNumberId: phones[0].id,
            phoneNumber:   phones[0].display_phone_number,
          }
        }
      }
    }
    throw new Error('Bu hesapta aktif WhatsApp numarası bulunamadı.')
  }

  // wabaIdHint provided — just fetch phone numbers for that WABA
  const res = await fetch(
    `${GRAPH}/${wabaIdHint}/phone_numbers?fields=id,display_phone_number&access_token=${accessToken}`
  )
  const data = await res.json()
  const phones: any[] = data.data ?? []
  if (phones.length === 0) throw new Error('WABA\'ya bağlı telefon numarası bulunamadı.')

  return {
    wabaId:        wabaIdHint,
    phoneNumberId: phones[0].id,
    phoneNumber:   phones[0].display_phone_number,
  }
}

// Subscribe the WABA to our app's webhook so we receive messages.
async function subscribeWebhook(wabaId: string, accessToken: string): Promise<void> {
  const res = await fetch(`${GRAPH}/${wabaId}/subscribed_apps`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    // Non-fatal — log but don't block
    console.error(`Webhook subscribe failed for WABA ${wabaId}: ${await res.text()}`)
  }
}

// ─── POST /api/whatsapp/callback ──────────────────────────────────────────────
// Body: { code: string, phone_number_id?: string, waba_id?: string }
// Called from the client after FB.login() succeeds.

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

  const { code, phone_number_id: phoneNumberIdHint, waba_id: wabaIdHint } = body ?? {}
  if (!code) return NextResponse.json({ error: 'code zorunlu' }, { status: 400 })

  const service = getServiceClient()

  // Get user's org
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })
  if (orgUser.role !== 'admin' && orgUser.role !== 'patron') {
    return NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli' }, { status: 403 })
  }

  try {
    // 1. Exchange code for access token
    const accessToken = await exchangeCode(code)

    // 2. Discover WABA + phone number
    let wabaId        = wabaIdHint
    let phoneNumberId = phoneNumberIdHint
    let phoneNumber   = ''

    if (!phoneNumberId || !wabaId) {
      const discovered = await discoverPhoneNumber(accessToken, wabaId)
      wabaId        = discovered.wabaId
      phoneNumberId = discovered.phoneNumberId
      phoneNumber   = discovered.phoneNumber
    } else {
      // We have IDs from the session event — just fetch the display number
      const res = await fetch(
        `${GRAPH}/${phoneNumberId}?fields=display_phone_number&access_token=${accessToken}`
      )
      const d = await res.json()
      phoneNumber = d.display_phone_number ?? ''
    }

    // 3. Subscribe WABA to our webhook
    await subscribeWebhook(wabaId, accessToken)

    // 4. Fetch current channel_config to merge (avoid wiping other channels)
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
          phone_number_id: phoneNumberId,
          waba_id:         wabaId,
          access_token:    accessToken,
          phone_number:    phoneNumber,
        },
      },
    }

    await service
      .from('organizations')
      .update({ channel_config: updatedConfig })
      .eq('id', orgUser.organization_id)

    return NextResponse.json({
      ok:              true,
      phone_number:    phoneNumber,
      phone_number_id: phoneNumberId,
    })

  } catch (err: any) {
    console.error('[whatsapp/callback]', err)
    return NextResponse.json({ error: err.message ?? 'Bağlantı başarısız' }, { status: 500 })
  }
}

// ─── GET /api/whatsapp/callback ───────────────────────────────────────────────
// Not used in JS SDK flow (no redirect) — kept for potential future OAuth redirect fallback.
export async function GET() {
  return NextResponse.json({ error: 'Bu endpoint GET desteklemiyor' }, { status: 405 })
}
