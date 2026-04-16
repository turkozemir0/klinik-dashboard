import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel } = await request.json()
  const service = createServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const orgId = orgUser.organization_id

  const { data: org } = await service
    .from('organizations')
    .select('name, sector')
    .eq('id', orgId)
    .single()

  const { data: kbItems } = await service
    .from('knowledge_items')
    .select('item_type, title, description_for_ai')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .limit(15)

  const kbSummary = kbItems
    ?.map(i => `• ${i.title}: ${i.description_for_ai.slice(0, 150)}`)
    .join('\n') || '(Bilgi bankası boş)'

  // Mevcut alanları al — tekrar önermesin
  const { data: existingSchema } = await service
    .from('intake_schemas')
    .select('fields')
    .eq('organization_id', orgId)
    .eq('channel', channel === 'voice' ? 'voice' : 'whatsapp')
    .maybeSingle()

  const existingKeys: string[] = ((existingSchema?.fields ?? []) as any[]).map((f: any) => f.key)

  const channelNote = channel === 'whatsapp'
    ? 'WhatsApp kanalından telefon numarası otomatik alınıyor.'
    : 'SIP üzerinden arayan numarası otomatik alınıyor.'

  const prompt = `Bu işletme için AI asistanının konuşma sırasında müşteriden toplaması gereken veri alanlarını öner.

İşletme: ${org?.name}
Sektör: ${org?.sector || 'Genel'}

Bilgi Bankası:
${kbSummary}

Kurallar:
- "phone" alanını ÖNERME — ${channelNote}
- Zaten mevcut olan şu alanları ÖNERME: ${existingKeys.length ? existingKeys.join(', ') : 'yok'}
- Satış sürecinde gerçekten ihtiyaç duyulan alanları öner
- En fazla 6 alan öner
- "must": satış için kritik, "should": faydalı ama zorunlu değil
- voice_prompt: asistanın bu bilgiyi sormak için kullanacağı doğal Türkçe cümle

Sadece JSON döndür:
{"fields": [{"key": "alan_adi", "label": "Görünen Ad", "type": "text", "priority": "must", "voice_prompt": "..."}]}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })
    const result = JSON.parse(response.choices[0]?.message?.content ?? '{}')
    return NextResponse.json({ fields: result.fields ?? [] })
  } catch {
    return NextResponse.json({ error: 'Öneri üretilemedi' }, { status: 500 })
  }
}
