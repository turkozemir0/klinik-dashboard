import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { SipClient } from 'livekit-server-sdk'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const LIVEKIT_URL    = process.env.LIVEKIT_URL ?? ''
const LIVEKIT_KEY    = process.env.LIVEKIT_API_KEY ?? ''
const LIVEKIT_SECRET = process.env.LIVEKIT_API_SECRET ?? ''

export async function DELETE() {
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
    return NextResponse.json({ error: 'Bu islem icin admin yetkisi gerekli' }, { status: 403 })
  }

  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const currentConfig = (org?.channel_config ?? {}) as any
  const voiceInbound = currentConfig.voice_inbound

  // Try to delete LiveKit SIP trunk
  if (voiceInbound?.livekit_sip_trunk_id && LIVEKIT_URL && LIVEKIT_KEY && LIVEKIT_SECRET) {
    try {
      const httpUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://')
      const sipClient = new SipClient(httpUrl, LIVEKIT_KEY, LIVEKIT_SECRET)
      await sipClient.deleteSipTrunk(voiceInbound.livekit_sip_trunk_id)
    } catch (e) {
      console.warn('[voice/disconnect] LiveKit trunk deletion failed (may already be deleted):', e)
    }
  }

  const { error: updateErr } = await service
    .from('organizations')
    .update({
      channel_config: {
        ...currentConfig,
        voice_inbound: { active: false },
      },
    })
    .eq('id', orgUser.organization_id)

  if (updateErr) {
    console.error('[voice/disconnect] DB update failed:', updateErr)
    return NextResponse.json({ error: 'Baglanti kesilemedi' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
