import type { Lang } from '@/lib/i18n/messages';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Stage =
  | 'GREETING'
  | 'DISCOVERY'
  | 'TRUST_BUILDING'
  | 'APPOINTMENT_OFFER'
  | 'INFO_COLLECTION'
  | 'CLOSING'
  | 'NURTURING';

export type Timeline = 'hemen' | '1_hafta' | '1_ay' | '3_ay' | 'belirsiz';
export type BudgetAwareness = 'not_asked' | 'fiyat_sordu' | 'taksit_sordu' | 'butce_belirti';
export type Urgency = 'unknown' | 'low' | 'medium' | 'high';
export type EngagementLevel = 'unknown' | 'low' | 'medium' | 'high';
export type BuyingIntent = 'unknown' | 'just_browsing' | 'considering' | 'ready';

export interface CollectedData {
  name: string | null;
  interested_service: string | null;
  interested_service_key: string | null;
  pain_point: string | null;
  pain_point_duration: string | null;
  timeline: Timeline | null;
  previous_consultation: string | null;
  previous_procedure: string | null;
  budget_awareness: BudgetAwareness;
  referral_source: string | null;
  special_health_notes: string | null;
  preferred_consultation_type: string | null;
  preferred_day_time: string | null;
}

export interface LeadSignals {
  urgency: Urgency;
  engagement_level: EngagementLevel;
  buying_intent: BuyingIntent;
  objections_raised: string[];
  objections_resolved: string[];
}

export interface SessionState {
  currentStage: Stage;
  collectedData: CollectedData;
  leadSignals: LeadSignals;
  currentScore: number;
}

export interface AnalysisResult {
  currentStage: Stage;
  collectedData: CollectedData;
  leadSignals: LeadSignals;
  handoffRecommended: boolean;
  handoffReason: string | null;
  replyGuidance: string;
}

export interface ScoreResult {
  score: number;
  breakdown: Record<string, number>;
}

// ─── INITIAL STATE ────────────────────────────────────────────────────────────

export function initialSessionState(): SessionState {
  return {
    currentStage: 'GREETING',
    collectedData: {
      name: null,
      interested_service: null,
      interested_service_key: null,
      pain_point: null,
      pain_point_duration: null,
      timeline: null,
      previous_consultation: null,
      previous_procedure: null,
      budget_awareness: 'not_asked',
      referral_source: null,
      special_health_notes: null,
      preferred_consultation_type: null,
      preferred_day_time: null,
    },
    leadSignals: {
      urgency: 'unknown',
      engagement_level: 'unknown',
      buying_intent: 'unknown',
      objections_raised: [],
      objections_resolved: [],
    },
    currentScore: 0,
  };
}

// ─── ANALYSIS PROMPTS ─────────────────────────────────────────────────────────

export function buildAnalysisMessages(
  clinic: { name: string; clinic_type: string },
  services: { name: string; description?: string }[],
  faqs: { question: string; answer: string }[],
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  sessionState: SessionState,
  lang: Lang,
): { system: string; userContent: string } {
  const servicesShort = services.map(s => `- ${s.name}`).join('\n') || '(no services listed)';
  const historyText = history.map(m => `${m.role === 'user' ? 'Hasta' : 'Asistan'}: ${m.content}`).join('\n') || '(yok)';

  const systemTR = `Sen bir klinik konuşma analiz motorusun. Hasta mesajını analiz edip yapılandırılmış JSON verisi çıkar.

## KLİNİK
Ad: ${clinic.name}
Tür: ${clinic.clinic_type}

## HİZMETLER
${servicesShort}

## MEVCUT DURUM
Aşama: ${sessionState.currentStage}
ÖNCEKİ TOPLANAN VERİLER (BUNLARI ASLA SİLME!): ${JSON.stringify(sessionState.collectedData)}
Sinyaller: ${JSON.stringify(sessionState.leadSignals)}

## AŞAMA GEÇİŞ KURALLARI (ZORUNLU — ASLA GERİ GİTME)
Aşamalar sırasıyla ilerler: GREETING → DISCOVERY → TRUST_BUILDING → INFO_COLLECTION → CLOSING
Mevcut aşama: ${sessionState.currentStage} — current_stage bu aşamadan GERİYE dönemez.

- GREETING: Sadece konuşmanın ilk mesajı. Hasta herhangi bir hizmetten bahsettiyse → hemen DISCOVERY.
- DISCOVERY: Hasta ilgilendiği hizmeti/tedaviyi belirtti.
- TRUST_BUILDING: Hasta fiyat, detay, karşılaştırma soruyor; henüz randevu bilgisi vermediyse.
- INFO_COLLECTION: Hasta randevu için gün, saat, ad veya iletişim bilgisi verdi.
- CLOSING: Hasta hem spesifik GÜN hem spesifik SAAT verdi.
- NURTURING: Hasta açıkça hazır değil.

## SİNYAL SINIFLANDIRMA KURALLARI (ÇOK ÖNEMLİ)
- urgency = "high": "acil", "hemen", "bugün", "en kısa sürede" gibi ifadeler
- urgency = "medium": "yakında", "bu hafta", "önümüzdeki günler"
- urgency = "low"/"unknown": zaman belirtmedi

- buying_intent = "ready": Hasta spesifik GÜN verdi ("yarın", "çarşamba", "haftaya") VEYA spesifik SAAT verdi ("15:00", "sabah 10", "öğleden sonra") VEYA "gelmek istiyorum" / "randevu almak istiyorum" dedi
- buying_intent = "considering": Fiyat soruyor, bilgi topluyor, karşılaştırıyor
- buying_intent = "just_browsing": Sadece bakınıyor, şu an ilgilenmiyor

- engagement_level = "high": Detaylı anlatıyor, soru soruyor
- engagement_level = "low": Kısa tek kelimelik cevaplar
- engagement_level = "medium": Diğer durumlar

- budget_awareness = "fiyat_sordu": Fiyat, ücret, ödeme, taksit soruyor

- timeline enum (SADECE bu 5 değerden biri):
  * "hemen" → bugün, acil, en kısa sürede
  * "1_hafta" → bu hafta, haftaya, önümüzdeki hafta
  * "1_ay" → bu ay, yakında, 1-2 ay içinde
  * "3_ay" → 3 ay sonra, ileride
  * "belirsiz" → belirsiz veya belirtmedi

- handoff_recommended = true: buying_intent = "ready" ise VEYA hasta spesifik gün/saat verdiyse

## GÖREV
Yanıtın SADECE geçerli bir JSON nesnesi olmalı (markdown, açıklama, başka hiçbir şey ekleme):
{
  "metadata": {
    "current_stage": "GREETING|DISCOVERY|TRUST_BUILDING|APPOINTMENT_OFFER|INFO_COLLECTION|CLOSING|NURTURING",
    "collected_data": {
      "name": null, "interested_service": null, "interested_service_key": null,
      "pain_point": null, "pain_point_duration": null,
      "timeline": null, "previous_consultation": null, "previous_procedure": null,
      "budget_awareness": "not_asked", "referral_source": null,
      "special_health_notes": null, "preferred_consultation_type": null,
      "preferred_day_time": null
    },
    "lead_signals": {
      "urgency": "unknown", "engagement_level": "unknown",
      "buying_intent": "unknown", "objections_raised": [], "objections_resolved": []
    },
    "handoff_recommended": false,
    "handoff_reason": null
  },
  "reply_guidance": "Yanıt asistanı için 1-2 cümlelik yönlendirme"
}

KURAL: ÖNCEKİ TOPLANAN VERİLER içindeki dolu alanları ASLA null yapma!`;

  const systemEN = `You are a clinic conversation analysis engine. Output structured JSON data only.

## CLINIC
Name: ${clinic.name}
Type: ${clinic.clinic_type}

## SERVICES
${servicesShort}

## CURRENT STATE
Stage: ${sessionState.currentStage}
PREVIOUSLY COLLECTED DATA (NEVER DELETE THESE!): ${JSON.stringify(sessionState.collectedData)}
Signals: ${JSON.stringify(sessionState.leadSignals)}

## STAGE TRANSITION RULES (MANDATORY — NEVER GO BACKWARDS)
Stages progress in order: GREETING → DISCOVERY → TRUST_BUILDING → INFO_COLLECTION → CLOSING
Current stage: ${sessionState.currentStage} — current_stage CANNOT go back to a previous stage.

- GREETING: First message only. If patient mentioned any service → immediately DISCOVERY.
- DISCOVERY: Patient identified the service/treatment they're interested in.
- TRUST_BUILDING: Patient asking about price, details, comparisons; no appointment info yet.
- INFO_COLLECTION: Patient provided a day, time, name, or contact info for appointment.
- CLOSING: Patient provided both a specific DAY and a specific TIME.
- NURTURING: Patient explicitly not ready.

## SIGNAL CLASSIFICATION RULES (VERY IMPORTANT)
- urgency = "high": "urgent", "immediately", "today", "asap"
- urgency = "medium": "soon", "this week", "in the coming days"
- urgency = "low"/"unknown": no time reference

- buying_intent = "ready": Patient gave a specific DAY ("tomorrow", "Wednesday", "next week") OR a specific TIME ("3pm", "15:00", "morning") OR said "I'd like to come in" / "I want to book"
- buying_intent = "considering": Asking questions, gathering info, comparing
- buying_intent = "just_browsing": Just looking, not ready

- engagement_level = "high": Detailed descriptions, asking questions
- engagement_level = "low": Short one-word answers
- engagement_level = "medium": Everything else

- budget_awareness = "fiyat_sordu": Asking about price, cost, payment

- timeline enum (ONLY these 5 values):
  * "hemen" → today, ASAP, immediately
  * "1_hafta" → this week, next week
  * "1_ay" → this month, within 1-2 months
  * "3_ay" → in 3 months, later
  * "belirsiz" → unspecified or unclear

- handoff_recommended = true: if buying_intent = "ready" OR patient gave specific day/time

## TASK
Your response MUST be a valid JSON object only (no markdown, no explanation, nothing else):
{
  "metadata": {
    "current_stage": "GREETING|DISCOVERY|TRUST_BUILDING|APPOINTMENT_OFFER|INFO_COLLECTION|CLOSING|NURTURING",
    "collected_data": {
      "name": null, "interested_service": null, "interested_service_key": null,
      "pain_point": null, "pain_point_duration": null,
      "timeline": null, "previous_consultation": null, "previous_procedure": null,
      "budget_awareness": "not_asked", "referral_source": null,
      "special_health_notes": null, "preferred_consultation_type": null,
      "preferred_day_time": null
    },
    "lead_signals": {
      "urgency": "unknown", "engagement_level": "unknown",
      "buying_intent": "unknown", "objections_raised": [], "objections_resolved": []
    },
    "handoff_recommended": false,
    "handoff_reason": null
  },
  "reply_guidance": "1-2 sentence guidance for the reply assistant"
}

RULE: NEVER set previously non-null collected data to null.`;

  const system = lang === 'en' ? systemEN : systemTR;
  const userContent = `Hasta mesajı: "${userMessage}"\n\nKonuşma geçmişi:\n${historyText}`;

  return { system, userContent };
}

// ─── REPLY PROMPTS ────────────────────────────────────────────────────────────

export function buildReplySystemPrompt(
  clinic: {
    name: string;
    clinic_type: string;
    address?: string;
    district?: string;
    city?: string;
    phone?: string;
    working_hours?: any;
    parking_info?: string;
    lead_doctor_name?: string;
    lead_doctor_title?: string;
  },
  services: { name: string; description?: string; price_range?: string }[],
  faqs: { question: string; answer: string }[],
  lang: Lang,
): string {
  const servicesText = services
    .map(s => `- ${s.name}${s.description ? `: ${s.description}` : ''}${s.price_range ? ` (${s.price_range})` : ''}`)
    .join('\n') || '(no services listed)';

  const faqsText = faqs
    .map(f => `S: ${f.question}\nC: ${f.answer}`)
    .join('\n\n') || '(no FAQs)';

  if (lang === 'en') {
    return `You are the WhatsApp assistant for ${clinic.name} clinic. You greet patients, provide information and guide them towards a consultation appointment.

## CLINIC PROFILE
Name: ${clinic.name}
Type: ${clinic.clinic_type}
Address: ${[clinic.address, clinic.district, clinic.city].filter(Boolean).join(', ') || 'Not specified'}
Phone: ${clinic.phone || 'Not specified'}
Working Hours: ${clinic.working_hours ? JSON.stringify(clinic.working_hours) : 'Not specified'}
Parking: ${clinic.parking_info || 'No information available'}
Lead Doctor: ${[clinic.lead_doctor_name, clinic.lead_doctor_title].filter(Boolean).join(', ') || 'Not specified'}

## SERVICES
${servicesText}

## FREQUENTLY ASKED QUESTIONS
${faqsText}

## CONVERSATION RULES
1. Ask ONLY 1 question per message.
2. Keep responses to 2-4 sentences but do provide information. Avoid robotic-sounding language.
3. NEVER greet with "Hello" or "Welcome" in every message — only in the very first message.
4. USE YOUR MEMORY: If the patient's area of interest is already established, when they request an appointment NEVER ask "Which treatment are you interested in?" again. Directly ask for a suitable day and time.
5. Never make medical diagnoses or give guarantees.
6. Never disparage competitor clinics.
7. If asked about pricing, explain that costs are personalised and guide them towards a free consultation.
8. Respond in the same language the patient is writing in. Default to British English if unclear.`;
  }

  return `Sen ${clinic.name} kliniğinin WhatsApp asistanısın. Hastaları karşılıyor, bilgilendiriyor ve ön görüşme randevusuna yönlendiriyorsun.

## KLİNİK PROFİLİ
Ad: ${clinic.name}
Tür: ${clinic.clinic_type}
Adres: ${[clinic.address, clinic.district, clinic.city].filter(Boolean).join(', ') || 'Belirtilmemiş'}
Telefon: ${clinic.phone || 'Belirtilmemiş'}
Çalışma Saatleri: ${clinic.working_hours ? JSON.stringify(clinic.working_hours) : 'Belirtilmemiş'}
Otopark: ${clinic.parking_info || 'Bilgi yok'}
Baş Doktor: ${[clinic.lead_doctor_name, clinic.lead_doctor_title].filter(Boolean).join(', ') || 'Belirtilmemiş'}

## HİZMETLER
${servicesText}

## SIK SORULAN SORULAR
${faqsText}

## KONUŞMA KURALLARI
1. Her mesajda SADECE 1 soru sor.
2. Yanıtların 2-4 cümle olsun ancak bilgi vermekten kaçınma. Robotik konuşma.
3. KESİNLİKLE her mesajda "Merhaba" veya "Hoş geldiniz" DEME. Sadece ilk mesajda selam ver.
4. HAFIZANI KULLAN: Konuşma geçmişinde hastanın ilgilendiği işlem belli olduysa, randevu istediğinde ASLA "Hangi işlemle ilgileniyorsunuz?" diye TEKRAR SORMA. Doğrudan o işlem için gün ve saat sor.
5. Asla tıbbi teşhis koyma, garanti verme.
6. Rakip klinik kötüleme.
7. Fiyat sorulursa kişiye özel olduğunu belirt, ön görüşmeye yönlendir.`;
}

// ─── SCORING LOGIC (ported from WF1 Parse AI + Score node) ──────────────────

export function calculateScore(
  collectedData: CollectedData,
  leadSignals: LeadSignals,
): ScoreResult {
  const cd = collectedData;
  const ls = leadSignals;
  let score = 0;
  const breakdown: Record<string, number> = {};

  // Service interest: +10
  if (cd.interested_service) {
    score += 10;
    breakdown.service = 10;
  }

  // Pain point: +10 detailed, +5 basic
  if (cd.pain_point && cd.pain_point.length > 20) {
    score += 10;
    breakdown.pain_detailed = 10;
  } else if (cd.pain_point) {
    score += 5;
    breakdown.pain_basic = 5;
  }

  // Timeline
  const tScores: Record<string, number> = {
    hemen: 20,
    '1_hafta': 15,
    '1_ay': 8,
    '3_ay': 3,
    belirsiz: 0,
  };
  if (cd.timeline) {
    const ts = tScores[cd.timeline] !== undefined ? tScores[cd.timeline] : 15;
    score += ts;
    breakdown.timeline = ts;
  }

  // Previous consultation
  if (cd.previous_consultation === 'baska_klinik') {
    score += 10;
    breakdown.researched = 10;
  }
  if (cd.previous_consultation === 'ameliyat_olmus') {
    score += 12;
    breakdown.revision = 12;
  }

  // Budget awareness: +8
  if (['fiyat_sordu', 'taksit_sordu', 'butce_belirti'].includes(cd.budget_awareness)) {
    score += 8;
    breakdown.budget = 8;
  }

  // Consultation preference: +10
  if (cd.preferred_consultation_type) {
    score += 10;
    breakdown.consult_pref = 10;
  }

  // Appointment interest: +15
  if (cd.preferred_day_time) {
    score += 15;
    breakdown.appt_interest = 15;
  }

  // Engagement: +8 high, +4 medium
  if (ls.engagement_level === 'high') {
    score += 8;
    breakdown.high_eng = 8;
  } else if (ls.engagement_level === 'medium') {
    score += 4;
    breakdown.med_eng = 4;
  }

  // Buying intent
  if (ls.buying_intent === 'ready') {
    score += 15;
    breakdown.ready = 15;
  } else if (ls.buying_intent === 'considering') {
    score += 8;
    breakdown.considering = 8;
  } else if (ls.buying_intent === 'just_browsing') {
    score -= 5;
    breakdown.browsing = -5;
  }

  // Urgency: +7
  if (ls.urgency === 'high') {
    score += 7;
    breakdown.urgency = 7;
  }

  // Clamp 0–100
  score = Math.max(0, Math.min(100, score));

  return { score, breakdown };
}
