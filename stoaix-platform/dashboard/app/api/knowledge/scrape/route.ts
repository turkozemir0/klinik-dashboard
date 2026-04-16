import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const rateLimitMap = new Map<string, { count: number; date: string }>()
const DAILY_LIMIT = 5

function checkRateLimit(orgId: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const entry = rateLimitMap.get(orgId)
  if (!entry || entry.date !== today) {
    rateLimitMap.set(orgId, { count: 1, date: today })
    return true
  }
  if (entry.count >= DAILY_LIMIT) return false
  entry.count++
  return true
}

const SCRAPE_SYSTEM_PROMPT = `Sen bir işletme için knowledge base içeriği çıkaran uzmansın.
Sana verilen web sitesi içeriğinden, bir AI asistanının müşterilere cevap vermesi için kullanabileceği bilgi maddelerini çıkar.

ÇIKAR: Hizmetler, fiyatlar, SSS, ekip/doktorlar, politikalar, lokasyon, çalışma saatleri, tedaviler, süreçler.
ÇIKARMA: Reklam sloganları, "Bizi seçin" gibi genel pazarlama metinleri, iletişim form açıklamaları.

Yanıtını SADECE geçerli JSON array olarak döndür, başka hiçbir şey yazma:
[
  {
    "title": "kısa başlık (max 60 karakter)",
    "description_for_ai": "AI'ın kullanacağı olgusal açıklama (2-5 cümle, yorum/tavsiye yok)",
    "item_type": "service | faq | pricing | team_member | policy | general"
  }
]

Kurallar:
- item_type'ı içeriğe göre seç
- description_for_ai objektif ve olgusal olsun, promosyon dili kullanma
- Aynı konuyu tekrarlama
- Max 15 madde döndür
- Dil: içeriğin diliyle aynı (Türkçe içerik → Türkçe çıkar)`

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { url, organization_id } = body

  if (!url || !organization_id) {
    return NextResponse.json({ error: 'url ve organization_id zorunlu' }, { status: 400 })
  }

  if (!checkRateLimit(organization_id)) {
    return NextResponse.json({ error: 'Günlük tarama limitine ulaştınız (5/gün). Yarın tekrar deneyin.' }, { status: 429 })
  }

  // URL validation
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Geçersiz URL — sadece http/https desteklenir' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Geçersiz URL formatı' }, { status: 400 })
  }

  // Fetch clean content via Jina Reader
  let markdownContent: string
  try {
    const jinaUrl = `https://r.jina.ai/${parsedUrl.toString()}`
    const response = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) {
      return NextResponse.json({ error: `Siteye ulaşılamadı (${response.status})` }, { status: 422 })
    }
    markdownContent = await response.text()
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Site yanıt vermedi (zaman aşımı)' }, { status: 422 })
    }
    return NextResponse.json({ error: 'Site içeriği çekilemedi' }, { status: 422 })
  }

  if (!markdownContent || markdownContent.trim().length < 100) {
    return NextResponse.json({ error: 'Site içeriği çok kısa veya boş' }, { status: 422 })
  }

  // Truncate to ~24k chars to stay within token limits
  const truncated = markdownContent.slice(0, 24000)

  // Extract KB items with GPT-4o-mini
  let suggestions: Array<{ title: string; description_for_ai: string; item_type: string }>
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SCRAPE_SYSTEM_PROMPT },
        { role: 'user', content: `Web sitesi URL: ${parsedUrl.origin}\n\n---\n\n${truncated}` },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]'

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    suggestions = JSON.parse(jsonStr)

    if (!Array.isArray(suggestions)) {
      return NextResponse.json({ error: 'AI geçersiz yanıt döndürdü' }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'İçerik analiz edilemedi: ' + (err?.message ?? 'bilinmeyen hata') }, { status: 500 })
  }

  // Sanitize & filter
  const valid = suggestions
    .filter(s => s?.title && s?.description_for_ai)
    .slice(0, 15)
    .map(s => ({
      title: String(s.title).slice(0, 100),
      description_for_ai: String(s.description_for_ai).slice(0, 2000),
      item_type: ['service', 'faq', 'pricing', 'team_member', 'policy', 'general'].includes(s.item_type)
        ? s.item_type
        : 'general',
    }))

  if (valid.length === 0) {
    return NextResponse.json({ error: 'Siteden anlamlı bilgi çıkarılamadı' }, { status: 422 })
  }

  return NextResponse.json({ suggestions: valid, source_url: parsedUrl.origin })
}
