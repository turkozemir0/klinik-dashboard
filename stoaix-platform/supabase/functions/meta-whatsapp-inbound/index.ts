import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleInboundMessage, getSupabase } from '../_shared/chat-engine.ts'

// ─── Meta Cloud API webhook types ─────────────────────────────────────────────
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks

interface MetaTextMessage {
  from:      string   // wa_id — phone without '+', e.g. "905551234567"
  id:        string   // message ID (used to avoid duplicate processing)
  type:      string   // 'text' | 'image' | 'audio' | 'document' | 'sticker' | ...
  timestamp: string
  text?:     { body: string }
}

interface MetaWebhookPayload {
  object: string   // 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string   // used to route to the correct org
        }
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: MetaTextMessage[]
        statuses?: unknown[]  // delivery/read receipts — ignored
      }
      field: string  // 'messages'
    }>
  }>
}

// ─── Meta Graph API helpers ───────────────────────────────────────────────────

async function sendMetaMessage(
  accessToken:   string,
  phoneNumberId: string,
  to:            string,   // wa_id (phone without '+')
  message:       string
): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    }
  )
  if (!res.ok) console.error(`Meta send failed ${res.status}: ${await res.text()}`)
}

// ─── Main handler ─────────────────────────────────────────────────────────────

async function handleInbound(
  phoneNumberId: string,
  message:       MetaTextMessage
): Promise<void> {
  // Only process text messages — skip images, audio, stickers, etc. for now
  if (message.type !== 'text' || !message.text?.body?.trim()) return

  const supabase    = getSupabase()
  const waId        = message.from              // e.g. "905551234567"
  const phone       = '+' + waId               // E.164: "+905551234567"
  const messageText = message.text.body.trim()

  // Find org by Meta phone_number_id.
  // Supports two storage paths:
  //   1. Legacy:  crm_config.provider === 'meta'      + crm_config.phone_number_id
  //   2. Current: channel_config.whatsapp.provider === 'whatsapp_cloud' + channel_config.whatsapp.credentials.phone_number_id
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, crm_config, channel_config')
    .eq('status', 'active')

  const org = orgs?.find((o: any) => {
    const crm = o.crm_config as Record<string, string>
    if (crm?.provider === 'meta' && crm?.phone_number_id === phoneNumberId) return true
    const wa = (o.channel_config as any)?.whatsapp
    return wa?.provider === 'whatsapp_cloud' && wa?.credentials?.phone_number_id === phoneNumberId
  })

  if (!org) {
    console.error(`No active org for Meta phone_number_id: ${phoneNumberId}`)
    return
  }

  // Resolve access token — prefer channel_config.whatsapp.credentials, fall back to crm_config
  const waCreds   = (org.channel_config as any)?.whatsapp?.credentials ?? {}
  const crm       = org.crm_config as Record<string, string>
  const accessToken = waCreds.access_token ?? crm.access_token

  await handleInboundMessage({
    supabase,
    orgId: org.id,
    phone,
    providerContactId:    waId,
    channelIdentifierKey: 'wa_id',
    channel:              'whatsapp',
    messageText,
    channelMetadata: {
      wa_id:           waId,
      phone_number_id: phoneNumberId,
    },
    // Meta Graph API — send reply back to the same wa_id
    sendReply: (msg) => sendMetaMessage(accessToken, phoneNumberId, waId, msg),
    // Meta doesn't have a built-in CRM pipeline — onNewLead is omitted.
    // If the customer also uses a CRM, add integration here.
  })
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const url = new URL(req.url)

  // ── Meta webhook verification (one-time GET during app setup) ──
  // Meta sends: GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === Deno.env.get('META_WEBHOOK_VERIFY_TOKEN')) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let payload: MetaWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  // Only handle WhatsApp Business Account events
  if (payload.object !== 'whatsapp_business_account') {
    return new Response('OK', { status: 200 })
  }

  // Collect all message-handling tasks across all entries/changes
  const tasks: Promise<void>[] = []

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue

      const phoneNumberId = change.value.metadata.phone_number_id

      for (const message of change.value.messages ?? []) {
        tasks.push(handleInbound(phoneNumberId, message))
      }
    }
  }

  // Ack immediately — Meta requires fast response to avoid retries
  // @ts-ignore Deno-specific global
  EdgeRuntime.waitUntil(Promise.all(tasks))
  return new Response('OK', { status: 200 })
})
