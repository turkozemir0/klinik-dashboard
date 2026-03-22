import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Channel = 'whatsapp' | 'instagram'

interface KBMatch {
  description_for_ai: string
  data: Record<string, unknown> | null
}

export interface InboundMessageOptions {
  supabase:              ReturnType<typeof createClient>
  orgId:                 string
  phone:                 string | null   // E.164 — present for WhatsApp, may be null for Instagram
  providerContactId:     string          // GHL contactId | Meta wa_id | Instagram user id
  channelIdentifierKey:  string          // key stored inside channel_identifiers JSONB
  channel:               Channel
  messageText:           string
  channelMetadata?:      Record<string, unknown>  // provider-specific extras (location_id, phone_number_id…)
  sendReply:             (message: string) => Promise<void>
  onNewLead?:            () => Promise<void>      // e.g. GHL pipeline stage update
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS            = 3500
const MAX_HISTORY            = 8
const PROCESSING_TIMEOUT_MS  = 120_000  // 2 min — auto-release locks from crashed workers

// ─── Supabase client ──────────────────────────────────────────────────────────

export function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// ─── KB vector search ─────────────────────────────────────────────────────────

async function searchKB(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  query: string
): Promise<string> {
  const embRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: query, model: 'text-embedding-3-small' }),
  })
  if (!embRes.ok) return ''

  const { data } = await embRes.json()
  const { data: matches } = await supabase.rpc('match_knowledge_items', {
    org_id: orgId,
    query_vector: data[0].embedding,
    match_count: 4,
  })

  if (!matches?.length) return ''
  return (matches as KBMatch[]).map((m) => {
    let text = m.description_for_ai || ''
    const programs = (m.data as any)?.programs
    if (programs?.length) {
      text += '\n\nProgram fiyatları:\n' +
        programs.map((p: any) => `- ${p.name}: ${p.fee} (${p.language})`).join('\n')
    }
    return text
  }).join('\n\n---\n\n')
}

// ─── Debounce lock ────────────────────────────────────────────────────────────

/**
 * Atomically claim processing rights.
 * Succeeds only when:
 *   - pending_process_id still matches our message (no newer message arrived during debounce)
 *   - Nobody else is processing (or the lock is older than 2 minutes → auto-released)
 */
async function claimProcessing(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  messageId: string
): Promise<boolean> {
  const timeoutCutoff = new Date(Date.now() - PROCESSING_TIMEOUT_MS).toISOString()

  const { data } = await supabase
    .from('conversations')
    .update({
      is_processing: true,
      processing_started_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .eq('pending_process_id', messageId)
    .or(`is_processing.eq.false,processing_started_at.lt.${timeoutCutoff}`)
    .select('id')
    .maybeSingle()

  return !!data
}

async function releaseProcessing(
  supabase: ReturnType<typeof createClient>,
  conversationId: string
): Promise<void> {
  await supabase
    .from('conversations')
    .update({ is_processing: false, pending_process_id: null, processing_started_at: null })
    .eq('id', conversationId)
}

/**
 * Returns all user messages since the last assistant reply — i.e. everything
 * that hasn't been responded to yet, regardless of when they were sent.
 */
async function getPendingUserMessages(
  supabase: ReturnType<typeof createClient>,
  conversationId: string
): Promise<string | null> {
  const { data: lastAssistant } = await supabase
    .from('messages')
    .select('created_at')
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const since = lastAssistant?.created_at ?? '1970-01-01T00:00:00Z'

  const { data } = await supabase
    .from('messages')
    .select('content')
    .eq('conversation_id', conversationId)
    .eq('role', 'user')
    .gt('created_at', since)
    .order('created_at', { ascending: true })

  if (!data?.length) return null
  return data.map((m: any) => m.content).join('\n')
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const CALENDAR_INTENT_KEYWORDS = [
  'randevu', 'toplantı', 'görüşme', 'saat', 'ne zaman', 'müsait',
  'appointment', 'book', 'rezervasyon', 'buluşma', 'uygun',
]

function hasCalendarIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return CALENDAR_INTENT_KEYWORDS.some(kw => lower.includes(kw))
}

async function getCalendarId(
  supabase: ReturnType<typeof createClient>,
  orgId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('organizations')
    .select('crm_config')
    .eq('id', orgId)
    .single()
  return (data?.crm_config as Record<string, string>)?.calendar_id || null
}

async function getPitToken(
  supabase: ReturnType<typeof createClient>,
  orgId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('organizations')
    .select('crm_config')
    .eq('id', orgId)
    .single()
  return (data?.crm_config as Record<string, string>)?.pit_token || null
}

async function fetchFreeSlots(calendarId: string, pitToken: string): Promise<string> {
  try {
    const now      = new Date()
    const startDate = now.toISOString().split('T')[0]
    const endDate   = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const url = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots` +
      `?startDate=${startDate}&endDate=${endDate}&timezone=Europe%2FIstanbul`

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${pitToken}`,
        'Version': '2021-04-15',
        'Accept': 'application/json',
      },
    })
    if (!res.ok) return ''

    const json = await res.json()
    // GHL free-slots response: { slots: { "2026-03-22": ["10:00","14:00"], ... } }
    const slots = json.slots as Record<string, string[]> | undefined
    if (!slots) return ''

    const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    const lines: string[] = []
    for (const [date, times] of Object.entries(slots)) {
      if (!times?.length) continue
      const d = new Date(date + 'T00:00:00')
      const dayName = DAYS[d.getDay()]
      lines.push(`${dayName} (${date}): ${times.slice(0, 5).join(', ')}`)
    }
    return lines.join('\n')
  } catch {
    return ''
  }
}

async function createAppointment(
  calendarId: string,
  pitToken: string,
  data: { name: string; phone: string; datetimeStr: string; notes?: string }
): Promise<boolean> {
  try {
    const res = await fetch('https://services.leadconnectorhq.com/calendars/events/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pitToken}`,
        'Version': '2021-04-15',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calendarId,
        selectedTimezone: 'Europe/Istanbul',
        startTime: data.datetimeStr,
        title: `Randevu — ${data.name}`,
        appointmentStatus: 'confirmed',
        address: '',
        notes: data.notes || '',
        contactName: data.name,
        phone: data.phone,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Chat engine ──────────────────────────────────────────────────────────────

async function runChatEngine(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  contactId: string,
  conversationId: string,
  messageText: string,
  channel: Channel,
  sendReply: (message: string) => Promise<void>
): Promise<void> {
  // Load channel-specific playbook; fall back to 'whatsapp' if no dedicated one exists
  let { data: playbook } = await supabase
    .from('agent_playbooks')
    .select('system_prompt_template, fallback_responses, hard_blocks, features')
    .eq('organization_id', orgId)
    .eq('channel', channel)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!playbook && channel !== 'whatsapp') {
    const { data: fallback } = await supabase
      .from('agent_playbooks')
      .select('system_prompt_template, fallback_responses, hard_blocks, features')
      .eq('organization_id', orgId)
      .eq('channel', 'whatsapp')
      .order('version', { ascending: false })
      .limit(1)
      .single()
    playbook = fallback
  }

  if (!playbook) {
    console.error('No playbook found for org', orgId, 'channel', channel)
    return
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, ai_persona')
    .eq('id', orgId)
    .single()

  if (!org) return

  const fallbackResponses = playbook.fallback_responses as Record<string, string>

  // Hard block check
  const lower      = messageText.toLowerCase()
  const hardBlocks = (playbook.hard_blocks ?? []) as Array<{ keywords: string[]; response: string }>
  for (const block of hardBlocks) {
    if (block.keywords?.some((kw: string) => lower.includes(kw.toLowerCase()))) {
      await supabase.from('messages').insert({
        conversation_id: conversationId, organization_id: orgId,
        role: 'assistant', content: block.response, content_type: 'text',
      })
      await sendReply(block.response)
      return
    }
  }

  // KB vector search
  const kbContext = await searchKB(supabase, orgId, messageText)

  // Conversation history — descending ile en yeni MAX_HISTORY*2 mesajı al, sonra kronolojik sıraya çevir
  const { data: historyRows } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY * 2)

  const history = ((historyRows ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>).reverse()

  // Calendar slot injection (only if feature is enabled and message has booking intent)
  let calendarSection = ''
  const features = (playbook as any).features as Record<string, boolean> | null
  if (features?.calendar_booking && hasCalendarIntent(messageText)) {
    const [calId, pitTok] = await Promise.all([
      getCalendarId(supabase, orgId),
      getPitToken(supabase, orgId),
    ])
    if (calId && pitTok) {
      const slots = await fetchFreeSlots(calId, pitTok)
      if (slots) {
        calendarSection = `\n\n━━━ TAKVİM (anlık müsait saatler) ━━━\n${slots}\nRandevu oluşturmak için müşteriden ad, telefon ve tercih edilen saat iste.\nRandevu onaylanınca "RANDEVU_AL:ad=...,telefon=...,saat=YYYY-MM-DDTHH:MM" formatında yaz.`
      } else {
        calendarSection = `\n\n━━━ TAKVİM ━━━\nTakvime şu an erişilemiyor. Müşteriye "Ekibimiz en kısa sürede sizi arayıp randevu ayarlayacak" de ve telefon numarasını al.`
      }
    }
  }

  // Müşteri profili — lead'den toplanan yapılandırılmış veri
  let profileSection = ''
  const { data: leadRow } = await supabase
    .from('leads')
    .select('collected_data')
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .maybeSingle()

  const collectedData = (leadRow?.collected_data ?? {}) as Record<string, unknown>
  const profileEntries = Object.entries(collectedData).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (profileEntries.length > 0) {
    const lines = profileEntries.map(([k, v]) => `- ${k}: ${v}`).join('\n')
    profileSection = `\n\n━━━ MÜŞTERİ PROFİLİ (önceki mesajlardan toplanan bilgiler) ━━━\n${lines}\nBu bilgileri bağlam olarak kullanabilirsin, tekrar sormak zorunda değilsin. Kullanıcı düzeltirse güncellediğini kabul et.`
  }

  // Build system prompt
  const persona      = org.ai_persona as Record<string, string>
  const systemPrompt = [
    playbook.system_prompt_template,
    kbContext ? `\n\n[BİLGİ TABANI]\n${kbContext}` : '',
    profileSection,
    calendarSection,
    `\nOrganizasyon: ${org.name}`,
    persona?.persona_name ? `\nSenin adın: ${persona.persona_name}` : '',
  ].filter(Boolean).join('')

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history.slice(-(MAX_HISTORY * 2 - 1)),
    { role: 'user', content: messageText },
  ]

  let reply = ''
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    })
    if (!openaiRes.ok) throw new Error(`OpenAI ${openaiRes.status}`)
    const openaiData = await openaiRes.json()
    reply = openaiData.choices?.[0]?.message?.content ?? ''
  } catch (err) {
    console.error('OpenAI error:', err)
    reply = fallbackResponses['error'] ??
      fallbackResponses['no_kb_match'] ??
      'Şu an bir sorun yaşıyorum. Lütfen birazdan tekrar yazın.'
  }

  // Parse booking intent from AI reply (RANDEVU_AL:ad=...,telefon=...,saat=...)
  if (features?.calendar_booking && reply.includes('RANDEVU_AL:')) {
    try {
      const match = reply.match(/RANDEVU_AL:([^\n]+)/)
      if (match) {
        const params = Object.fromEntries(
          match[1].split(',').map(p => p.split('=').map(s => s.trim()))
        )
        const [calId, pitTok] = await Promise.all([
          getCalendarId(supabase, orgId),
          getPitToken(supabase, orgId),
        ])
        if (calId && pitTok && params.ad && params.saat) {
          await createAppointment(calId, pitTok, {
            name: params.ad,
            phone: params.telefon || '',
            datetimeStr: params.saat,
          })
        }
        // Strip the booking command from the user-visible reply
        reply = reply.replace(/RANDEVU_AL:[^\n]*/g, '').trim()
      }
    } catch {
      // Booking parse failed — reply is still sent as-is
    }
  }

  await supabase.from('messages').insert({
    conversation_id: conversationId, organization_id: orgId,
    role: 'assistant', content: reply, content_type: 'text',
  })

  await sendReply(reply)
}

// ─── Lead data extraction (chat) ─────────────────────────────────────────────

/**
 * Sohbet geçmişinden intake schema alanlarını GPT-4o-mini ile çıkarır.
 */
async function extractCollectedData(
  history: Array<{ role: string; content: string }>,
  intakeFields: Array<{ key: string; label: string; type?: string }>
): Promise<Record<string, string | null>> {
  if (!history.length || !intakeFields.length) return {}

  const fieldDefs  = intakeFields.map(f => `- ${f.key} (${f.label}): ${f.type ?? 'text'}`).join('\n')
  const transcript = history.map(m => `[${m.role}] ${m.content}`).join('\n')

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: `Aşağıdaki sohbetten şu bilgileri çıkar ve JSON formatında döndür.\nHer field için kullanıcının verdiği değeri yaz, vermemişse null koy.\n\nToplanacak bilgiler:\n${fieldDefs}\n\nSohbet:\n${transcript.slice(-3000)}\n\nSadece JSON döndür. Örnek: {"full_name": "Ali Veli", "phone": null}`,
        }],
      }),
    })
    if (!res.ok) return {}
    const data = await res.json()
    return JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
  } catch {
    return {}
  }
}

function calculateLeadScore(
  intakeFields: Array<{ key: string; priority?: string }>,
  collectedData: Record<string, unknown>
): number {
  const mustFields   = intakeFields.filter(f => f.priority === 'must').map(f => f.key)
  const shouldFields = intakeFields.filter(f => f.priority === 'should').map(f => f.key)
  if (!mustFields.length) return 0

  const mustDone   = mustFields.filter(k => collectedData[k]).length
  const shouldDone = shouldFields.filter(k => collectedData[k]).length

  const mustScore   = (mustDone / mustFields.length) * 70
  const shouldScore = shouldFields.length ? (shouldDone / shouldFields.length) * 30 : 0
  return Math.min(100, Math.round(mustScore + shouldScore))
}

/**
 * Her AI yanıtından sonra lead'i günceller:
 * collected_data, data_completeness, missing_fields, qualification_score, status
 */
async function updateLeadFromChat(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  contactId: string,
  conversationId: string,
  channel: Channel
): Promise<void> {
  try {
    const { data: lead } = await supabase
      .from('leads')
      .select('id, collected_data, status')
      .eq('organization_id', orgId)
      .eq('contact_id', contactId)
      .maybeSingle()
    if (!lead?.id) return

    // Intake schema: önce kanalın kendi şeması, yoksa voice fallback
    let { data: schema } = await supabase
      .from('intake_schemas')
      .select('fields')
      .eq('organization_id', orgId)
      .eq('channel', channel)
      .maybeSingle()
    if (!schema) {
      const { data: fallback } = await supabase
        .from('intake_schemas')
        .select('fields')
        .eq('organization_id', orgId)
        .eq('channel', 'voice')
        .maybeSingle()
      schema = fallback
    }

    const intakeFields = (schema?.fields ?? []) as Array<{ key: string; label: string; type?: string; priority?: string }>
    if (!intakeFields.length) return

    // Konuşma geçmişi
    const { data: historyRows } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
    if (!historyRows?.length) return

    // Yapılandırılmış veri çıkar
    const newData  = await extractCollectedData(historyRows, intakeFields)
    const existing = (lead.collected_data ?? {}) as Record<string, unknown>

    // Mevcut dolu alanları koruyarak birleştir
    const merged: Record<string, unknown> = { ...existing }
    for (const [k, v] of Object.entries(newData)) {
      if (v !== null && v !== undefined && v !== '') merged[k] = v
    }

    // data_completeness ve missing_fields
    const dataCompleteness: Record<string, string> = {}
    for (const f of intakeFields) {
      dataCompleteness[f.key] = merged[f.key] ? 'collected' : 'not_collected'
    }
    const missingFields = intakeFields
      .filter(f => f.priority === 'must' && !merged[f.key])
      .map(f => f.key)

    const score     = calculateLeadScore(intakeFields, merged)
    const newStatus = lead.status === 'new' && Object.values(merged).some(v => v)
      ? 'in_progress'
      : lead.status

    await supabase
      .from('leads')
      .update({
        collected_data:      merged,
        data_completeness:   dataCompleteness,
        missing_fields:      missingFields,
        qualification_score: score,
        status:              newStatus,
        updated_at:          new Date().toISOString(),
      })
      .eq('id', lead.id)
  } catch (err) {
    console.error('updateLeadFromChat failed:', err)
  }
}

// ─── Shared inbound handler ───────────────────────────────────────────────────

/**
 * Provider-agnostic message handler.
 * Called by each edge function after normalizing the inbound webhook payload.
 * Handles contact/lead/conversation upsert, debounce locking, and chat engine.
 */
export async function handleInboundMessage(opts: InboundMessageOptions): Promise<void> {
  const {
    supabase, orgId, phone, providerContactId, channelIdentifierKey,
    channel, messageText, channelMetadata, sendReply, onNewLead,
  } = opts

  // ── Upsert contact ──
  // Lookup by the provider-specific identifier stored inside channel_identifiers JSONB
  let contactId: string
  let isNewContact = false

  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .filter(`channel_identifiers->>${channelIdentifierKey}`, 'eq', providerContactId)
    .maybeSingle()

  if (existingContact?.id) {
    contactId = existingContact.id
  } else {
    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: orgId,
        phone: phone || null,
        channel_identifiers: {
          [channelIdentifierKey]: providerContactId,
          ...(phone ? { phone } : {}),
        },
        source_channel: channel,
        status: 'new',
      })
      .select('id')
      .single()

    if (error || !newContact?.id) {
      console.error('Contact insert failed:', error)
      return
    }
    contactId  = newContact.id
    isNewContact = true
  }

  // ── Upsert lead ──
  let isNewLead = isNewContact
  if (!isNewLead) {
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', orgId)
      .eq('contact_id', contactId)
      .maybeSingle()
    isNewLead = !existingLead?.id
  }

  if (isNewLead) {
    await supabase.from('leads').insert({
      organization_id: orgId,
      contact_id: contactId,
      status: 'new',
      qualification_score: 5,
      source_channel: channel,
      collected_data: {},
    })
  }

  // ── Find or create active conversation ──
  let conversationId: string

  const { data: existingConvo } = await supabase
    .from('conversations')
    .select('id')
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .eq('channel', channel)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingConvo?.id) {
    conversationId = existingConvo.id
  } else {
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({
        organization_id: orgId,
        contact_id: contactId,
        channel,
        status: 'active',
        channel_metadata: channelMetadata ?? {},
      })
      .select('id')
      .single()

    if (error || !newConvo?.id) {
      console.error('Conversation create failed:', error)
      return
    }
    conversationId = newConvo.id
  }

  // ── Save user message ──
  const { data: savedMsg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      organization_id: orgId,
      role: 'user',
      content: messageText,
      content_type: 'text',
    })
    .select('id')
    .single()

  if (msgErr || !savedMsg?.id) {
    console.error('Message save failed:', msgErr)
    return
  }

  // ── Re-engagement: lead cevap verdi → kalan re_contact task'larını iptal et ──
  await supabase
    .from('follow_up_tasks')
    .update({ status: 'cancelled' })
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .eq('status', 'pending')
    .like('sequence_stage', 're_contact_%')

  // ── Debounce: mark this message as the pending processor (latest always wins) ──
  await supabase
    .from('conversations')
    .update({ pending_process_id: savedMsg.id })
    .eq('id', conversationId)

  // Wait for any follow-up messages from the same user
  await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS))

  // Atomically claim exclusive processing rights
  const claimed = await claimProcessing(supabase, conversationId, savedMsg.id)
  if (!claimed) return  // a newer message took over, or another worker is already processing

  try {
    const aggregated = await getPendingUserMessages(supabase, conversationId)
    if (!aggregated) return

    await runChatEngine(supabase, orgId, contactId, conversationId, aggregated, channel, sendReply)

    // Lead'i güncel konuşmadan çıkarılan yapılandırılmış veriyle güncelle
    await updateLeadFromChat(supabase, orgId, contactId, conversationId, channel)

    if (isNewLead && onNewLead) {
      await onNewLead()
    }
  } finally {
    // Always release the lock — even if an error is thrown above
    await releaseProcessing(supabase, conversationId)
  }
}
