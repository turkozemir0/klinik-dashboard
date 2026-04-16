import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleInboundMessage, getSupabase } from '../_shared/chat-engine.ts'

// ─── Instagram Messaging webhook types ────────────────────────────────────────
// Docs: https://developers.facebook.com/docs/messenger-platform/instagram/features/send-message

interface IGMessage {
  mid:          string   // message ID — used for idempotency
  text?:        string
  attachments?: Array<{
    type:    string          // 'image' | 'audio' | 'video' | 'file' | 'story_mention' | ...
    payload: { url?: string }
  }>
}

interface IGMessaging {
  sender:    { id: string }   // IGSID of the customer
  recipient: { id: string }   // Instagram Business Account ID (= Page ID)
  timestamp: number
  message?:  IGMessage
  read?:     unknown          // read receipt — ignored
  delivery?: unknown          // delivery receipt — ignored
}

interface IGWebhookPayload {
  object: string   // 'instagram'
  entry: Array<{
    id:        string   // Page ID
    time:      number
    messaging: IGMessaging[]
  }>
}

// ─── Meta Graph API send helper ───────────────────────────────────────────────

async function sendInstagramMessage(
  accessToken: string,
  pageId:      string,
  recipientId: string,
  message:     string
): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        recipient:      { id: recipientId },
        message:        { text: message },
        messaging_type: 'RESPONSE',
      }),
    }
  )
  if (!res.ok) console.error(`IG send failed ${res.status}: ${await res.text()}`)
}

// ─── Message handler ──────────────────────────────────────────────────────────

async function handleInbound(
  event: IGMessaging,
  orgs:  any[]
): Promise<void> {
  const { sender, recipient, message } = event
  if (!message) return

  const pageId      = recipient.id
  const senderId    = sender.id

  // Echo detection: sender === recipient means it's a message sent BY our account
  if (senderId === pageId) return

  // Find org by instagram page_id stored in channel_config.instagram.credentials
  const org = orgs?.find((o: any) => {
    const ig = (o.channel_config as any)?.instagram
    return ig?.credentials?.page_id === pageId
  })

  if (!org) {
    console.error(`No active org for Instagram page_id: ${pageId}`)
    return
  }

  const creds       = (org.channel_config as any)?.instagram?.credentials ?? {}
  const accessToken = creds.access_token
  const fbPageId    = creds.fb_page_id ?? pageId  // use Facebook Page ID for send; fallback to IG account ID

  if (!accessToken) {
    console.error(`Missing access_token for org: ${org.id}`)
    return
  }

  const supabase = getSupabase()
  const reply    = (msg: string) => sendInstagramMessage(accessToken, fbPageId, senderId, msg)

  if (message.text?.trim()) {
    await handleInboundMessage({
      supabase,
      orgId:                org.id,
      phone:                null,    // Instagram DM has no phone number
      providerContactId:    senderId,
      channelIdentifierKey: 'instagram_id',
      channel:              'instagram',
      messageText:          message.text.trim(),
      externalId:           message.mid,
      channelMetadata: {
        instagram_id: senderId,
        page_id:      pageId,
        provider:     'meta',
      },
      sendReply: reply,
    })
    return
  }

  // Non-text attachments (image, video, audio, story mention, etc.) — friendly fallback
  if (message.attachments?.length) {
    await reply('Üzgünüm, şu an yalnızca metin mesajlarını anlayabiliyorum. Lütfen yazmak istediğinizi metin olarak iletin.')
  }
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const url = new URL(req.url)

  // ── Webhook verification (GET) ──
  // Meta sends: GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === Deno.env.get('INSTAGRAM_WEBHOOK_VERIFY_TOKEN') && challenge) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let payload: IGWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  // DEBUG: log raw payload to diagnose routing issues — remove after testing
  console.log('IG webhook payload:', JSON.stringify(payload))

  // Only handle Instagram events
  if (payload.object !== 'instagram') {
    console.log('Skipped non-instagram object:', payload.object)
    return new Response('OK', { status: 200 })
  }

  // Load all active orgs once — shared across all messages in this batch
  const supabase = getSupabase()
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, channel_config')
    .eq('status', 'active')

  const tasks: Promise<void>[] = []

  for (const entry of payload.entry ?? []) {
    // Format 1: Messenger Platform format — real DMs
    for (const event of (entry as any).messaging ?? []) {
      if (!event.message) continue
      tasks.push(handleInbound(event, orgs ?? []))
    }

    // Format 2: Changes format — sent by Meta Test button + some webhook configs
    for (const change of (entry as any).changes ?? []) {
      if (change.field !== 'messages') continue
      const v = change.value
      if (!v?.message) continue
      const event: IGMessaging = {
        sender:    v.sender,
        recipient: v.recipient,
        timestamp: Number(v.timestamp),
        message:   v.message,
      }
      tasks.push(handleInbound(event, orgs ?? []))
    }
  }

  // Ack immediately — Meta requires fast response to avoid retries
  // @ts-ignore Deno-specific global
  EdgeRuntime.waitUntil(Promise.all(tasks))
  return new Response('OK', { status: 200 })
})
