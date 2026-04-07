"""
stoaix Platform Voice Agent — Multi-Tenant Inbound
LiveKit Cloud + Deepgram STT + Claude Sonnet 4.6 (default, metadata override ile değiştirilebilir) + Cartesia TTS

Her işletme aynı agent kodu — davranış DB config'inden gelir.

Room metadata:
  Inbound : {"organization_id": "uuid"}
            phone_from → SIP participant attribute 'sip.callFrom' ile okunur (room metadata'da değil)
  Outbound: {"organization_id": "uuid", "scenario": "followup", "contact_id": "...", "lead_id": "..."}
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Annotated

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    AudioConfig,
    AutoSubscribe,
    BackgroundAudioPlayer,
    BuiltinAudioClip,
    JobContext,
    RoomInputOptions,
    WorkerOptions,
    cli,
    llm,
)
from livekit.plugins import cartesia, deepgram, openai, anthropic, silero

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


# ── Calendar API helpers ───────────────────────────────────────────────────────

async def fetch_free_slots_ghl(calendar_id: str, pit_token: str) -> str:
    """GHL free-slots API'sinden sonraki 3 günün müsait saatlerini çek."""
    import urllib.request
    try:
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        start_date = now.strftime("%Y-%m-%d")
        end_date = (now + timedelta(days=3)).strftime("%Y-%m-%d")

        url = (
            f"https://services.leadconnectorhq.com/calendars/{calendar_id}/free-slots"
            f"?startDate={start_date}&endDate={end_date}&timezone=Europe%2FIstanbul"
        )
        req = urllib.request.Request(url, headers={
            "Authorization": f"Bearer {pit_token}",
            "Version": "2021-04-15",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())

        slots = data.get("slots", {})
        if not slots:
            return ""

        DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]
        lines = []
        for date, times in slots.items():
            if not times:
                continue
            d = datetime.strptime(date, "%Y-%m-%d")
            lines.append(f"{DAYS[d.weekday() + 1 if d.weekday() < 6 else 0]} ({date}): {', '.join(times[:5])}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"fetch_free_slots failed: {e}")
        return ""


async def create_appointment_ghl(
    calendar_id: str,
    pit_token: str,
    name: str,
    phone: str,
    datetime_str: str,
    notes: str = "",
) -> bool:
    """GHL'de randevu oluştur."""
    import urllib.request
    try:
        payload = json.dumps({
            "calendarId": calendar_id,
            "selectedTimezone": "Europe/Istanbul",
            "startTime": datetime_str,
            "title": f"Randevu — {name}",
            "appointmentStatus": "confirmed",
            "notes": notes,
            "contactName": name,
            "phone": phone,
        }).encode()
        req = urllib.request.Request(
            "https://services.leadconnectorhq.com/calendars/events/appointments",
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {pit_token}",
                "Version": "2021-04-15",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        logger.warning(f"create_appointment failed: {e}")
        return False


# ── Prompt builder ─────────────────────────────────────────────────────────────

def build_system_prompt(
    org: dict,
    playbook: dict,
    intake_fields: list,
    kb_context: str,
    calendar_enabled: bool = False,
) -> str:
    persona      = org.get("ai_persona", {})
    persona_name = persona.get("persona_name", "Asistan")
    fallback_no_kb = persona.get("fallback_responses", {}).get(
        "no_kb_match",
        "Bu konuda elimde net bir bilgi yok. Danışmanımıza not alıyorum."
    )

    calendar_section = (
        "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "RANDEVU ALMA:\n"
        "Kullanıcı randevu, görüşme veya uygun saat talep ederse check_availability tool'unu çağır.\n"
        "Kullanıcı uygun bir saati seçince ad ve telefon al, ardından book_appointment tool'unu çağır.\n"
    ) if calendar_enabled else ""

    must_fields  = [f for f in intake_fields if f.get("priority") == "must"]
    must_prompts = "\n".join(
        f"- {f['label']}: \"{f.get('voice_prompt', f['label'])}\"" for f in must_fields
    )

    routing = playbook.get("routing_rules", []) if playbook else []
    if isinstance(routing, dict):
        routing = routing.get("rules", [])
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
KONUŞMA KURALLARI (KATI — İSTİSNASIZ UYGULANIR):
- Her turda yalnızca 1 soru sor. Aynı anda iki soru sormak YASAK.
- Yanıtların maksimum 2 cümle olsun. Monolog yapma.
- Sayıları HER ZAMAN yazıyla söyle: "1500" yerine "bin beş yüz", "05321234567" yerine "sıfır beş üç iki bir iki üç dört beş altı yedi"
- Fiyatları yazıyla söyle: "2.500 TL" yerine "iki bin beş yüz lira"
- Tarihleri yazıyla söyle: "15.03.2026" yerine "on beş Mart iki bin yirmi altı"
- 1.000 rakamı "bin"dir, "bir bin" YANLIŞ. Örnek: 1.400 → "bin dört yüz", 1.000 → "bin"
- "Harika!", "Bunu düşünmenize bayıldım", "Mükemmel tercih!" gibi abartılı ifadeler YASAK. Doğal ve sade konuş.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BİLGİ TABANI (RAG — bu konuşma için ilgili içerik):
{kb_context if kb_context else "(Henüz sorgu yapılmadı — kullanıcı soru sorunca KB'den çekilecek)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPLANMASI GEREKEN BİLGİLER (zorunlu):
{must_prompts}

VERİ TOPLAMA TARZI (ÇOK ÖNEMLİ):
- Arayan konusunu belirtince konuyu 1 cümleyle onayla, hemen ilk soruya geç.
- Detaylı program açıklaması yapma — sadece doğrudan sorulursa, 1-2 cümle ile kısa yanıt ver.
- Bilgileri tek seferde sormak YASAK. Birer birer, sırayla sor.
- Kullanıcı zaten bir bilgiyi paylaştıysa tekrar sorma.
- Tüm zorunlu bilgiler toplandığında: "Bilgilerinizi not aldım, bir danışmanımız sizi en kısa sürede arayacak." de ve görüşmeyi nazikçe sonlandır.

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
{calendar_section}"""


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


def calculate_qualification_score(intake_fields: list, collected_data: dict) -> int:
    """Toplanan veri doluluk oranına göre 0-100 qualification score hesapla."""
    if not intake_fields or not collected_data:
        return 0

    must_fields   = [f["key"] for f in intake_fields if f.get("priority") == "must"]
    should_fields = [f["key"] for f in intake_fields if f.get("priority") == "should"]

    if not must_fields:
        return 0

    must_collected   = sum(1 for k in must_fields   if collected_data.get(k))
    should_collected = sum(1 for k in should_fields if collected_data.get(k))

    # Must alanlar %70, should alanlar %30 ağırlık
    must_score   = (must_collected   / len(must_fields))   * 70 if must_fields   else 0
    should_score = (should_collected / len(should_fields)) * 30 if should_fields else 0

    return min(100, round(must_score + should_score))


async def generate_call_summary(transcript: list, collected_data: dict, org_name: str) -> str:
    """GPT-4o mini ile konuşmanın kısa AI özetini üret."""
    if not transcript:
        return ""
    try:
        from openai import OpenAI as OpenAIClient
        oa = OpenAIClient(api_key=os.environ["OPENAI_API_KEY"])

        transcript_text = "\n".join(
            f"[{m['role']}] {m['content']}"
            for m in transcript
            if m.get("role") in ("user", "assistant")
        )
        data_str = ", ".join(f"{k}: {v}" for k, v in collected_data.items() if v)

        prompt = f"""Aşağıdaki sesli görüşmeyi 2-3 cümleyle özetle. Türkçe yaz.
Müşterinin ilgilendiği konu, temel bilgileri ve sonraki adım varsa belirt.
Toplanan veriler: {data_str or 'yok'}

Konuşma:
{transcript_text[:3000]}

Özet:"""

        resp = oa.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"summary generation failed: {e}")
        return ""


async def update_lead_data(lead_id: str, intake_fields: list, collected_data: dict, summary: str = ""):
    """collected_data, data_completeness, missing_fields, score ve özet güncelle."""
    if not lead_id:
        return
    try:
        must_keys = {f["key"] for f in intake_fields if f.get("priority") == "must"}

        completeness = {
            f["key"]: ("collected" if collected_data.get(f["key"]) else "not_collected")
            for f in intake_fields
        }
        missing = [k for k in must_keys if not collected_data.get(k)]
        score   = calculate_qualification_score(intake_fields, collected_data)

        update_payload = {
            "collected_data":      collected_data,
            "data_completeness":   completeness,
            "missing_fields":      missing,
            "qualification_score": score,
            "status":              "in_progress" if collected_data else "new",
        }
        if summary:
            update_payload["ai_summary"] = summary

        sb = get_supabase()
        sb.table("leads").update(update_payload).eq("id", lead_id).execute()
        logger.info(f"lead updated — score: {score}, missing: {missing}")
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
        else:
            # Caller number unavailable — create anonymous contact so conversation insert doesn't fail
            res = sb.table("contacts").insert({
                "organization_id": org_id,
                "status":          "anonymous",
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


# ── SIP yardımcıları ───────────────────────────────────────────────────────────

def _get_sip_caller_number(ctx: JobContext) -> str:
    """
    Inbound SIP aramasında arayan numarasını LiveKit participant attribute'larından okur.
    LiveKit, SIP katılımcısına otomatik olarak 'sip.callFrom' attribute'u set eder.
    Room metadata'daki 'phone_from' (dispatch rule'da statik) yerine bu kullanılmalı.
    """
    for participant in ctx.room.remote_participants.values():
        attrs = participant.attributes or {}
        call_from = attrs.get("sip.callFrom", "")
        if call_from:
            return call_from if call_from.startswith("+") else "+" + call_from
    return ""


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

    # metadata'dan model oku, default Claude Sonnet 4.6
    llm_model = meta.get("model", "claude-sonnet-4-6")
    if llm_model.startswith("claude-"):
        llm_instance = anthropic.LLM(model=llm_model)
    else:
        llm_instance = openai.LLM(model=llm_model)

    org      = await load_org(org_id)
    playbook = await load_playbook(org_id, channel="voice")
    intake   = await load_intake_schema(org_id, channel="voice")

    persona      = org.get("ai_persona", {})
    persona_name = persona.get("persona_name", "Asistan")
    lang         = meta.get("lang") or persona.get("language", "tr")
    room_name    = ctx.room.name

    # Calendar feature
    features         = (playbook or {}).get("features", {}) if playbook else {}
    calendar_enabled = features.get("calendar_booking", False)
    crm_config       = org.get("crm_config", {})
    calendar_id      = crm_config.get("calendar_id", "")
    pit_token        = crm_config.get("pit_token", "")
    if not (calendar_id and pit_token):
        calendar_enabled = False

    logger.info(f"{'Outbound' if scenario else 'Inbound'} — org: {org['name']} | lang: {lang} | scenario: {scenario}")

    # Handoff keyword listesi (runtime'da kontrol için)
    handoff_keywords = []
    if playbook:
        handoff_keywords = playbook.get("handoff_triggers", {}).get("keywords", [])

    # ── İnbound ───────────────────────────────────────────────────────────────
    if not scenario:
        initial_kb = ""  # Başlangıçta KB yükleme — şehir/ofis varsayımını önler, sorular gelince dinamik yüklenir
        system_prompt = build_system_prompt(org, playbook, intake, initial_kb, calendar_enabled)
        opening    = (playbook or {}).get("opening_message") or f"Merhaba, {org['name']}."
        direction  = "inbound"
        phone_from = _get_sip_caller_number(ctx) or meta.get("phone_from", "")
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

        # If contact_id wasn't passed in metadata, upsert from phone_to so conversation insert never fails
        if not contact_id:
            contact_id, fallback_lead_id = await upsert_contact_and_lead(
                org_id, phone_to, org["name"], source="voice_outbound"
            )
            if not lead_id:
                lead_id = fallback_lead_id

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

    # ── Calendar tools (only if feature enabled) ───────────────────────────────
    fnc_ctx = None
    if calendar_enabled:
        fnc_ctx = llm.FunctionContext()

        @fnc_ctx.ai_callable(description="Müsait randevu saatlerini listeler. Kullanıcı randevu/görüşme istediğinde çağır.")
        async def check_availability(
            date: Annotated[str, llm.TypeInfo(description="Kontrol edilecek tarih, YYYY-MM-DD formatında. Belirtilmezse yakın 3 günü döndür.")] = ""
        ) -> str:
            slots = await fetch_free_slots_ghl(calendar_id, pit_token)
            if not slots:
                return "TAKVİM_HATA: Takvime şu an erişemiyorum. Kullanıcıya ekibimizin en kısa sürede kendisini arayacağını söyle ve görüşmeyi nazikçe sonlandır."
            return f"Müsait saatler:\n{slots}"

        @fnc_ctx.ai_callable(description="Randevu oluşturur. Kullanıcı ad, telefon ve saat bilgisini verdikten sonra çağır.")
        async def book_appointment(
            name: Annotated[str, llm.TypeInfo(description="Randevu sahibinin adı soyadı")],
            phone: Annotated[str, llm.TypeInfo(description="Telefon numarası, +90 ile başlayan format")],
            datetime_str: Annotated[str, llm.TypeInfo(description="Randevu tarihi ve saati, YYYY-MM-DDTHH:MM formatında")],
            notes: Annotated[str, llm.TypeInfo(description="Ek notlar veya özel istekler")] = "",
        ) -> str:
            ok = await create_appointment_ghl(calendar_id, pit_token, name, phone, datetime_str, notes)
            if ok:
                return f"Randevunuz oluşturuldu: {name}, {datetime_str}. Onay bilgisi size iletilecektir."
            return "Randevu oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin veya bizi arayın."

    # ── Session ───────────────────────────────────────────────────────────────
    VOICE_IDS = {
        "tr": os.environ.get("CARTESIA_VOICE_ID_TR", "c1cfee3d-532d-47f8-8dd2-8e5b2b66bf1d"),
        "en": os.environ.get("CARTESIA_VOICE_ID_EN", "b7d50908-b17c-442d-ad8d-810c63997ed9"),
    }
    tts_lang = lang if lang in VOICE_IDS else "tr"

    session = AgentSession(
        stt=deepgram.STT(model="nova-2", language=tts_lang),
        llm=llm_instance,
        tts=cartesia.TTS(
            model="sonic-3",
            voice=VOICE_IDS[tts_lang],
            language=tts_lang,
        ),
        vad=silero.VAD.load(),
        **({"fnc_ctx": fnc_ctx} if fnc_ctx else {}),
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

    background_audio = BackgroundAudioPlayer(
        ambient_sound=AudioConfig(BuiltinAudioClip.OFFICE_AMBIENCE, volume=0.7),
        thinking_sound=[
            AudioConfig(BuiltinAudioClip.KEYBOARD_TYPING, volume=0.6),
            AudioConfig(BuiltinAudioClip.KEYBOARD_TYPING2, volume=0.6),
        ],
    )
    await background_audio.start(room=ctx.room, agent_session=session)

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

    # 2. Collected data çıkar, AI özet üret, lead güncelle
    collected_data = {}
    missing_fields = []
    summary        = ""
    if lead_id and intake:
        collected_data = await extract_collected_data(transcript, intake)
        summary        = await generate_call_summary(transcript, collected_data, org_id)
        await update_lead_data(lead_id, intake, collected_data, summary)
        must_keys      = {f["key"] for f in intake if f.get("priority") == "must"}
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
