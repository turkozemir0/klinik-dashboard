"""
stoaix Voice Agent — Inbound Receptionist
LiveKit Cloud + Deepgram STT + GPT-4o Mini + Cartesia TTS
"""

import asyncio
import logging
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

from livekit.agents import (
    AgentSession,
    Agent,
    JobContext,
    RoomInputOptions,
    WorkerOptions,
    AutoSubscribe,
    cli,
)
from livekit.plugins import cartesia, deepgram, openai, silero

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stoaix-voice")


# ── Supabase client (paylaşımlı) ──────────────────────────────────────────────

def get_supabase():
    from supabase import create_client
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


# ── Klinik KB çek ─────────────────────────────────────────────────────────────

async def get_system_prompt(clinic_id: str) -> str:
    sb = get_supabase()

    clinic_res = sb.table("clinics").select("*").eq("id", clinic_id).single().execute()
    kb_res     = sb.table("kb_documents").select("source_type,content").eq("clinic_id", clinic_id).execute()

    c = clinic_res.data
    if not c:
        raise ValueError(f"Clinic not found: {clinic_id}")

    services_docs = [d["content"] for d in (kb_res.data or []) if d.get("source_type") == "service"]
    faq_docs      = [d["content"] for d in (kb_res.data or []) if d.get("source_type") == "faq"]

    services_text = "\n\n".join(services_docs) or "(Hizmet bilgisi girilmemiş)"
    faqs_text     = "\n\n".join(faq_docs)      or "(SSS girilmemiş)"

    address = ", ".join(filter(None, [
        c.get("address"), c.get("district"), c.get("city")
    ])) or "Belirtilmemiş"

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
{services_text}

## SIK SORULAN SORULAR
{faqs_text}

## KURALLAR
1. Sıcak ve profesyonel ol — telefon görüşmesi olduğunu unutma, kısa tut
2. Her seferinde sadece 1 soru sor
3. Asla tıbbi teşhis koyma veya garanti verme
4. Fiyat sorularında kişiye özel olduğunu söyle, ücretsiz ön görüşmeye yönlendir
5. Randevu almak isteyenlerden: isim, telefon, tercih edilen gün ve saat al
6. Hastanın konuştuğu dilde yanıt ver (Türkçe/İngilizce)
7. Eğer cevaplayamadığın bir soru varsa kliniği aramasını öner: {c.get('phone', '')}
"""


# ── Çağrı sonu Supabase'e kaydet ──────────────────────────────────────────────

async def save_call_log(
    clinic_id: str,
    call_start: datetime,
    duration_seconds: int,
    transcript: list,
    phone_from: str = "",
    phone_to: str = "",
):
    try:
        sb = get_supabase()

        # Transcript'i düz metin olarak birleştir
        transcript_text = "\n".join(
            f"[{m.get('role', 'unknown')}] {m.get('content', '')}"
            for m in transcript
        ) if transcript else ""

        sb.table("voice_calls").insert({
            "clinic_id": clinic_id,
            "direction": "inbound",
            "status": "completed",
            "phone_from": phone_from,
            "phone_to": phone_to,
            "duration_seconds": duration_seconds,
            "transcript": transcript_text,
            "started_at": call_start.replace(tzinfo=timezone.utc).isoformat(),
            "ended_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

        logger.info(f"Call log saved — duration: {duration_seconds}s")
    except Exception as e:
        logger.warning(f"Call log failed: {e}")


# ── Agent entrypoint ──────────────────────────────────────────────────────────

async def entrypoint(ctx: JobContext):
    clinic_id = os.environ.get("CLINIC_ID")
    if not clinic_id:
        raise ValueError("CLINIC_ID env var is required")

    logger.info(f"New call — clinic: {clinic_id}")

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    system_prompt = await get_system_prompt(clinic_id)

    session = AgentSession(
        stt=deepgram.STT(model="nova-2", language="tr"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=cartesia.TTS(
            voice=os.environ.get("CARTESIA_VOICE_ID", "79a125e8-cd45-4c13-8a67-188112f4dd22"),
            language="tr",
        ),
        vad=silero.VAD.load(),
    )

    call_start = datetime.utcnow()
    transcript = []

    # Konuşma geçmişini topla (v1.x event adı)
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
        instructions="Aramayı sıcak bir şekilde karşıla, kliniği tanıt ve nasıl yardımcı olabileceğini sor. Kısa tut."
    )

    # Çağrı bitince kaydet
    @ctx.room.on("disconnected")
    def on_disconnected():
        duration = int((datetime.utcnow() - call_start).total_seconds())
        asyncio.create_task(
            save_call_log(clinic_id, call_start, duration, transcript)
        )


# ── Başlat ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
