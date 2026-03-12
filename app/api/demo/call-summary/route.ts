import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface TranscriptItem {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, lang = 'en' }: { transcript: TranscriptItem[]; lang: string } = await req.json();

    if (!transcript || transcript.length < 2) {
      return NextResponse.json({ ready: false });
    }

    const transcriptText = transcript
      .map(m => `[${m.role}] ${m.content}`)
      .join('\n');

    const JSON_SCHEMA = `{
  "name": "caller name or null",
  "phone": "phone number or null",
  "interested_service": "service they asked about or null",
  "lead_score": <integer 1-10, based on: interest level, urgency, budget signals, decision readiness>,
  "lead_score_reason": "1-sentence explanation of the score",
  "buying_signals": ["list of positive signals detected, e.g. asked about price, mentioned specific date, said yes to appointment"],
  "objections": ["list of hesitations or blockers mentioned"],
  "next_step": "next step agreed during the call or null",
  "sales_action": "concrete action the sales team should take next, e.g. 'Call back within 24h — high intent, price was the only concern'",
  "sentiment": "positive | neutral | negative"
}`;

    const systemPromptMap: Record<string, string> = {
      en: `You are a sales analyst. Extract structured lead intelligence from this clinic AI receptionist + patient call transcript.
Return ONLY valid JSON — no markdown, no explanation:
${JSON_SCHEMA}
Null for fields not mentioned. Lead score: 1 = cold/not interested, 10 = hot/ready to book.`,
      de: `Sie sind ein Vertriebsanalyst. Extrahieren Sie strukturierte Lead-Informationen aus diesem Transkript.
Geben Sie NUR gültiges JSON zurück:
${JSON_SCHEMA}
Null für nicht erwähnte Felder. Lead-Score: 1 = kalt/kein Interesse, 10 = heiß/buchungsbereit.`,
      ar: `أنت محلل مبيعات. استخرج معلومات العميل المحتمل من نص المكالمة.
أعد JSON صحيحاً فقط:
${JSON_SCHEMA}
Null للحقول غير المذكورة. نقاط العميل: 1 = بارد, 10 = جاهز للحجز.`,
      tr: `Satış analisti olarak bu klinik AI görüşme transkriptinden lead bilgilerini çıkar.
SADECE geçerli JSON döndür:
${JSON_SCHEMA}
Null belirtilmeyenler için. Lead skoru: 1 = soğuk/ilgisiz, 10 = sıcak/randevuya hazır.`,
    };

    const systemPrompt = systemPromptMap[lang] ?? systemPromptMap['en'];

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
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
