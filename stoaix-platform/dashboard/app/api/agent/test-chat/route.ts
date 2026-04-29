import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { isDemoOrg, getDemoRef, checkDemoRateLimit, incrementDemoUsage } from '@/lib/demo-guard'

const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'gpt-4o-mini']

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

// USD per 1M tokens
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6':         { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 1.00,  output: 5.00  },
  'gpt-4o-mini':               { input: 0.15,  output: 0.60  },
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

  // --- Input validation ---
  const {
    message,
    history = [],
    channel = 'whatsapp',
    model: rawModel = 'claude-sonnet-4-6',
  } = await req.json()

  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  const model = ALLOWED_MODELS.includes(rawModel) ? rawModel : 'claude-sonnet-4-6'

  // Demo rate limiting
  if (isDemoOrg(orgId)) {
    const ref = getDemoRef()
    const limit = await checkDemoRateLimit(ref, 'chatbot_messages')
    if (limit) return NextResponse.json({ error: limit.error, limit: limit.limit, used: limit.used, message: 'Günlük demo limitiniz doldu.' }, { status: 429 })
    await incrementDemoUsage(ref, 'chatbot_messages', 1)
  }

  // Playbook'u çek
  const { data: playbooks } = await service
    .from('agent_playbooks')
    .select('system_prompt_template, hard_blocks, routing_rules')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .in('channel', [channel, 'all'])
    .order('version', { ascending: false })
    .limit(2)

  const pb = playbooks?.find(p => p)

  // KB vector search (OpenAI embedding)
  let kbContext = ''
  try {
    const openai = getOpenAI()
    const embedRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    })
    const embedding = embedRes.data[0].embedding

    const { data: kbResults } = await service.rpc('match_knowledge_items', {
      query_vector: embedding,
      match_count: 5,
      org_id: orgId,
    })

    if (kbResults?.length) {
      kbContext = kbResults
        .map((r: any) => r.description_for_ai || r.title)
        .filter(Boolean)
        .join('\n\n')
    }
  } catch {
    // KB search opsiyonel, hata olursa devam et
  }

  const systemPrompt = [
    pb?.system_prompt_template || 'You are a helpful assistant.',
    kbContext
      ? `\n\n## Bilgi Bankası (bu konuşmayla ilgili içerikler):\n${kbContext}`
      : '',
    '\n\n## Not: Bu bir test konuşmasıdır, gerçek bir kullanıcı kaydı oluşturulmaz.',
  ]
    .filter(Boolean)
    .join('')

  let reply: string
  let inputTokens = 0
  let outputTokens = 0

  if (model.startsWith('claude-')) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const anthropicMessages = (history as { role: string; content: string }[]).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    anthropicMessages.push({ role: 'user', content: message })

    const response = await anthropic.messages.create({
      model,
      system: systemPrompt,
      messages: anthropicMessages,
      max_tokens: 600,
    })

    reply = response.content[0].type === 'text' ? response.content[0].text : ''
    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens
  } else {
    const openai = getOpenAI()
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...(history as OpenAI.Chat.ChatCompletionMessageParam[]),
      { role: 'user', content: message },
    ]

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 600,
      temperature: 0.7,
    })

    reply = completion.choices[0].message.content || ''
    inputTokens = completion.usage?.prompt_tokens ?? 0
    outputTokens = completion.usage?.completion_tokens ?? 0
  }

  const costs = MODEL_COSTS[model] ?? MODEL_COSTS['claude-sonnet-4-6']
  const cost = (inputTokens / 1_000_000) * costs.input + (outputTokens / 1_000_000) * costs.output

  return NextResponse.json({ reply, usage: { inputTokens, outputTokens, cost } })
}
