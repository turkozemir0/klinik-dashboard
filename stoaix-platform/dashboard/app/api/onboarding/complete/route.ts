import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function getKbSummary(service: any, orgId: string): Promise<string> {
  const { data: kbItems } = await service
    .from('knowledge_items')
    .select('item_type, title, description_for_ai')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .limit(20)

  const byType: Record<string, { title: string; description_for_ai: string }[]> = {}
  for (const item of kbItems || []) {
    if (!byType[item.item_type]) byType[item.item_type] = []
    if (byType[item.item_type].length < 3) byType[item.item_type].push(item)
  }

  return Object.entries(byType).map(([type, items]) =>
    `[${type.toUpperCase()}]\n` + items.map(i => `• ${i.title}: ${i.description_for_ai.slice(0, 200)}`).join('\n')
  ).join('\n\n')
}

async function generateSystemPrompt(service: any, orgId: string, org: any, channel: 'voice' | 'whatsapp'): Promise<string> {
  try {
    const kbSummary = await getKbSummary(service, orgId)

    const isVoice = channel === 'voice'
    const metaPrompt = `Aşağıdaki işletme için bir AI ${isVoice ? 'sesli telefon' : 'WhatsApp/chat'} asistanının sistem promptunu oluştur.
Bu prompt asistanın KİMLİĞİNİ, GÖREVİNİ ve TEMEL DAVRANIŞ KURALLARINI tanımlar.
NOT: Konuşma kuralları, KB içerikleri ve veri toplama alanları runtime'da otomatik ekleniyor — onları EKLEME.

İŞLETME BİLGİLERİ:
- Ad: ${org.name}
- Sektör: ${org.sector || 'Hizmet'}
- Konum: ${[org.city, org.country].filter(Boolean).join(', ') || 'Belirtilmemiş'}

MEVCUT BİLGİ TABANI:
${kbSummary || '(Henüz bilgi bankası eklenmemiş)'}

FORMAT (max 200 kelime):
1. Kimlik tanımı (kim olduğu, hangi şirket adına çalıştığı)
2. Görev tanımı (ne yapacağı)
3. İletişim tarzı (${isVoice ? 'sesli telefon için kısa, doğal cümleler' : 'yazılı chat için net, samimi mesajlar'})
4. Sınırlar (bilgi dışı sorularda ne yapacağı)

Sadece sistem promptunu yaz — başlık veya açıklama ekleme.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      messages: [{ role: 'user', content: metaPrompt }],
    })

    return response.choices[0]?.message?.content?.trim() ?? ''
  } catch {
    return ''
  }
}

export async function POST(_request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const orgId = orgUser.organization_id

  const { data: org, error } = await service
    .from('organizations')
    .update({ status: 'active', onboarding_status: 'completed' })
    .eq('id', orgId)
    .select('name, sector, city, country')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Playbook yoksa her iki kanal için oluştur (voice + whatsapp)
  const { data: existingPlaybooks } = await service
    .from('agent_playbooks')
    .select('id, channel')
    .eq('organization_id', orgId)

  const existingChannels = new Set((existingPlaybooks || []).map((p: any) => p.channel))

  const playbookInserts: any[] = []
  if (!existingChannels.has('voice')) {
    const systemPrompt = await generateSystemPrompt(service, orgId, org, 'voice')
    playbookInserts.push({
      organization_id: orgId,
      name: `${org?.name ?? 'AI Asistan'} — Sesli Asistan`,
      channel: 'voice',
      system_prompt_template: systemPrompt,
      hard_blocks: [],
      routing_rules: [],
      is_active: true,
    })
  }
  if (!existingChannels.has('whatsapp')) {
    const systemPrompt = await generateSystemPrompt(service, orgId, org, 'whatsapp')
    playbookInserts.push({
      organization_id: orgId,
      name: `${org?.name ?? 'AI Asistan'} — WhatsApp/Chat`,
      channel: 'whatsapp',
      system_prompt_template: systemPrompt,
      hard_blocks: [],
      routing_rules: [],
      is_active: true,
    })
  }
  if (playbookInserts.length > 0) {
    await service.from('agent_playbooks').insert(playbookInserts)
  }

  // Intake schema yoksa her iki kanal için default oluştur
  const { data: existingSchemas } = await service
    .from('intake_schemas')
    .select('id, channel')
    .eq('organization_id', orgId)

  const existingSchemaChannels = new Set((existingSchemas || []).map((s: any) => s.channel))
  const schemaInserts: any[] = []

  const minimalFields = [
    {
      key: 'full_name',
      label: 'Ad Soyad',
      type: 'text',
      priority: 'must',
      voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?',
    },
    {
      key: 'phone',
      label: 'Telefon',
      type: 'phone',
      priority: 'must',
      voice_prompt: 'Sizi daha sonra arayabilmemiz için telefon numaranızı alabilir miyim?',
    },
  ]

  if (!existingSchemaChannels.has('voice')) {
    schemaInserts.push({
      organization_id: orgId,
      channel: 'voice',
      name: `${org?.name ?? 'İşletme'} Voice Başvuru Formu`,
      fields: minimalFields,
    })
  }
  if (!existingSchemaChannels.has('whatsapp')) {
    schemaInserts.push({
      organization_id: orgId,
      channel: 'whatsapp',
      name: `${org?.name ?? 'İşletme'} WhatsApp Başvuru Formu`,
      fields: minimalFields,
    })
  }
  if (schemaInserts.length > 0) {
    await service.from('intake_schemas').insert(schemaInserts)
  }

  return NextResponse.json({ ok: true })
}
