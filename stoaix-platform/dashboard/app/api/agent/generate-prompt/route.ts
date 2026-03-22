import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SECTOR_LABELS: Record<string, string> = {
  education:    'Eğitim / Yurt Dışı Danışmanlık',
  clinic:       'Sağlık / Klinik',
  real_estate:  'Gayrimenkul',
  tech_service: 'Teknoloji Hizmetleri',
  other:        'Hizmet',
}

const KB_TYPE_LABELS: Record<string, string> = {
  service:             'Hizmet',
  faq:                 'Sık Sorulan Soru',
  pricing:             'Fiyatlandırma',
  policy:              'Politika',
  general:             'Genel Bilgi',
  treatment:           'Tedavi',
  doctor:              'Uzman',
  country_overview:    'Ülke Bilgisi',
  university_programs: 'Üniversite Programları',
  property:            'Mülk',
  neighborhood:        'Semt/Mahalle',
  service_package:     'Hizmet Paketi',
  case_study:          'Vaka Çalışması',
  office_location:     'Ofis/Temsilcilik',
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel } = await request.json()
  if (!channel || !['voice', 'chat', 'whatsapp'].includes(channel)) {
    return NextResponse.json({ error: 'channel must be voice, chat or whatsapp' }, { status: 400 })
  }

  const service = createServiceClient()

  // Org bul
  let orgId = ''
  const { data: ou } = await supabase.from('org_users').select('organization_id').eq('user_id', user.id).maybeSingle()
  if (ou) {
    orgId = ou.organization_id
  } else {
    const { data: firstOrg } = await service.from('organizations').select('id').eq('status', 'active').order('created_at', { ascending: true }).limit(1).maybeSingle()
    if (firstOrg) orgId = firstOrg.id
  }
  if (!orgId) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  // Org bilgileri
  const { data: org } = await service
    .from('organizations')
    .select('name, sector, city, country, phone, email, ai_persona, working_hours')
    .eq('id', orgId)
    .single()
  if (!org) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  // KB özeti — type başına max 4 kayıt
  const { data: kbItems } = await service
    .from('knowledge_items')
    .select('item_type, title, description_for_ai')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('item_type')
    .limit(40)

  const byType: Record<string, { title: string; description_for_ai: string }[]> = {}
  for (const item of kbItems || []) {
    if (!byType[item.item_type]) byType[item.item_type] = []
    if (byType[item.item_type].length < 4) byType[item.item_type].push(item)
  }

  const kbSummary = Object.entries(byType).map(([type, items]) => {
    const label = KB_TYPE_LABELS[type] || type
    return `[${label.toUpperCase()}]\n` + items.map(i =>
      `• ${i.title}: ${i.description_for_ai.slice(0, 250)}`
    ).join('\n')
  }).join('\n\n')

  // Persona bilgileri
  const persona = (org.ai_persona as any) || {}
  const personaName = persona.persona_name || 'AI Asistan'
  const tone = persona.tone === 'warm-professional' ? 'sıcak ve profesyonel' : persona.tone || 'profesyonel'
  const sectorLabel = SECTOR_LABELS[org.sector] || org.sector

  // Çalışma saatleri
  const wh = (org.working_hours as any) || {}
  const whText = wh.weekdays
    ? `Hafta içi ${wh.weekdays}${wh.saturday ? ', Cumartesi ' + wh.saturday : ''}${wh.sunday ? ', Pazar: ' + wh.sunday : ''}`
    : null

  // Channel'a özel talimatlar
  const channelInstructions = channel === 'voice'
    ? `Bu bir SESLİ TELEFON asistanı promptu. Şu kurallara göre yaz:
- Kısa, doğal konuşma cümleleri kur (her yanıtta max 2-3 cümle)
- Asla liste, madde işareti veya markdown kullanma
- Sayıları ve fiyatları yazıyla söylemesi gerektiğini belirt (ör: "iki bin beş yüz lira")
- Doğal telefon konuşması tarzı — resmi ama samimi
- "Sizi bekletiyor musunuz?" gibi doğal geçiş ifadelerine yer ver`
    : `Bu bir CHAT / MESAJLAŞMA asistanı promptu (WhatsApp/web). Şu kurallara göre yaz:
- Yanıtlar daha kapsamlı olabilir
- Gerektiğinde madde işareti veya kısa listeler kullanabilir
- Emoji kısıtlaması yok — sektöre uygunsa sıcak bir dil kullanabilir
- Yanıtlar ekran okunurluğuna göre bölünebilir`

  const metaPrompt = `Aşağıdaki işletme için bir AI asistanının sistem promptunu (system_prompt_template) oluştur.

Bu prompt asistanın KİMLİĞİNİ, GÖREVİNİ ve TEMEL DAVRANIŞ KURALLARINI tanımlar.
NOT: Konuşma kuralları, KB içerikleri ve intake form alanları runtime'da otomatik ekleniyor — onları EKLEME.

İŞLETME BİLGİLERİ:
- Ad: ${org.name}
- Sektör: ${sectorLabel}
- Konum: ${org.city || ''}${org.country ? ', ' + org.country : ''}
- Telefon: ${org.phone || 'Belirtilmemiş'}
- E-posta: ${org.email || 'Belirtilmemiş'}
- AI Asistan Adı: ${personaName}
- Ton: ${tone}
${whText ? `- Çalışma Saatleri: ${whText}` : ''}

MEVCUT BİLGİ TABANI ÖZETİ:
${kbSummary || '(Henüz bilgi bankası eklenmemiş)'}

KANAL KURALLARI:
${channelInstructions}

PROMPT FORMATI:
1. Kimlik tanımı (kim olduğu, hangi şirket adına çalıştığı)
2. Görev tanımı (ne yapacağı)
3. İletişim tarzı kuralları
4. Neler yapabileceği / yapamayacağı
5. Çalışma saatleri dışı için kısa bir not (varsa)

Sadece sistem promptunu yaz — başlık, açıklama veya not ekleme.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 800,
    messages: [{ role: 'user', content: metaPrompt }],
  })

  const systemPrompt = response.choices[0]?.message?.content?.trim() ?? ''
  return NextResponse.json({ system_prompt: systemPrompt })
}
