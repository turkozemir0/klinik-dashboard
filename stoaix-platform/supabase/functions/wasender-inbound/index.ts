import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleInboundMessage, updateLeadWithVision, getSupabase } from '../_shared/chat-engine.ts'

// ─── Actual WasenderAPI webhook payload structure ─────────────────────────────
// Reference: https://wasenderapi.com/api-docs/webhooks/webhook-message-received
//
// {
//   event: "messages.received",
//   timestamp: 1633456789,
//   data: {
//     messages: {
//       key: {
//         id: "3EB0X123456789",
//         fromMe: false,
//         remoteJid: "905551234567@s.whatsapp.net",
//         cleanedSenderPn: "905551234567",
//       },
//       messageBody: "Hello",
//       message: {
//         conversation: "Hello",          // text
//         imageMessage: { ... },          // image
//         extendedTextMessage: { ... },   // link/quoted text
//       }
//     }
//   }
// }

interface WasenderKey {
  id: string
  fromMe: boolean
  remoteJid: string
  cleanedSenderPn?: string
  senderPn?: string
}

interface WasenderMessages {
  key: WasenderKey
  messageBody?: string
  message?: Record<string, any>
  pushName?: string
}

interface WasenderWebhookPayload {
  event: string
  timestamp?: number
  data?: {
    messages?: WasenderMessages
    status?: string   // for session.status event
  }
}

// ─── Vision prompts ───────────────────────────────────────────────────────────

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

const I18N: Record<string, { imageAck: string; imageError: string; unsupported: string }> = {
  tr: {
    imageAck:    'Fotoğrafınızı aldım, uzman ekibimiz inceleyecek.',
    imageError:  'Görselinizi alırken bir sorun oluştu. Lütfen tekrar gönderin.',
    unsupported: 'Üzgünüm, şu an yalnızca metin ve görsel mesajları anlayabiliyorum.',
  },
  de: {
    imageAck:    'Vielen Dank für Ihr Foto! Unser Expertenteam wird es prüfen.',
    imageError:  'Beim Empfang Ihres Bildes ist ein Fehler aufgetreten. Bitte senden Sie es erneut.',
    unsupported: 'Entschuldigung, ich kann derzeit nur Text- und Bildnachrichten verarbeiten.',
  },
  en: {
    imageAck:    'Thank you for your photo! Our expert team will review it.',
    imageError:  'There was an issue receiving your image. Please send it again.',
    unsupported: 'Sorry, I can only process text and image messages at the moment.',
  },
}

function getI18n(lang: string) { return I18N[lang] ?? I18N.tr }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

async function callGPTVision(imageUrl: string, prompt: string): Promise<string> {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) { console.error('OPENAI_API_KEY not set'); return '' }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [{ role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
        ]}],
      }),
    })
    if (!res.ok) { console.error(`GPT-4o Vision failed ${res.status}`); return '' }
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  } catch (err) {
    console.error('Vision error:', err)
    return ''
  }
}

async function resolveLanguage(orgId: string, orgDefaultLang: string, waId: string): Promise<string> {
  try {
    const supabase = getSupabase()
    const { data: contact } = await supabase
      .from('contacts').select('preferred_language')
      .eq('organization_id', orgId)
      .filter('channel_identifiers->>wa_id', 'eq', waId)
      .maybeSingle()
    if (contact?.preferred_language) return contact.preferred_language
  } catch { /* ignore */ }
  return orgDefaultLang || 'tr'
}

async function sendWasenderMessage(apiKey: string, to: string, text: string): Promise<void> {
  const res = await fetch('https://www.wasenderapi.com/api/send-message', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, text }),
  })
  if (!res.ok) console.error(`WasenderAPI send failed ${res.status}: ${await res.text()}`)
}

// ─── Detect message type from message object ──────────────────────────────────

function detectMessageType(msg: WasenderMessages): 'text' | 'image' | 'other' {
  const m = msg.message ?? {}
  if (m.imageMessage) return 'image'
  if (msg.messageBody || m.conversation || m.extendedTextMessage) return 'text'
  return 'other'
}

// ─── Image handler ────────────────────────────────────────────────────────────

async function handleWasenderImageMessage(
  org: { id: string; sector?: string | null; default_language?: string },
  apiKey: string,
  msg: WasenderMessages
): Promise<void> {
  const waId = msg.key.cleanedSenderPn ?? msg.key.senderPn?.split('@')[0] ?? ''
  if (!waId) return

  const supabase = getSupabase()
  const lang = await resolveLanguage(org.id, (org as any).default_language ?? 'tr', waId)
  const msgs = getI18n(lang)

  // ── Idempotency ──
  if (msg.key.id) {
    const { data: dup } = await supabase.from('messages').select('id')
      .eq('organization_id', org.id).eq('channel', 'whatsapp').eq('external_id', msg.key.id).maybeSingle()
    if (dup) { console.log(`[wasender-inbound] Duplicate image skipped: ${msg.key.id}`); return }
  }

  // ── Ensure contact exists ──
  let { data: contact } = await supabase.from('contacts').select('id')
    .eq('organization_id', org.id)
    .filter('channel_identifiers->>wa_id', 'eq', waId)
    .maybeSingle()

  if (!contact) {
    const { data: newContact, error } = await supabase.from('contacts').insert({
      organization_id: org.id,
      phone: `+${waId}`,
      channel_identifiers: { wa_id: waId },
      source_channel: 'whatsapp',
      status: 'new',
      ...(msg.pushName?.trim() ? { full_name: msg.pushName.trim() } : {}),
    }).select('id').single()
    if (error || !newContact) { console.error('Image contact create failed:', error); return }
    contact = newContact
  }

  // ── Ensure lead exists ──
  const { data: existingLead } = await supabase.from('leads').select('id')
    .eq('organization_id', org.id).eq('contact_id', contact.id).maybeSingle()
  if (!existingLead) {
    await supabase.from('leads').insert({
      organization_id: org.id,
      contact_id: contact.id,
      status: 'new',
      qualification_score: 5,
      source_channel: 'whatsapp',
      collected_data: {},
    })
  }

  // ── Ensure conversation exists ──
  let { data: convo } = await supabase.from('conversations').select('id')
    .eq('organization_id', org.id).eq('contact_id', contact.id)
    .eq('channel', 'whatsapp').eq('status', 'active')
    .order('started_at', { ascending: false }).limit(1).maybeSingle()

  if (!convo) {
    const { data: newConvo, error } = await supabase.from('conversations').insert({
      organization_id: org.id,
      contact_id: contact.id,
      channel: 'whatsapp',
      status: 'active',
      channel_metadata: { wa_id: waId, provider: 'wasender' },
    }).select('id').single()
    if (error || !newConvo) { console.error('Image conversation create failed:', error); return }
    convo = newConvo
  }

  // ── Download image (decrypt-media first, direct URL fallback) ──
  const imageMsg = msg.message?.imageMessage
  const mime = imageMsg?.mimetype ?? 'image/jpeg'
  let blob: ArrayBuffer | null = null

  // 1) Try WASender decrypt-media API (Baileys media is encrypted)
  if (imageMsg?.mediaKey && imageMsg?.url) {
    try {
      const decryptRes = await fetch('https://www.wasenderapi.com/api/decrypt-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { messages: { key: { id: msg.key.id }, message: msg.message } }
        }),
      })
      if (decryptRes.ok) {
        const decryptData = await decryptRes.json()
        const publicUrl = decryptData?.publicUrl ?? decryptData?.url ?? null
        console.log(`[wasender-inbound] decrypt-media response: publicUrl=${publicUrl}`)
        if (publicUrl) {
          const dlRes = await fetch(publicUrl)
          if (dlRes.ok) blob = await dlRes.arrayBuffer()
        }
      } else {
        console.error(`[wasender-inbound] decrypt-media failed ${decryptRes.status}: ${await decryptRes.text()}`)
      }
    } catch (err) {
      console.error('[wasender-inbound] decrypt-media error:', err)
    }
  }

  if (!blob || blob.byteLength < 100) {
    console.error('[wasender-inbound] Could not download image')
    await sendWasenderMessage(apiKey, waId, msgs.imageError)
    return
  }

  const dataUrl = `data:${mime};base64,${toBase64(blob)}`

  // ── Upload to Supabase Storage ──
  let persistentUrl: string | null = null
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const safeName = msg.key.id.replace(/[^a-zA-Z0-9_-]/g, '_')
    const path = `${org.id}/${yearMonth}/${safeName}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('wa-media').upload(path, blob, { contentType: mime, upsert: true })
    if (uploadErr) {
      console.error('Storage upload failed:', uploadErr.message)
    } else {
      persistentUrl = `${supabaseUrl}/storage/v1/object/public/wa-media/${path}`
    }
  } catch (err) {
    console.error('Storage upload error:', err)
  }

  // ── Save user image message (role: user) ──
  const caption = imageMsg?.caption?.trim() || ''
  await supabase.from('messages').insert({
    conversation_id: convo.id,
    organization_id: org.id,
    role: 'user',
    content: caption,
    content_type: 'image',
    media_url: persistentUrl,
    external_id: msg.key.id,
    channel: 'whatsapp',
  })

  // ── GPT-4o Vision analysis ──
  const sector = (org as any).sector ?? 'default'
  const langPrompts = VISION_PROMPTS[lang] ?? VISION_PROMPTS.tr
  const prompt = langPrompts[sector] ?? langPrompts.default
  const analysis = await callGPTVision(dataUrl, prompt)

  if (analysis) {
    // Save vision analysis as system message
    await supabase.from('messages').insert({
      conversation_id: convo.id,
      organization_id: org.id,
      role: 'system',
      content: `📎 Görsel Analizi: ${analysis}`,
      content_type: 'image',
      media_url: persistentUrl,
      channel: 'whatsapp',
    })

    // Update lead score + notes
    const { data: lead } = await supabase.from('leads').select('id, qualification_score, notes')
      .eq('organization_id', org.id).eq('contact_id', contact.id).maybeSingle()
    if (lead) {
      const dateStr = new Date().toLocaleDateString('tr-TR')
      const noteEntry = `📎 Görsel Analizi ${dateStr}: ${analysis}`
      const existingNotes = (lead.notes ?? '') as string
      await supabase.from('leads').update({
        notes: existingNotes ? `${existingNotes}\n${noteEntry}` : noteEntry,
        qualification_score: Math.min(100, (lead.qualification_score ?? 0) + 10),
        updated_at: new Date().toISOString(),
      }).eq('id', lead.id)
    }
  }

  // ── Ack (dedup: skip if already sent in last 2 min) ──
  let shouldAck = true
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
      .eq('conversation_id', convo.id).eq('role', 'system').eq('content_type', 'image')
      .gte('created_at', twoMinAgo)
    if (count && count > 0) shouldAck = false
  } catch { /* ignore */ }

  if (shouldAck) await sendWasenderMessage(apiKey, waId, msgs.imageAck)
  console.log(`[wasender-inbound] Inbound image saved for ${waId}, analysis=${!!analysis}`)
}

// ─── Outbound helpers (phone-sent messages) ─────────────────────────────────

async function resolveOutboundContext(
  supabase: ReturnType<typeof getSupabase>,
  orgId: string,
  waId: string,
  pushName?: string
): Promise<{ contactId: string; conversationId: string }> {
  // Find or create contact
  let { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .filter('channel_identifiers->>wa_id', 'eq', waId)
    .maybeSingle()

  if (!contact) {
    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: orgId,
        phone: `+${waId}`,
        channel_identifiers: { wa_id: waId },
        source: 'whatsapp',
        ...(pushName ? { full_name: pushName } : {}),
      })
      .select('id')
      .single()
    if (error) throw new Error(`Contact create failed: ${error.message}`)
    contact = newContact
  }

  // Find active conversation or create new one (mode: human — no AI trigger)
  let { data: convo } = await supabase
    .from('conversations')
    .select('id')
    .eq('organization_id', orgId)
    .eq('contact_id', contact!.id)
    .eq('channel', 'whatsapp')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!convo) {
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({
        organization_id: orgId,
        contact_id: contact!.id,
        channel: 'whatsapp',
        status: 'active',
        mode: 'human',
      })
      .select('id')
      .single()
    if (error) throw new Error(`Conversation create failed: ${error.message}`)
    convo = newConvo
  } else {
    // Switch existing conversation to human mode
    await supabase
      .from('conversations')
      .update({ mode: 'human' })
      .eq('id', convo.id)
  }

  return { contactId: contact!.id, conversationId: convo!.id }
}

async function handleOutboundMessage(
  supabase: ReturnType<typeof getSupabase>,
  orgId: string,
  msg: WasenderMessages
): Promise<void> {
  const waId = msg.key.cleanedSenderPn ?? msg.key.remoteJid?.split('@')[0] ?? ''
  if (!waId) return

  // Idempotency: skip if already saved
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('external_id', msg.key.id)
    .eq('organization_id', orgId)
  if (count && count > 0) return

  const { contactId, conversationId } = await resolveOutboundContext(
    supabase, orgId, waId, msg.pushName?.trim() || undefined
  )

  const text = msg.messageBody?.trim()
    ?? msg.message?.conversation?.trim()
    ?? msg.message?.extendedTextMessage?.text?.trim()
    ?? ''
  if (!text) return

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    organization_id: orgId,
    role: 'assistant',
    content: text,
    content_type: 'text',
    channel: 'whatsapp',
    external_id: msg.key.id,
  })

  // Cancel pending re_contact follow-up tasks
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('contact_id', contactId)
  if (leads && leads.length > 0) {
    await supabase
      .from('follow_up_tasks')
      .update({ status: 'cancelled' })
      .eq('organization_id', orgId)
      .like('task_type', 're_contact_%')
      .eq('status', 'pending')
      .in('lead_id', leads.map(l => l.id))
  }

  console.log(`[wasender-inbound] Outbound text saved for ${waId}`)
}

async function handleOutboundImage(
  supabase: ReturnType<typeof getSupabase>,
  orgId: string,
  msg: WasenderMessages,
  apiKey: string
): Promise<void> {
  const waId = msg.key.cleanedSenderPn ?? msg.key.remoteJid?.split('@')[0] ?? ''
  if (!waId) return

  // Idempotency
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('external_id', msg.key.id)
    .eq('organization_id', orgId)
  if (count && count > 0) return

  const { conversationId } = await resolveOutboundContext(
    supabase, orgId, waId, msg.pushName?.trim() || undefined
  )

  const imageMsg = msg.message?.imageMessage
  const mime = imageMsg?.mimetype ?? 'image/jpeg'
  let blob: ArrayBuffer | null = null

  // 1) Try WASender decrypt-media API first (Baileys media is encrypted)
  if (imageMsg?.mediaKey && imageMsg?.url) {
    try {
      const decryptRes = await fetch('https://www.wasenderapi.com/api/decrypt-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { messages: { key: { id: msg.key.id }, message: msg.message } }
        }),
      })
      if (decryptRes.ok) {
        const decryptData = await decryptRes.json()
        const publicUrl = decryptData?.publicUrl ?? decryptData?.url ?? null
        if (publicUrl) {
          const dlRes = await fetch(publicUrl)
          if (dlRes.ok) blob = await dlRes.arrayBuffer()
        }
      }
    } catch (err) {
      console.error('[wasender-inbound] Outbound decrypt-media error:', err)
    }
  }

  // 2) Fallback: direct URL (might be encrypted, but try anyway)
  if (!blob) {
    const directUrl = imageMsg?.url ?? imageMsg?.mediaUrl ?? null
    if (directUrl) {
      try {
        const imgRes = await fetch(directUrl)
        if (imgRes.ok) blob = await imgRes.arrayBuffer()
      } catch { /* ignore */ }
    }
  }

  let persistentUrl: string | null = null
  if (blob && blob.byteLength >= 100) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
      const now = new Date()
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const safeName = msg.key.id.replace(/[^a-zA-Z0-9_-]/g, '_')
      const path = `${orgId}/${yearMonth}/${safeName}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('wa-media').upload(path, blob, { contentType: mime, upsert: true })
      if (uploadErr) {
        console.error('[wasender-inbound] Outbound image upload failed:', uploadErr.message)
      } else {
        persistentUrl = `${supabaseUrl}/storage/v1/object/public/wa-media/${path}`
      }
    } catch (err) {
      console.error('[wasender-inbound] Outbound image upload error:', err)
    }
  }

  const caption = imageMsg?.caption?.trim() || ''

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    organization_id: orgId,
    role: 'assistant',
    content: caption,
    content_type: 'image',
    channel: 'whatsapp',
    external_id: msg.key.id,
    ...(persistentUrl ? { media_url: persistentUrl } : {}),
  })

  console.log(`[wasender-inbound] Outbound image saved for ${waId}`)
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  // org_id is passed as query param in the webhook URL (?org_id=xxx)
  const url = new URL(req.url)
  const orgId = url.searchParams.get('org_id')

  let payload: WasenderWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  console.log(`[wasender-inbound] event=${payload.event} org_id=${orgId} payload=${JSON.stringify(payload).slice(0, 500)}`)

  if (!orgId) {
    console.error('[wasender-inbound] Missing org_id in webhook URL')
    return new Response('OK', { status: 200 })
  }

  const supabase = getSupabase()

  // Load org
  const { data: org } = await supabase
    .from('organizations')
    .select('id, sector, default_language, channel_config')
    .eq('id', orgId)
    .eq('status', 'active')
    .maybeSingle()

  if (!org) {
    console.error(`[wasender-inbound] Org not found: ${orgId}`)
    return new Response('OK', { status: 200 })
  }

  const channelConfig = (org.channel_config ?? {}) as any
  const apiKey = channelConfig?.whatsapp?.credentials?.api_key as string

  if (!apiKey) {
    console.error(`[wasender-inbound] No api_key for org: ${orgId}`)
    return new Response('OK', { status: 200 })
  }

  switch (payload.event) {
    case 'messages.received': {
      const msg = payload.data?.messages
      if (!msg?.key) { console.error('[wasender-inbound] No message key'); break }

      if (msg.key.fromMe) break  // skip outbound

      // Extract sender phone
      const waId = msg.key.cleanedSenderPn ?? msg.key.senderPn?.split('@')[0] ?? ''
      if (!waId) { console.error('[wasender-inbound] No sender phone'); break }

      const phone = `+${waId}`
      const messageType = detectMessageType(msg)
      console.log(`[wasender-inbound] type=${messageType} from=${waId}`)

      if (messageType === 'text') {
        const messageText = msg.messageBody?.trim() ?? ''
        if (!messageText) break
        await handleInboundMessage({
          supabase,
          orgId: org.id,
          phone,
          providerContactId: waId,
          channelIdentifierKey: 'wa_id',
          channel: 'whatsapp',
          messageText,
          externalId: msg.key.id,
          channelMetadata: { wa_id: waId, provider: 'wasender' },
          sendReply: (m) => sendWasenderMessage(apiKey, waId, m),
        })
      } else if (messageType === 'image') {
        await handleWasenderImageMessage(org, apiKey, msg)
      } else {
        const lang = await resolveLanguage(org.id, (org as any).default_language ?? 'tr', waId)
        await sendWasenderMessage(apiKey, waId, getI18n(lang).unsupported)
      }

      // Set pushName as full_name if available and not already set
      if (msg.pushName?.trim()) {
        await supabase.from('contacts')
          .update({ full_name: msg.pushName.trim() })
          .eq('organization_id', org.id)
          .filter('channel_identifiers->>wa_id', 'eq', waId)
          .is('full_name', null)
      }
      break
    }

    case 'messages.upsert': {
      const msg = payload.data?.messages
      if (!msg?.key) { console.error('[wasender-inbound] No message key in upsert'); break }

      if (!msg.key.fromMe) break  // inbound already handled by messages.received
      if (msg.key.remoteJid?.endsWith('@g.us')) break  // skip group messages

      const waId = msg.key.cleanedSenderPn ?? msg.key.remoteJid?.split('@')[0] ?? ''
      if (!waId) { console.error('[wasender-inbound] No remote phone in upsert'); break }

      const messageType = detectMessageType(msg)
      console.log(`[wasender-inbound] upsert outbound type=${messageType} to=${waId}`)

      try {
        if (messageType === 'text') {
          await handleOutboundMessage(supabase, org.id, msg)
        } else if (messageType === 'image') {
          await handleOutboundImage(supabase, org.id, msg, apiKey)
        }
        // other types (video, audio, doc) silently ignored for now
      } catch (err) {
        console.error('[wasender-inbound] Outbound handler error:', err)
      }
      break
    }

    case 'session.status': {
      const newStatus = payload.data?.status ?? ''
      console.log(`[wasender-inbound] session status → ${newStatus} for org ${orgId}`)
      if (newStatus === 'logged_out' || newStatus === 'disconnected') {
        await supabase.from('organizations').update({
          channel_config: {
            ...channelConfig,
            whatsapp: {
              ...channelConfig.whatsapp,
              active: false,
              credentials: { ...channelConfig.whatsapp?.credentials, status: newStatus },
            },
          },
        }).eq('id', orgId)
      } else if (newStatus === 'connected') {
        await supabase.from('organizations').update({
          channel_config: {
            ...channelConfig,
            whatsapp: {
              ...channelConfig.whatsapp,
              active: true,
              credentials: { ...channelConfig.whatsapp?.credentials, status: 'connected' },
            },
          },
        }).eq('id', orgId)
      }
      break
    }

    default:
      console.log(`[wasender-inbound] Unhandled event: ${payload.event}`)
  }

  return new Response('OK', { status: 200 })
})
