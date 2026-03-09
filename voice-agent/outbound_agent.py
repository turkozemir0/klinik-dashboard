"""
stoaix Voice Agent — Outbound Caller
LiveKit Cloud + Deepgram STT + GPT-4o Mini + Cartesia TTS

Senaryolar:
  follow_up           — Yanıtsız lead'i tekrar ara
  appointment_reminder — Randevu günü hatırlatma
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
logger = logging.getLogger("stoaix-outbound")


# ── Supabase ───────────────────────────────────────────────────────────────────

def get_supabase():
    from supabase import create_client
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


# ── Klinik bilgisi ─────────────────────────────────────────────────────────────

async def get_clinic(clinic_id: str) -> dict:
    sb = get_supabase()
    res = sb.table("clinics").select("name,phone,clinic_type,lead_doctor_name").eq("id", clinic_id).single().execute()
    if not res.data:
        raise ValueError(f"Clinic not found: {clinic_id}")
    return res.data


# ── Sistem prompt'ları ─────────────────────────────────────────────────────────

def build_followup_prompt(clinic: dict, patient_name: str, service_name: str, lang: str = "tr") -> str:
    if lang == "en":
        return f"""You are a sales representative calling on behalf of {clinic['name']}.
You are calling {patient_name} as a follow-up because they previously showed interest in {service_name or 'our services'}.

## CALL GOAL
- Briefly remind them of their interest
- Ask if they have questions or if they'd like to schedule a consultation
- If interested: offer to connect them with the clinic directly or schedule a callback

## RULES
1. Be warm and professional — never pushy
2. Keep it short: max 3-4 exchanges before offering to book
3. If they say not interested: thank them politely and end the call
4. If they ask for pricing: say it's personalized, offer a free consultation
5. Never make medical claims or guarantees
6. If they're busy: ask when to call back and end politely
"""
    return f"""Sen {clinic['name']} adına arayan bir danışmansın.
{patient_name} isimli kişiyi arıyorsun çünkü daha önce {service_name or 'hizmetlerimiz'} ile ilgilenmişti.

## ARAMA AMACI
- Kısaca ilgisini hatırlat
- Soru olup olmadığını veya ön görüşme yapmak isteyip istemediğini sor
- İlgileniyorsa: klinikle görüşmelerini sağla veya geri arama planla

## KURALLAR
1. Sıcak ve profesyonel ol — kesinlikle zorlayıcı olma
2. Kısa tut: randevu teklifinden önce en fazla 3-4 alışveriş
3. İlgilenmiyorsa: nazikçe teşekkür edip kapat
4. Fiyat sorarsa: kişiye özel olduğunu söyle, ücretsiz ön görüşme öner
5. Asla tıbbi iddiada veya garanti verme
6. Meşgulse: ne zaman aranabileceğini sor ve nazikçe kapat
"""


def build_reminder_prompt(clinic: dict, patient_name: str, appointment_time: str, lang: str = "tr") -> str:
    if lang == "en":
        return f"""You are calling on behalf of {clinic['name']} to remind {patient_name} of their upcoming appointment.

## APPOINTMENT DETAILS
Time: {appointment_time}
Clinic: {clinic['name']}
Phone: {clinic.get('phone', '')}

## CALL GOAL
1. Confirm the appointment is still on
2. If they need to reschedule: note it and say the clinic will call back to arrange a new time
3. Give any prep instructions if asked (say they'll be briefed when they arrive)

## RULES
1. Keep it very short — this is a reminder call, not a sales call
2. Be friendly and efficient
3. Don't give medical advice
"""
    return f"""{clinic['name']} adına {patient_name} kişisini randevu hatırlatması için arıyorsun.

## RANDEVU BİLGİSİ
Zaman: {appointment_time}
Klinik: {clinic['name']}
Telefon: {clinic.get('phone', '')}

## ARAMA AMACI
1. Randevuyu onaylamasını sağla
2. Yeniden planlama istiyorsa: notu al, kliniğin geri arayacağını söyle
3. Hazırlık sorarsa: gelince bilgilendirileceğini söyle

## KURALLAR
1. Çok kısa tut — bu bir satış araması değil, hatırlatma araması
2. Dostane ve verimli ol
3. Tıbbi tavsiye verme
"""


# ── Açılış cümlesi ─────────────────────────────────────────────────────────────

def opening_line(scenario: str, clinic_name: str, patient_name: str,
                 service_name: str, appointment_time: str, lang: str) -> str:
    if lang == "en":
        if scenario == "follow_up":
            return (
                f"Introduce yourself as a representative from {clinic_name}, "
                f"greet {patient_name} by name, and ask if this is a good time to talk briefly "
                f"about their interest in {service_name or 'our services'}. Keep it very short."
            )
        return (
            f"Introduce yourself as calling from {clinic_name}, "
            f"greet {patient_name} by name, and confirm their appointment at {appointment_time}. "
            f"Ask if they'll be able to make it."
        )
    if scenario == "follow_up":
        return (
            f"{clinic_name} adına {patient_name}'i ismiyle selamla, "
            f"kısa konuşmak için uygun olup olmadığını sor ve "
            f"{service_name or 'hizmetlerimiz'} ile ilgili takip araması yaptığını belirt. Çok kısa tut."
        )
    return (
        f"{clinic_name} adına {patient_name}'i ismiyle selamla ve "
        f"{appointment_time} tarihindeki randevusunu hatırlat. "
        f"Randevuya gelebilip gelemeyeceğini sor."
    )


# ── Çağrı sonu kaydet ──────────────────────────────────────────────────────────

async def save_call_log(
    clinic_id: str,
    scenario: str,
    call_start: datetime,
    duration_seconds: int,
    transcript: list,
    phone_to: str = "",
):
    try:
        sb = get_supabase()
        transcript_text = "\n".join(
            f"[{m.get('role', 'unknown')}] {m.get('content', '')}"
            for m in transcript
        ) if transcript else ""

        sb.table("voice_calls").insert({
            "clinic_id": clinic_id,
            "direction": "outbound",
            "status": "completed",
            "phone_from": os.environ.get("OUTBOUND_CALLER_ID", "+13185698481"),
            "phone_to": phone_to,
            "duration_seconds": duration_seconds,
            "transcript": transcript_text,
            "started_at": call_start.replace(tzinfo=timezone.utc).isoformat(),
            "ended_at": datetime.now(timezone.utc).isoformat(),
            "metadata": {"scenario": scenario},
        }).execute()

        logger.info(f"Outbound call log saved — scenario: {scenario}, duration: {duration_seconds}s")
    except Exception as e:
        logger.warning(f"Outbound call log failed: {e}")


# ── Agent entrypoint ───────────────────────────────────────────────────────────

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Room metadata'dan parametreleri oku
    meta_raw = ctx.room.metadata or "{}"
    try:
        meta = json.loads(meta_raw)
    except json.JSONDecodeError:
        meta = {}

    clinic_id       = meta.get("clinic_id") or os.environ.get("CLINIC_ID")
    scenario        = meta.get("scenario", "follow_up")       # follow_up | appointment_reminder
    patient_name    = meta.get("patient_name", "")
    service_name    = meta.get("service_name", "")
    appointment_time= meta.get("appointment_time", "")
    phone_to        = meta.get("phone_number", "")
    lang            = meta.get("lang", "tr")                   # tr | en

    if not clinic_id:
        raise ValueError("clinic_id missing from room metadata and CLINIC_ID env var")

    logger.info(f"Outbound call — scenario: {scenario}, patient: {patient_name}, clinic: {clinic_id}")

    clinic = await get_clinic(clinic_id)

    if scenario == "appointment_reminder":
        system_prompt = build_reminder_prompt(clinic, patient_name, appointment_time, lang)
    else:
        system_prompt = build_followup_prompt(clinic, patient_name, service_name, lang)

    session = AgentSession(
        stt=deepgram.STT(model="nova-2", language=lang if lang in ("tr", "en") else "tr"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=cartesia.TTS(
            voice=os.environ.get("CARTESIA_VOICE_ID", "79a125e8-cd45-4c13-8a67-188112f4dd22"),
            language=lang if lang in ("tr", "en") else "tr",
        ),
        vad=silero.VAD.load(),
    )

    call_start = datetime.utcnow()
    transcript = []

    @session.on("conversation_item_added")
    def on_item_added(ev):
        item = ev.item
        role = getattr(item, "role", None)
        content = getattr(item, "content", None)
        if role and content:
            text = content if isinstance(content, str) else str(content)
            transcript.append({"role": role, "content": text})

    await session.start(
        agent=Agent(instructions=system_prompt),
        room=ctx.room,
        room_input_options=RoomInputOptions(noise_cancellation=True),
    )

    await session.generate_reply(
        instructions=opening_line(scenario, clinic["name"], patient_name, service_name, appointment_time, lang)
    )

    @ctx.room.on("disconnected")
    def on_disconnected():
        duration = int((datetime.utcnow() - call_start).total_seconds())
        asyncio.create_task(
            save_call_log(clinic_id, scenario, call_start, duration, transcript, phone_to)
        )


# ── Başlat ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        agent_name="stoaix-outbound",   # explicit dispatch için
    ))
