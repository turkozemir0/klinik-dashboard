"""
stoaix Platform Voice Agent — Multi-Tenant Inbound
LiveKit Cloud + Deepgram STT + GPT-4o Mini + Cartesia TTS

Her işletme aynı agent kodu — davranış DB config'inden gelir.

Room metadata:
  Inbound : {"organization_id": "uuid"}
  Outbound: {"organization_id": "uuid", "scenario": "followup", "contact_id": "...", "lead_id": "..."}
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
logger = logging.getLogger("stoaix-platform")


# ── Supabase client ────────────────────────────────────────────────────────────

def get_supabase():
    from supabase import create_client
    return create_client(
        os.environ["PLATFORM_SUPABASE_URL"],
        os.environ["PLATFORM_SUPABASE_SERVICE_KEY"],
    )


# ── DB yükleyiciler ────────────────────────────────────────────────────────────

async def load_org(org_id: str) -> dict:
    sb = get_supabase()
    res = sb.table("organizations").select("*").eq("id", org_id).single().execute()
    if not res.data:
        raise ValueError(f"Organization not found: {org_id}")
    return res.data


async def load_playbook(org_id: str, channel: str = "voice") -> dict | None:
    sb = get_supabase()
    res = sb.table("agent_playbooks") \
        .select("*") \
        .eq("organization_id", org_id) \
        .eq("is_active", True) \
        .eq("channel", channel) \
        .order("version", desc=True) \
        .limit(1) \
        .execute()
    if res.data:
        return res.data[0]
    # channel-specific bulunamazsa "all" playbook'a düş
    res2 = sb.table("agent_playbooks") \
        .select("*") \
        .eq("organization_id", org_id) \
        .eq("is_active", True) \
        .eq("channel", "all") \
        .order("version", desc=True) \
        .limit(1) \
        .execute()
    return res2.data[0] if res2.data else None


async def load_intake_schema(org_id: str, channel: str = "voice") -> list:
    sb = get_supabase()
    res = sb.table("intake_schemas") \
        .select("fields") \
        .eq("organization_id", org_id) \
        .eq("is_active", True) \
        .eq("channel", channel) \
        .limit(1) \
        .execute()
    if res.data:
        return res.data[0].get("fields", [])
    # channel-specific bulunamazsa "all"'a düş
    res2 = sb.table("intake_schemas") \
        .select("fields") \
        .eq("organization_id", org_id) \
        .eq("is_active", True) \
        .eq("channel", "all") \
        .limit(1) \
        .execute()
    return res2.data[0].get("fields", []) if res2.data else []


async def vector_search_kb(org_id: str, query: str, limit: int = 5) -> str:
    """Kullanıcının sorusuna en yakın KB itemlarını döndür."""
    try:
        from openai import OpenAI as OpenAIClient
        oa = OpenAIClient(api_key=os.environ["OPENAI_API_KEY"])

        embed_resp = oa.embeddings.create(
            model="text-embedding-3-small",
            input=query,
            encoding_format="float"
        )
        query_vector = embed_resp.data[0].embedding
        vec_str = "[" + ",".join(str(x) for x in query_vector) + "]"

        sb = get_supabase()
        res = sb.rpc("match_knowledge_items", {
            "org_id": org_id,
            "query_vector": vec_str,
            "match_count": limit
        }).execute()

        if not res.data:
            return ""

        chunks = []
        for item in res.data:
            sim = item.get("similarity", 0)
            if sim < 0.3:
                continue
            chunks.append(f"[{item['title']}]\n{item['description_for_ai']}")

        return "\n\n---\n\n".join(chunks)

    except Exception as e:
        logger.warning(f"KB search failed: {e}")
        return ""


# ── Prompt builder ─────────────────────────────────────────────────────────────

def build_system_prompt(
    org: dict,
    playbook: dict,
    intake_fields: list,
    kb_context: str,
) -> str:
    persona      = org.get("ai_persona", {})
    persona_name = persona.get("persona_name", "Asistan")
    fallback_no_kb = persona.get("fallback_responses", {}).get(
        "no_kb_match",
        "Bu konuda elimde net bir bilgi yok. Danışmanımıza not alıyorum."
    )

    must_fields  = [f for f in intake_fields if f.get("priority") == "must"]
    must_prompts = "\n".join(
        f"- {f['label']}: \"{f.get('voice_prompt', f['label'])}\"" for f in must_fields
    )

    routing = playbook.get("routing_rules", []) if playbook else []
    routing_text = ""
    for r in routing:
        routing_text += f"\n- {r.get('description','')}: {r.get('response_template','')}"

    blocks = playbook.get("hard_blocks", []) if playbook else []
    blocks_text = ""
    for b in blocks:
        kw = ", ".join(b.get("keywords", []))
        blocks_text += f"\n- [{b.get('trigger_id','')}] Anahtar kelimeler: {kw} → \"{b.get('response','')}\""

    triggers = playbook.get("handoff_triggers", {}) if playbook else {}
    handoff_keywords = ", ".join(triggers.get("keywords", []))

    base_prompt = playbook.get("system_prompt_template", "") if playbook else ""

    return f"""{base_prompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KONUŞMA KURALLARI:
- Sayıları HER ZAMAN yazıyla söyle: "1500" yerine "bin beş yüz", "05321234567" yerine "sıfır beş üç iki bir iki üç dört beş altı yedi"
- Fiyatları yazıyla söyle: "2.500 TL" yerine "iki bin beş yüz lira"
- Tarihleri yazıyla söyle: "15.03.2026" yerine "on beş Mart iki bin yirmi altı"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BİLGİ TABANI (RAG — bu konuşma için ilgili içerik):
{kb_context if kb_context else "(Henüz sorgu yapılmadı — kullanıcı soru sorunca KB'den çekilecek)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPLANMASI GEREKEN BİLGİLER (zorunlu):
{must_prompts}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YÖNLENDİRME KURALLARI:{routing_text if routing_text else " (tanımlı kural yok)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KAPSAM DIŞI KONULAR (bu tetiklenince aşağıdaki yanıtı ver):{blocks_text if blocks_text else " (tanımlı blok yok)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDOFF TETİKLEYİCİLER:
Şu kelimeler duyulursa HEMEN danışmana aktar: {handoff_keywords}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HALÜSİNASYON KURALI:
{fallback_no_kb}
"""


# ── Agent sınıfı ───────────────────────────────────────────────────────────────

class PlatformAgent(Agent):
    def __init__(self, instructions: str, org_id: str, lang: str = "tr"):
        super().__init__(instructions=instructions)
        self.org_id      = org_id
        self.lang        = lang
        self._kb_queried = set()

    async def on_user_turn_completed(self, turn_ctx, new_message):
        user_text = ""
        if hasattr(new_message, "content"):
            c = new_message.content
            user_text = c if isinstance(c, str) else str(c)

        if not user_text or user_text in self._kb_queried:
            return

        self._kb_queried.add(user_text)
        kb_result = await vector_search_kb(self.org_id, user_text)
        if kb_result:
            turn_ctx.add_message(
                role="system",
                content=f"[KB Bağlamı — Bu soruyla ilgili bilgi tabanı içeriği:]\n{kb_result}"
            )


# ── DB yazıcılar ───────────────────────────────────────────────────────────────

async def create_conversation(
    org_id: str,
    contact_id: str | None,
    lead_id: str | None,
    room_name: str,
) -> str | None:
    """Çağrı başında conversations kaydı aç."""
    try:
        sb = get_supabase()
        res = sb.table("conversations").insert({
            "organization_id": org_id,
            "contact_id":      contact_id,
            "lead_id":         lead_id,
            "channel":         "voice",
            "status":          "active",
            "channel_metadata": {"livekit_room": room_name},
        }).execute()
        conv_id = res.data[0]["id"] if res.data else None
        logger.info(f"conversation created: {conv_id}")
        return conv_id
    except Exception as e:
        logger.warning(f"conversation create failed: {e}")
        return None


async def close_conversation(conv_id: str):
    try:
        sb = get_supabase()
        sb.table("conversations").update({
            "status":   "closed",
            "ended_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", conv_id).execute()
    except Exception as e:
        logger.warning(f"conversation close failed: {e}")


async def save_messages(conv_id: str, org_id: str, transcript: list):
    """Transcript'i messages tablosuna yaz."""
    if not conv_id or not transcript:
        return
    try:
        sb = get_supabase()
        rows = [
            {
                "conversation_id": conv_id,
                "organization_id": org_id,
                "role":            m["role"],
                "content":         m["content"],
                "content_type":    "audio_transcript",
            }
            for m in transcript
            if m.get("role") in ("user", "assistant") and m.get("content")
        ]
        if rows:
            sb.table("messages").insert(rows).execute()
            logger.info(f"messages saved: {len(rows)} rows")
    except Exception as e:
        logger.warning(f"messages save failed: {e}")


async def extract_collected_data(transcript: list, intake_fields: list) -> dict:
    """LLM ile transcript'ten structured data çıkar."""
    if not transcript or not intake_fields:
        return {}
    try:
        from openai import OpenAI as OpenAIClient
        oa = OpenAIClient(api_key=os.environ["OPENAI_API_KEY"])

        field_defs = "\n".join(
            f"- {f['key']} ({f['label']}): {f.get('type', 'text')}"
            for f in intake_fields
        )
        transcript_text = "\n".join(
            f"[{m['role']}] {m['content']}"
            for m in transcript
            if m.get("role") in ("user", "assistant")
        )

        prompt = f"""Aşağıdaki sesli görüşme transkripsiyonundan şu bilgileri çıkar ve JSON formatında döndür.
Her field için kullanıcının verdiği değeri yaz, vermemişse null koy.

Toplanacak bilgiler:
{field_defs}

Konuşma:
{transcript_text[:4000]}

Sadece JSON döndür. Örnek: {{"full_name": "Ali Veli", "phone": null, "budget": "50000"}}"""

        resp = oa.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=500,
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        logger.warning(f"collected_data extraction failed: {e}")
        return {}


async def update_lead_data(lead_id: str, intake_fields: list, collected_data: dict):
    """collected_data, data_completeness, missing_fields güncelle."""
    if not lead_id:
        return
    try:
        must_keys = {f["key"] for f in intake_fields if f.get("priority") == "must"}

        completeness = {
            f["key"]: ("collected" if collected_data.get(f["key"]) else "not_collected")
            for f in intake_fields
        }
        missing = [k for k in must_keys if not collected_data.get(k)]

        sb = get_supabase()
        sb.table("leads").update({
            "collected_data":    collected_data,
            "data_completeness": completeness,
            "missing_fields":    missing,
            "status":            "in_progress" if collected_data else "new",
        }).eq("id", lead_id).execute()
        logger.info(f"lead data updated — missing: {missing}")
    except Exception as e:
        logger.warning(f"lead data update failed: {e}")


async def save_handoff(
    org_id:         str,
    lead_id:        str | None,
    conv_id:        str | None,
    trigger_reason: str,
    summary:        str,
    collected_data: dict,
    missing_fields: list,
):
    """Handoff log oluştur ve lead'i güncelle."""
    try:
        sb = get_supabase()
        sb.table("handoff_logs").insert({
            "organization_id":         org_id,
            "lead_id":                 lead_id,
            "conversation_id":         conv_id,
            "trigger_reason":          trigger_reason,
            "summary":                 summary,
            "collected_data_snapshot": collected_data,
            "missing_at_handoff":      missing_fields,
            "status":                  "pending",
        }).execute()

        if lead_id:
            sb.table("leads").update({
                "status":            "handed_off",
                "handoff_triggered": True,
                "handoff_at":        datetime.now(timezone.utc).isoformat(),
                "handoff_summary":   summary,
            }).eq("id", lead_id).execute()

        logger.info(f"handoff_log saved — reason: {trigger_reason}")
    except Exception as e:
        logger.warning(f"handoff save failed: {e}")


async def save_call(
    org_id:          str,
    direction:       str,
    call_start:      datetime,
    duration:        int,
    transcript:      list,
    phone_from:      str = "",
    phone_to:        str = "",
    contact_id:      str | None = None,
    lead_id:         str | None = None,
    conversation_id: str | None = None,
    metadata:        dict | None = None,
):
    try:
        sb = get_supabase()
        transcript_text = "\n".join(
            f"[{m.get('role','?')}] {m.get('content','')}"
            for m in transcript
        )
        sb.table("voice_calls").insert({
            "organization_id": org_id,
            "contact_id":      contact_id,
            "conversation_id": conversation_id,
            "lead_id":         lead_id,
            "direction":       direction,
            "status":          "completed",
            "phone_from":      phone_from,
            "phone_to":        phone_to,
            "duration_seconds": duration,
            "transcript":      transcript_text,
            "livekit_room_name": (metadata or {}).get("livekit_room"),
            "started_at":      call_start.replace(tzinfo=timezone.utc).isoformat(),
            "ended_at":        datetime.now(timezone.utc).isoformat(),
            **({"metadata": metadata} if metadata else {}),
        }).execute()
        logger.info(f"voice_call saved — {direction}, {duration}s")
    except Exception as e:
        logger.warning(f"voice_call save failed: {e}")


async def upsert_contact_and_lead(
    org_id:     str,
    phone_from: str,
    org_name:   str,
    source:     str = "voice_inbound",
) -> tuple[str | None, str | None]:
    try:
        sb = get_supabase()
        contact_id = None
        lead_id    = None

        if phone_from:
            existing = sb.table("contacts") \
                .select("id") \
                .eq("organization_id", org_id) \
                .eq("phone", phone_from) \
                .limit(1) \
                .execute()

            if existing.data:
                contact_id = existing.data[0]["id"]
            else:
                res = sb.table("contacts").insert({
                    "organization_id": org_id,
                    "phone":           phone_from,
                    "status":          "new",
                    "source_channel":  source,
                }).execute()
                if res.data:
                    contact_id = res.data[0]["id"]

        if contact_id:
            open_lead = sb.table("leads") \
                .select("id") \
                .eq("organization_id", org_id) \
                .eq("contact_id", contact_id) \
                .in_("status", ["new", "in_progress"]) \
                .limit(1) \
                .execute()

            if open_lead.data:
                lead_id = open_lead.data[0]["id"]
            else:
                res = sb.table("leads").insert({
                    "organization_id": org_id,
                    "contact_id":      contact_id,
                    "status":          "new",
                    "source_channel":  source,
                    "collected_data":  {},
                    "data_completeness": {},
                    "missing_fields":  [],
                }).execute()
                if res.data:
                    lead_id = res.data[0]["id"]

        return contact_id, lead_id

    except Exception as e:
        logger.warning(f"contact/lead upsert failed: {e}")
        return None, None


# ── Entrypoint ─────────────────────────────────────────────────────────────────

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    try:
        meta = json.loads(ctx.room.metadata or "{}")
    except json.JSONDecodeError:
        meta = {}

    org_id   = meta.get("organization_id") or os.environ.get("PLATFORM_ORG_ID")
    scenario = meta.get("scenario")

    if not org_id:
        raise ValueError("organization_id missing in room metadata and PLATFORM_ORG_ID env not set")

    org      = await load_org(org_id)
    playbook = await load_playbook(org_id, channel="voice")
    intake   = await load_intake_schema(org_id, channel="voice")

    persona      = org.get("ai_persona", {})
    persona_name = persona.get("persona_name", "Asistan")
    lang         = meta.get("lang") or persona.get("language", "tr")
    room_name    = ctx.room.name

    logger.info(f"{'Outbound' if scenario else 'Inbound'} — org: {org['name']} | lang: {lang} | scenario: {scenario}")

    # Handoff keyword listesi (runtime'da kontrol için)
    handoff_keywords = []
    if playbook:
        handoff_keywords = playbook.get("handoff_triggers", {}).get("keywords", [])

    # ── İnbound ───────────────────────────────────────────────────────────────
    if not scenario:
        initial_kb = await vector_search_kb(org_id, "genel bilgi hizmetler")
        system_prompt = build_system_prompt(org, playbook, intake, initial_kb)
        opening    = f"Merhaba, {org['name']}, ben {persona_name} — buyurun, sizi dinliyorum."
        direction  = "inbound"
        phone_from = meta.get("phone_from", "")
        phone_to   = os.environ.get("PLATFORM_INBOUND_NUMBER", "")

        contact_id, lead_id = await upsert_contact_and_lead(
            org_id, phone_from, org["name"], source="voice_inbound"
        )

    # ── Outbound ──────────────────────────────────────────────────────────────
    else:
        contact_name = meta.get("contact_name", "")
        phone_to     = meta.get("phone_to", "")
        lead_id      = meta.get("lead_id") or None
        contact_id   = meta.get("contact_id") or None
        context_note = meta.get("context_note", "")

        outbound_playbook_text = playbook.get("system_prompt_template", "") if playbook else ""
        system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına arayan {persona_name}'sın.
Arama yapılan kişi: {contact_name}
Arama amacı: {scenario}
{f"Bağlam notu: {context_note}" if context_note else ""}

KURAL: Kısa ve doğal konuş. Zorlayıcı olma.
KURAL: Bilgi tabanında olmayan bir şeyi asla uydurma.
"""
        opening = (
            f"Merhaba{', ' + contact_name if contact_name else ''}! "
            f"Ben {org['name']}'dan {persona_name} arıyorum. "
            f"Şu an uygun musunuz, iki dakikanız var mı?"
        )
        direction  = "outbound"
        phone_from = os.environ.get("PLATFORM_OUTBOUND_NUMBER", "")

    # ── Conversation aç ───────────────────────────────────────────────────────
    conv_id = await create_conversation(org_id, contact_id, lead_id, room_name)

    # ── Session ───────────────────────────────────────────────────────────────
    VOICE_IDS = {
        "tr": os.environ.get("CARTESIA_VOICE_ID_TR", "c1cfee3d-532d-47f8-8dd2-8e5b2b66bf1d"),
        "en": os.environ.get("CARTESIA_VOICE_ID_EN", "b7d50908-b17c-442d-ad8d-810c63997ed9"),
    }
    tts_lang = lang if lang in VOICE_IDS else "tr"

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

    call_start     = datetime.utcnow()
    transcript     = []
    handoff_reason = None   # handoff tetiklendiyse sebebi

    @session.on("conversation_item_added")
    def on_item(ev):
        nonlocal handoff_reason
        item    = ev.item
        role    = getattr(item, "role", None)
        content = getattr(item, "content", None)
        if role and content:
            text = content if isinstance(content, str) else str(content)
            transcript.append({"role": role, "content": text})

            # Handoff keyword kontrolü (user mesajlarında)
            if role == "user" and handoff_keywords and handoff_reason is None:
                text_lower = text.lower()
                for kw in handoff_keywords:
                    if kw.lower() in text_lower:
                        handoff_reason = "user_requested"
                        logger.info(f"Handoff triggered by keyword: {kw}")
                        break

    await session.start(
        agent=PlatformAgent(instructions=system_prompt, org_id=org_id, lang=tts_lang),
        room=ctx.room,
        room_input_options=RoomInputOptions(noise_cancellation=True),
    )

    await session.generate_reply(instructions=opening)

    @ctx.room.on("disconnected")
    def on_disconnected():
        asyncio.create_task(_save_all(
            org_id=org_id,
            direction=direction,
            call_start=call_start,
            transcript=transcript,
            phone_from=phone_from,
            phone_to=phone_to,
            contact_id=contact_id,
            lead_id=lead_id,
            conv_id=conv_id,
            intake=intake,
            handoff_reason=handoff_reason,
            room_name=room_name,
        ))


async def _save_all(
    org_id, direction, call_start, transcript,
    phone_from, phone_to, contact_id, lead_id,
    conv_id, intake, handoff_reason, room_name,
):
    """Çağrı bittikten sonra tüm DB yazımlarını sırayla yap."""
    duration = int((datetime.utcnow() - call_start).total_seconds())

    # 1. Messages
    await save_messages(conv_id, org_id, transcript)

    # 2. Collected data çıkar ve lead güncelle
    collected_data = {}
    missing_fields = []
    if lead_id and intake:
        collected_data = await extract_collected_data(transcript, intake)
        await update_lead_data(lead_id, intake, collected_data)
        must_keys = {f["key"] for f in intake if f.get("priority") == "must"}
        missing_fields = [k for k in must_keys if not collected_data.get(k)]

    # 3. Handoff log
    if handoff_reason:
        summary = f"Handoff tetiklendi ({handoff_reason}). Konuşma süresi: {duration}s."
        await save_handoff(
            org_id=org_id,
            lead_id=lead_id,
            conv_id=conv_id,
            trigger_reason=handoff_reason,
            summary=summary,
            collected_data=collected_data,
            missing_fields=missing_fields,
        )
        if conv_id:
            get_supabase().table("conversations").update({"status": "handed_off"}).eq("id", conv_id).execute()
    else:
        # 4. Conversation kapat
        if conv_id:
            await close_conversation(conv_id)

    # 5. Voice call kaydet
    await save_call(
        org_id=org_id,
        direction=direction,
        call_start=call_start,
        duration=duration,
        transcript=transcript,
        phone_from=phone_from,
        phone_to=phone_to,
        contact_id=contact_id,
        lead_id=lead_id,
        conversation_id=conv_id,
        metadata={"livekit_room": room_name},
    )

    logger.info(f"All data saved — duration: {duration}s, handoff: {handoff_reason}")


# ── Başlat ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        agent_name="stoaix-platform",
    ))
