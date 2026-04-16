import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleInboundMessage, updateLeadWithVision, getSupabase } from '../_shared/chat-engine.ts'

// ─── 360dialog webhook types ──────────────────────────────────────────────────
// 360dialog uses the same Meta Cloud API webhook format
// Docs: https://docs.360dialog.com/whatsapp-api/whatsapp-api/webhooks

interface MetaMessage {
  from:      string   // wa_id — phone without '+', e.g. "905551234567"
  to?:       string   // present in SMB echo (outbound), value = wa_id of the recipient
  id:        string   // wamid — used for idempotency (duplicate webhook prevention)
  type:      string   // 'text' | 'image' | 'audio' | 'document' | ...
  timestamp: string
  text?:     { body: string }
  image?:    { id: string; mime_type?: string; caption?: string }
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
          phone_number_id: string   // routes to the correct org
        }
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: MetaMessage[]
        statuses?: Array<{
          id:     string   // wamid of the sent message
          status: 'sent' | 'delivered' | 'read' | 'failed'
          recipient_id?: string
        }>
      }
      field: string
    }>
  }>
}

// ─── Sector-aware vision prompts ──────────────────────────────────────────────

const VISION_PROMPTS: Record<string, string> = {
  dental:     'Hangi diş bölgesi? Kırık, renk bozukluğu, eksik diş, dolgu, protez var mı? Kısa, klinik.',
  hair:       'Dökülme alanı, yoğunluk, bölge? Norwood skalasına göre tahmin.',
  aesthetics: 'Hangi bölge, ne tür endikasyon? Botoks, filler, ameliyat?',
  default:    'Klinik açıdan önemli bir bilgi var mı? Kısa tut.',
}

// ─── 360dialog send helper ────────────────────────────────────────────────────
// API endpoint: https://waba.360dialog.io/v1/messages
// Auth: D360-API-KEY header (not Bearer token)

async function send360dialogMessage(
  clientToken: string,
  to:          string,   // wa_id (phone without '+')
  message:     string
): Promise<void> {
  const res = await fetch('https://waba.360dialog.io/v1/messages', {
    method: 'POST',
    headers: {
      'D360-API-KEY': clientToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type:    'individual',
      to,
      type:              'text',
      text:              { body: message },
    }),
  })
  if (!res.ok) console.error(`360dialog send failed ${res.status}: ${await res.text()}`)
}

// ─── GPT-4o Vision call ───────────────────────────────────────────────────────

async function callGPTVision(imageUrl: string, prompt: string): Promise<string> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')!}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'text',      text: prompt },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          ],
        }],
      }),
    })
    if (!res.ok) {
      console.error(`GPT-4o Vision failed ${res.status}`)
      return ''
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  } catch (err) {
    console.error('Vision error:', err)
    return ''
  }
}

// ─── SMB Echo: human agent sent a message from the mobile app ─────────────────
// In coexistence mode, messages sent by the sales rep appear as echo webhooks.
// message.from === phoneNumberId → outbound echo from our number.

async function handleHumanEcho(
  supabase:      ReturnType<typeof getSupabase>,
  orgId:         string,
  message:       MetaMessage
): Promise<void> {
  // 'to' in an echo = the customer's wa_id
  const customerWaId = message.to
  if (!customerWaId) return

  const customerPhone = '+' + customerWaId

  // Find active conversation for this contact
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .filter("channel_identifiers->>'wa_id'", 'eq', customerWaId)
    .maybeSingle()

  if (!contact?.id) return

  const { data: convo } = await supabase
    .from('conversations')
    .select('id, mode')
    .eq('organization_id', orgId)
    .eq('contact_id', contact.id)
    .eq('channel', 'whatsapp')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!convo?.id) return

  // Switch conversation to human mode
  if (convo.mode !== 'human') {
    await supabase
      .from('conversations')
      .update({ mode: 'human' })
      .eq('id', convo.id)
  }

  // Cancel any pending re_contact follow-up tasks
  await supabase
    .from('follow_up_tasks')
    .update({ status: 'cancelled' })
    .eq('organization_id', orgId)
    .eq('contact_id', contact.id)
    .eq('status', 'pending')
    .like('sequence_stage', 're_contact_%')

  // Notify org: human agent took over via mobile
  await supabase.from('notifications').insert({
    organization_id: orgId,
    type:            'human_echo_detected',
    conversation_id: convo.id,
    title:           'Satışçı konuşmayı devraldı',
    body:            `Mobil uygulama üzerinden mesaj gönderildi (${customerPhone}). AI modu kapatıldı.`,
  })
}

// ─── Image message handler (Faz 3 — Vision Pipeline) ─────────────────────────

async function handleImageMessage(
  phoneNumberId: string,
  message:       MetaMessage,
  org:           { id: string; sector?: string | null },
  clientToken:   string,
  waId:          string
): Promise<void> {
  const mediaId = message.image?.id
  if (!mediaId) return

  // Fetch signed media URL from 360dialog
  const mediaRes = await fetch(`https://waba-v2.360dialog.io/${mediaId}`, {
    headers: { 'D360-API-KEY': clientToken },
  })
  if (!mediaRes.ok) {
    console.error(`Media fetch failed ${mediaRes.status}`)
    await send360dialogMessage(clientToken, waId,
      'Görselinizi alırken bir sorun oluştu. Lütfen tekrar gönderin.')
    return
  }

  const mediaData = await mediaRes.json()
  const imageUrl  = mediaData.url
  if (!imageUrl) {
    await send360dialogMessage(clientToken, waId,
      'Görselinizi alırken bir sorun oluştu. Lütfen tekrar gönderin.')
    return
  }

  const sector  = (org as any).sector ?? 'default'
  const prompt  = VISION_PROMPTS[sector] ?? VISION_PROMPTS.default
  const analysis = await callGPTVision(imageUrl, prompt)

  const supabase = getSupabase()
  if (analysis) {
    await updateLeadWithVision(supabase, org.id, waId, analysis, message.id)
  }

  // Acknowledge the image — do not run the full chat engine
  await send360dialogMessage(clientToken, waId,
    'Fotoğrafınızı aldım, uzman ekibimiz inceleyecek. ✅')
}

// ─── Main text message handler ────────────────────────────────────────────────

async function handleInbound(
  phoneNumberId: string,
  message:       MetaMessage,
  orgs:          any[]
): Promise<void> {
  const supabase    = getSupabase()
  const waId        = message.from
  const phone       = '+' + waId
  const messageText = message.text?.body?.trim() ?? ''

  // Find org by 360dialog phone_number_id stored in channel_config.whatsapp.credentials
  const org = orgs?.find((o: any) => {
    const wa = (o.channel_config as any)?.whatsapp
    return wa?.provider === '360dialog' && wa?.credentials?.phone_number_id === phoneNumberId
  })

  if (!org) {
    console.error(`No active org for 360dialog phone_number_id: ${phoneNumberId}`)
    return
  }

  const creds       = (org.channel_config as any)?.whatsapp?.credentials ?? {}
  const clientToken = creds.client_token

  if (!clientToken) {
    console.error(`Missing client_token for org: ${org.id}`)
    return
  }

  // Route by message type
  switch (message.type) {
    case 'text': {
      if (!messageText) return
      await handleInboundMessage({
        supabase,
        orgId:                org.id,
        phone,
        providerContactId:    waId,
        channelIdentifierKey: 'wa_id',
        channel:              'whatsapp',
        messageText,
        externalId:           message.id,
        channelMetadata: {
          wa_id:           waId,
          phone_number_id: phoneNumberId,
          provider:        '360dialog',
        },
        sendReply: (msg) => send360dialogMessage(clientToken, waId, msg),
      })
      break
    }

    case 'image': {
      await handleImageMessage(phoneNumberId, message, org, clientToken, waId)
      break
    }

    default: {
      // Audio, document, sticker, location, etc. — friendly fallback
      await send360dialogMessage(clientToken, waId,
        'Üzgünüm, şu an yalnızca metin ve görsel mesajları anlayabiliyorum. Lütfen yazmak istediğinizi metin olarak iletin.')
      break
    }
  }
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const url = new URL(req.url)

  // ── Webhook verification (GET) ──
  // 360dialog sends same Meta-style verification:
  // GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token && challenge) {
      const supabase = getSupabase()
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, channel_config')
        .eq('status', 'active')

      const matched = orgs?.find((o: any) => {
        const wa = (o.channel_config as any)?.whatsapp
        return wa?.provider === '360dialog' && wa?.credentials?.webhook_verify_token === token
      })

      if (matched) return new Response(challenge, { status: 200 })
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

  // Load all active orgs once — shared across all messages in this batch
  const supabase = getSupabase()
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, sector, channel_config')
    .eq('status', 'active')

  const tasks: Promise<void>[] = []

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue

      const { metadata, messages: msgs, statuses } = change.value
      const phoneNumberId = metadata.phone_number_id

      // ── Delivery/read receipts — log failures, skip chat engine ──
      if (statuses?.length) {
        for (const s of statuses) {
          if (s.status === 'failed') {
            console.error(`360dialog delivery failed for wamid: ${s.id}`)
          }
        }
        continue
      }

      // ── Process inbound messages ──
      for (const message of msgs ?? []) {
        // SMB Echo detection: if message.from === phoneNumberId, it's an outbound echo
        // (the human agent sent a message from the mobile app → we should NOT run AI)
        if (message.from === phoneNumberId) {
          // Find org for this phoneNumberId
          const echoOrg = orgs?.find((o: any) => {
            const wa = (o.channel_config as any)?.whatsapp
            return wa?.provider === '360dialog' && wa?.credentials?.phone_number_id === phoneNumberId
          })
          if (echoOrg) {
            tasks.push(handleHumanEcho(supabase, echoOrg.id, message))
          }
          continue
        }

        tasks.push(handleInbound(phoneNumberId, message, orgs ?? []))
      }
    }
  }

  // Ack immediately — 360dialog requires fast response to avoid retries
  // @ts-ignore Deno-specific global
  EdgeRuntime.waitUntil(Promise.all(tasks))
  return new Response('OK', { status: 200 })
})
