import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleInboundMessage, getSupabase } from '../_shared/chat-engine.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GHLWebhookPayload {
  type: string
  locationId: string
  contactId: string       // GHL contact ID — always present
  phone?: string          // present for WhatsApp, may be absent for Instagram
  body?: string
  messageType?: string    // 'WhatsApp' | 'Instagram'
}

type GHLChannel = 'WhatsApp' | 'Instagram' | 'SMS'
const SUPPORTED_GHL_CHANNELS: GHLChannel[] = ['WhatsApp', 'Instagram', 'SMS']

// GHL quirk: WhatsApp messages sometimes arrive with messageType: 'SMS'.
// Map to the correct channel for DB storage and reply routing.
function resolveGHLChannel(raw: GHLChannel): { dbChannel: 'whatsapp' | 'instagram'; replyType: GHLChannel } {
  if (raw === 'Instagram') return { dbChannel: 'instagram', replyType: 'Instagram' }
  // 'WhatsApp' and 'SMS' both map to whatsapp — reply with the same type GHL sent
  return { dbChannel: 'whatsapp', replyType: raw }
}

// ─── GHL API helpers ──────────────────────────────────────────────────────────

async function sendGHLMessage(
  pitToken: string,
  contactId: string,
  message: string,
  channel: GHLChannel
): Promise<void> {
  const res = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pitToken}`,
      'Version': '2021-04-15',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: channel, contactId, message }),
  })
  if (!res.ok) console.error(`GHL send failed ${res.status}: ${await res.text()}`)
}

async function updateGHLPipelineStage(
  pitToken: string,
  pipelineId: string,
  stageId: string,
  locationId: string,
  contactId: string,
  channel: GHLChannel
): Promise<void> {
  const searchRes = await fetch(
    `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&contact_id=${contactId}`,
    { headers: { 'Authorization': `Bearer ${pitToken}`, 'Version': '2021-04-15' } }
  )

  let opportunityId: string | null = null
  if (searchRes.ok) {
    const data = await searchRes.json()
    opportunityId = data.opportunities?.[0]?.id ?? null
  }

  const leadName = channel === 'Instagram' ? 'Instagram Lead' : 'WhatsApp Lead'

  if (!opportunityId) {
    await fetch('https://services.leadconnectorhq.com/opportunities/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pitToken}`,
        'Version': '2021-04-15',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId, pipelineId, pipelineStageId: stageId,
        contactId, name: leadName, status: 'open',
      }),
    })
  } else {
    await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${pitToken}`,
        'Version': '2021-04-15',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pipelineStageId: stageId }),
    })
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

async function handleInbound(payload: GHLWebhookPayload): Promise<void> {
  const supabase     = getSupabase()
  const ghlChannel   = payload.messageType as GHLChannel
  const locationId   = payload.locationId
  const ghlContactId = payload.contactId
  const messageText  = (payload.body ?? '').trim()

  if (!messageText) return

  // Find org by GHL location_id
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, crm_config')
    .eq('status', 'active')

  const org = orgs?.find((o: any) => {
    const crm = o.crm_config as Record<string, string>
    return crm?.provider === 'ghl' && crm?.location_id === locationId
  })

  if (!org) {
    console.error(`No active org for GHL location_id: ${locationId}`)
    return
  }

  const crm                        = org.crm_config as Record<string, string>
  const pitToken                   = crm.pit_token
  const pipelineId                 = crm.pipeline_id
  const stageMapping               = (crm as any).stage_mapping as Record<string, string> | undefined
  const { dbChannel, replyType }   = resolveGHLChannel(ghlChannel)

  await handleInboundMessage({
    supabase,
    orgId: org.id,
    phone: payload.phone || null,
    providerContactId:    ghlContactId,
    channelIdentifierKey: 'ghl_contact_id',
    channel:              dbChannel,
    messageText,
    channelMetadata: { ghl_contact_id: ghlContactId, ghl_location_id: locationId },
    sendReply: (message) => sendGHLMessage(pitToken, ghlContactId, message, replyType),
    onNewLead: (stageMapping?.['ai_qualifying'] ?? stageMapping?.['in_progress'])
      ? () => updateGHLPipelineStage(
          pitToken, pipelineId,
          stageMapping['ai_qualifying'] ?? stageMapping['in_progress'],
          locationId, ghlContactId, replyType
        )
      : undefined,
  })
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let payload: GHLWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  if (
    payload.type !== 'InboundMessage' ||
    !SUPPORTED_GHL_CHANNELS.includes(payload.messageType as GHLChannel)
  ) {
    return new Response('OK', { status: 200 })
  }

  // @ts-ignore Deno-specific global
  EdgeRuntime.waitUntil(handleInbound(payload))
  return new Response('OK', { status: 200 })
})
