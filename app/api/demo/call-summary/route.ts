import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface TranscriptItem {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, lang = 'tr' }: { transcript: TranscriptItem[]; lang: string } = await req.json();

    if (!transcript || transcript.length < 2) {
      return NextResponse.json({ ready: false });
    }

    const transcriptText = transcript
      .map(m => `[${m.role}] ${m.content}`)
      .join('\n');

    const systemPrompt = lang === 'en'
      ? `Extract structured info from this clinic receptionist AI + patient voice call transcript.
Return ONLY valid JSON:
{
  "name": "caller name or null",
  "phone": "phone number or null",
  "interested_service": "service they asked about or null",
  "key_questions": ["up to 3 main questions asked"],
  "next_step": "next step agreed or null",
  "sentiment": "positive | neutral | negative"
}
Null for fields not mentioned. Be concise.`
      : `Klinik AI resepsiyonist + hasta sesli görüşme transkriptinden bilgi çıkar.
SADECE geçerli JSON döndür:
{
  "name": "arayanın adı veya null",
  "phone": "telefon numarası veya null",
  "interested_service": "ilgilenilen hizmet veya null",
  "key_questions": ["en fazla 3 ana soru"],
  "next_step": "kararlaştırılan sonraki adım veya null",
  "sentiment": "positive | neutral | negative"
}
Belirtilmeyenler için null. Kısa ol.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 350,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript:\n${transcriptText.slice(0, 3000)}` },
      ],
    });

    const extracted = JSON.parse(resp.choices[0]?.message?.content ?? '{}');
    return NextResponse.json({ ready: true, ...extracted });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[call-summary]', msg);
    return NextResponse.json({ ready: false });
  }
}
