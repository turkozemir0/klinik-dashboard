import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { SipClient } from 'livekit-server-sdk'
import { checkEntitlement } from '@/lib/entitlements'
import { VOICE_PROVIDERS, getProviderPhoneNumber, type VoiceProvider } from '@/lib/voice-providers'
import { normalizePhone } from '@/lib/phone-utils'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const LIVEKIT_URL    = process.env.LIVEKIT_URL ?? ''
const LIVEKIT_KEY    = process.env.LIVEKIT_API_KEY ?? ''
const LIVEKIT_SECRET = process.env.LIVEKIT_API_SECRET ?? ''

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { provider, credentials } = body ?? {}
  if (!provider || !credentials) {
    return NextResponse.json({ error: 'provider ve credentials zorunlu' }, { status: 400 })
  }

  const providerDef = VOICE_PROVIDERS[provider as VoiceProvider]
  if (!providerDef) {
    return NextResponse.json({ error: 'Gecersiz provider' }, { status: 400 })
  }

  // Validate required fields
  for (const field of providerDef.fields) {
    if (field.required && !credentials[field.key]?.trim()) {
      return NextResponse.json({ error: `${field.label} zorunlu` }, { status: 400 })
    }
  }

  const service = getServiceClient()

  // 2. Role check (admin/patron)
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadi' }, { status: 403 })
  if (orgUser.role !== 'admin' && orgUser.role !== 'patron') {
    return NextResponse.json({ error: 'Bu islem icin admin yetkisi gerekli' }, { status: 403 })
  }

  // 3. Entitlement check
  const ent = await checkEntitlement(orgUser.organization_id, 'voice_agent_inbound')
  if (!ent.enabled) {
    return NextResponse.json({ error: 'upgrade_required', feature: 'voice_agent_inbound' }, { status: 403 })
  }

  // 4. Normalize phone number
  const rawPhone = getProviderPhoneNumber(provider as VoiceProvider, credentials)
  const phoneNumber = normalizePhone(rawPhone)
  if (!phoneNumber) {
    return NextResponse.json({ error: 'Gecersiz telefon numarasi' }, { status: 400 })
  }

  // 5. Provider-specific credential validation
  const validationResult = await validateProviderCredentials(provider as VoiceProvider, credentials)
  if (!validationResult.valid) {
    return NextResponse.json({ error: validationResult.error ?? 'Credential dogrulama basarisiz' }, { status: 400 })
  }

  // 6. Create LiveKit SIP Inbound Trunk
  let sipTrunkId = ''
  let dispatchRuleId = ''

  if (LIVEKIT_URL && LIVEKIT_KEY && LIVEKIT_SECRET) {
    try {
      const httpUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://')
      const sipClient = new SipClient(httpUrl, LIVEKIT_KEY, LIVEKIT_SECRET)

      const trunkName = `${providerDef.name} - ${phoneNumber}`

      // Build trunk options based on provider
      const trunkOpts: any = {
        metadata: JSON.stringify({
          organization_id: orgUser.organization_id,
          provider,
        }),
      }

      // For Netgsm: add SIP auth credentials
      if (provider === 'netgsm') {
        trunkOpts.authUsername = credentials.sip_username
        trunkOpts.authPassword = credentials.sip_password
      }

      const trunk = await sipClient.createSipInboundTrunk(trunkName, [phoneNumber], trunkOpts)
      sipTrunkId = trunk.sipTrunkId

      // Create dispatch rule for this trunk
      const rule = await sipClient.createSipDispatchRule(
        { type: 'individual', roomPrefix: `voice-${orgUser.organization_id.slice(0, 8)}-` },
        {
          name: `Dispatch - ${providerDef.name}`,
          trunkIds: [sipTrunkId],
          metadata: JSON.stringify({ organization_id: orgUser.organization_id }),
        }
      )
      dispatchRuleId = rule.sipDispatchRuleId
    } catch (e: any) {
      console.error('[voice/connect] LiveKit SIP trunk creation failed:', e)
      return NextResponse.json({
        error: 'LiveKit SIP trunk olusturulamadi: ' + (e.message ?? String(e)),
      }, { status: 500 })
    }
  }

  // 7. Save to channel_config
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const currentConfig = (org?.channel_config ?? {}) as any

  // Build credentials without sensitive data exposed unnecessarily
  const savedCredentials: Record<string, string> = {}
  for (const field of providerDef.fields) {
    savedCredentials[field.key] = credentials[field.key]
  }
  if (providerDef.sipServer) {
    savedCredentials.sip_server = providerDef.sipServer
  }

  const updatedConfig = {
    ...currentConfig,
    voice_inbound: {
      active: true,
      provider,
      inbound_number: phoneNumber,
      livekit_sip_trunk_id: sipTrunkId || currentConfig.voice_inbound?.livekit_sip_trunk_id || null,
      livekit_dispatch_rule_id: dispatchRuleId || currentConfig.voice_inbound?.livekit_dispatch_rule_id || null,
      credentials: savedCredentials,
      connected_at: new Date().toISOString(),
    },
  }

  const { error: updateError } = await service
    .from('organizations')
    .update({ channel_config: updatedConfig })
    .eq('id', orgUser.organization_id)

  if (updateError) {
    console.error('[voice/connect] DB update error:', updateError)
    return NextResponse.json({ error: 'Kayit basarisiz' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    provider,
    phone_number: phoneNumber,
    sip_trunk_id: sipTrunkId || null,
    dispatch_rule_id: dispatchRuleId || null,
  })
}

// Provider-specific credential validation
async function validateProviderCredentials(
  provider: VoiceProvider,
  credentials: Record<string, string>
): Promise<{ valid: boolean; error?: string }> {
  switch (provider) {
    case 'twilio': {
      // Validate Twilio credentials via API
      const { account_sid, auth_token, sip_trunk_sid } = credentials
      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${account_sid}.json`,
          {
            headers: {
              Authorization: 'Basic ' + Buffer.from(`${account_sid}:${auth_token}`).toString('base64'),
            },
          }
        )
        if (!res.ok) return { valid: false, error: 'Twilio Account SID veya Auth Token gecersiz' }

        // Check trunk exists
        const trunkRes = await fetch(
          `https://trunking.twilio.com/v1/Trunks/${sip_trunk_sid}`,
          {
            headers: {
              Authorization: 'Basic ' + Buffer.from(`${account_sid}:${auth_token}`).toString('base64'),
            },
          }
        )
        if (!trunkRes.ok) return { valid: false, error: 'Twilio SIP Trunk SID gecersiz' }
        return { valid: true }
      } catch {
        return { valid: false, error: 'Twilio API baglantisi basarisiz' }
      }
    }

    case 'telnyx': {
      // Validate Telnyx credentials via API
      const { api_key } = credentials
      try {
        const res = await fetch('https://api.telnyx.com/v2/available_phone_numbers?filter[limit]=1', {
          headers: { Authorization: `Bearer ${api_key}` },
        })
        if (!res.ok) return { valid: false, error: 'Telnyx API Key gecersiz' }
        return { valid: true }
      } catch {
        return { valid: false, error: 'Telnyx API baglantisi basarisiz' }
      }
    }

    case 'netgsm':
      // Netgsm SIP credentials cannot be validated via API — accept as pending
      return { valid: true }

    case 'verimor':
      // Verimor API validation would require specific endpoint
      return { valid: true }

    default:
      return { valid: false, error: 'Bilinmeyen provider' }
  }
}
