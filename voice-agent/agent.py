"""
stoaix Voice Agent — Inbound Receptionist
LiveKit Cloud + Deepgram STT + GPT-4o Mini + Cartesia TTS
"""

import asyncio
import logging
import os
import json
from datetime import datetime
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
from livekit.plugins import cartesia, deepgram, openai, silero, turn_detector

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stoaix-voice")


# ── Supabase'den klinik KB çek ────────────────────────────────────────────────

async def get_system_prompt(clinic_id: str) -> str:
    from supabase import create_client

    sb = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    clinic_res  = sb.table("clinics").select("*").eq("id", clinic_id).single().execute()
    services_res = sb.table("clinic_services").select("name,description,price_range").eq("clinic_id", clinic_id).eq("is_active", True).execute()
    faqs_res    = sb.table("clinic_faqs").select("question,answer").eq("clinic_id", clinic_id).eq("is_active", True).execute()

    c = clinic_res.data
    if not c:
        raise ValueError(f"Clinic not found: {clinic_id}")

    services_text = "\n".join(
        f"- {s['name']}" + (f": {s['description']}" if s.get("description") else "")
        + (f" ({s['price_range']})" if s.get("price_range") else "")
        for s in (services_res.data or [])
    ) or "(Hizmet bilgisi girilmemiş)"

    faqs_text = "\n\n".join(
        f"S: {f['question']}\nC: {f['answer']}"
        for f in (faqs_res.data or [])
    ) or "(SSS girilmemiş)"

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


# ── Çağrı sonu n8n'e log at ──────────────────────────────────────────────────

async def log_call_to_n8n(clinic_id: str, transcript: list, duration_seconds: int):
    webhook_url = os.environ.get("N8N_CALL_LOG_WEBHOOK")
    if not webhook_url:
        return

    import urllib.request

    payload = json.dumps({
        "clinic_id": clinic_id,
        "timestamp": datetime.utcnow().isoformat(),
        "duration_seconds": duration_seconds,
        "transcript": transcript,
    }).encode("utf-8")

    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=5)
        logger.info("Call log sent to n8n")
    except Exception as e:
        logger.warning(f"n8n log failed: {e}")


# ── Agent entrypoint ──────────────────────────────────────────────────────────

async def entrypoint(ctx: JobContext):
    clinic_id = os.environ.get("CLINIC_ID")
    if not clinic_id:
        raise ValueError("CLINIC_ID env var is required")

    logger.info(f"New call — clinic: {clinic_id}")

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Klinik KB'sini çek
    system_prompt = await get_system_prompt(clinic_id)

    session = AgentSession(
        stt=deepgram.STT(model="nova-2"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=cartesia.TTS(
            voice_id=os.environ.get("CARTESIA_VOICE_ID", "79a125e8-cd45-4c13-8a67-188112f4dd22"),
        ),
        vad=silero.VAD.load(),
        turn_detection=turn_detector.MultilingualModel(),
    )

    call_start = datetime.utcnow()

    await session.start(
        room=ctx.room,
        agent=Agent(instructions=system_prompt),
        room_input_options=RoomInputOptions(noise_cancellation=True),
    )

    # İlk selamlama
    await session.generate_reply(
        instructions="Aramayı sıcak bir şekilde karşıla, kliniği tanıt ve nasıl yardımcı olabileceğini sor. Kısa tut."
    )

    # Çağrı bitince log at
    @ctx.room.on("disconnected")
    def on_disconnected():
        duration = int((datetime.utcnow() - call_start).total_seconds())
        logger.info(f"Call ended — duration: {duration}s")
        asyncio.create_task(
            log_call_to_n8n(clinic_id, [], duration)
        )


# ── Başlat ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
