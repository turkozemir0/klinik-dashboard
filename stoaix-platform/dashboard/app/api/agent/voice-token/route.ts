import { NextRequest, NextResponse } from 'next/server'
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { checkEntitlement } from '@/lib/entitlements'
import { isDemoOrg, getDemoRef, checkDemoRateLimit, incrementDemoUsage } from '@/lib/demo-guard'

const LIVEKIT_URL    = process.env.LIVEKIT_URL!
const LIVEKIT_KEY    = process.env.LIVEKIT_API_KEY!
const LIVEKIT_SECRET = process.env.LIVEKIT_API_SECRET!

const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'gpt-4o-mini']

const ALLOWED_SCENARIOS = [
  'first_contact', 'warm_followup', 'appt_confirm',
  'noshow_followup', 'satisfaction_survey', 'treatment_reminder',
  'reactivation', 'payment_followup', 'appointment_reminder',
]

export async function POST(req: NextRequest) {
  // --- Auth ---
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgId = orgUser.organization_id

  // --- Input validation ---
  const { model: rawModel = 'claude-sonnet-4-6', scenario } = await req.json()
  const model = ALLOWED_MODELS.includes(rawModel) ? rawModel : 'claude-sonnet-4-6'

  if (scenario && !ALLOWED_SCENARIOS.includes(scenario)) {
    return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 })
  }

  // Demo rate limiting
  if (isDemoOrg(orgId)) {
    const ref = getDemoRef()
    const limit = await checkDemoRateLimit(ref, 'voice_minutes')
    if (limit) return NextResponse.json({ error: limit.error, limit: limit.limit, used: limit.used, message: 'Günlük demo limitiniz doldu.' }, { status: 429 })
    await incrementDemoUsage(ref, 'voice_minutes', 1)
  }

  const ent = await checkEntitlement(orgId, 'voice_agent_inbound')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'voice_agent_inbound' }, { status: 403 })

  const roomName = `test-${orgId.slice(0, 8)}-${Date.now()}`
  const identity = `test-user-${Date.now()}`

  // Build metadata for both user token and dispatch
  const meta: Record<string, any> = { organization_id: orgId, test_mode: true, model }
  if (scenario) {
    meta.scenario = scenario
    meta.contact_name = 'Test Müşteri'

    // Senaryo-bazlı test verisi
    if (scenario === 'appt_confirm' || scenario === 'appointment_reminder') {
      meta.appointment_time = 'Yarın saat 14:00'
    }
    if (scenario === 'appointment_reminder') {
      meta.reminder_hours = '24'
    }
    if (scenario === 'reactivation') {
      meta.offer_text = 'Bu ay size özel indirimli konsültasyon fırsatımız var.'
    }
    if (scenario === 'treatment_reminder') {
      meta.interval_days = '180'
    }
    if (scenario === 'first_contact') {
      meta.attempt = '1'
    }
    if (scenario === 'noshow_followup') {
      meta.context_note = 'Bugünkü randevusuna gelmedi.'
    }
  }

  // Kullanıcı için LiveKit token
  const at = new AccessToken(LIVEKIT_KEY, LIVEKIT_SECRET, {
    identity,
    name: 'Test Kullanıcısı',
    ttl: '5m',
    metadata: JSON.stringify(meta),
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    roomCreate: false,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false,
  })

  const token = await at.toJwt()

  // Agent'ı bu odaya explicit dispatch ile çağır
  let dispatchOk = false
  let dispatchError = ''
  try {
    const httpUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://')
    const dispatch = new AgentDispatchClient(httpUrl, LIVEKIT_KEY, LIVEKIT_SECRET)
    await dispatch.createDispatch(roomName, 'stoaix-platform', {
      metadata: JSON.stringify(meta),
    })
    dispatchOk = true
  } catch (e: any) {
    console.warn('Agent dispatch failed:', e?.message || String(e))
    dispatchError = 'dispatch_failed'
  }

  return NextResponse.json({
    token,
    url: LIVEKIT_URL,
    roomName,
    dispatchOk,
    dispatchError,
  })
}
