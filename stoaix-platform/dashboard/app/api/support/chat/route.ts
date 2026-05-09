import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { SUPPORT_SYSTEM_PROMPT } from '@/lib/support-prompt'

const RATE_LIMIT = 20          // mesaj/saat/kullanıcı
const MAX_MSG_LENGTH = 2000
const MAX_HISTORY = 20         // son N mesaj gönderilir
const MATCH_COUNT = 5

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function buildOrgContext(org: any, sub: any, usage: any[], userCount: number): string {
  const lines: string[] = []

  if (org?.name) lines.push(`Organizasyon: ${org.name}`)
  if (org?.sector) lines.push(`Sektör: ${org.sector}`)

  // Plan durumu
  if (!sub) {
    lines.push('Plan: Henüz plan seçilmemiş')
  } else if (sub.status === 'legacy') {
    lines.push('Plan: Legacy (ücretsiz erişim)')
  } else if (sub.status === 'trialing') {
    const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('tr-TR') : '?'
    lines.push(`Plan: ${sub.plan_id?.toUpperCase() || '?'} (Deneme — ${trialEnd} tarihine kadar)`)
  } else if (sub.status === 'active') {
    lines.push(`Plan: ${sub.plan_id?.toUpperCase() || '?'} (Aktif)`)
  } else {
    lines.push(`Plan: ${sub.plan_id?.toUpperCase() || '?'} (${sub.status})`)
  }

  // Kullanım — sadece subscription varsa
  if (sub?.plan_id) {
    const usageMap = (usage ?? []).reduce((a, u) => ({ ...a, [u.metric]: u.used_value }), {} as Record<string, number>)
    const PLAN_LIMITS: Record<string, { conv: number; voice: number }> = {
      essential:    { conv: 1000, voice: 0 },
      professional: { conv: 2000, voice: 200 },
      business:     { conv: 5000, voice: 500 },
      custom:       { conv: -1,   voice: -1 },
    }
    const limits = PLAN_LIMITS[sub.plan_id] || null
    if (limits) {
      const convUsed = usageMap['ai_conversations'] || 0
      const voiceUsed = usageMap['voice_minutes'] || 0
      lines.push(`AI Konuşma: ${convUsed}/${limits.conv === -1 ? '∞' : limits.conv}`)
      if (limits.voice > 0) lines.push(`Ses Dakikası: ${voiceUsed}/${limits.voice} dk`)
      else if (limits.voice === 0) lines.push('Ses: Plan kapsamında değil')
    }
  }

  // Kanallar
  const ch = org?.channel_config || {}
  const channels = [
    `WhatsApp: ${ch.whatsapp?.active ? '✓ Bağlı' : '✗ Bağlı değil'}`,
    `Instagram: ${ch.instagram?.active ? '✓ Bağlı' : '✗ Bağlı değil'}`,
    `Sesli Arama: ${ch.voice_inbound?.active ? '✓ Aktif' : '✗ Aktif değil'}`,
  ]
  lines.push(`Kanallar: ${channels.join(', ')}`)

  lines.push(`Kullanıcı sayısı: ${userCount}`)

  return lines.join('\n')
}

function getHourWindow(): Date {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  return now
}

export async function POST(req: NextRequest) {
  // --- Auth ---
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgId = orgUser.organization_id

  // --- Org context (kişisel asistan) ---
  const billingPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const [orgRes, subRes, usageRes, usersRes] = await Promise.all([
    service.from('organizations')
      .select('name, sector, channel_config')
      .eq('id', orgId).single(),
    service.from('org_subscriptions')
      .select('plan_id, status, trial_ends_at, current_period_end')
      .eq('organization_id', orgId).maybeSingle(),
    service.from('usage_counters')
      .select('metric, used_value')
      .eq('organization_id', orgId)
      .eq('billing_period', billingPeriod),
    service.from('org_users')
      .select('id')
      .eq('organization_id', orgId),
  ])

  // --- Input validation ---
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 })
  }

  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content) {
    return NextResponse.json({ error: 'Last message must be a user message' }, { status: 400 })
  }

  if (lastMessage.content.length > MAX_MSG_LENGTH) {
    return NextResponse.json({ error: `Message too long (max ${MAX_MSG_LENGTH} chars)` }, { status: 400 })
  }

  // --- Rate limit check ---
  const windowStart = getHourWindow()
  const { data: rlData } = await service
    .from('support_chat_rate_limits')
    .select('message_count')
    .eq('user_id', user.id)
    .eq('window_start', windowStart.toISOString())
    .maybeSingle()

  if (rlData && rlData.message_count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.', limit: RATE_LIMIT },
      { status: 429 }
    )
  }

  // --- KB vector search ---
  let kbContext = ''
  let kbDocIds: string[] = []
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const embedRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: lastMessage.content,
    })
    const embedding = embedRes.data[0].embedding

    const { data: kbResults } = await service.rpc('match_support_docs', {
      query_vector: embedding,
      match_count: MATCH_COUNT,
    })

    if (kbResults?.length) {
      kbDocIds = kbResults.map((r: any) => r.id)
      kbContext = kbResults
        .map((r: any) => `### ${r.title}\n${r.content}`)
        .join('\n\n---\n\n')
    } else {
      console.warn('[support-chat] No KB docs found — embeddings may be missing')
    }
  } catch (err) {
    console.error('[support-chat] KB search error:', err)
    // KB search opsiyonel, hata olursa devam et
  }

  // --- Build system prompt ---
  const orgContext = buildOrgContext(orgRes.data, subRes.data, usageRes.data ?? [], usersRes.data?.length ?? 0)

  const systemPrompt = [
    SUPPORT_SYSTEM_PROMPT,
    orgContext ? `\n\n## Kullanıcının Organizasyon Bilgileri:\n\n${orgContext}` : '',
    kbContext ? `\n\n## Bilgi Bankası İçerikleri:\n\n${kbContext}` : '',
  ].join('')

  // --- Trim history ---
  const trimmedMessages = messages.slice(-MAX_HISTORY).map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content as string,
  }))

  // --- Claude Haiku call ---
  let reply = ''
  let inputTokens = 0
  let outputTokens = 0

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: trimmedMessages,
      max_tokens: 800,
    })

    reply = response.content[0].type === 'text' ? response.content[0].text : ''
    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens
  } catch (err) {
    console.error('[support-chat] LLM error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
  }

  // --- Log to support_chat_logs (await — serverless'ta fire-and-forget process öldürür) ---
  await service.from('support_chat_logs').insert({
    organization_id: orgId,
    user_id: user.id,
    user_message: lastMessage.content,
    ai_response: reply,
    kb_docs_used: kbDocIds,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  })

  // --- Increment rate limit ---
  await service.rpc('increment_support_rate_limit', {
    p_user_id: user.id,
    p_window_start: windowStart.toISOString(),
  })

  return NextResponse.json({ reply })
}
