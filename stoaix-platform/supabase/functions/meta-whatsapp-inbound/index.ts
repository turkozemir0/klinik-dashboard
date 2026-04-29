import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleInboundMessage, updateLeadWithVision, getSupabase } from '../_shared/chat-engine.ts'

// ─── Meta Cloud API webhook types ─────────────────────────────────────────────
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks

interface MetaMessage {
  from:      string   // wa_id — phone without '+', e.g. "905551234567"
  to?:       string   // present in SMB echo (outbound), value = wa_id of the recipient
  id:        string   // wamid — used for idempotency
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
          phone_number_id: string   // used to route to the correct org
        }
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: MetaMessage[]
        statuses?: Array<{
          id:     string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          recipient_id?: string
        }>
        // Template status update events
        message_template?: {
          name:             string
          status:           'APPROVED' | 'REJECTED' | 'PENDING' | 'PAUSED' | 'DISABLED'
          id?:              string
          rejection_reason?: string
          category?:        string
          language?:        string
        }
        waba_id?: string
      }
      field: string  // 'messages' | 'message_template_status_update'
    }>
  }>
}

// ─── Sector-aware vision prompts (language × sector) ─────────────────────────

const VISION_PROMPTS: Record<string, Record<string, string>> = {
  tr: {
    dental:     'Bir klinik danışmanlık asistanısın, teşhis değil gözlem yapıyorsun. Görselde hangi diş bölgesi görünüyor? Kırık, renk bozukluğu, eksik diş, dolgu veya protez var mı? Kısa ve açıklayıcı yaz.',
    hair:       'Bir klinik danışmanlık asistanısın, teşhis değil gözlem yapıyorsun. Görselde saç dökülme alanı, saç yoğunluğu ve etkilenen bölgeyi tanımla. Norwood skalasına göre yaklaşık aşamayı belirt. Kısa yaz.',
    aesthetics: 'Bir klinik danışmanlık asistanısın, teşhis değil gözlem yapıyorsun. Görselde hangi yüz/vücut bölgesi var? Botoks, dolgu veya cerrahi açıdan ne tür bir endikasyon gözlemliyorsun? Kısa yaz.',
    default:    'Bir klinik danışmanlık asistanısın, teşhis değil gözlem yapıyorsun. Görselde dikkat çeken noktaları kısaca tanımla.',
  },
  de: {
    dental:     'Du bist ein klinischer Beratungsassistent — du machst Beobachtungen, keine Diagnosen. Welcher Zahnbereich ist zu sehen? Gibt es Brüche, Verfärbungen, fehlende Zähne, Füllungen oder Prothesen? Kurz und beschreibend.',
    hair:       'Du bist ein klinischer Beratungsassistent — du machst Beobachtungen, keine Diagnosen. Beschreibe den Bereich des Haarausfalls, die Haardichte und die betroffene Zone. Schätze die ungefähre Stufe nach der Norwood-Skala. Kurz.',
    aesthetics: 'Du bist ein klinischer Beratungsassistent — du machst Beobachtungen, keine Diagnosen. Welcher Gesichts-/Körperbereich ist zu sehen? Welche Indikation für Botox, Filler oder OP beobachtest du? Kurz.',
    default:    'Du bist ein klinischer Beratungsassistent — du machst Beobachtungen, keine Diagnosen. Beschreibe kurz die auffälligen Punkte im Bild.',
  },
  en: {
    dental:     'You are a clinical consultation assistant — you make observations, not diagnoses. Which dental area is visible? Any fractures, discoloration, missing teeth, fillings, or prostheses? Brief and descriptive.',
    hair:       'You are a clinical consultation assistant — you make observations, not diagnoses. Describe the hair loss area, density, and affected zone. Estimate the approximate Norwood scale stage. Brief.',
    aesthetics: 'You are a clinical consultation assistant — you make observations, not diagnoses. Which facial/body area is shown? What indication for Botox, filler, or surgery do you observe? Brief.',
    default:    'You are a clinical consultation assistant — you make observations, not diagnoses. Briefly describe the notable points in the image.',
  },
}

// ─── Language-aware UI messages ──────────────────────────────────────────────

const I18N: Record<string, { imageAck: string; imageError: string; unsupported: string }> = {
  tr: {
    imageAck:    'Fotoğrafınızı aldım, uzman ekibimiz inceleyecek.',
    imageError:  'Görselinizi alırken bir sorun oluştu. Lütfen tekrar gönderin.',
    unsupported: 'Üzgünüm, şu an yalnızca metin ve görsel mesajları anlayabiliyorum. Lütfen yazmak istediğinizi metin olarak iletin.',
  },
  de: {
    imageAck:    'Vielen Dank für Ihr Foto! Unser Expertenteam wird es prüfen.',
    imageError:  'Beim Empfang Ihres Bildes ist ein Fehler aufgetreten. Bitte senden Sie es erneut.',
    unsupported: 'Entschuldigung, ich kann derzeit nur Text- und Bildnachrichten verarbeiten. Bitte senden Sie Ihre Anfrage als Textnachricht.',
  },
  en: {
    imageAck:    'Thank you for your photo! Our expert team will review it.',
    imageError:  'There was an issue receiving your image. Please send it again.',
    unsupported: 'Sorry, I can only process text and image messages at the moment. Please send your request as a text message.',
  },
}

function getI18n(lang: string) {
  return I18N[lang] ?? I18N.tr
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

// ─── GPT-4o Vision call ───────────────────────────────────────────────────────

async function callGPTVision(imageUrl: string, prompt: string): Promise<string> {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) { console.error('OPENAI_API_KEY not set'); return '' }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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

// ─── SMB Echo: human agent sent a message from the mobile/web app ─────────────
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

  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .filter('channel_identifiers->>wa_id', 'eq', customerWaId)
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

  if (convo.mode !== 'human') {
    await supabase
      .from('conversations')
      .update({ mode: 'human' })
      .eq('id', convo.id)
  }

  await supabase
    .from('follow_up_tasks')
    .update({ status: 'cancelled' })
    .eq('organization_id', orgId)
    .eq('contact_id', contact.id)
    .eq('status', 'pending')
    .like('sequence_stage', 're_contact_%')

  await supabase.from('notifications').insert({
    organization_id: orgId,
    type:            'human_echo_detected',
    conversation_id: convo.id,
    title:           'Satışçı konuşmayı devraldı',
    body:            `Mobil/web üzerinden mesaj gönderildi (${customerPhone}). AI modu kapatıldı.`,
  })
}

// ─── Resolve language: contact override → org default → 'tr' ────────────────

async function resolveLanguage(
  orgId:          string,
  orgDefaultLang: string,
  identifierKey:  string,
  identifierVal:  string
): Promise<string> {
  try {
    const supabase = getSupabase()
    const { data: contact } = await supabase
      .from('contacts')
      .select('preferred_language')
      .eq('organization_id', orgId)
      .filter(`channel_identifiers->>${identifierKey}`, 'eq', identifierVal)
      .maybeSingle()
    if (contact?.preferred_language) return contact.preferred_language
  } catch { /* ignore — fall through */ }
  return orgDefaultLang || 'tr'
}

// ─── Image message handler (Vision Pipeline) ─────────────────────────────────

async function handleImageMessage(
  phoneNumberId: string,
  message:       MetaMessage,
  org:           { id: string; sector?: string | null; default_language?: string },
  accessToken:   string,
  waId:          string
): Promise<void> {
  const mediaId = message.image?.id
  if (!mediaId) return

  const lang = await resolveLanguage(org.id, (org as any).default_language ?? 'tr', 'wa_id', waId)
  const msgs = getI18n(lang)

  // Step 1: Resolve media URL from Meta Graph API
  const infoRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  if (!infoRes.ok) {
    console.error(`Meta media info failed ${infoRes.status}`)
    await sendMetaMessage(accessToken, phoneNumberId, waId, msgs.imageError)
    return
  }
  const infoData = await infoRes.json()
  const mediaUrl = infoData.url
  if (!mediaUrl) {
    await sendMetaMessage(accessToken, phoneNumberId, waId, msgs.imageError)
    return
  }

  // Step 2: Download the actual image bytes (Meta media URLs require Bearer auth)
  const imgRes = await fetch(mediaUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  if (!imgRes.ok) {
    console.error(`Meta media download failed ${imgRes.status}`)
    await sendMetaMessage(accessToken, phoneNumberId, waId, msgs.imageError)
    return
  }

  // Convert to base64 data URL for GPT-4o Vision
  const blob    = await imgRes.arrayBuffer()
  const mime    = infoData.mime_type ?? 'image/jpeg'
  const dataUrl = `data:${mime};base64,${toBase64(blob)}`

  // ── Upload to Supabase Storage for persistent URL ──
  let persistentUrl = mediaUrl  // fallback to Meta URL if upload fails
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const safeName = message.id.replace(/[^a-zA-Z0-9_-]/g, '_')
    const path = `${org.id}/${yearMonth}/${safeName}.${ext}`

    const storageSupabase = getSupabase()
    const { error: uploadErr } = await storageSupabase.storage
      .from('wa-media')
      .upload(path, blob, { contentType: mime, upsert: true })

    if (uploadErr) {
      console.error('Storage upload failed:', uploadErr.message)
    } else {
      persistentUrl = `${supabaseUrl}/storage/v1/object/public/wa-media/${path}`
    }
  } catch (err) {
    console.error('Storage upload error:', err)
  }

  const sector     = (org as any).sector ?? 'default'
  const langPrompts = VISION_PROMPTS[lang] ?? VISION_PROMPTS.tr
  const prompt     = langPrompts[sector] ?? langPrompts.default
  const analysis   = await callGPTVision(dataUrl, prompt)

  const supabase = getSupabase()
  if (analysis) {
    await updateLeadWithVision(supabase, org.id, waId, analysis, message.id, persistentUrl)
  } else {
    console.error(`Vision returned empty for waId: ${waId}`)
  }

  // Only send ack if we haven't sent one for this contact in the last 2 minutes
  // (prevents spam when user sends multiple photos back-to-back)
  let shouldAck = true
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', org.id)
      .filter('channel_identifiers->>wa_id', 'eq', waId)
      .maybeSingle()

    if (contact?.id) {
      const { data: convo } = await supabase
        .from('conversations')
        .select('id')
        .eq('organization_id', org.id)
        .eq('contact_id', contact.id)
        .eq('channel', 'whatsapp')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (convo?.id) {
        const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', convo.id)
          .eq('role', 'system')
          .eq('content_type', 'image')
          .gte('created_at', twoMinAgo)

        if (count && count > 0) shouldAck = false
      }
    }
  } catch { /* ignore — send ack as fallback */ }

  if (shouldAck) {
    await sendMetaMessage(accessToken, phoneNumberId, waId, msgs.imageAck)
  }
}

// ─── Main inbound handler ─────────────────────────────────────────────────────

async function handleInbound(
  phoneNumberId: string,
  message:       MetaMessage,
  orgs:          any[]
): Promise<void> {
  // Find org — supports both legacy crm_config.provider==='meta' and channel_config.whatsapp.provider==='whatsapp_cloud'
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

  const waCreds     = (org.channel_config as any)?.whatsapp?.credentials ?? {}
  const crm         = org.crm_config as Record<string, string>
  const accessToken = waCreds.access_token ?? crm.access_token

  if (!accessToken) {
    console.error(`Missing access_token for org: ${org.id}`)
    return
  }

  const supabase = getSupabase()
  const waId     = message.from
  const phone    = '+' + waId

  switch (message.type) {
    case 'text': {
      const messageText = message.text?.body?.trim() ?? ''
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
          provider:        'whatsapp_cloud',
        },
        sendReply: (msg) => sendMetaMessage(accessToken, phoneNumberId, waId, msg),
      })
      break
    }

    case 'image': {
      await handleImageMessage(phoneNumberId, message, org, accessToken, waId)
      break
    }

    default: {
      // Audio, document, sticker, location, etc.
      const lang = await resolveLanguage(org.id, org.default_language ?? 'tr', 'wa_id', waId)
      await sendMetaMessage(accessToken, phoneNumberId, waId, getI18n(lang).unsupported)
      break
    }
  }
}

// ─── Template status update handler ──────────────────────────────────────────
// Called when Meta approves or rejects a submitted template.

async function handleTemplateStatusUpdate(
  supabase:        ReturnType<typeof getSupabase>,
  templateEvent:   NonNullable<MetaWebhookPayload['entry'][0]['changes'][0]['value']['message_template']>,
  wabaId?:         string
): Promise<void> {
  const { name, status, id: metaTemplateId, rejection_reason } = templateEvent

  // Map Meta status to our DB status
  const statusMap: Record<string, string> = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PENDING:  'pending',
    PAUSED:   'rejected',
    DISABLED: 'rejected',
  }
  const dbStatus = statusMap[status]
  if (!dbStatus) return

  // Find the template in DB — match by name + waba_id (via org's channel_config)
  // First try to find the org by waba_id, then find the template
  let orgId: string | null = null
  if (wabaId) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, channel_config')
      .eq('status', 'active')
    const matchOrg = orgs?.find((o: any) => {
      const waCreds = (o.channel_config as any)?.whatsapp?.credentials
      return waCreds?.waba_id === wabaId
    })
    orgId = matchOrg?.id ?? null
  }

  const query = supabase
    .from('message_templates')
    .update({
      status:           dbStatus,
      meta_template_id: metaTemplateId ?? null,
      rejection_reason: rejection_reason ?? null,
      updated_at:       new Date().toISOString(),
    })
    .eq('name', name)

  if (orgId) {
    query.eq('organization_id', orgId)
  }

  const { error } = await query
  if (error) {
    console.error(`Template status update failed for "${name}":`, error.message)
  } else {
    console.log(`Template "${name}" status updated → ${dbStatus}`)
  }
}

// ─── HMAC-SHA256 signature verification ───────────────────────────────────────
// Meta signs every webhook POST with X-Hub-Signature-256: sha256=<hmac>
// using the Meta App Secret as the key.

async function verifyMetaSignature(rawBody: Uint8Array, signatureHeader: string | null): Promise<boolean> {
  const appSecret = Deno.env.get('META_APP_SECRET')
  if (!appSecret) {
    console.error('META_APP_SECRET not set — skipping signature verification')
    return true  // fail-open only if secret is not configured (should be set in production)
  }
  if (!signatureHeader?.startsWith('sha256=')) return false

  const expected = signatureHeader.slice(7)
  const keyData  = new TextEncoder().encode(appSecret)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig    = await crypto.subtle.sign('HMAC', cryptoKey, rawBody)
  const actual = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return actual === expected
}

// ─── Safe base64 encoding (avoids spread stack overflow on large images) ──────

function toBase64(buffer: ArrayBuffer): string {
  const bytes  = new Uint8Array(buffer)
  const CHUNK  = 8192
  let binary   = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const url = new URL(req.url)

  // ── Meta webhook verification (one-time GET during app setup) ──
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

  // ── Verify Meta signature before parsing ──
  const rawBody = new Uint8Array(await req.arrayBuffer())
  const sigHeader = req.headers.get('x-hub-signature-256')
  if (!await verifyMetaSignature(rawBody, sigHeader)) {
    console.error('Meta webhook signature mismatch — rejecting request')
    return new Response('Forbidden', { status: 403 })
  }

  let payload: MetaWebhookPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody))
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  if (payload.object !== 'whatsapp_business_account') {
    return new Response('OK', { status: 200 })
  }

  // Load all active orgs once — shared across all messages in this batch
  const supabase = getSupabase()
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, sector, default_language, crm_config, channel_config')
    .eq('status', 'active')

  const tasks: Promise<void>[] = []

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      // ── Template approval/rejection events ──
      if (change.field === 'message_template_status_update') {
        const { message_template, waba_id } = change.value as any
        if (message_template) {
          tasks.push(handleTemplateStatusUpdate(supabase, message_template, waba_id))
        }
        continue
      }

      if (change.field !== 'messages') continue

      const { metadata, messages: msgs, statuses } = change.value
      const phoneNumberId = metadata.phone_number_id

      // ── Delivery/read receipts — log failures only ──
      if (statuses?.length) {
        for (const s of statuses) {
          if (s.status === 'failed') {
            console.error(`Meta WA delivery failed for wamid: ${s.id}`)
          }
        }
        continue
      }

      for (const message of msgs ?? []) {
        // SMB Echo: message.from === phoneNumberId → outbound echo from our number
        if (message.from === phoneNumberId) {
          const echoOrg = orgs?.find((o: any) => {
            const crm = o.crm_config as Record<string, string>
            if (crm?.provider === 'meta' && crm?.phone_number_id === phoneNumberId) return true
            const wa = (o.channel_config as any)?.whatsapp
            return wa?.provider === 'whatsapp_cloud' && wa?.credentials?.phone_number_id === phoneNumberId
          })
          if (echoOrg) tasks.push(handleHumanEcho(supabase, echoOrg.id, message))
          continue
        }

        tasks.push(handleInbound(phoneNumberId, message, orgs ?? []))
      }
    }
  }

  // Run all tasks before responding — waitUntil may not complete on edge runtime
  await Promise.all(tasks)
  return new Response('OK', { status: 200 })
})
