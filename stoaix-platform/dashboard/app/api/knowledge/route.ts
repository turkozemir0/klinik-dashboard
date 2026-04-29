import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { checkEntitlement, incrementUsage } from '@/lib/entitlements'
import { getSchema } from '@/lib/kb-schemas'
import { demoWriteBlock } from '@/lib/demo-guard'

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) }

function autoDetectTags(itemType: string, existingTags: string[]): string[] {
  const detected = new Set<string>(existingTags)
  if (itemType) detected.add(itemType)
  return Array.from(detected)
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  })
  return response.data[0].embedding
}

const KB_GENERATION_SYSTEM_PROMPT =
  'Sen bir sesli AI asistanı için bilgi tabanı içeriği yazıyorsun. ' +
  'ZORUNLU KURALLAR:\n' +
  '- "Merhaba", "Bugün size...", "Ben ... temsilcisiyim" gibi açılışlar YASAK\n' +
  '- "Harika bir seçenek", "mükemmel tercih", "kariyer hedeflerinize ulaşın", ' +
  '"memnuniyetle yanıtlarım", "unutmayın" gibi promosyon/öneri cümleleri YASAK\n' +
  '- Yorum, tavsiye veya motivasyon cümlesi ekleme\n' +
  '- Sadece nesnel ve olgusal bilgi yaz: programlar, ücretler, dil, koşullar\n' +
  '- Kısa ve doğrudan yaz, gereksiz açıklama ekleme'

async function generateDescriptionForAI(item_type: string, data: Record<string, any>): Promise<string> {
  const schema = getSchema(item_type)
  if (!schema) return JSON.stringify(data)
  const prompt = schema.llmPrompt(data)
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: KB_GENERATION_SYSTEM_PROMPT },
      { role: 'user',   content: prompt },
    ],
  })
  return response.choices[0]?.message?.content?.trim() ?? JSON.stringify(data)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description_for_ai: manualDescription, data: itemData, tags, item_type, organization_id, is_active } = body

  if (!title || !organization_id) {
    return NextResponse.json({ error: 'title ve organization_id zorunlu' }, { status: 400 })
  }

  const blocked = demoWriteBlock(organization_id)
  if (blocked) return blocked

  const ent = await checkEntitlement(organization_id, 'kb_write')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'kb_write' }, { status: 403 })
  if (ent.remaining !== null && ent.remaining <= 0) {
    return NextResponse.json({ error: 'usage_limit_exceeded', feature: 'kb_write', limit: ent.limit, used: ent.used }, { status: 403 })
  }

  // Generate description_for_ai from data if not provided manually
  let description_for_ai: string
  if (manualDescription) {
    description_for_ai = manualDescription
  } else if (itemData) {
    description_for_ai = await generateDescriptionForAI(item_type || 'general', itemData)
  } else {
    return NextResponse.json({ error: 'description_for_ai veya data zorunlu' }, { status: 400 })
  }

  // Generate embedding
  const textToEmbed = `${title}\n\n${description_for_ai}`
  const embedding = await generateEmbedding(textToEmbed)

  const service = createServiceClient()
  const { data, error } = await service
    .from('knowledge_items')
    .insert({
      organization_id,
      item_type: item_type || 'faq',
      title,
      description_for_ai,
      data: itemData || {},
      tags: autoDetectTags(item_type || 'faq', tags || []),
      is_active: is_active !== undefined ? is_active : true,
      embedding,
    })
    .select('id, item_type, title, description_for_ai, data, tags, is_active, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await incrementUsage(organization_id, 'kb_write')

  // Fire-and-forget: kb item added event
  service.from('org_events').insert({
    org_id: organization_id,
    event_type: 'kb_item_added',
    metadata: { item_type: item_type || 'faq', title },
  }).then(() => {})

  return NextResponse.json(data)
}
