import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function GET(req: NextRequest) {
  try {
    const clinicId = process.env.DEMO_CLINIC_ID;
    if (!clinicId) {
      return NextResponse.json({ error: 'DEMO_CLINIC_ID missing' }, { status: 500 });
    }

    // Son 10 dakika içindeki en yeni demo aramasını getir
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: call, error } = await supabase
      .from('voice_calls')
      .select('id, duration_seconds, transcript, started_at, direction')
      .eq('clinic_id', clinicId)
      .gte('started_at', since)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !call) {
      return NextResponse.json({ ready: false }, { status: 200 });
    }

    if (!call.transcript || call.transcript.trim().length < 50) {
      return NextResponse.json({ ready: false }, { status: 200 });
    }

    // GPT ile özet çıkar
    const lang = detectLang(call.transcript);

    const systemPrompt = lang === 'en'
      ? `You are extracting structured information from a voice call transcript between a clinic receptionist AI and a patient.
Return ONLY valid JSON with these fields:
{
  "name": "caller's name or null",
  "phone": "phone number mentioned or null",
  "interested_service": "main service they asked about or null",
  "key_questions": ["up to 3 main questions they asked"],
  "next_step": "what was agreed as next step or null",
  "sentiment": "positive | neutral | negative"
}
Use null for fields not mentioned. Be concise.`
      : `Bir klinik resepsiyonist AI ile hasta arasındaki sesli görüşme transkriptinden yapılandırılmış bilgi çıkarıyorsun.
SADECE geçerli JSON döndür:
{
  "name": "arayanın adı veya null",
  "phone": "belirtilen telefon numarası veya null",
  "interested_service": "ilgilendiği ana hizmet veya null",
  "key_questions": ["sordukları en fazla 3 ana soru"],
  "next_step": "bir sonraki adım olarak ne kararlaştırıldı veya null",
  "sentiment": "positive | neutral | negative"
}
Belirtilmeyen alanlar için null kullan. Kısa ve öz ol.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript:\n${call.transcript.slice(0, 3000)}` },
      ],
    });

    const raw = resp.choices[0]?.message?.content ?? '{}';
    const extracted = JSON.parse(raw);

    return NextResponse.json({
      ready: true,
      duration: call.duration_seconds,
      lang,
      ...extracted,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[call-summary]', msg);
    return NextResponse.json({ ready: false }, { status: 200 });
  }
}

function detectLang(transcript: string): 'tr' | 'en' {
  const trWords = /\b(merhaba|evet|hayır|teşekkür|randevu|hizmet|fiyat|nasıl|için)\b/i;
  return trWords.test(transcript) ? 'tr' : 'en';
}
