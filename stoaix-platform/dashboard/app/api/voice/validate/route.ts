import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { VOICE_PROVIDERS, type VoiceProvider } from '@/lib/voice-providers'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
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

  // Role check
  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Provider-specific validation (no side effects)
  switch (provider) {
    case 'twilio': {
      const { account_sid, auth_token, sip_trunk_sid } = credentials
      if (!account_sid || !auth_token) {
        return NextResponse.json({ valid: false, error: 'Account SID ve Auth Token zorunlu' })
      }
      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${account_sid}.json`,
          {
            headers: {
              Authorization: 'Basic ' + Buffer.from(`${account_sid}:${auth_token}`).toString('base64'),
            },
          }
        )
        if (!res.ok) return NextResponse.json({ valid: false, error: 'Account SID veya Auth Token gecersiz' })

        if (sip_trunk_sid) {
          const trunkRes = await fetch(
            `https://trunking.twilio.com/v1/Trunks/${sip_trunk_sid}`,
            {
              headers: {
                Authorization: 'Basic ' + Buffer.from(`${account_sid}:${auth_token}`).toString('base64'),
              },
            }
          )
          if (!trunkRes.ok) return NextResponse.json({ valid: false, error: 'SIP Trunk SID gecersiz' })
        }

        return NextResponse.json({ valid: true })
      } catch {
        return NextResponse.json({ valid: false, error: 'Twilio API baglantisi basarisiz' })
      }
    }

    case 'telnyx': {
      const { api_key } = credentials
      if (!api_key) return NextResponse.json({ valid: false, error: 'API Key zorunlu' })
      try {
        const res = await fetch('https://api.telnyx.com/v2/available_phone_numbers?filter[limit]=1', {
          headers: { Authorization: `Bearer ${api_key}` },
        })
        if (!res.ok) return NextResponse.json({ valid: false, error: 'API Key gecersiz' })
        return NextResponse.json({ valid: true })
      } catch {
        return NextResponse.json({ valid: false, error: 'Telnyx API baglantisi basarisiz' })
      }
    }

    case 'netgsm':
      // SIP credentials can only be validated by attempting connection
      return NextResponse.json({ valid: true, note: 'SIP baglantisi kurulurken dogrulanacak' })

    case 'verimor':
      return NextResponse.json({ valid: true, note: 'Baglanti kurulurken dogrulanacak' })

    default:
      return NextResponse.json({ valid: false, error: 'Bilinmeyen provider' })
  }
}
