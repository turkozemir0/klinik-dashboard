import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { buildClinicPlaybookDefaults } from '@/lib/agent-templates'
import { CLINIC_INTAKE_SCHEMAS } from '@/lib/clinic-intake-schemas'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

// Fixture KB snippets per clinic type — used in template mode
const FIXTURE_KB: Record<string, string[]> = {
  dental: [
    'İmplant tedavisi: Titanyum vida ile kayıp dişin yerine kalıcı protez yerleştirilir. İyileşme süresi 2-4 ay.',
    'Zirkonyum kaplama: Doğal diş görünümüne en yakın estetik çözüm. Ortalama ömrü 10-15 yıl.',
    'Ortodonti (diş teli): Çapraşık dişlerin düzeltilmesi. Tedavi süresi 12-24 ay. Şeffaf plak seçeneği mevcut.',
    'Diş beyazlatma: Ofis tipi beyazlatma 1 seansta yapılır. Sonuç 2-3 yıl sürer.',
    'Kanal tedavisi: Enfekte diş sinirinin temizlenmesi. 1-2 seans, ağrısız.',
  ],
  hair_transplant: [
    'FUE Saç Ekimi: Greftler tek tek çıkarılır ve hazırlanan kanallara yerleştirilir. İz bırakmaz.',
    'DHI Saç Ekimi: İmplanter kalemiyle doğrudan ekim. Kanal açma aşaması yok, daha yoğun ekim mümkün.',
    'Saç Analizi: Greft sayısı, donör alan kalitesi ve saç çizgisi tasarımı belirlenir. Ücretsiz yapılır.',
    'Medikal Turizm Paketi: Transfer, konaklama ve işlem dahil. Yurt dışından gelen hastalar için.',
    'PRP Tedavisi: Saç ekimi sonrası iyileşmeyi hızlandırır. 3-4 seans önerilir.',
  ],
  medical_aesthetics: [
    'Botoks: Kırışıklık giderme, 10-15 dakika uygulama. Etki 4-6 ay sürer.',
    'Dolgu: Dudak, yanak, çene hatları için hyalüronik asit dolgular. Etki 6-12 ay.',
    'Lazer Cilt Yenileme: Leke, kırışıklık ve akne izi tedavisi. 3-6 seans önerilir.',
    'PRP Cilt Bakımı: Kendi kanınızdan elde edilen plazma ile cilt yenileme. 3-4 seans.',
    'Kimyasal Peeling: Cilt tonunu eşitler, lekeleri azaltır. Hafif veya orta derinlikte seçenekler.',
  ],
  surgical_aesthetics: [
    'Rinoplasti: Burun şekillendirme, estetik ve fonksiyonel düzeltme. İyileşme 2-3 hafta.',
    'Liposuction: Bölgesel yağ alma. Karın, bel, uyluk bölgelerinde uygulanır.',
    'Meme Estetiği: Büyütme, küçültme, dikleştirme. Silikon veya yağ transferi seçenekleri.',
    'Yüz Germe: Sarkmış cilt ve dokuların gerginleştirilmesi. Kalıcı sonuç.',
    'Karın Germe (Abdominoplasti): Fazla cilt ve yağ alınır, karın duvarı sıkılaştırılır.',
  ],
  physiotherapy: [
    'Bel Fıtığı Tedavisi: Manuel terapi, egzersiz ve fizik tedavi kombine. 10-15 seans.',
    'Diz Rehabilitasyonu: Ameliyat öncesi/sonrası rehabilitasyon. Kişiye özel program.',
    'Omuz Ağrısı Tedavisi: Donuk omuz, rotator cuff yaralanması. Manuel terapi + egzersiz.',
    'Spor Yaralanmaları: Akut ve kronik spor sakatlıklarının rehabilitasyonu.',
    'Boyun Ağrısı Tedavisi: Boyun fıtığı, kas gerginliği. Postür eğitimi dahil.',
  ],
  ophthalmology: [
    'LASIK: Kornea üzerinde lazer ile görme kusuru düzeltme. İşlem 15 dakika, ertesi gün normale dönüş.',
    'SMILE: Kesisiz lazer göz tedavisi. Kornea bütünlüğü korunur, hızlı iyileşme.',
    'Katarakt Ameliyatı: Bulanıklaşan göz merceği yapay mercekle değiştirilir. 15-20 dakika.',
    'Göz İçi Lens: Yüksek numaralarda lazer uygun değilse, lens yerleştirme alternatifi.',
    'Göz Muayenesi: Kapsamlı göz kontrolü, göz tansiyonu ölçümü, retina değerlendirmesi.',
  ],
  general_practice: [
    'Genel Check-up: Kan tahlili, tansiyon, şeker ölçümü, EKG dahil kapsamlı kontrol.',
    'Kronik Hastalık Takibi: Diyabet, hipertansiyon, tiroid hastalıklarının düzenli kontrolü.',
    'Aşılama: Yetişkin ve çocuk aşı programları. Grip, hepatit, HPV aşıları.',
    'Laboratuvar Hizmetleri: Tam kan sayımı, hormon paneli, idrar tahlili.',
    'Sağlık Raporu: Ehliyet, işe giriş, spor raporu düzenleme.',
  ],
  other: [
    'Konsültasyon: Uzmanımız ihtiyacınızı değerlendirir ve en uygun tedavi planını sunar.',
    'Online Randevu: Web veya telefon üzerinden 7/24 randevu alabilirsiniz.',
    'Taksitli Ödeme: 3, 6, 9 ve 12 taksit seçenekleri mevcuttur.',
  ],
}

// Voice-specific guardrails (mirrors prompt_rules.py)
const VOICE_GUARDRAILS = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM GÜVENLİK KURALLARI (DEĞİŞTİRİLEMEZ):
- Asla teşhis koyma, tedavi önerme veya ilaç dozajı belirtme
- Sağlık sorusu geldiğinde: "Bu konuda uzmanımız sizi bilgilendirir" de, tıbbi tavsiye verme
- Gerçek bir klinik çalışanı gibi doğal davran — yapay zeka olduğunu belli etme, robot gibi konuşma
- Başka hastaların bilgisini veya kişisel verilerini paylaşma
- Acil durum kelimeleri (şiddetli ağrı, kanama, nefes darlığı, bayılma) → ANINDA insan temsilciye yönlendir
- Rakip klinikler hakkında yorum yapma, karşılaştırma yapma

━━━ KONUŞMA KURALLARI (KATI): ━━━
- Her turda yalnızca 1 soru sor. Aynı anda iki soru sormak YASAK.
- Yanıtların maksimum 2 cümle olsun. Monolog yapma.
- Her cümle en fazla 15-20 kelime olsun — kısa ve net konuş.
- Sayıları HER ZAMAN yazıyla söyle: "1500" yerine "bin beş yüz"
- "Harika!", "Mükemmel!" gibi abartılı ifadeler YASAK. Doğal ve sade konuş.
- Fiyat sorusunda kesin rakam verme — aralık ver veya konsültasyona yönlendir

━━━ DOĞAL KONUŞMA ━━━
- Hasta endişeli görünüyorsa: "Anlıyorum" ile başla, empati göster
- Kızgın hastaya sakin yanıt ver, baskı yapma
- İtirazı 1 cümlede karşıla, hemen niteleme sorusuna dön

━━━ DİL KURALI ━━━
- DAİMA "siz" formu kullan, "sen" formu HİÇBİR DURUMDA kullanılmaz
`.trim()

const CHAT_GUARDRAILS_TR = `━━━ PLATFORM GÜVENLİK KURALLARI (değiştirilemez) ━━━
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
- Türkçe konuşuyorsan: DAİMA "siz" formu kullan, "sen" formu YASAK
- Diğer dillerde: o dilin resmi/nazik hitap formunu kullan`.trim()

const CHAT_GUARDRAILS_DE = `━━━ PLATFORM-SICHERHEITSREGELN (unveränderlich) ━━━
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
- In anderen Sprachen: die formelle/höfliche Anredeform verwenden`.trim()

const CHAT_GUARDRAILS_EN = `━━━ PLATFORM SAFETY RULES (immutable) ━━━
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
- Use the formal/polite form of address in every language`.trim()

function getChatGuardrails(lang?: string): string {
  switch (lang?.toLowerCase()) {
    case 'de': return CHAT_GUARDRAILS_DE
    case 'en': return CHAT_GUARDRAILS_EN
    default:   return CHAT_GUARDRAILS_TR
  }
}

// Outbound scenario system prompt prefixes
const OUTBOUND_PREFIXES: Record<string, string> = {
  first_contact: 'Bu bir ilk temas aramasıdır. Lead\'e nazikçe ulaşıyorsun, ilgisini teyit et.',
  warm_followup: 'Bu bir takip aramasıdır. Önceki konuşmaya referans ver, baskı yapma.',
  appt_confirm: 'Bu bir randevu teyit aramasıdır. Tarih/saati doğrulat, kısa tut.',
  appointment_reminder: 'Bu bir randevu hatırlatma aramasıdır. Çok kısa, 2-3 tur.',
  noshow_followup: 'Hasta randevuya gelmedi. Anlayışlı ol, yeni randevu öner.',
  satisfaction_survey: 'Bu bir memnuniyet anketi aramasıdır. 1-5 puan + yorum al, kısa tut.',
  treatment_reminder: 'Bu bir tedavi hatırlatma aramasıdır. Kontrol randevusu öner.',
  reactivation: 'Bu uyuyan bir lead\'e yeniden ulaşma aramasıdır. Nazik ol, teklif varsa ilet.',
  payment_followup: 'Bu bir ödeme takip aramasıdır. Nazik ol, ödeme planı sun.',
}

// USD per 1M tokens
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6':         { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 1.00,  output: 5.00  },
  'gpt-4o-mini':               { input: 0.15,  output: 0.60  },
}

export async function POST(req: NextRequest) {
  // Auth check: only allow in development or with eval secret
  const evalSecret = req.headers.get('x-eval-secret')
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && evalSecret !== process.env.EVAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = getServiceClient()
  const {
    message,
    orgId,
    channel = 'voice',
    scenario = 'inbound',
    conversationHistory = [],
    model = 'claude-sonnet-4-6',
    // Template mode: generate playbook from templates instead of DB
    templateMode = false,
    clinicType = 'other',
    clinicName = 'Test Kliniği',
    personaName = 'Asistan',
    fixtureKb,     // optional: override fixture KB with custom array
  } = await req.json()

  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }
  if (!templateMode && !orgId) {
    return NextResponse.json({ error: 'message and orgId required (or use templateMode)' }, { status: 400 })
  }

  let playbookPrompt: string | null = null
  let intakeFields: any[] = []
  let kbContext = ''
  let kbHits = 0
  let orgLang = 'tr' // default to Turkish; overridden in DB mode

  if (templateMode) {
    // ── Template mode: generate from agent-templates.ts ──
    const ch = channel === 'voice' ? 'voice' : 'whatsapp' as const
    const defaults = buildClinicPlaybookDefaults(clinicName, personaName, ch, clinicType)
    playbookPrompt = defaults.systemPrompt

    // Use clinic-type-specific intake schema
    intakeFields = CLINIC_INTAKE_SCHEMAS[clinicType] ?? CLINIC_INTAKE_SCHEMAS['other'] ?? []

    // Use fixture KB (provided or built-in)
    const kbItems = fixtureKb || FIXTURE_KB[clinicType] || FIXTURE_KB['other'] || []
    if (kbItems.length) {
      kbHits = kbItems.length
      kbContext = kbItems.join('\n\n')
    }
  } else {
    // ── DB mode: load from Supabase (original behavior) ──
    const { data: playbooks } = await service
      .from('agent_playbooks')
      .select('system_prompt_template, hard_blocks, routing_rules, features, persona')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .in('channel', [channel === 'voice' ? 'voice' : channel, 'all'])
      .order('version', { ascending: false })
      .limit(2)

    const pb = playbooks?.find(p => p)
    playbookPrompt = pb?.system_prompt_template || null

    // Load intake schema
    const { data: intakeSchemas } = await service
      .from('intake_schemas')
      .select('fields')
      .eq('organization_id', orgId)
      .in('channel', [channel === 'voice' ? 'voice' : channel, 'all'])
      .order('created_at', { ascending: false })
      .limit(1)

    intakeFields = intakeSchemas?.[0]?.fields || []

    // Fetch org language for guardrails
    const { data: orgRow } = await service
      .from('organizations')
      .select('default_language')
      .eq('id', orgId)
      .single()
    if (orgRow?.default_language) orgLang = orgRow.default_language

    // KB vector search
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
        kbHits = kbResults.length
        kbContext = kbResults
          .map((r: any) => r.description_for_ai || r.title)
          .filter(Boolean)
          .join('\n\n')
      }
    } catch {
      // KB search optional
    }
  }

  // Build system prompt based on channel
  const guardrails = channel === 'voice' ? VOICE_GUARDRAILS : getChatGuardrails(orgLang)
  const scenarioPrefix = OUTBOUND_PREFIXES[scenario] || ''

  // Must/should fields for intake
  const mustFields = intakeFields.filter((f: any) => f.priority === 'must')
  const shouldFields = intakeFields.filter((f: any) => f.priority === 'should')

  let intakeSection = ''
  if (mustFields.length || shouldFields.length) {
    intakeSection = '\n\n━━━ TOPLANMASI GEREKEN BİLGİLER: ━━━\n'
    if (mustFields.length) {
      intakeSection += 'ZORUNLU:\n' + mustFields.map((f: any) =>
        `- ${f.label || f.key}${f.voice_prompt ? ` (sor: "${f.voice_prompt}")` : ''}`
      ).join('\n')
    }
    if (shouldFields.length) {
      intakeSection += '\n\nOPSİYONEL:\n' + shouldFields.map((f: any) =>
        `- ${f.label || f.key}`
      ).join('\n')
    }
  }

  const systemPrompt = [
    guardrails,
    '\n\n',
    playbookPrompt || 'You are a helpful clinic assistant.',
    scenarioPrefix ? `\n\n━━━ SENARYO: ━━━\n${scenarioPrefix}` : '',
    kbContext ? `\n\n━━━ BİLGİ TABANI: ━━━\n${kbContext}` : '',
    intakeSection,
    '\n\n## Not: Bu bir test konuşmasıdır, gerçek kayıt oluşturulmaz.',
  ].filter(Boolean).join('')

  // Calculate qualification score from history (simple heuristic)
  const collectedFields = new Set<string>()
  const allMessages = [...conversationHistory, { role: 'user', content: message }]
  for (const f of mustFields) {
    const key = f.key?.toLowerCase()
    if (key && allMessages.some((m: any) =>
      m.role === 'user' && m.content?.toLowerCase().includes(key)
    )) {
      collectedFields.add(f.key)
    }
  }
  const qualificationScore = mustFields.length
    ? Math.round((collectedFields.size / mustFields.length) * 70)
    : 0

  let reply: string
  let inputTokens = 0
  let outputTokens = 0

  try {
    if (model.startsWith('claude-')) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

      const anthropicMessages = (conversationHistory as { role: string; content: string }[]).map(m => ({
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
        ...(conversationHistory as OpenAI.Chat.ChatCompletionMessageParam[]),
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
  } catch (err: any) {
    const status = err?.status || 500
    const msg = err?.message || 'LLM API error'
    return NextResponse.json({ error: msg, reply: '', usage: {} }, { status })
  }

  const costs = MODEL_COSTS[model] ?? MODEL_COSTS['claude-sonnet-4-6']
  const cost = (inputTokens / 1_000_000) * costs.input + (outputTokens / 1_000_000) * costs.output

  return NextResponse.json({
    reply,
    usage: { inputTokens, outputTokens, cost },
    metadata: {
      channel,
      scenario,
      kbHits,
      qualificationScore,
      collectedFields: Array.from(collectedFields),
      model,
      templateMode,
      clinicType: templateMode ? clinicType : undefined,
    },
  })
}
