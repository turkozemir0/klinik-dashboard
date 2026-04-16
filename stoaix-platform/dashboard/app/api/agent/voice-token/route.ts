import { NextRequest, NextResponse } from 'next/server'
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk'
import { checkEntitlement } from '@/lib/entitlements'

const LIVEKIT_URL    = process.env.LIVEKIT_URL!
const LIVEKIT_KEY    = process.env.LIVEKIT_API_KEY!
const LIVEKIT_SECRET = process.env.LIVEKIT_API_SECRET!

export async function POST(req: NextRequest) {
  const { orgId, model = 'claude-sonnet-4-6' } = await req.json()

  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const ent = await checkEntitlement(orgId, 'voice_agent_inbound')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'voice_agent_inbound' }, { status: 403 })

  const roomName = `test-${orgId.slice(0, 8)}-${Date.now()}`
  const identity = `test-user-${Date.now()}`

  // Kullanıcı için LiveKit token
  const at = new AccessToken(LIVEKIT_KEY, LIVEKIT_SECRET, {
    identity,
    name: 'Test Kullanıcısı',
    ttl: '1h',
    metadata: JSON.stringify({ organization_id: orgId, test_mode: true, model }),
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    roomCreate: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  const token = await at.toJwt()

  // Agent'ı bu odaya explicit dispatch ile çağır
  try {
    const httpUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://')
    const dispatch = new AgentDispatchClient(httpUrl, LIVEKIT_KEY, LIVEKIT_SECRET)
    await dispatch.createDispatch(roomName, 'stoaix-platform', {
      metadata: JSON.stringify({ organization_id: orgId, test_mode: true, model }),
    })
  } catch (e) {
    console.warn('Agent dispatch failed (agent may not be running):', e)
    // Token hala geçerli — kullanıcı bağlanabilir, agent yoksa uyarı gösterilir
  }

  return NextResponse.json({
    token,
    url: LIVEKIT_URL,
    roomName,
  })
}
