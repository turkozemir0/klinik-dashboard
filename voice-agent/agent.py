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

async def build_inbound_prompt(clinic_id: str) -> str:
    c = await get_clinic(clinic_id)
    services, faqs = await get_kb(clinic_id)
    address = ", ".join(filter(None, [c.get("address"), c.get("district"), c.get("city")])) or "Belirtilmemiş"
    return f"""Sen {c['name']} kliniğinin telefon resepsiyonistisin.
Hastaları karşılıyor, sorularını yanıtlıyor ve randevu alıyorsun.

## KLİNİK BİLGİSİ
Ad: {c['name']}
Tür: {c.get('clinic_type', 'Klinik')}
Adres: {address}
Telefon: {c.get('phone', 'Belirtilmemiş')}
Çalışma Saatleri: {json.dumps(c.get('working_hours', {}), ensure_ascii=False) if c.get('working_hours') else 'Belirtilmemiş'}
Baş Doktor: {c.get('lead_doctor_name', '')} {c.get('lead_doctor_title', '')}

## HİZMETLER
{services}

## SIK SORULAN SORULAR
{faqs}

## KURALLAR
1. Sıcak ve profesyonel ol — telefon görüşmesi olduğunu unutma, kısa tut
2. Her seferinde sadece 1 soru sor
3. Asla tıbbi teşhis koyma veya garanti verme
4. Fiyat sorularında kişiye özel olduğunu söyle, ücretsiz ön görüşmeye yönlendir
5. Randevu almak isteyenlerden: isim, telefon, tercih edilen gün ve saat al
6. Hastanın konuştuğu dilde yanıt ver (Türkçe/İngilizce)
7. Eğer cevaplayamadığın bir soru varsa kliniği aramasını öner: {c.get('phone', '')}
"""


def build_followup_prompt(clinic_name: str, patient_name: str, service_name: str, lang: str) -> str:
    if lang == "en":
        return f"""You are a sales representative calling on behalf of {clinic_name}.
You are calling {patient_name} as a follow-up because they previously showed interest in {service_name or 'our services'}.

## CALL GOAL
- Briefly remind them of their interest
- Ask if they have questions or if they'd like to schedule a consultation
- If interested: offer to connect them or schedule a callback

## RULES
1. Be warm and professional — never pushy
2. Keep it short: max 3-4 exchanges before offering to book
3. If not interested: thank them and end politely
4. Pricing: personalized, offer a free consultation
5. No medical claims or guarantees
6. If busy: ask when to call back and end politely
"""
    return f"""Sen {clinic_name} adına arayan bir danışmansın.
{patient_name} isimli kişiyi arıyorsun çünkü daha önce {service_name or 'hizmetlerimiz'} ile ilgilenmişti.

## ARAMA AMACI
- Kısaca ilgisini hatırlat
- Soru olup olmadığını veya ön görüşme yapmak isteyip istemediğini sor
- İlgileniyorsa: klinikle görüşmelerini sağla veya geri arama planla

## KURALLAR
1. Sıcak ve profesyonel ol — kesinlikle zorlayıcı olma
2. Kısa tut: en fazla 3-4 alışveriş
3. İlgilenmiyorsa: nazikçe teşekkür edip kapat
4. Fiyat: kişiye özel, ücretsiz ön görüşme öner
5. Asla tıbbi iddiada bulunma veya garanti verme
6. Meşgulse: ne zaman aranabileceğini sor ve nazikçe kapat
"""


def build_reminder_prompt(clinic_name: str, clinic_phone: str, patient_name: str,
                           appointment_time: str, lang: str) -> str:
    if lang == "en":
        return f"""You are calling on behalf of {clinic_name} to remind {patient_name} of their appointment.

Appointment: {appointment_time}
Clinic phone: {clinic_phone}

## CALL GOAL
1. Confirm the appointment
2. If rescheduling needed: note it, say clinic will call back
3. If they ask about prep: say they'll be briefed when they arrive

## RULES
- Very short call — reminder only, not sales
- Be friendly and efficient
- No medical advice
"""
    return f"""{clinic_name} adına {patient_name} kişisini randevu hatırlatması için arıyorsun.

Randevu: {appointment_time}
Klinik telefonu: {clinic_phone}

## ARAMA AMACI
1. Randevuyu onayla
2. Yeniden planlama istiyorsa: notu al, kliniğin geri arayacağını söyle
3. Hazırlık sorarsa: gelince bilgilendirileceğini söyle

## KURALLAR
- Çok kısa tut — sadece hatırlatma
- Dostane ve verimli ol
- Tıbbi tavsiye verme
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

    # ── Outbound ──────────────────────────────────────────────────────────────
    if scenario:
        clinic_id       = meta.get("clinic_id") or os.environ.get("CLINIC_ID")
        patient_name    = meta.get("patient_name", "")
        service_name    = meta.get("service_name", "")
        appointment_time= meta.get("appointment_time", "")
        phone_to        = meta.get("phone_number", "")
        lang            = meta.get("lang", "tr")

        if not clinic_id:
            raise ValueError("clinic_id missing")

        logger.info(f"Outbound call — scenario: {scenario}, patient: {patient_name}")
        clinic = await get_clinic(clinic_id)

        if scenario == "appointment_reminder":
            system_prompt = build_reminder_prompt(
                clinic["name"], clinic.get("phone", ""), patient_name, appointment_time, lang
            )
        else:  # follow_up (default)
            system_prompt = build_followup_prompt(clinic["name"], patient_name, service_name, lang)

        if lang == "en":
            if scenario == "follow_up":
                opening = (
                    f"Introduce yourself as a representative from {clinic['name']}, "
                    f"greet {patient_name} by name and ask if this is a good time to talk briefly "
                    f"about {service_name or 'our services'}. Keep it very short."
                )
            else:
                opening = (
                    f"Introduce yourself as calling from {clinic['name']}, "
                    f"greet {patient_name} and confirm the appointment at {appointment_time}. "
                    f"Ask if they'll be able to make it."
                )
        else:
            if scenario == "follow_up":
                opening = (
                    f"{clinic['name']} adına {patient_name}'i ismiyle selamla, "
                    f"kısa konuşmak için uygun olup olmadığını sor ve "
                    f"{service_name or 'hizmetlerimiz'} ile ilgili takip araması yaptığını belirt. Çok kısa tut."
                )
            else:
                opening = (
                    f"{clinic['name']} adına {patient_name}'i ismiyle selamla ve "
                    f"{appointment_time} tarihindeki randevusunu hatırlat. "
                    f"Randevuya gelebilip gelemeyeceğini sor."
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

        lang = "tr"
        logger.info(f"Inbound call — clinic: {clinic_id}")
        system_prompt = await build_inbound_prompt(clinic_id)
        opening = "Aramayı sıcak bir şekilde karşıla, kliniği tanıt ve nasıl yardımcı olabileceğini sor. Kısa tut."
        direction = "inbound"
        log_kwargs = dict(phone_from="", phone_to="")

    # ── Session ───────────────────────────────────────────────────────────────

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
        role    = getattr(item, "role", None)
        content = getattr(item, "content", None)
        if role and content:
            text = content if isinstance(content, str) else str(content)
            transcript.append({"role": role, "content": text})

    await session.start(
        agent=Agent(instructions=system_prompt),
        room=ctx.room,
        room_input_options=RoomInputOptions(noise_cancellation=True),
    )

    await session.generate_reply(instructions=opening)

    @ctx.room.on("disconnected")
    def on_disconnected():
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
