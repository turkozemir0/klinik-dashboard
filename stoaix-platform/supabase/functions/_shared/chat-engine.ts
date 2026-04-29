import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendCrmEvent } from './crm-webhooks.ts'

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
  externalId?:           string          // wamid / provider message ID for idempotency
  channelMetadata?:      Record<string, unknown>  // provider-specific extras
  sendReply:             (message: string) => Promise<void>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS            = 3500

// ─── Phone normalization ──────────────────────────────────────────────────────

/**
 * Normalize a phone string to E.164 (e.g. "+905551234567").
 * Safe conversions only — no country-code guessing for ambiguous local formats.
 *
 *   "+905551234567"   → "+905551234567"  (already E.164)
 *   "905551234567"    → "+905551234567"  (bare international digits)
 *   "00905551234567"  → "+905551234567"  (00-prefix → +)
 *   "05551234567"     → null             (local format, ambiguous)
 */
function normalizePhoneE164(phone: string): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-\(\)\.]+/g, '')
  if (cleaned.startsWith('+')) {
    const digits = cleaned.replace(/\D/g, '')
    return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null
  }
  const digits = cleaned.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('00') && digits.length >= 9) {
    const stripped = digits.slice(2)
    return stripped.length >= 7 && stripped.length <= 15 ? `+${stripped}` : null
  }
  if (/^\d{9,15}$/.test(digits) && !digits.startsWith('0')) {
    return `+${digits}`
  }
  return null
}
const MAX_HISTORY            = 6    // reduced from 8 for token efficiency
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

// ─── Calendar intent detection ────────────────────────────────────────────────

const CALENDAR_INTENT_KEYWORDS = [
  'randevu', 'toplantı', 'görüşme', 'saat', 'ne zaman', 'müsait',
  'appointment', 'book', 'rezervasyon', 'buluşma', 'uygun',
]

function hasCalendarIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return CALENDAR_INTENT_KEYWORDS.some(kw => lower.includes(kw))
}

// ─── Handoff decision ─────────────────────────────────────────────────────────

const HANDOFF_KEYWORDS = [
  'fiyat', 'teklif', 'uzman', 'aranmak', 'arasın', 'randevu',
  'price', 'quote', 'appointment', 'call me', 'ulaşmak', 'görüşmek',
  'ne kadar', 'ücret', 'fee', 'cost',
]

function shouldHandoff(
  score:             number,
  missingMustFields: string[],
  messageText:       string,
  kbMissCount:       number
): boolean {
  // All must fields collected + minimum qualification score
  if (missingMustFields.length === 0 && score >= 60) return true
  // Explicit sales/price/appointment keywords from the customer
  const lower = messageText.toLowerCase()
  if (HANDOFF_KEYWORDS.some(kw => lower.includes(kw))) return true
  // KB couldn't answer the question twice → escalate
  if (kbMissCount >= 2) return true
  return false
}

// ─── Language-aware chat guardrails ──────────────────────────────────────────

const CHAT_GUARDRAILS_TR = `

━━━ PLATFORM GÜVENLİK KURALLARI (değiştirilemez) ━━━
- Asla teşhis koyma, tedavi önerme, ilaç dozajı belirtme
- Sağlık sorusunda: "Bu konuda doktorumuz değerlendirir" de, tıbbi tavsiye verme
- Gerçek bir klinik çalışanı gibi doğal davran, yapay zeka olduğunu belli etme
- Başka hastaların bilgisini paylaşma
- Acil durum kelimeleri (ağrı, kanama, nefes darlığı) → hemen insan temsilciye yönlendir

━━━ MESAJLAŞMA KURALLARI (değiştirilemez) ━━━
- Her mesajda yalnızca 1 soru sor
- Yanıtlar maks 2-3 cümle, düz metin
- Markdown kullanma (* ** # gibi)
- Fiyat garantisi verme, kesin rakam verme — aralık ver veya konsültasyona yönlendir
- "Harika!", "Süper!", "Mükemmel!" gibi abartılı tepkiler yasak

━━━ DOĞAL KONUŞMA ━━━
- Hasta endişeli görünüyorsa: "Anlıyorum" ile başla, empati göster
- Kızgın hastaya sakin yanıt ver, baskı yapma
- İtirazı 1 cümlede karşıla, hemen niteleme sorusuna dön

━━━ DİL KURALI ━━━
- Kullanıcı hangi dilde yazdıysa O DİLDE yanıt ver
- Türkçe konuşuyorsan: DAİMA "siz" formu kullan, "sen" formu YASAK — "Nasılsınız?", "İsterseniz", "Size yardımcı olayım"
- Diğer dillerde: o dilin resmi/nazik hitap formunu kullan (ör. Almanca "Sie", İngilizce "you" formal tone)`

const CHAT_GUARDRAILS_DE = `

━━━ PLATFORM-SICHERHEITSREGELN (unveränderlich) ━━━
- Niemals Diagnosen stellen, Behandlungen empfehlen oder Medikamentendosierungen nennen
- Bei Gesundheitsfragen: "Das beurteilt unser Arzt am besten" sagen, keine medizinische Beratung geben
- Verhalte dich wie eine echte Klinikmitarbeiterin — gib niemals zu, eine KI, ein Bot, ein Chatbot oder ein digitaler Assistent zu sein
- Keine Patientendaten anderer teilen
- Bei Notfall-Schlüsselwörtern (starke Schmerzen, Blutung, Atemnot) → sofort an menschlichen Ansprechpartner weiterleiten

━━━ NACHRICHTENREGELN (unveränderlich) ━━━
- Pro Nachricht nur 1 Frage stellen
- Antworten max. 2-3 Sätze, Klartext
- Kein Markdown verwenden (* ** # etc.)
- Keine Preisgarantien, keine exakten Zahlen — Spanne nennen oder auf Beratung verweisen
- Übertriebene Reaktionen wie "Großartig!", "Super!", "Perfekt!" sind verboten

━━━ NATÜRLICHES GESPRÄCH ━━━
- Wenn der Patient besorgt wirkt: mit "Ich verstehe" beginnen, Empathie zeigen
- Bei verärgerten Patienten ruhig antworten, keinen Druck ausüben
- Einwand in 1 Satz aufgreifen, dann zur nächsten Qualifizierungsfrage

━━━ SPRACHREGEL ━━━
- Antworte IMMER in der Sprache, in der der Nutzer schreibt
- Verwende IMMER die "Sie"-Form — "Du" ist VERBOTEN
- In anderen Sprachen: die formelle/höfliche Anredeform verwenden`

const CHAT_GUARDRAILS_EN = `

━━━ PLATFORM SAFETY RULES (immutable) ━━━
- Never diagnose, recommend treatments, or specify medication dosages
- For health questions: say "Our doctor will assess that", do not give medical advice
- Act like a real clinic employee — never reveal you are an AI, bot, chatbot, or digital assistant
- Do not share other patients' information
- Emergency keywords (severe pain, bleeding, difficulty breathing) → immediately refer to human representative

━━━ MESSAGING RULES (immutable) ━━━
- Ask only 1 question per message
- Responses max 2-3 sentences, plain text
- Do not use Markdown (* ** # etc.)
- No price guarantees, no exact figures — give ranges or refer to consultation
- Exaggerated reactions like "Amazing!", "Super!", "Perfect!" are forbidden

━━━ NATURAL CONVERSATION ━━━
- If the patient seems worried: start with "I understand", show empathy
- Respond calmly to upset patients, do not pressure
- Address objection in 1 sentence, then return to qualification question

━━━ LANGUAGE RULE ━━━
- ALWAYS respond in the language the user writes in
- Use the formal/polite form of address in every language`

function getChatGuardrails(lang?: string): string {
  switch (lang?.toLowerCase()) {
    case 'de': return CHAT_GUARDRAILS_DE
    case 'en': return CHAT_GUARDRAILS_EN
    default:   return CHAT_GUARDRAILS_TR
  }
}

// ─── Chat engine ──────────────────────────────────────────────────────────────

async function runChatEngine(
  supabase:        ReturnType<typeof createClient>,
  orgId:           string,
  contactId:       string,
  conversationId:  string,
  messageText:     string,
  channel:         Channel,
  sendReply:       (message: string) => Promise<void>
): Promise<void> {
  // Load channel-specific playbook; fall back to 'whatsapp' if no dedicated one exists
  let { data: playbook } = await supabase
    .from('agent_playbooks')
    .select('system_prompt_template, fallback_responses, hard_blocks, features, few_shot_examples, handoff_bridge_message')
    .eq('organization_id', orgId)
    .eq('channel', channel)
    .is('scenario', null)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!playbook && channel !== 'whatsapp') {
    const { data: fallback } = await supabase
      .from('agent_playbooks')
      .select('system_prompt_template, fallback_responses, hard_blocks, features, few_shot_examples, handoff_bridge_message')
      .eq('organization_id', orgId)
      .eq('channel', 'whatsapp')
      .is('scenario', null)
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
    .select('name, ai_persona, default_language')
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
        channel,
      })
      await sendReply(block.response)
      return
    }
  }

  // KB vector search
  const kbContext  = await searchKB(supabase, orgId, messageText)
  const kbMissed   = !kbContext   // track for handoff decision

  // Conversation history
  const { data: historyRows } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY * 2)

  const history = ((historyRows ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>).reverse()

  // Customer profile from lead
  let profileSection = ''
  const { data: leadRow } = await supabase
    .from('leads')
    .select('id, collected_data, missing_fields, qualification_score, status')
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .maybeSingle()

  const collectedData = (leadRow?.collected_data ?? {}) as Record<string, unknown>
  const profileEntries = Object.entries(collectedData).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (profileEntries.length > 0) {
    const lines = profileEntries.map(([k, v]) => `- ${k}: ${v}`).join('\n')
    profileSection = `\n\n━━━ MÜŞTERİ PROFİLİ (önceki mesajlardan toplanan bilgiler) ━━━\n${lines}\nBu bilgileri bağlam olarak kullanabilirsin, tekrar sormak zorunda değilsin. Kullanıcı düzeltirse güncellediğini kabul et.`
  }

  // Model selection — from playbook features, fallback to gpt-4o-mini
  const model = (playbook.features as any)?.model ?? 'gpt-4o-mini'

  // Few-shot examples section
  const fewShots = (playbook.few_shot_examples ?? []) as Array<{ user: string; assistant: string }>
  const fewShotSection = fewShots.length > 0
    ? '\n\n━━━ ÖRNEK KONUŞMALAR ━━━\n' +
      fewShots.map(ex => `Kullanıcı: ${ex.user}\nAsistan: ${ex.assistant}`).join('\n\n')
    : ''

  // Build system prompt — guardrails in org's language
  const orgLang = (org as any).default_language as string | undefined
  const persona      = org.ai_persona as Record<string, string>

  // Stable part — same per org, cacheable by Claude prompt caching
  const stablePrompt = [
    playbook.system_prompt_template,
    kbContext ? `\n\n[BİLGİ TABANI]\n${kbContext}` : '',
    `\nOrganizasyon: ${org.name}`,
    persona?.persona_name ? `\nSenin adın: ${persona.persona_name}` : '',
    fewShotSection,
    getChatGuardrails(orgLang),
  ].filter(Boolean).join('')

  // Dynamic part — changes per conversation (customer profile)
  const dynamicPrompt = profileSection || ''

  // Full system prompt for OpenAI (single string, auto-cached by OpenAI)
  const systemPrompt = dynamicPrompt ? `${stablePrompt}${dynamicPrompt}` : stablePrompt

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history.slice(-(MAX_HISTORY * 2 - 1)),
    { role: 'user', content: messageText },
  ]

  let reply = ''
  try {
    if (model.startsWith('claude-')) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 240,
          system: [
            { type: 'text', text: stablePrompt, cache_control: { type: 'ephemeral' } },
            ...(dynamicPrompt ? [{ type: 'text', text: dynamicPrompt }] : []),
          ],
          messages,
        }),
      })
      if (!claudeRes.ok) throw new Error(`Claude ${claudeRes.status}`)
      const claudeData = await claudeRes.json()
      reply = claudeData.content?.[0]?.text ?? ''
    } else {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 240,
          messages:   [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      })
      if (!openaiRes.ok) throw new Error(`OpenAI ${openaiRes.status}`)
      const openaiData = await openaiRes.json()
      reply = openaiData.choices?.[0]?.message?.content ?? ''
    }
  } catch (err) {
    console.error('LLM error:', err)
    reply = fallbackResponses['error'] ??
      fallbackResponses['no_kb_match'] ??
      'Şu an bir sorun yaşıyorum. Lütfen birazdan tekrar yazın.'
  }

  // ── Handoff decision ──
  // Read latest lead state after extraction (or use what we loaded above)
  const missingMustFields = (leadRow?.missing_fields ?? []) as string[]
  const currentScore      = leadRow?.qualification_score ?? 0

  // Track kb_miss_count in conversation channel_metadata (no schema change needed)
  const { data: convoMeta } = await supabase
    .from('conversations')
    .select('channel_metadata')
    .eq('id', conversationId)
    .single()

  const meta = (convoMeta?.channel_metadata ?? {}) as Record<string, any>
  const newMissCount = (meta.kb_miss_count ?? 0) + (kbMissed ? 1 : 0)

  // Update kb_miss_count in metadata (fire-and-forget, don't await)
  supabase
    .from('conversations')
    .update({ channel_metadata: { ...meta, kb_miss_count: newMissCount } })
    .eq('id', conversationId)
    .then(() => {})

  if (shouldHandoff(currentScore, missingMustFields, messageText, newMissCount)) {
    const bridgeMsg = (playbook as any).handoff_bridge_message
      ?? 'Bilgilerinizi aldım, uzman ekibimiz en kısa sürede sizinle iletişime geçecek. 👋'

    // Only send bridge message on handoff — skip AI reply to avoid contradictory double-message
    await supabase.from('messages').insert({
      conversation_id: conversationId, organization_id: orgId,
      role: 'assistant', content: bridgeMsg, content_type: 'text', channel,
    })
    await sendReply(bridgeMsg)

    // Switch to human mode
    await supabase
      .from('conversations')
      .update({ mode: 'human' })
      .eq('id', conversationId)

    // CRM event
    if (leadRow?.id) {
      await sendCrmEvent(supabase, orgId, {
        event:      'lead_status_change',
        org_id:     orgId,
        lead_id:    leadRow.id,
        contact_id: contactId,
        old_status: leadRow.status,
        new_status: 'handed_off',
        score:      currentScore,
        timestamp:  new Date().toISOString(),
      })

      await supabase
        .from('leads')
        .update({ status: 'handed_off', handoff_at: new Date().toISOString() })
        .eq('id', leadRow.id)

      // Schedule handoff follow-up tasks (4h + 24h reminders)
      const handoffTasks = [
        { stage: 'handoff_check_4h',  hours: 4 },
        { stage: 'handoff_check_24h', hours: 24 },
      ]
      for (const t of handoffTasks) {
        await supabase.from('follow_up_tasks').insert({
          organization_id: orgId,
          contact_id:      contactId,
          lead_id:         leadRow.id,
          conversation_id: conversationId,
          task_type:       'handoff_reminder',
          sequence_stage:  t.stage,
          status:          'pending',
          channel,
          scheduled_at:    new Date(Date.now() + t.hours * 60 * 60 * 1000).toISOString(),
        })
      }
    }

    // Notification for org team
    await supabase.from('notifications').insert({
      organization_id: orgId,
      type:            'handoff',
      conversation_id: conversationId,
      lead_id:         leadRow?.id ?? null,
      title:           'Lead devredildi',
      body:            `Otomatik handoff: skor ${currentScore}, ${missingMustFields.length === 0 ? 'tüm must alanlar dolu' : 'anahtar kelime tetiklendi'}.`,
    })

    return
  }

  // ── Normal AI reply ──
  await supabase.from('messages').insert({
    conversation_id: conversationId, organization_id: orgId,
    role: 'assistant', content: reply, content_type: 'text', channel,
  })
  await sendReply(reply)

  // Fire-and-forget: ai_reply_sent event
  supabase.from('org_events').insert({ org_id: orgId, event_type: 'ai_reply_sent', metadata: { channel, conversation_id: conversationId } }).then(() => {})
}

// ─── Lead data extraction (chat) ─────────────────────────────────────────────

async function extractCollectedData(
  history: Array<{ role: string; content: string }>,
  intakeFields: Array<{ key: string; label: string; type?: string }>
): Promise<Record<string, string | null>> {
  if (!history.length || !intakeFields.length) return {}

  const fieldDefs  = intakeFields.map(f => `- ${f.key} (${f.label}): ${f.type ?? 'text'}`).join('\n')
  // Only user messages — assistant messages may contain names (e.g. "Merhaba Emir Bey") that
  // should not be attributed to the user, causing false positives in extraction.
  const transcript = history.filter(m => m.role === 'user').map(m => m.content).join('\n')

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

    const { data: historyRows } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
    if (!historyRows?.length) return

    const newData  = await extractCollectedData(historyRows, intakeFields)
    const existing = (lead.collected_data ?? {}) as Record<string, unknown>

    const merged: Record<string, unknown> = { ...existing }
    for (const [k, v] of Object.entries(newData)) {
      if (v !== null && v !== undefined && v !== '') merged[k] = v
    }

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

    // Sync full_name to contacts table so inbox + leads page show real name
    const extractedName = merged.full_name as string | undefined
    if (extractedName) {
      await supabase
        .from('contacts')
        .update({ full_name: extractedName })
        .eq('id', contactId)
        .is('full_name', null)  // only set if not already manually assigned
    }

    if (newStatus !== lead.status) {
      await sendCrmEvent(supabase, orgId, {
        event:          'lead_status_change',
        org_id:         orgId,
        lead_id:        lead.id,
        contact_id:     contactId,
        old_status:     lead.status,
        new_status:     newStatus,
        score,
        collected_data: merged,
        timestamp:      new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('updateLeadFromChat failed:', err)
  }
}

// ─── Vision: update lead with image analysis result ───────────────────────────

/**
 * Called after GPT-4o Vision analyzes an inbound image.
 * Appends analysis to lead.notes, bumps qualification_score by 10,
 * and saves a system message to the conversation.
 */
export async function updateLeadWithVision(
  supabase:      ReturnType<typeof createClient>,
  orgId:         string,
  waId:          string,
  analysisText:  string,
  wamid:         string,
  mediaUrl?:     string
): Promise<void> {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .filter('channel_identifiers->>wa_id', 'eq', waId)
      .maybeSingle()

    if (!contact?.id) return

    const { data: lead } = await supabase
      .from('leads')
      .select('id, qualification_score, notes')
      .eq('organization_id', orgId)
      .eq('contact_id', contact.id)
      .maybeSingle()

    if (!lead?.id) return

    const { data: convo } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', orgId)
      .eq('contact_id', contact.id)
      .eq('channel', 'whatsapp')
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const dateStr = new Date().toLocaleDateString('tr-TR')
    const noteEntry = `📎 Görsel Analizi ${dateStr}: ${analysisText}`

    const existingNotes = (lead.notes ?? '') as string
    const updatedNotes  = existingNotes ? `${existingNotes}\n${noteEntry}` : noteEntry
    const newScore = Math.min(100, (lead.qualification_score ?? 0) + 10)

    const { error: leadErr } = await supabase
      .from('leads')
      .update({
        notes:               updatedNotes,
        qualification_score: newScore,
        updated_at:          new Date().toISOString(),
      })
      .eq('id', lead.id)

    if (leadErr) console.error('Vision lead update failed:', leadErr.message)

    if (convo?.id) {
      const { error: msgErr } = await supabase.from('messages').insert({
        conversation_id: convo.id,
        organization_id: orgId,
        role:            'system',
        content:         noteEntry,
        content_type:    'image',
        media_url:       mediaUrl ?? null,
        external_id:     wamid,
        channel:         'whatsapp',
      })
      if (msgErr) console.error('Vision message insert failed:', msgErr.message)
    }
  } catch (err) {
    console.error('updateLeadWithVision failed:', err)
  }
}

// ─── Shared inbound handler ───────────────────────────────────────────────────

export async function handleInboundMessage(opts: InboundMessageOptions): Promise<void> {
  const {
    supabase, orgId, phone, providerContactId, channelIdentifierKey,
    channel, messageText, externalId, channelMetadata, sendReply,
  } = opts

  // ── Idempotency check — skip duplicate webhooks ──
  if (externalId) {
    const { data: dup } = await supabase
      .from('messages')
      .select('id')
      .eq('organization_id', orgId)
      .eq('channel', channel)
      .eq('external_id', externalId)
      .maybeSingle()
    if (dup) {
      console.log(`Duplicate webhook skipped: ${externalId}`)
      return
    }
  }

  // ── Upsert contact ──
  let contactId: string
  let isNewContact = false

  // Step 1: Look up by channel identifier (fast, channel-specific)
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .filter(`channel_identifiers->>${channelIdentifierKey}`, 'eq', providerContactId)
    .maybeSingle()

  if (existingContact?.id) {
    contactId = existingContact.id
  } else {
    // Step 2: Phone-first cross-channel dedup
    // BSUID guard: Meta WA may send Business-Scoped User IDs (contain '.') from June 2026+
    // BSUIDs are not phone numbers — skip phone dedup for them
    const isBSUID = providerContactId.includes('.')
    const normalizedPhone = (phone && !isBSUID) ? normalizePhoneE164(phone) : null

    let foundByPhone: { id: string } | null = null
    if (normalizedPhone) {
      const { data: byPhone } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', orgId)
        .eq('phone', normalizedPhone)
        .maybeSingle()
      foundByPhone = byPhone
    }

    if (foundByPhone?.id) {
      // Cross-channel match — reuse existing contact, merge channel_identifiers
      contactId = foundByPhone.id
      const { data: contactData } = await supabase
        .from('contacts')
        .select('channel_identifiers')
        .eq('id', contactId)
        .single()
      const mergedIdentifiers = {
        ...((contactData?.channel_identifiers ?? {}) as Record<string, unknown>),
        [channelIdentifierKey]: providerContactId,
      }
      await supabase
        .from('contacts')
        .update({ channel_identifiers: mergedIdentifiers })
        .eq('id', contactId)
    } else {
      // Step 3: No match found — create new contact
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          phone: normalizedPhone ?? phone ?? null,
          channel_identifiers: {
            [channelIdentifierKey]: providerContactId,
            ...(normalizedPhone ? { phone: normalizedPhone } : phone ? { phone } : {}),
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
      contactId    = newContact.id
      isNewContact = true
    }
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
      contact_id:      contactId,
      status:          'new',
      qualification_score: 5,
      source_channel:  channel,
      collected_data:  {},
    })
  }

  // ── Find or create active conversation ──
  let conversationId: string
  let conversationMode: string = 'ai'

  const { data: existingConvo } = await supabase
    .from('conversations')
    .select('id, mode')
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .eq('channel', channel)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingConvo?.id) {
    conversationId   = existingConvo.id
    conversationMode = existingConvo.mode ?? 'ai'
  } else {
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({
        organization_id: orgId,
        contact_id:      contactId,
        channel,
        status:          'active',
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
      role:            'user',
      content:         messageText,
      content_type:    'text',
      external_id:     externalId ?? null,
      channel,
    })
    .select('id')
    .single()

  if (msgErr || !savedMsg?.id) {
    console.error('Message save failed:', msgErr)
    return
  }

  // ── Human mode: customer replied while salesperson is handling ──
  if (conversationMode === 'human') {
    // Message saved so the salesperson can see it — no AI response
    await supabase.from('notifications').insert({
      organization_id: orgId,
      type:            'human_reply_received',
      conversation_id: conversationId,
      title:           'İnsan modunda müşteri mesajı',
      body:            'Müşteri, satışçı aktifken mesaj gönderdi.',
    })
    return
  }

  // ── Re-engagement: customer responded — cancel pending re_contact tasks ──
  await supabase
    .from('follow_up_tasks')
    .update({ status: 'cancelled' })
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .eq('status', 'pending')
    .like('sequence_stage', 're_contact_%')

  // ── Debounce: mark this message as the pending processor ──
  await supabase
    .from('conversations')
    .update({ pending_process_id: savedMsg.id })
    .eq('id', conversationId)

  await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS))

  const claimed = await claimProcessing(supabase, conversationId, savedMsg.id)
  if (!claimed) return

  try {
    const aggregated = await getPendingUserMessages(supabase, conversationId)
    if (!aggregated) return

    await runChatEngine(supabase, orgId, contactId, conversationId, aggregated, channel, sendReply)

    await updateLeadFromChat(supabase, orgId, contactId, conversationId, channel)

    // ── Auto-create re_contact follow-up task (only if conversation is still in AI mode) ──
    const { data: convoCheck } = await supabase
      .from('conversations')
      .select('mode')
      .eq('id', conversationId)
      .single()

    if (convoCheck?.mode === 'ai') {
      // Get lead_id for the follow_up_tasks FK
      const { data: leadForTask } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', orgId)
        .eq('contact_id', contactId)
        .maybeSingle()

      // Upsert: if re_contact_1 already pending for this contact, leave it (ignoreDuplicates)
      await supabase.from('follow_up_tasks').upsert({
        organization_id:   orgId,
        contact_id:        contactId,
        lead_id:           leadForTask?.id ?? null,
        conversation_id:   conversationId,
        task_type:         're_contact',
        sequence_stage:    're_contact_1',
        status:            'pending',
        channel,
        scheduled_at:      new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        template_name:     're_engagement_v1',
      }, { onConflict: 'organization_id,contact_id,sequence_stage', ignoreDuplicates: true })
    }

    if (isNewLead) {
      await sendCrmEvent(supabase, orgId, {
        event:      'new_lead',
        org_id:     orgId,
        contact_id: contactId,
        phone:      phone ?? null,
        channel,
        timestamp:  new Date().toISOString(),
      })

      // Fire-and-forget: lead_received event
      supabase.from('org_events').insert({ org_id: orgId, event_type: 'lead_received', metadata: { channel, contact_id: contactId } }).then(() => {})
    }
  } finally {
    await releaseProcessing(supabase, conversationId)
  }
}
