import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// OpenAI client via fetch (no SDK needed in Deno edge)

// ─── Types ────────────────────────────────────────────────────────────────────

interface GHLWebhookPayload {
  type: string            // 'InboundMessage'
  locationId: string
  contactId: string       // GHL contact ID
  phone?: string          // sender phone
  body?: string           // message text
  messageType?: string    // 'SMS' | 'WhatsApp'
}

interface KBMatch {
  title: string
  description_for_ai: string
  data: Record<string, unknown> | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 3500
const MAX_HISTORY = 10

// ─── Clients ──────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// ─── GHL helpers ──────────────────────────────────────────────────────────────

async function sendGHLMessage(pitToken: string, contactId: string, message: string) {
  const res = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pitToken}`,
      'Version': '2021-04-15',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'WhatsApp', contactId, message }),
  })
  if (!res.ok) console.error(`GHL send failed ${res.status}: ${await res.text()}`)
  return res.ok
}

async function updateGHLPipelineStage(
  pitToken: string, pipelineId: string, stageId: string, locationId: string, contactId: string
) {
  // Search for existing opportunity
  const searchRes = await fetch(
    `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&contact_id=${contactId}`,
    { headers: { 'Authorization': `Bearer ${pitToken}`, 'Version': '2021-04-15' } }
  )
  let opportunityId: string | null = null
  if (searchRes.ok) {
    const data = await searchRes.json()
    opportunityId = data.opportunities?.[0]?.id ?? null
  }

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
        contactId, name: 'WhatsApp Lead', status: 'open',
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

// ─── KB vector search ─────────────────────────────────────────────────────────

async function searchKB(
  supabase: ReturnType<typeof getSupabase>,
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
  const embedding = data[0].embedding

  const { data: matches } = await supabase.rpc('match_knowledge_items', {
    org_id: orgId,
    query_vector: embedding,
    match_count: 4,
  })

  if (!matches?.length) return ''
  return (matches as KBMatch[]).map((m) => {
    let text = m.description_for_ai || ''
    // Append structured program list if available
    const programs = (m.data as any)?.programs
    if (programs?.length) {
      text += '\n\nProgram fiyatları:\n' +
        programs.map((p: any) => `- ${p.name}: ${p.fee} (${p.language})`).join('\n')
    }
    return text
  }).join('\n\n---\n\n')
}

// ─── Debounce ─────────────────────────────────────────────────────────────────

async function getAggregatedIfLatest(
  supabase: ReturnType<typeof getSupabase>,
  conversationId: string,
  currentMessageId: string
): Promise<string | null> {
  const since = new Date(Date.now() - DEBOUNCE_MS - 1000).toISOString()
  const { data } = await supabase
    .from('messages')
    .select('id, content')
    .eq('conversation_id', conversationId)
    .eq('role', 'user')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (!data?.length) return null
  // Only the latest user message triggers processing
  if (data[data.length - 1].id !== currentMessageId) return null
  return data.map((m: { content: string }) => m.content).join('\n')
}

// ─── Chat engine ──────────────────────────────────────────────────────────────

async function runChatEngine(
  supabase: ReturnType<typeof getSupabase>,
  orgId: string,
  conversationId: string,
  ghlContactId: string,
  locationId: string,
  pitToken: string,
  pipelineId: string,
  stageMapping: Record<string, string>,
  messageText: string,
  isNewLead: boolean
) {
  // ── Load playbook ──
  const { data: playbook } = await supabase
    .from('agent_playbooks')
    .select('system_prompt_template, fallback_responses, hard_blocks')
    .eq('organization_id', orgId)
    .eq('channel', 'whatsapp')
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!playbook) {
    console.error('No whatsapp playbook found for org', orgId)
    return
  }

  // ── Load org name/persona ──
  const { data: org } = await supabase
    .from('organizations')
    .select('name, ai_persona')
    .eq('id', orgId)
    .single()

  if (!org) return

  // ── Working hours check (UTC+3) ──
  const now = new Date()
  const hours = (now.getUTCHours() + 3) % 24
  const day = now.getDay()
  const inHours =
    (day >= 1 && day <= 5 && hours >= 9 && hours < 18) ||
    (day === 6 && hours >= 10 && hours < 15)

  const fallbackResponses = playbook.fallback_responses as Record<string, string>

  if (!inHours) {
    const reply = fallbackResponses['outside_hours'] ??
      'Şu an mesai saatlerimiz dışındayız. Sabah sizi arayacağız.'
    await sendGHLMessage(pitToken, ghlContactId, reply)
    await supabase.from('messages').insert({
      conversation_id: conversationId, organization_id: orgId,
      role: 'assistant', content: reply, content_type: 'text',
    })
    return
  }

  // ── Hard block check ──
  const lower = messageText.toLowerCase()
  const hardBlocks = (playbook.hard_blocks ?? []) as Array<{
    keywords: string[]; response: string
  }>
  for (const block of hardBlocks) {
    if (block.keywords?.some((kw: string) => lower.includes(kw.toLowerCase()))) {
      await sendGHLMessage(pitToken, ghlContactId, block.response)
      await supabase.from('messages').insert({
        conversation_id: conversationId, organization_id: orgId,
        role: 'assistant', content: block.response, content_type: 'text',
      })
      return
    }
  }

  // ── KB search ──
  const kbContext = await searchKB(supabase, orgId, messageText)

  // ── History ──
  const { data: historyRows } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: true })
    .limit(MAX_HISTORY * 2)

  const history = (historyRows ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>

  // ── System prompt ──
  const persona = org.ai_persona as Record<string, string>
  const systemPrompt = [
    playbook.system_prompt_template,
    kbContext ? `\n\n[BİLGİ TABANI]\n${kbContext}` : '',
    `\nOrganizasyon: ${org.name}`,
    persona?.persona_name ? `\nSenin adın: ${persona.persona_name}` : '',
  ].filter(Boolean).join('')

  // ── Claude call ──
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
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })
    if (!openaiRes.ok) throw new Error(`OpenAI ${openaiRes.status}`)
    const openaiData = await openaiRes.json()
    reply = openaiData.choices?.[0]?.message?.content ?? ''
  } catch (err) {
    console.error('OpenAI error:', err)
    reply = fallbackResponses['no_kb_match'] ?? 'Şu an bir sorun yaşıyorum. Lütfen birazdan tekrar yazın.'
  }

  // ── Save assistant reply ──
  await supabase.from('messages').insert({
    conversation_id: conversationId, organization_id: orgId,
    role: 'assistant', content: reply, content_type: 'text',
  })

  // ── Send via GHL ──
  await sendGHLMessage(pitToken, ghlContactId, reply)

  // ── Move new lead to in_progress in GHL pipeline ──
  if (isNewLead) {
    await updateGHLPipelineStage(
      pitToken, pipelineId, stageMapping['in_progress'], locationId, ghlContactId
    )
  }
}

// ─── Main flow ────────────────────────────────────────────────────────────────

async function handleInbound(payload: GHLWebhookPayload) {
  const supabase = getSupabase()
  const locationId = payload.locationId
  const ghlContactId = payload.contactId
  const phone = payload.phone ?? ''
  const messageText = (payload.body ?? '').trim()

  if (!messageText) return

  // ── Find org by location_id ──
  // Supabase doesn't support filtering on nested JSONB with REST API directly,
  // so load all GHL orgs and filter in memory (small dataset)
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, crm_config, channel_config')
    .eq('status', 'active')

  const org = orgs?.find((o) => {
    const crm = o.crm_config as Record<string, string>
    return crm?.provider === 'ghl' && crm?.location_id === locationId
  })

  if (!org) {
    console.error(`No active org found for GHL location_id: ${locationId}`)
    return
  }

  const crm = org.crm_config as Record<string, unknown>
  const pitToken = crm['pit_token'] as string
  const pipelineId = crm['pipeline_id'] as string
  const stageMapping = crm['stage_mapping'] as Record<string, string>

  // ── Upsert contact in Supabase ──
  let contactId: string
  let isNewLead = false

  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', org.id)
    .eq('phone', phone)
    .maybeSingle()

  if (existingContact?.id) {
    contactId = existingContact.id
  } else {
    const { data: newContact, error: contactErr } = await supabase
      .from('contacts')
      .insert({
        organization_id: org.id,
        phone,
        channel_identifiers: { whatsapp: phone, ghl_contact_id: ghlContactId },
        source_channel: 'whatsapp',
        status: 'new',
      })
      .select('id')
      .single()

    if (contactErr || !newContact?.id) {
      console.error('Contact upsert failed:', contactErr)
      return
    }
    contactId = newContact.id
    isNewLead = true
  }

  // ── Upsert lead ──
  if (!isNewLead) {
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', org.id)
      .eq('contact_id', contactId)
      .maybeSingle()
    isNewLead = !existingLead?.id
  }

  if (isNewLead) {
    await supabase.from('leads').insert({
      organization_id: org.id,
      contact_id: contactId,
      status: 'new',
      qualification_score: 5,
      source_channel: 'whatsapp',
      collected_data: {},
    })
  }

  // ── Find or create open conversation ──
  let conversationId: string

  const { data: existingConvo } = await supabase
    .from('conversations')
    .select('id')
    .eq('organization_id', org.id)
    .eq('contact_id', contactId)
    .eq('channel', 'whatsapp')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingConvo?.id) {
    conversationId = existingConvo.id
  } else {
    const { data: newConvo, error: convoErr } = await supabase
      .from('conversations')
      .insert({
        organization_id: org.id,
        contact_id: contactId,
        channel: 'whatsapp',
        status: 'active',
        channel_metadata: { ghl_contact_id: ghlContactId, ghl_location_id: locationId },
      })
      .select('id')
      .single()

    if (convoErr || !newConvo?.id) {
      console.error('Conversation create failed:', convoErr)
      return
    }
    conversationId = newConvo.id
  }

  // ── Save inbound user message ──
  const { data: savedMsg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      organization_id: org.id,
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

  // ── Debounce: wait, then check if still latest ──
  await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS))

  const aggregated = await getAggregatedIfLatest(supabase, conversationId, savedMsg.id)
  if (!aggregated) return  // a newer message will handle this

  // ── Run chat engine ──
  await runChatEngine(
    supabase, org.id, conversationId,
    ghlContactId, locationId, pitToken, pipelineId, stageMapping,
    aggregated, isNewLead
  )
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

  // Only process inbound WhatsApp messages
  if (payload.type !== 'InboundMessage' || payload.messageType !== 'WhatsApp') {
    return new Response('OK', { status: 200 })
  }

  // Ack immediately, process in background
  // @ts-ignore Deno-specific global
  EdgeRuntime.waitUntil(handleInbound(payload))

  return new Response('OK', { status: 200 })
})
