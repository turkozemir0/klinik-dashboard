// WasenderAPI AI Message Generator
// OpenAI gpt-4o-mini ile scenario-bazlı, çok dilli WhatsApp mesaj üretimi

export type WaScenario =
  | 'first_contact'
  | 'followup'
  | 'appointment_confirm'
  | 'appointment_reminder'
  | 'satisfaction_survey'
  | 'reactivation'
  | 'payment_followup'
  | 'call_fallback'

export interface MessageGeneratorInput {
  scenario: WaScenario
  language: string               // ISO 639-1: 'tr', 'en', 'de', 'ar', 'ru', ...
  contact_data: {
    name?: string
    appointment_time?: string
    attempt?: number
    [key: string]: any
  }
  org: {
    name: string
    sector?: string
    ai_persona?: {
      name?: string
      tone?: string
      language?: string
    }
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  tr: 'Turkish',
  en: 'English',
  de: 'German',
  ar: 'Arabic',
  ru: 'Russian',
  fr: 'French',
  es: 'Spanish',
  nl: 'Dutch',
  it: 'Italian',
  pt: 'Portuguese',
}

const SCENARIO_PROMPTS: Record<WaScenario, string> = {
  first_contact:
    'Write a warm welcome message to {name} who just showed interest. Short, friendly, not salesy. Ask one easy question to start conversation.',
  followup:
    'Write a gentle follow-up message to {name} (attempt #{attempt}). Ask an easy-to-answer question. Be understanding, not pushy.',
  appointment_confirm:
    'Write an appointment confirmation message to {name}. Appointment: {appointment_time}. Ask them to confirm.',
  appointment_reminder:
    'Write a short appointment reminder to {name}. Appointment: {appointment_time}. Keep it brief and friendly.',
  satisfaction_survey:
    'Write a short post-visit satisfaction message to {name}. Ask how their visit went and request a rating from 1-5.',
  reactivation:
    'Write a warm message to {name} who hasn\'t been in touch for a while. Not pushy. Show genuine interest in their wellbeing.',
  payment_followup:
    'Write a polite payment reminder to {name}. Offer payment plan options. Be understanding and respectful.',
  call_fallback:
    'Write a message to {name} saying you tried to call but couldn\'t reach them. Offer alternative contact methods.',
}

// Statik fallback mesajları — OpenAI hata verirse kullanılır
const FALLBACK_MESSAGES: Record<WaScenario, Record<string, string>> = {
  first_contact: {
    tr: 'Merhaba {name}, ilginiz için teşekkürler! Size nasıl yardımcı olabiliriz?',
    en: 'Hi {name}, thank you for your interest! How can we help you?',
    de: 'Hallo {name}, vielen Dank für Ihr Interesse! Wie können wir Ihnen helfen?',
  },
  followup: {
    tr: 'Merhaba {name}, mesajımızı görebildiniz mi? Herhangi bir sorunuz varsa yardımcı olmaktan memnuniyet duyarız.',
    en: 'Hi {name}, did you get a chance to see our message? We\'d be happy to help with any questions.',
    de: 'Hallo {name}, konnten Sie unsere Nachricht sehen? Wir helfen Ihnen gerne bei Fragen.',
  },
  appointment_confirm: {
    tr: 'Merhaba {name}, {appointment_time} tarihli randevunuzu onaylar mısınız?',
    en: 'Hi {name}, can you confirm your appointment on {appointment_time}?',
    de: 'Hallo {name}, können Sie Ihren Termin am {appointment_time} bestätigen?',
  },
  appointment_reminder: {
    tr: 'Merhaba {name}, randevunuz yaklaşıyor: {appointment_time}. Sizi bekliyoruz!',
    en: 'Hi {name}, a reminder about your appointment: {appointment_time}. See you soon!',
    de: 'Hallo {name}, eine Erinnerung an Ihren Termin: {appointment_time}. Bis bald!',
  },
  satisfaction_survey: {
    tr: 'Merhaba {name}, ziyaretiniz nasıl geçti? 1-5 arası puanlayabilir misiniz?',
    en: 'Hi {name}, how was your visit? Could you rate it from 1-5?',
    de: 'Hallo {name}, wie war Ihr Besuch? Können Sie ihn von 1-5 bewerten?',
  },
  reactivation: {
    tr: 'Merhaba {name}, sizi uzun süredir göremedik. Nasılsınız? Size yardımcı olabileceğimiz bir konu var mı?',
    en: 'Hi {name}, it\'s been a while! How are you? Is there anything we can help with?',
    de: 'Hallo {name}, es ist eine Weile her! Wie geht es Ihnen? Können wir Ihnen bei etwas helfen?',
  },
  payment_followup: {
    tr: 'Merhaba {name}, ödemeniz hakkında hatırlatma yapmak istedik. Ödeme planı oluşturabiliriz, detaylar için bize yazın.',
    en: 'Hi {name}, a gentle reminder about your payment. We can arrange a payment plan — reach out for details.',
    de: 'Hallo {name}, eine freundliche Erinnerung an Ihre Zahlung. Wir können einen Zahlungsplan erstellen.',
  },
  call_fallback: {
    tr: 'Merhaba {name}, sizi telefonla aradık ama ulaşamadık. Size uygun bir zamanda dönebilir misiniz?',
    en: 'Hi {name}, we tried to call but couldn\'t reach you. Could you get back to us at a convenient time?',
    de: 'Hallo {name}, wir haben versucht Sie anzurufen. Können Sie uns zu einem passenden Zeitpunkt zurückrufen?',
  },
}

function interpolate(text: string, vars: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key]
    return val != null ? String(val) : ''
  })
}

function getFallback(scenario: WaScenario, language: string, vars: Record<string, any>): string {
  const msgs = FALLBACK_MESSAGES[scenario]
  const template = msgs[language] ?? msgs['en'] ?? msgs['tr']
  return interpolate(template, vars)
}

export async function generateMessage(input: MessageGeneratorInput): Promise<string> {
  const { scenario, language, contact_data, org } = input

  const vars: Record<string, any> = {
    name: contact_data.name || '',
    appointment_time: contact_data.appointment_time || '',
    attempt: contact_data.attempt ?? 1,
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[wa-message-generator] OPENAI_API_KEY not set, using fallback')
    return getFallback(scenario, language, vars)
  }

  const personaName = org.ai_persona?.name || 'Asistan'
  const personaTone = org.ai_persona?.tone || 'friendly, professional'
  const languageName = LANGUAGE_NAMES[language] || language
  const sectorLabel = org.sector || 'business'

  const scenarioPrompt = interpolate(SCENARIO_PROMPTS[scenario], vars)

  const systemPrompt = [
    `You are writing a WhatsApp message for ${org.name} (${sectorLabel}).`,
    `Persona: ${personaName}, tone: ${personaTone}.`,
    `Write in ${languageName}.`,
    'Rules: 2-3 sentences max, under 300 chars. Natural, human-sounding.',
    "Use contact's name naturally. One clear purpose per message.",
    'No links, emojis, markdown. Plain text only.',
    'Do NOT include any greeting formula like "Dear" — use a casual approach.',
  ].join('\n')

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: scenarioPrompt },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      console.error('[wa-message-generator] OpenAI error:', res.status, await res.text())
      return getFallback(scenario, language, vars)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return getFallback(scenario, language, vars)
    }

    // Ensure max 300 chars
    return content.length > 300 ? content.slice(0, 297) + '...' : content
  } catch (err) {
    console.error('[wa-message-generator] generateMessage failed:', err)
    return getFallback(scenario, language, vars)
  }
}

/** Resolve language: contact preferred → org default → persona language → 'tr' */
export function resolveLanguage(
  contactData: Record<string, any>,
  org: { default_language?: string; ai_persona?: { language?: string } }
): string {
  return (
    contactData.preferred_language ||
    org.default_language ||
    org.ai_persona?.language ||
    'tr'
  )
}
