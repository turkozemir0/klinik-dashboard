import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { item_type, title, data, field_name, field_label } = await request.json()

  const dataStr = Object.entries(data || {})
    .filter(([, v]) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('\n')

  let prompt: string

  if (!field_name || field_name === '__tags__') {
    // Main tags field: semantic retrieval tags for the whole item
    prompt = `Aşağıdaki bilgi bankası kaydı için arama ve retrieval kalitesini artıracak kısa, alakalı etiketler öner. 5-8 etiket ver, Türkçe veya uygun dilde, virgülle ayrılmış.

Tip: ${item_type}
Başlık: ${title || ''}
${dataStr}

Sadece etiketleri virgülle ayırarak yaz, başka hiçbir şey ekleme. Örnek: etiket1, etiket2, etiket3`
  } else {
    // Specific schema field: suggest values for that field
    prompt = `Aşağıdaki bilgi bankası kaydının "${field_label || field_name}" alanı için uygun değerler öner. 3-6 değer ver, virgülle ayrılmış.

Tip: ${item_type}
Başlık: ${title || ''}
${dataStr}
Alan: ${field_label || field_name}

Sadece değerleri virgülle ayırarak yaz, başka hiçbir şey ekleme.`
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.choices[0]?.message?.content?.trim() ?? ''
  const tags = raw.split(',').map((s: string) => s.trim()).filter(Boolean)

  return NextResponse.json({ tags })
}
