import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  const { message, history = [], channel = 'whatsapp', orgId } = await req.json()

  if (!message || !orgId) {
    return NextResponse.json({ error: 'message and orgId required' }, { status: 400 })
  }

  // Playbook'u çek (channel-specific önce, sonra 'all' fallback)
  const { data: playbooks } = await service
    .from('agent_playbooks')
    .select('system_prompt_template, hard_blocks, routing_rules')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .in('channel', [channel, 'all'])
    .order('version', { ascending: false })
    .limit(2)

  const pb = playbooks?.find(p => p) // first result

  // KB vector search
  let kbContext = ''
  try {
    const embedRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    })
    const embedding = embedRes.data[0].embedding

    const { data: kbResults } = await service.rpc('match_knowledge_items', {
      query_embedding: embedding,
      match_threshold: 0.45,
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

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(history as OpenAI.Chat.ChatCompletionMessageParam[]),
    { role: 'user', content: message },
  ]

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 600,
    temperature: 0.7,
  })

  const reply = completion.choices[0].message.content || ''
  return NextResponse.json({ reply })
}
