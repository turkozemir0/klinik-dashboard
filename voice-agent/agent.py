"""
stoaix Voice Agent — Combined Inbound + Outbound
LiveKit Cloud + Deepgram STT + GPT-4o Mini + Cartesia TTS

Inbound : SIP dispatch rule → room adı "call-" ile başlar
Outbound: Explicit dispatch  → room metadata'da "scenario" alanı var
"""

import asyncio
import json
import logging
import os
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
    address = ", ".join(filter(None, [clinic.get("address"), clinic.get("district"), clinic.get("city")])) or "N/A"

    if lang == "en":
        return f"""You are the AI phone receptionist for {clinic['name']}. You greet patients, answer questions, and book appointments.

## CLINIC INFO
Name: {clinic['name']}
Type: {clinic.get('clinic_type', 'Clinic')}
Address: {address}
Phone: {clinic.get('phone', 'N/A')}
Working Hours: {json.dumps(clinic.get('working_hours', {}), ensure_ascii=False) if clinic.get('working_hours') else 'N/A'}
Lead Doctor: {clinic.get('lead_doctor_name', '')} {clinic.get('lead_doctor_title', '')}

## SERVICES
{services}

## FREQUENTLY ASKED QUESTIONS
{faqs}

## CONVERSATION STYLE
- Answer the patient's question FIRST, then guide toward booking if appropriate
- Max 2 short sentences per response — this is a phone call, keep it brief
- Use natural transitions: "Of course", "Absolutely", "Great question"
- Ask only one question at a time
- Never give medical diagnoses or guarantees

## NUMBER & PHONE RULES — CRITICAL
- Always say phone numbers digit by digit: "zero five three five ..." — never run them together
- When the caller gives you a phone number: repeat it back digit by digit and confirm ("Got it: zero-five-three-five-... is that right?")
- Say prices in words: "five thousand lira", "two thousand five hundred lira" — never write digits
- State durations clearly: "six sessions", "three months", "forty-five minutes"
- Always write numbers as words in your responses, never as digits

## BOOKING AN APPOINTMENT
Ask for: name → phone number (take digit by digit, repeat back, confirm) → preferred day and time.
Say: "The clinic will call you shortly to confirm your appointment."

## UNKNOWN QUESTIONS
Direct them to call the clinic directly at {clinic.get('phone', 'our main number')}.
"""

    # Turkish (default)
    address_tr = ", ".join(filter(None, [clinic.get("address"), clinic.get("district"), clinic.get("city")])) or "Belirtilmemiş"
    return f"""Sen {clinic['name']} kliniğinin AI telefon resepsiyonistisin. Hastaları karşılıyor, sorularını yanıtlıyor, randevu alıyorsun.

## KLİNİK BİLGİSİ
Ad: {clinic['name']}
Tür: {clinic.get('clinic_type', 'Klinik')}
Adres: {address_tr}
Telefon: {clinic.get('phone', 'Belirtilmemiş')}
Çalışma Saatleri: {json.dumps(clinic.get('working_hours', {}), ensure_ascii=False) if clinic.get('working_hours') else 'Belirtilmemiş'}
Baş Doktor: {clinic.get('lead_doctor_name', '')} {clinic.get('lead_doctor_title', '')}

## HİZMETLER
{services}

## SIK SORULAN SORULAR
{faqs}

## KONUŞMA TARZI
- Hastanın sorusunu ÖNCE tam olarak yanıtla, sonra gerekirse randevuya yönlendir
- Her yanıt en fazla 2 kısa cümle — telefon görüşmesi, kısa tut
- "Tabii ki", "Anlıyorum", "Haklısınız" gibi doğal geçişler kullan
- Her seferinde yalnızca 1 soru sor, birden fazla soru sorma
- Asla tıbbi teşhis koyma veya garanti verme

## SAYI VE TELEFON KURALLARI — ÇOK ÖNEMLİ
- Telefon numaralarını her zaman rakam rakam söyle: "sıfır beş üç beş ..." şeklinde, bitişik söyleme
- Hasta telefon numarası söylediğinde: rakam rakam tekrar ederek doğrula ("Şöyle not aldım: sıfır-beş-üç-beş-... doğru mu?")
- Fiyatları kelimeyle söyle: "beş bin lira", "iki bin beş yüz lira" — hiçbir zaman "5000₺" veya rakam yazma
- Süreleri açık söyle: "altı seans", "üç ay", "kırk beş dakika"
- Sayıları yanıt metninde her zaman kelimeyle yaz, rakam kullanma

## RANDEVU ALMA
İsim → telefon (rakam rakam al, tekrar et, onay al) → tercih edilen gün ve saat iste.
"Kliniğimiz sizi en kısa sürede arayıp randevuyu doğrulayacak." de.

## BİLİNMEYEN SORULAR
Doğrudan {clinic.get('phone', 'kliniğimizi')} numarasından aramalarını öner.
"""


def build_followup_prompt(clinic_name: str, patient_name: str, service_name: str, lang: str) -> str:
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

## NUMBER RULES — CRITICAL
- Speak phone numbers digit by digit: "zero five three five ..."
- Prices in words: "five thousand lira", never "5000"
- Repeat back any number the caller gives you, digit by digit, for confirmation

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

## SAYI VE TELEFON KURALLARI — ÇOK ÖNEMLİ
- Telefon numaralarını rakam rakam söyle: "sıfır beş üç beş ..." şeklinde
- Fiyatları kelimeyle söyle: "beş bin lira" — hiçbir zaman rakam yazma
- Karşı tarafın söylediği numaraları rakam rakam tekrar et, onay al

## KURALLAR
- Kesinlikle zorlayıcı olma — ilgilenmiyorsa nazikçe teşekkür edip kapat
- Meşgulse: ne zaman aranabileceğini sor, nazikçe kapat
- Asla tıbbi iddiada bulunma veya garanti verme
- Fiyat: kişiye özel, ücretsiz ön görüşme öner
"""


def build_reminder_prompt(clinic_name: str, clinic_phone: str, patient_name: str,
                           appointment_time: str, lang: str) -> str:
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
            opening = f"Hello! Thank you for calling {clinic['name']}. How can I help you today?"
        else:
            opening = f"Merhaba! {clinic['name']} kliniğine hoş geldiniz. Size nasıl yardımcı olabilirim?"
        direction = "inbound"
        log_kwargs = dict(phone_from="", phone_to="")

    # ── Session ───────────────────────────────────────────────────────────────

    VOICE_IDS = {
        "tr": os.environ.get("CARTESIA_VOICE_ID_TR", "8036098f-cff4-401e-bfba-f0a6a6e5e49b"),  # Elif
        "en": os.environ.get("CARTESIA_VOICE_ID_EN", "2f251ac3-89a9-4a77-a452-704b474ccd01"),  # Lucy
    }
    tts_lang = lang if lang in ("tr", "en") else "tr"

    session = AgentSession(
        stt=deepgram.STT(model="nova-2", language=tts_lang),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=cartesia.TTS(
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
        agent=Agent(instructions=system_prompt),
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
