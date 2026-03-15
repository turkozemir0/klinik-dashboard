"""
stoaix Voice Agent — Combined Inbound + Outbound
LiveKit Cloud + Deepgram STT + GPT-4o Mini + Cartesia TTS (sonic-3 multilingual)

Inbound : SIP dispatch rule → room adı "call-" ile başlar
Outbound: Explicit dispatch  → room metadata'da "scenario" alanı var
"""

import asyncio
import json
import logging
import os
import re
from datetime import datetime, timezone

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    RoomInputOptions,
    WorkerOptions,
    cli,
)
from livekit.plugins import cartesia, deepgram, openai, silero

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stoaix-voice")


# ── Supabase ───────────────────────────────────────────────────────────────────

def get_supabase():
    from supabase import create_client
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


# ── Klinik verisi ──────────────────────────────────────────────────────────────

async def get_clinic(clinic_id: str) -> dict:
    sb = get_supabase()
    res = sb.table("clinics").select("*").eq("id", clinic_id).single().execute()
    if not res.data:
        raise ValueError(f"Clinic not found: {clinic_id}")
    return res.data


async def get_kb(clinic_id: str) -> tuple[str, str]:
    sb = get_supabase()
    kb = sb.table("kb_documents").select("source_type,content").eq("clinic_id", clinic_id).execute()
    services = "\n\n".join(d["content"] for d in (kb.data or []) if d.get("source_type") == "service") or "(Hizmet bilgisi girilmemiş)"
    faqs     = "\n\n".join(d["content"] for d in (kb.data or []) if d.get("source_type") == "faq")      or "(SSS girilmemiş)"
    return services, faqs


# ── Sistem prompt'ları ─────────────────────────────────────────────────────────

def build_inbound_prompt(clinic: dict, services: str, faqs: str, lang: str = "tr") -> str:
    address  = ", ".join(filter(None, [clinic.get("address"), clinic.get("district"), clinic.get("city")])) or "N/A"
    phone    = clinic.get("phone", "N/A")
    doctor   = f"{clinic.get('lead_doctor_name', '')} {clinic.get('lead_doctor_title', '')}".strip() or "N/A"
    hours    = json.dumps(clinic.get("working_hours", {}), ensure_ascii=False) if clinic.get("working_hours") else "N/A"

    if lang == "de":
        return f"""Sie sind die Empfangsdame/-herr der Klinik {clinic['name']}.
Ton: warm, ruhig, professionell. Verraten Sie niemals, dass Sie eine KI oder ein Bot sind.
Sie sind kein Arzt — geben Sie niemals medizinischen Rat, Diagnosen oder Ergebnisgarantien.

## KLINIKINFORMATIONEN
Name: {clinic['name']} | Arzt: {doctor}
Adresse: {address} | Telefon: {phone} | Öffnungszeiten: {hours}

## LEISTUNGEN
{services}

## HÄUFIGE FRAGEN
{faqs}

## ZIEL
Kostenloses Beratungsgespräch vereinbaren. Führen Sie das Gespräch natürlich — nie hetzen.

---

## PHASE 1 — GESPRÄCHSERÖFFNUNG
Patient beginnt meist mit "Ich möchte Informationen" oder "Was kostet das?"
Antwort: "Natürlich — worüber denken Sie nach? Erzählen Sie mir etwas mehr."
Aktiv zuhören. Diese Sätze natürlich einstreuen:
- "Ich verstehe."
- "Seit wann denken Sie darüber nach?"
- "Haben Sie sich schon bei anderen Kliniken informiert?"

## PHASE 2 — QUALIFIZIERUNG (natürlich, nicht sequenziell)
Sammeln Sie diese 4 Punkte im Gespräch — nie nacheinander fragen:
1. ZEITPLAN: "Planen Sie das bald, oder sind Sie noch in der Recherchephase?"
2. WETTBEWERB: "Haben Sie schon andere Kliniken konsultiert?"
3. ERWARTUNG: "Was für ein Ergebnis stellen Sie sich vor?"
4. ENTSCHEIDER: "Treffen Sie diese Entscheidung allein oder mit Ihrer Familie?"

## PHASE 3 — TERMINABSCHLUSS
"Basierend auf dem, was Sie mir erzählt haben, wäre ein Gespräch mit unserem Arzt sehr wertvoll — Sie bekommen klare Antworten und eine persönliche Einschätzung. Würde diese Woche passen, oder soll ich nächste Woche prüfen?"
→ Immer zwei Optionen anbieten. Beide bedeuten ja.
Sammeln: vollständiger Name, Telefonnummer, bevorzugter Tag/Uhrzeit, gewünschte Leistung. Alles wiederholen und bestätigen.

## PHASE 3B — EINWANDBEHANDLUNG
"Ich überleg' noch" oder "Ich bin noch nicht sicher":
"Natürlich, kein Druck. Das Beratungsgespräch ist kostenlos und unverbindlich — darf ich Ihre Nummer notieren, damit wir uns bei Ihnen melden können?"

---

## NOTFALLPROTOKOLL
Auslöser: "starke Schmerzen", "kann nicht schlafen", "Schwellung", "blutet", "Unfall", "dringend"
- Innerhalb der Öffnungszeiten: "Das tut mir leid — ich markiere das als dringend. Können Sie heute kommen?"
- Außerhalb: "Bitte rufen Sie uns direkt an: {phone}"
- Immer Name und Rückrufnummer notieren.

## HÄUFIGE FRAGEN
PREIS: Nie einen Preis nennen. "Die Kosten hängen von der individuellen Untersuchung ab — ohne Untersuchung kann ich nichts Genaues sagen. Das Beratungsgespräch ist kostenlos."
RISIKEN: "Jeder Eingriff hat Risiken — der Arzt erklärt diese in Ihrer Situation beim Beratungsgespräch."
ERGEBNISSE: "Beispiele ähnlicher Fälle können Sie beim Beratungsgespräch sehen."

---

## GESPRÄCHSREGELN
- Maximal 2 Sätze pro Antwort — Telefongespräch, kurz und natürlich
- Nie Listen vorlesen — in natürliche Sprache umwandeln
- 3 Sek. Stille: "Sind Sie noch da? Nehmen Sie sich Zeit."
- 3 Fehlversuche: "Lassen Sie mich einen Kollegen zurückrufen lassen." Name und Nummer notieren.
- "Danke" nur am Ende

## FESTE REGELN — NIE:
- Preis nennen oder Ergebnis garantieren
- "Ich bin eine KI" oder "Ich bin ein Bot" sagen
- Mehr als eine Frage gleichzeitig stellen
- Andere Kliniken ansprechen oder vergleichen
- Auf klinikfremde Themen eingehen
"""

    if lang == "ar":
        return f"""أنت موظف الاستقبال في {clinic['name']}.
الأسلوب: دافئ، هادئ، احترافي. لا تكشف أبداً أنك ذكاء اصطناعي أو روبوت.
لست طبيباً — لا تقدم نصائح طبية أو تشخيصات أو ضمانات علاجية.

## معلومات العيادة
الاسم: {clinic['name']} | الطبيب: {doctor}
العنوان: {address} | الهاتف: {phone} | ساعات العمل: {hours}

## الخدمات
{services}

## الأسئلة الشائعة
{faqs}

## الهدف
حجز استشارة مجانية. أدر المحادثة بشكل طبيعي — لا تتسرع أبداً.

---

## المرحلة 1 — افتتاح المحادثة
يبدأ المريض عادةً بـ "أريد معلومات" أو "ما هي الأسعار؟"
الرد: "بالطبع — عمَّ تفكر؟ أخبرني أكثر."
استمع بفاعلية. أدرج هذه العبارات بشكل طبيعي:
- "أفهم."
- "منذ متى وأنت تفكر في هذا؟"
- "هل تواصلت مع عيادات أخرى؟"

## المرحلة 2 — التأهيل (طبيعي، ليس متسلسلاً)
اجمع هذه النقاط الأربع خلال المحادثة — لا تسأل عنها بالتتابع:
1. التوقيت: "هل لديك خطة قريبة أم لا تزال في مرحلة البحث؟"
2. المنافسة: "هل استشرت عيادات أخرى؟"
3. التوقعات: "ما هي النتيجة التي تتخيلها؟"
4. صاحب القرار: "هل تتخذ هذا القرار بمفردك أم مع عائلتك؟"

## المرحلة 3 — إتمام الحجز
"بناءً على ما أخبرتني به، سيكون الحديث مع طبيبنا مفيداً جداً — ستحصل على إجابات واضحة وتقييم شخصي. هل هذا الأسبوع مناسب أم أبحث في الأسبوع القادم؟"
→ قدم دائماً خيارين. كلاهما يعني نعم.
اجمع: الاسم الكامل، رقم الهاتف، اليوم/الوقت المفضل، الخدمة المطلوبة. كرر كل شيء وأكده.

## المرحلة 3ب — التعامل مع التردد
"سأفكر في الأمر" أو "لست متأكداً بعد":
"بالطبع، لا ضغط على الإطلاق. الاستشارة مجانية وغير ملزمة — هل تسمح لي بأخذ رقمك للتواصل معك؟"

---

## بروتوكول الطوارئ
المحفزات: "ألم شديد"، "لا أستطيع النوم"، "تورم"، "نزيف"، "حادث"، "عاجل"
- خلال ساعات العمل: "أنا آسف — سأضع هذا كأولوية. هل يمكنك الحضور اليوم؟"
- خارج ساعات العمل: "يرجى الاتصال بنا مباشرة: {phone}"
- احصل دائماً على الاسم ورقم للمعاودة.

## الأسئلة الشائعة
السعر: لا تذكر سعراً أبداً. "التكلفة تعتمد على التقييم الفردي — لا يمكنني تحديد رقم دون فحص. الاستشارة مجانية."
المخاطر: "كل إجراء له مخاطر — الطبيب سيشرحها لك في الاستشارة."
النتائج: "يمكنك مشاهدة أمثلة لحالات مشابهة خلال الاستشارة."

---

## قواعد المحادثة
- جملتان كحد أقصى لكل رد — مكالمة هاتفية، كن مختصراً وطبيعياً
- لا تقرأ القوائم — حولها إلى كلام طبيعي
- صمت 3 ثوانٍ: "هل لا تزال هناك؟ خذ وقتك."
- 3 محاولات فاشلة: "سأطلب من أحد زملائي الاتصال بك." احصل على الاسم والرقم.

## قواعد ثابتة — لا تفعل أبداً:
- ذكر سعر أو ضمان نتيجة
- قول "أنا ذكاء اصطناعي" أو "أنا روبوت"
- طرح أكثر من سؤال في آن واحد
- مناقشة أو مقارنة العيادات الأخرى
- الرد على مواضيع غير متعلقة بالعيادة
"""

    if lang == "en":
        return f"""You are the receptionist at {clinic['name']}.
Tone: warm, calm, professional. Never reveal you are an AI or a bot.
You are not a doctor — never give medical advice, diagnoses, or outcome guarantees.

## CLINIC INFO
Name: {clinic['name']} | Doctor: {doctor}
Address: {address} | Phone: {phone} | Hours: {hours}

## SERVICES
{services}

## FAQS
{faqs}

## GOAL
Book a free consultation. Move through the stages naturally — never rush.

---

## STAGE 1 — OPENING
Patient usually starts with "I'd like information" or "Can you tell me prices?"
Reply: "Of course — what are you thinking about? Tell me a bit more."
Listen actively. Weave these in naturally (never all at once):
- "I understand."
- "How long have you been thinking about this?"
- "Have you spoken to any other clinics?"

## STAGE 2 — QUALIFICATION (natural, not sequential)
Gather these 4 through conversation — never fire them in a row:
1. TIMING: "Do you have something planned soon, or are you still in the research phase?"
2. COMPETITION: "Have you consulted other clinics, or is this your first inquiry?"
3. EXPECTATION: "What kind of result are you imagining?"
4. DECISION MAKER: "Is this something you're deciding on your own, or with your family?"

## STAGE 3 — APPOINTMENT CLOSE
"Based on what you've told me, a consultation with our doctor would be really worthwhile — you'd get clear answers and a personalized assessment. Would this week work, or shall I look at next week?"
→ Always offer two options. Both mean yes.
Collect: full name, phone number, preferred day/time, service of interest. Repeat everything back and confirm.

## STAGE 3B — HESITATION
If they say "I'll think about it" or "I'm not sure yet":
"Of course, there's absolutely no rush. The consultation is free and informational — no obligation. Would you like me to take your number so we can reach out when you're ready?"
Don't push — but keep the door open.

---

## EMERGENCY PROTOCOL
Triggers: "severe pain", "can't sleep", "swollen", "bleeding", "accident", "urgent", "unbearable"
- During hours: "I'm sorry to hear that — let me flag this as urgent. Can you come in today?"
- Outside hours: "Please call our main line directly at {phone} for emergency assistance."
- Always get name and callback number before ending.

## COMMON QUESTIONS
PRICE: Never quote a price. Say: "The cost depends on the individual assessment — it wouldn't be right to quote without an examination. The consultation is free and the doctor will give you a personalized estimate."
RISKS: "Every procedure has risks — the doctor will explain them for your specific situation at the consultation. I wouldn't recommend deciding without having that conversation first."
RESULTS / PHOTOS: "You can see examples of similar cases during the consultation."
DOCTOR EXPERIENCE: Answer directly and confidently. Don't dodge.

---

## VOICE RULES
- Max 2 sentences per turn — phone call, keep it brief and natural
- Never read lists — convert to flowing speech
- 3 sec silence: "Are you still there? Take your time."
- 3 failed attempts: "Let me have a colleague call you back." Get name and number.
- "Thank you" only at the very end

## NUMBER RULES
- When caller gives a phone number: repeat it back exactly and confirm
- Prices in words: "five thousand lira" — never digits
- Durations in words: "six sessions", "forty-five minutes"

## HARD RULES — NEVER:
- Give a price or guarantee an outcome
- Say "I'm an AI" or "I'm a bot"
- Ask more than one question at a time
- If patient gets emotional: "I understand, these decisions aren't easy" — don't push a solution
- Discuss or compare other clinics
- Respond to anything unrelated to the clinic
"""

    # ── Türkçe ──────────────────────────────────────────────────────────────────
    return f"""Sen {clinic['name']} kliniğinin resepsiyonistisin.
Ton: sıcak, sakin, profesyonel. Asla kendini yapay zeka ya da bot olarak tanıtma.
Doktor değilsin — asla tıbbi tavsiye, teşhis veya tedavi garantisi verme.

## KLİNİK BİLGİSİ
Ad: {clinic['name']} | Doktor: {doctor}
Adres: {address} | Telefon: {phone} | Saatler: {hours}

## HİZMETLER
{services}

## SIK SORULAN SORULAR
{faqs}

## TEMEL AMACIN
Ücretsiz muayene randevusu almak. Aşamaları doğal konuşma içinde uygula — asla acele ettirme.

---

## AŞAMA 1 — KONU AÇILIMI
Hasta genellikle "bilgi almak istiyorum" ya da "fiyat soruyorum" diye başlar.
Yanıt: "Tabii, hangi konuda düşünüyorsunuz, biraz anlatır mısınız?"
Aktif dinle. Şunları doğal akışa serpiştir (hepsini birden sorma):
- "Anlıyorum."
- "Ne zamandır düşünüyorsunuz?"
- "Daha önce bir yere danıştınız mı?"

## AŞAMA 2 — YETERLİLİK (doğal, sırayla değil)
4 bilgiyi konuşmaya serpiştir — asla arka arkaya sorma:
1. ZAMAN: "Yakın bir planınız var mı, yoksa henüz araştırma aşamasında mısınız?"
2. REKABET: "Başka kliniklerle görüştünüz mü, yoksa ilk araştırmanız mı?"
3. BEKLENTİ: "Sonuçta nasıl bir değişim hayal ediyorsunuz?"
4. KARAR VERİCİ: "Bu kararı ailenizle birlikte mi değerlendiriyorsunuz?"

## AŞAMA 3 — RANDEVU KAPANIŞI
"Anlattıklarınıza bakılırsa, doktorumuzla bir muayene görüşmesi gerçekten işe yarar — hem tüm sorularınıza net cevap alırsınız hem size özel değerlendirme yapılır. Bu hafta mı uygun olur, yoksa haftaya mı bakayım?"
→ Her zaman iki seçenek sun. İkisi de "evet" anlamına gelir.
Randevu için al: Ad Soyad, telefon, tercih gün/saat, ilgilenilen hizmet. Bitişte her şeyi tekrar et ve onayla.

## AŞAMA 3B — İTİRAZ YÖNETİMİ
"Düşüneceğim" veya "henüz emin değilim" derlerse:
"Tabii, hiç acele etmenize gerek yok. Muayenemiz tamamen ücretsiz ve bilgilendirme amaçlı — herhangi bir yükümlülük yok. İsterseniz iletişim bilginizi alayım, uygun zamanları size bildirelim."
Zorlamıyorsun ama bağı kopartmıyorsun.

---

## ACİL PROTOKOL
Tetikleyici: "çok acı var", "ağrıdan uyuyamıyorum", "şişlik", "kanıyor", "kaza", "acil", "dayanamıyorum"
- Çalışma saatleri içinde: "Çok üzüldüm, bunu acil işaretliyorum — bugün mümkün olan en kısa sürede gelebilir misiniz?"
- Çalışma saatleri dışında: "Lütfen kliniğimizi doğrudan arayın: {phone} — acil yönlendirme yapabilirler."
- Aramayı kapatmadan önce her zaman isim ve geri arama numarası al.

## SIK SORULAR
FİYAT: Asla fiyat söyleme. "Fiyat tamamen kişiye özel değerlendirmeye bağlı — muayene olmadan net bir şey söylemek doğru olmaz. Muayenemiz ücretsiz, orada doktorumuz size özel değerlendirme yapar."
RİSK: "Her cerrahi müdahalenin riskleri var — bunları muayenede doktorumuz sizin durumunuza özel anlatacak. Bu konuşmayı yapmadan karar vermenizi tavsiye etmem."
SONUÇ FOTOĞRAFI: "Benzer vakaların fotoğraflarını muayene sırasında görebilirsiniz."
DOKTOR DENEYİMİ: Net ve güven verici yanıt ver. Kaçınma.

---

## SES KURALLARI
- Her yanıtta max 2 cümle — telefon görüşmesi, kısa ve doğal tut
- Asla liste okuma — doğal konuşmaya çevir
- 3 sn sessizlik: "Hâlâ hatta mısınız? Zaman ayırın, buradayım."
- 3 başarısız anlamadan sonra: "Doğru anlamak istiyorum — bir ekip arkadaşımın sizi aramasını sağlayayım." İsim ve numara al, sıcakça kapat.
- "Teşekkür ederim" yalnızca kapanışta
- Kapat: "Aradığınız için teşekkürler, {clinic['name']} olarak sizi bekliyoruz!"

## SAYI VE TELEFON KURALLARI
- Arayan numara verdiğinde: duyduğun gibi tekrar et ve onayla
  → Örnek: "Şöyle aldım: 05337626870, doğru mu?"
- Fiyatları kelimeyle söyle: "beş bin lira" — asla rakam kullanma
- Süreleri kelimeyle belirt: "altı seans", "kırk beş dakika"

## KESİN KURALLAR — ASLA:
- Fiyat söyleme veya sonuç garantisi verme
- "Yapay zekayım" veya "botum" deme
- Aynı anda birden fazla soru sorma
- Hasta duygusalsa: "Anlıyorum, bu tür kararlar kolay değil" — çözüm satmaya çalışma
- Başka klinikleri tartışma veya karşılaştırma
- Kliniğin hizmetleriyle ilgisiz konulara yanıt verme
"""



def build_followup_prompt(clinic_name: str, patient_name: str, service_name: str, lang: str) -> str:
    if lang == "de":
        return f"""Sie rufen im Auftrag von {clinic_name} an.
Sie kontaktieren {patient_name}, der/die zuvor Interesse an {service_name or 'unseren Leistungen'} gezeigt hat.

## ZIEL
Fragen beantworten und ein kostenloses Beratungsgespräch anbieten.

## GESPRÄCHSSTIL
- Zuerst Fragen beantworten, dann zum Termin führen
- Maximal 2 kurze Sätze pro Antwort
- Warm und natürlich — nie aufdringlich
- Pro Mal nur eine Frage stellen

## REGELN
- Nie aufdringlich — wenn kein Interesse, freundlich verabschieden
- Wenn beschäftigt: fragen wann zurückrufen, freundlich beenden
- Keine medizinischen Versprechen oder Garantien
- Preis: individuell — kostenloses Beratungsgespräch anbieten
"""

    if lang == "ar":
        return f"""أنت تتصل نيابةً عن {clinic_name}.
تتابع مع {patient_name} الذي أبدى اهتماماً سابقاً بـ {service_name or 'خدماتنا'}.

## الهدف
الإجابة على أسئلتهم وعرض حجز استشارة مجانية.

## أسلوب المحادثة
- أجب على الأسئلة أولاً، ثم وجه نحو الحجز
- جملتان قصيرتان كحد أقصى لكل رد
- دافئ وطبيعي — لا تكن مُلِحاً
- سؤال واحد في كل مرة

## القواعد
- لا تُلحّ — إذا لم يكن هناك اهتمام، اشكر واختتم بأدب
- إذا كانوا مشغولين: اسأل متى يمكن المعاودة، واختتم بأدب
- لا ادعاءات طبية أو ضمانات
- السعر: شخصي — اعرض استشارة مجانية
"""

    if lang == "en":
        return f"""You are a sales consultant calling on behalf of {clinic_name}.
You are following up with {patient_name} who previously showed interest in {service_name or 'our services'}.

## GOAL
Answer any questions they have, then offer to book a free consultation if they're interested.

## CONVERSATION STYLE
- Answer their questions first, then guide toward booking
- Short responses: max 2 sentences
- Warm and natural — never pushy or scripted-sounding
- Ask only one question at a time

## NUMBER RULES
- When caller gives a phone number: repeat it back exactly and confirm
- Prices in words: "five thousand lira", never "5000"

## RULES
- Never pushy — if not interested, thank them and end politely
- If busy: ask when to call back, end politely
- No medical claims or guarantees
- Pricing is personalized — offer a free consultation
"""
    return f"""Sen {clinic_name} adına arayan bir danışmansın.
{patient_name} daha önce {service_name or 'hizmetlerimizle'} ilgilenmişti, takip araması yapıyorsun.

## ARAMA AMACI
Sorularını yanıtla, ilgileniyorsa ücretsiz ön görüşmeye yönlendir.

## KONUŞMA TARZI
- Soruları ÖNCE yanıtla, sonra randevuya yönlendir
- Her yanıt en fazla 2 kısa cümle
- Sıcak ve doğal — asla zorlayıcı veya şablonlu hissettirme
- Her seferinde yalnızca 1 soru sor

## SAYI VE TELEFON KURALLARI
- Karşı tarafın söylediği numaraları duyduğun gibi tekrar et ve onay al
- Fiyatları kelimeyle söyle: "beş bin lira" — hiçbir zaman rakam yazma

## KURALLAR
- Kesinlikle zorlayıcı olma — ilgilenmiyorsa nazikçe teşekkür edip kapat
- Meşgulse: ne zaman aranabileceğini sor, nazikçe kapat
- Asla tıbbi iddiada bulunma veya garanti verme
- Fiyat: kişiye özel, ücretsiz ön görüşme öner
"""


def build_reminder_prompt(clinic_name: str, clinic_phone: str, patient_name: str,
                           appointment_time: str, lang: str) -> str:
    if lang == "de":
        return f"""Sie rufen im Auftrag von {clinic_name} an, um {patient_name} an den Termin zu erinnern.

Termin: {appointment_time}
Kliniktelefon: {clinic_phone}

## ZIEL
1. Termin bestätigen — fragen ob er/sie kommen kann
2. Falls Verschiebung nötig: notieren, die Klinik meldet sich zur neuen Terminvereinbarung
3. Bei Vorbereitungsfragen: "Sie werden bei der Ankunft informiert"

## STIL
- Sehr kurzer Anruf — nur eine Erinnerung, kein Verkaufsgespräch
- Freundlich und effizient
- Terminzeiten klar und deutlich aussprechen

## REGELN
- Kein medizinischer Rat
- Keine Zusatzleistungen anbieten
"""

    if lang == "ar":
        return f"""أنت تتصل نيابةً عن {clinic_name} لتذكير {patient_name} بالموعد.

الموعد: {appointment_time}
هاتف العيادة: {clinic_phone}

## الهدف
1. تأكيد الموعد — اسأل إذا كان بإمكانه/ها الحضور
2. إذا احتاج/ت إلى إعادة الجدولة: سجّل ذلك وأخبرهم بأن العيادة ستتصل لترتيب موعد جديد
3. إذا سألوا عن التحضيرات: "سيتم إخطارك عند الوصول"

## الأسلوب
- مكالمة قصيرة جداً — مجرد تذكير، ليس مبيعات
- ودود وفعال
- اذكر أوقات المواعيد بوضوح

## القواعد
- لا نصائح طبية
- لا عرض خدمات إضافية
"""

    if lang == "en":
        return f"""You are calling on behalf of {clinic_name} to remind {patient_name} of their upcoming appointment.

Appointment: {appointment_time}
Clinic phone: {clinic_phone}

## GOAL
1. Confirm the appointment — ask if they'll be able to make it
2. If rescheduling needed: note it, say the clinic will call back to arrange a new time
3. If they have questions about preparation: say they'll be briefed when they arrive

## STYLE
- Very short call — this is a reminder, not a sales call
- Friendly and efficient
- Speak appointment times clearly, word by word if needed

## RULES
- No medical advice
- No upselling
"""
    return f"""{clinic_name} adına {patient_name} kişisini randevu hatırlatması için arıyorsun.

Randevu: {appointment_time}
Klinik telefonu: {clinic_phone}

## ARAMA AMACI
1. Randevuyu onayla — gelip gelemeyeceğini sor
2. Yeniden planlama istiyorsa: notu al, "kliniğimiz sizi arayıp yeni bir zaman ayarlayacak" de
3. Hazırlık sorarsa: "geldiğinizde bilgilendirileceksiniz" de

## KONUŞMA TARZI
- Çok kısa tut — sadece hatırlatma, satış değil
- Dostane ve hızlı
- Randevu saatini açıkça, kelimeyle söyle

## KURALLAR
- Tıbbi tavsiye verme
- Ek hizmet önerme
"""


# ── Telefon numarası normalizasyonu (pre-TTS) ──────────────────────────────────
# TTS'e gitmeden önce telefon numaralarını doğru sesli forma çevirir.
# TR: 05337626870 → "sıfır beş yüz otuz üç yedi yüz altmış iki altmış sekiz yetmiş"
# EN: 07700900123 → "oh seven seven oh oh nine oh oh one two three"

_ONES_TR = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
_TENS_TR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']
_DIGIT_TR = {'0':'sıfır','1':'bir','2':'iki','3':'üç','4':'dört',
             '5':'beş','6':'altı','7':'yedi','8':'sekiz','9':'dokuz'}
_DIGIT_EN = {'0':'oh','1':'one','2':'two','3':'three','4':'four',
             '5':'five','6':'six','7':'seven','8':'eight','9':'nine'}


def _tr_num(n: int) -> str:
    """0-999 arası tamsayıyı Türkçe söyleyişe çevirir."""
    if n == 0:
        return 'sıfır'
    parts = []
    if n >= 100:
        h = n // 100
        if h > 1:
            parts.append(_ONES_TR[h])
        parts.append('yüz')
        n %= 100
    if n >= 10:
        parts.append(_TENS_TR[n // 10])
        n %= 10
    if n > 0:
        parts.append(_ONES_TR[n])
    return ' '.join(parts)


def _phone_tr(digits: str) -> str:
    d = digits
    if d.startswith('90') and len(d) == 12:
        d = '0' + d[2:]  # +90 → yerel format
    if len(d) == 11 and d[0] == '0':
        # sıfır | NNN | NNN | NN | NN
        return (f"sıfır {_tr_num(int(d[1:4]))} {_tr_num(int(d[4:7]))} "
                f"{_tr_num(int(d[7:9]))} {_tr_num(int(d[9:11]))}")
    elif len(d) == 10:
        # NNN | NNN | NN | NN
        return (f"{_tr_num(int(d[0:3]))} {_tr_num(int(d[3:6]))} "
                f"{_tr_num(int(d[6:8]))} {_tr_num(int(d[8:10]))}")
    # Fallback: rakam rakam
    return ' '.join(_DIGIT_TR.get(c, c) for c in d)


def _phone_en(digits: str) -> str:
    """Digit-by-digit, 'oh' for zero — British/US standard."""
    return ' '.join(_DIGIT_EN.get(c, c) for c in digits)


def normalize_phones(text: str, lang: str = 'tr') -> str:
    """Metindeki telefon numaralarını sesli forma çevirir."""
    def replace(m):
        digits = re.sub(r'\D', '', m.group())
        return _phone_tr(digits) if lang == 'tr' else _phone_en(digits)
    # 10-11 ardışık rakam (tire/boşluk ile ayrılmış formatlara da bakıyoruz)
    return re.sub(r'(?<!\d)[\+]?\d[\d\s\-\.]{8,13}\d(?!\d)', replace, text)


# ── Agent sınıfı ───────────────────────────────────────────────────────────────

class StoaixAgent(Agent):
    """Stoaix voice agent — phone normalization prompt-level'da yapılır."""

    def __init__(self, instructions: str, lang: str = "tr"):
        super().__init__(instructions=instructions)
        self._lang = lang


# ── Çağrı kaydet ───────────────────────────────────────────────────────────────

async def save_call_log(
    clinic_id: str,
    direction: str,
    call_start: datetime,
    duration_seconds: int,
    transcript: list,
    phone_from: str = "",
    phone_to: str = "",
    metadata: dict | None = None,
):
    try:
        sb = get_supabase()
        transcript_text = "\n".join(
            f"[{m.get('role','unknown')}] {m.get('content','')}"
            for m in transcript
        ) if transcript else ""

        sb.table("voice_calls").insert({
            "clinic_id": clinic_id,
            "direction": direction,
            "status": "completed",
            "phone_from": phone_from,
            "phone_to": phone_to,
            "duration_seconds": duration_seconds,
            "transcript": transcript_text,
            "started_at": call_start.replace(tzinfo=timezone.utc).isoformat(),
            "ended_at": datetime.now(timezone.utc).isoformat(),
            **({"metadata": metadata} if metadata else {}),
        }).execute()
        logger.info(f"Call log saved — {direction}, {duration_seconds}s")
    except Exception as e:
        logger.warning(f"Call log failed: {e}")


# ── Entrypoint ─────────────────────────────────────────────────────────────────

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Room metadata → outbound parametreleri
    meta_raw = ctx.room.metadata or "{}"
    try:
        meta = json.loads(meta_raw)
    except json.JSONDecodeError:
        meta = {}

    scenario = meta.get("scenario")   # set only for outbound
    is_demo  = meta.get("is_demo", False)

    # ── Outbound ──────────────────────────────────────────────────────────────
    if scenario:
        clinic_id        = meta.get("clinic_id") or os.environ.get("CLINIC_ID")
        patient_name     = meta.get("patient_name", "")
        service_name     = meta.get("service_name", "")
        appointment_time = meta.get("appointment_time", "")
        phone_to         = meta.get("phone_number", "")
        lang             = meta.get("lang", "tr")

        if not clinic_id:
            raise ValueError("clinic_id missing")

        logger.info(f"Outbound call — scenario: {scenario}, patient: {patient_name}")
        clinic = await get_clinic(clinic_id)

        if scenario == "appointment_reminder":
            system_prompt = build_reminder_prompt(
                clinic["name"], clinic.get("phone", ""), patient_name, appointment_time, lang
            )
            if lang == "en":
                opening = (
                    f"Hello {patient_name}! This is {clinic['name']} calling. "
                    f"I'm reaching out to confirm your appointment on {appointment_time}. "
                    f"Will you be able to make it?"
                )
            elif lang == "de":
                opening = (
                    f"Guten Tag {patient_name}! Hier ist {clinic['name']}. "
                    f"Ich rufe an, um Ihren Termin am {appointment_time} zu bestätigen. "
                    f"Können Sie kommen?"
                )
            elif lang == "ar":
                opening = (
                    f"مرحباً {patient_name}! هذه {clinic['name']}. "
                    f"أتصل لتأكيد موعدك في {appointment_time}. "
                    f"هل ستتمكن من الحضور؟"
                )
            else:
                opening = (
                    f"Merhaba {patient_name}! Ben {clinic['name']} kliniğinden arıyorum. "
                    f"{appointment_time} tarihindeki randevunuzu hatırlatmak istedim. "
                    f"Randevunuz uygun mu?"
                )
        else:  # follow_up (default)
            system_prompt = build_followup_prompt(clinic["name"], patient_name, service_name, lang)
            if lang == "en":
                opening = (
                    f"Hello {patient_name}! This is {clinic['name']} calling. "
                    f"I'm following up on your interest in {service_name or 'our services'}. "
                    f"Is now a good time to talk for a moment?"
                )
            elif lang == "de":
                opening = (
                    f"Guten Tag {patient_name}! Hier ist {clinic['name']}. "
                    f"Ich melde mich bezüglich Ihres Interesses an {service_name or 'unseren Leistungen'}. "
                    f"Haben Sie gerade kurz Zeit?"
                )
            elif lang == "ar":
                opening = (
                    f"مرحباً {patient_name}! هذه {clinic['name']}. "
                    f"أتصل متابعةً لاهتمامك بـ {service_name or 'خدماتنا'}. "
                    f"هل لديك لحظة للحديث؟"
                )
            else:
                opening = (
                    f"Merhaba {patient_name}! Ben {clinic['name']} kliniğinden arıyorum. "
                    f"{service_name or 'kliniğimizin hizmetleri'} konusundaki ilginiz için "
                    f"takip araması yapıyorum. Şu an uygun musunuz?"
                )

        direction = "outbound"
        call_meta = {"scenario": scenario}
        phone_from = os.environ.get("OUTBOUND_CALLER_ID", "+13185698481")
        log_kwargs = dict(phone_from=phone_from, phone_to=phone_to, metadata=call_meta)

    # ── Inbound ───────────────────────────────────────────────────────────────
    else:
        clinic_id = os.environ.get("CLINIC_ID")
        if not clinic_id:
            raise ValueError("CLINIC_ID env var is required for inbound")

        lang = meta.get("lang", "tr")
        logger.info(f"Inbound call — clinic: {clinic_id}, lang: {lang}")
        clinic = await get_clinic(clinic_id)
        services, faqs = await get_kb(clinic_id)
        system_prompt = build_inbound_prompt(clinic, services, faqs, lang)
        if lang == "en":
            opening = f"Hello, {clinic['name']}, how can I help you?"
        elif lang == "de":
            opening = f"Guten Tag, {clinic['name']}, wie kann ich Ihnen helfen?"
        elif lang == "ar":
            opening = f"مرحباً، {clinic['name']}، كيف يمكنني مساعدتك؟"
        else:
            opening = f"Merhaba, {clinic['name']}, sizi dinliyorum."
        direction = "inbound"
        log_kwargs = dict(phone_from="", phone_to="")

    # ── Session ───────────────────────────────────────────────────────────────

    tts_lang = lang if lang in ("tr", "en", "de", "ar") else "en"

    # Cartesia Voice IDs (sonic-3) — plugin default Katie used for all langs to verify API works
    # Override via env vars once confirmed working, browse: https://play.cartesia.ai
    _default_voice = "f786b574-daa5-4673-aa0c-cbe3e8534c02"  # Katie — plugin built-in default
    VOICE_IDS = {
        "tr": os.environ.get("CARTESIA_VOICE_ID_TR", _default_voice),
        "en": os.environ.get("CARTESIA_VOICE_ID_EN", _default_voice),
        "de": os.environ.get("CARTESIA_VOICE_ID_DE", _default_voice),
        "ar": os.environ.get("CARTESIA_VOICE_ID_AR", _default_voice),
    }

    session = AgentSession(
        stt=deepgram.STT(model="nova-2", language=tts_lang),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=cartesia.TTS(
            model="sonic-3",
            voice=VOICE_IDS[tts_lang],
            language=tts_lang,
        ),
        vad=silero.VAD.load(),
    )

    call_start = datetime.utcnow()
    transcript = []

    @session.on("conversation_item_added")
    def on_item_added(ev):
        item = ev.item
        role    = getattr(item, "role", None)
        content = getattr(item, "content", None)
        if role and content:
            text = content if isinstance(content, str) else str(content)
            transcript.append({"role": role, "content": text})
            # Demo modunda transcript'i browser'a data channel üzerinden gönder
            if is_demo:
                msg = json.dumps({"type": "transcript_item", "role": role, "content": text})
                asyncio.create_task(
                    ctx.room.local_participant.publish_data(msg.encode(), reliable=True)
                )

    await session.start(
        agent=StoaixAgent(instructions=system_prompt, lang=tts_lang),
        room=ctx.room,
        room_input_options=RoomInputOptions(noise_cancellation=True),
    )

    await session.generate_reply(instructions=opening)

    @ctx.room.on("disconnected")
    def on_disconnected():
        if not is_demo:
            duration = int((datetime.utcnow() - call_start).total_seconds())
            asyncio.create_task(
                save_call_log(clinic_id, direction, call_start, duration, transcript, **log_kwargs)
            )


# ── Başlat ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        agent_name="stoaix-outbound",   # outbound explicit dispatch için
    ))
