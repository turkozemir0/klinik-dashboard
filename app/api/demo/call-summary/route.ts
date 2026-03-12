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

    const JSON_SCHEMA = `{
  "name": "caller name or null",
  "phone": "phone number or null",
  "interested_service": "service they asked about or null",
  "key_questions": ["up to 3 main questions asked"],
  "next_step": "next step agreed or null",
  "sentiment": "positive | neutral | negative"
}`;

    const systemPromptMap: Record<string, string> = {
      en: `Extract structured info from this clinic receptionist AI + patient voice call transcript.
Return ONLY valid JSON:
${JSON_SCHEMA}
Null for fields not mentioned. Be concise.`,
      de: `Extrahiere strukturierte Informationen aus diesem Transkript eines KI-Rezeptionisten + Patienten.
Gib NUR gültiges JSON zurück:
${JSON_SCHEMA}
Null für nicht erwähnte Felder. Sei präzise.`,
      ar: `استخرج المعلومات المنظمة من نص هذه المكالمة بين موظف الاستقبال الذكي والمريض.
أعد JSON صحيحاً فقط:
${JSON_SCHEMA}
Null للحقول غير المذكورة. كن موجزاً.`,
    };

    const systemPrompt = systemPromptMap[lang] ?? systemPromptMap['en'];

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
