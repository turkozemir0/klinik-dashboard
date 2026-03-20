import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { getSchema } from '@/lib/kb-schemas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  })
  return response.data[0].embedding
}

async function generateDescriptionForAI(item_type: string, data: Record<string, any>): Promise<string> {
  const schema = getSchema(item_type)
  if (!schema) return JSON.stringify(data)
  const prompt = schema.llmPrompt(data)
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.choices[0]?.message?.content?.trim() ?? JSON.stringify(data)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description_for_ai: manualDescription, data: itemData, tags, item_type, is_active } = body

  const service = createServiceClient()

  // If only toggling is_active (no title change needed)
  if (is_active !== undefined && !title && !itemData && !manualDescription) {
    const { data, error } = await service
      .from('knowledge_items')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('id, item_type, title, description_for_ai, data, tags, is_active, updated_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (!title) {
    return NextResponse.json({ error: 'title zorunlu' }, { status: 400 })
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

  const updatePayload: Record<string, any> = {
    title,
    description_for_ai,
    tags: tags || [],
    item_type: item_type || 'faq',
    embedding,
    updated_at: new Date().toISOString(),
  }
  if (itemData !== undefined) updatePayload.data = itemData
  if (is_active !== undefined) updatePayload.is_active = is_active

  const { data, error } = await service
    .from('knowledge_items')
    .update(updatePayload)
    .eq('id', params.id)
    .select('id, item_type, title, description_for_ai, data, tags, is_active, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { error } = await service
    .from('knowledge_items')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
