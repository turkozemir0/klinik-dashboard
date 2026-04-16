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
import re
import urllib.parse
from datetime import datetime, timedelta, timezone
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

async def fetch_free_slots_ghl(calendar_id: str, pit_token: str, days: int = 3) -> str:
    """GHL free-slots API'sinden sonraki N günün müsait saatlerini çek."""
    import urllib.request
    try:
        now = datetime.now(timezone.utc)
        start_date = now.strftime("%Y-%m-%d")
        end_date = (now + timedelta(days=days)).strftime("%Y-%m-%d")

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


# ── Calendar Adapters ──────────────────────────────────────────────────────────

class CalendarAdapter:
    """Base class — all adapters must implement these methods."""

    async def get_free_slots(self, days: int = 3) -> str:
        """Returns a formatted multi-line string of available slots, or '' if unavailable."""
        raise NotImplementedError

    async def create_appointment(
        self, name: str, phone: str, datetime_str: str, notes: str = ""
    ) -> dict:
        """Returns {'success': bool, 'appointment_id': str|None, 'error': str|None}."""
        raise NotImplementedError


class GHLCalendarAdapter(CalendarAdapter):
    def __init__(self, calendar_id: str, pit_token: str):
        self.calendar_id = calendar_id
        self.pit_token   = pit_token

    async def get_free_slots(self, days: int = 3) -> str:
        return await fetch_free_slots_ghl(self.calendar_id, self.pit_token, days)

    async def create_appointment(self, name, phone, datetime_str, notes="") -> dict:
        ok = await create_appointment_ghl(self.calendar_id, self.pit_token, name, phone, datetime_str, notes)
        return {"success": ok, "appointment_id": None, "error": None if ok else "GHL appointment creation failed"}


class GoogleCalendarAdapter(CalendarAdapter):
    """Google Calendar adapter — getFreeSlots not supported for voice (no slots API)."""

    def __init__(self, cal_config: dict):
        self.cal_config = cal_config

    async def get_free_slots(self, days: int = 3) -> str:
        # Google Calendar has no "available slots" API without a scheduling layer.
        return ""

    async def create_appointment(self, name, phone, datetime_str, notes="") -> dict:
        import urllib.request
        try:
            cal_id   = urllib.parse.quote(self.cal_config.get("calendar_id", "primary"), safe="")
            token    = self.cal_config.get("access_token", "")
            end_dt   = (datetime.fromisoformat(datetime_str) + timedelta(hours=1)).isoformat()
            payload  = json.dumps({
                "summary":     f"Randevu — {name}",
                "description": notes,
                "start":       {"dateTime": datetime_str, "timeZone": "Europe/Istanbul"},
                "end":         {"dateTime": end_dt,       "timeZone": "Europe/Istanbul"},
            }).encode()
            req = urllib.request.Request(
                f"https://www.googleapis.com/calendar/v3/calendars/{cal_id}/events",
                data=payload,
                method="POST",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type":  "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read())
                return {"success": True, "appointment_id": data.get("id"), "error": None}
        except Exception as e:
            logger.warning(f"GoogleCalendarAdapter.create_appointment failed: {e}")
            return {"success": False, "appointment_id": None, "error": str(e)}


def get_calendar_adapter(org: dict) -> CalendarAdapter | None:
    """
    Returns the appropriate CalendarAdapter for the org, or None if not configured.

    Resolution order:
    1. channel_config.calendar.provider = 'google'    → GoogleCalendarAdapter
    2. channel_config.calendar.provider = 'dentsoft'  → None (skeleton, API docs pending)
    3. crm_config.calendar_id + pit_token present     → GHLCalendarAdapter (legacy)
    4. otherwise → None
    """
    channel_config = org.get("channel_config") or {}
    cal_config     = channel_config.get("calendar") or {}
    provider       = cal_config.get("provider", "none")

    if provider == "google":
        if not cal_config.get("access_token"):
            return None
        return GoogleCalendarAdapter(cal_config)

    if provider == "dentsoft":
        # Dentsoft adapter not yet implemented — API docs pending
        return None

    # Legacy GHL: crm_config.calendar_id + crm_config.pit_token
    crm_config   = org.get("crm_config") or {}
    calendar_id  = crm_config.get("calendar_id", "")
    pit_token    = crm_config.get("pit_token", "")
    if calendar_id and pit_token:
        return GHLCalendarAdapter(calendar_id, pit_token)

    return None


# ── Appointment helpers ─────────────────────────────────────────────────────────

async def save_appointment_to_db(
    supabase,
    org_id:           str,
    contact_id:       str | None,
    lead_id:          str | None,
    conv_id:          str | None,
    datetime_str:     str,
    duration_minutes: int = 60,
    notes:            str = "",
    source:           str = "ai",
    external_id:      str | None = None,
) -> None:
    """
    Inserts a row into appointments table.
    Fire-and-forget — failure only logs a warning.
    """
    try:
        scheduled_at = datetime_str if "T" in datetime_str else f"{datetime_str}T00:00:00"
        supabase.table("appointments").insert({
            "organization_id":  org_id,
            "contact_id":       contact_id,
            "lead_id":          lead_id,
            "conversation_id":  conv_id,
            "scheduled_at":     scheduled_at,
            "duration_minutes": duration_minutes,
            "status":           "confirmed",
            "appointment_type": "consultation",
            "title":            None,
            "source":           source,
            "external_id":      external_id,
            "notes":            notes or None,
            "metadata":         {"booked_by": "voice_agent"},
        }).execute()
        logger.info(f"Appointment saved to DB for org={org_id}, dt={datetime_str}")
    except Exception as e:
        logger.warning(f"save_appointment_to_db failed: {e}")


async def create_appointment_reminders(
    org_id:       str,
    contact_id:   str | None,
    lead_id:      str | None,
    conv_id:      str | None,
    datetime_str: str,
) -> None:
    """
    Creates two follow_up_tasks (voice channel) for appointment reminders:
      - 24h before the appointment (sequence_stage: appointment_reminder_24h)
      -  2h before the appointment (sequence_stage: appointment_reminder_2h)
    Appointment time is stored in variables JSONB for n8n to pass to the agent.
    """
    try:
        appt_dt = datetime.fromisoformat(datetime_str)
        # Normalise to UTC without corrupting an already-tz-aware string
        if appt_dt.tzinfo is None:
            appt_dt = appt_dt.replace(tzinfo=timezone.utc)
        else:
            appt_dt = appt_dt.astimezone(timezone.utc)
        base = {
            "organization_id": org_id,
            "contact_id":      contact_id,
            "lead_id":         lead_id,
            "conversation_id": conv_id,
            "task_type":       "appointment_reminder",
            "status":          "pending",
            "channel":         "voice",
            "variables":       {"appointment_time": datetime_str},
        }
        sb = get_supabase()
        sb.table("follow_up_tasks").insert([
            {
                **base,
                "sequence_stage": "appointment_reminder_24h",
                "scheduled_at":   (appt_dt - timedelta(hours=24)).isoformat(),
            },
            {
                **base,
                "sequence_stage": "appointment_reminder_2h",
                "scheduled_at":   (appt_dt - timedelta(hours=2)).isoformat(),
            },
        ]).execute()
        logger.info(f"Appointment reminder tasks created for {datetime_str}")
    except Exception as e:
        logger.warning(f"create_appointment_reminders failed: {e}")


# ── Prompt builder ─────────────────────────────────────────────────────────────

def build_system_prompt(
    org: dict,
    playbook: dict,
    intake_fields: list,
    kb_context: str,
    calendar_enabled: bool = False,
    lang: str = "tr",
    few_shots: list = None,
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

    # Few-shot section
    shots = few_shots or (playbook.get("few_shot_examples", []) if playbook else [])
    few_shot_section = ""
    if shots:
        few_shot_section = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nFEW-SHOT ÖRNEK KONUŞMALAR:\n"
        few_shot_section += "\n\n".join(
            f"Arayan: {ex.get('user', '')}\nAsistan: {ex.get('assistant', '')}"
            for ex in shots
        )

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
- Tüm zorunlu bilgiler toplandığında: "{"I've noted your information, one of our consultants will reach out to you shortly." if lang == "en" else "Bilgilerinizi not aldım, bir danışmanımız sizi en kısa sürede arayacak."}" de ve görüşmeyi nazikçe sonlandır.

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
{calendar_section}{few_shot_section}"""


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
            "started_at":      call_start.isoformat(),
            "ended_at":        datetime.now(timezone.utc).isoformat(),
            **({"metadata": metadata} if metadata else {}),
        }).execute()
        logger.info(f"voice_call saved — {direction}, {duration}s")
    except Exception as e:
        logger.warning(f"voice_call save failed: {e}")


def normalize_phone(phone: str) -> str:
    """
    Normalize a phone string to E.164 format (e.g. "+905551234567").
    Safe conversions only — no country-code guessing for local formats.

      "+905551234567"   → "+905551234567"  (already E.164, keep)
      "905551234567"    → "+905551234567"  (bare international digits)
      "00905551234567"  → "+905551234567"  (00-prefix → +)
      "05551234567"     → "05551234567"    (local format, leave unchanged)
    """
    if not phone:
        return phone
    cleaned = re.sub(r'[\s\-\(\)\.]+', '', phone)
    if cleaned.startswith('+'):
        digits = re.sub(r'\D', '', cleaned[1:])
        return ('+' + digits) if 7 <= len(digits) <= 15 else phone
    digits = re.sub(r'\D', '', cleaned)
    if not digits:
        return phone
    if digits.startswith('00') and len(digits) >= 9:
        stripped = digits[2:]
        return ('+' + stripped) if 7 <= len(stripped) <= 15 else phone
    if re.match(r'^\d{9,15}$', digits) and not digits.startswith('0'):
        return '+' + digits
    return phone  # local format or ambiguous — leave unchanged


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

        # Normalize to E.164 before any DB lookup/insert
        if phone_from:
            phone_from = normalize_phone(phone_from)

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

    # AgentDispatch metadata'sı ctx.job.metadata'da gelir (room.metadata değil)
    if not meta.get("organization_id"):
        try:
            job_meta = json.loads(ctx.job.metadata or "{}")
            meta.update(job_meta)
        except (json.JSONDecodeError, AttributeError):
            pass

    org_id   = meta.get("organization_id") or os.environ.get("PLATFORM_ORG_ID")
    scenario = meta.get("scenario")

    if not org_id:
        raise ValueError("organization_id missing in room metadata and PLATFORM_ORG_ID env not set")

    org      = await load_org(org_id)
    playbook = await load_playbook(org_id, channel="voice")
    intake   = await load_intake_schema(org_id, channel="voice")

    # Model öncelik sırası: 1. playbook features, 2. room metadata, 3. default
    features  = (playbook or {}).get("features", {}) if playbook else {}
    llm_model = (
        features.get("model")
        or meta.get("model")
        or "claude-sonnet-4-6"
    )
    if llm_model.startswith("claude-"):
        llm_instance = anthropic.LLM(model=llm_model)
    else:
        llm_instance = openai.LLM(model=llm_model)

    persona      = org.get("ai_persona", {})
    persona_name = persona.get("persona_name", "Asistan")
    lang         = meta.get("lang") or persona.get("language", "tr")
    room_name    = ctx.room.name

    # Calendar feature — provider-agnostic adapter (features already loaded above)
    calendar_adapter = get_calendar_adapter(org) if features.get("calendar_booking", False) else None
    calendar_enabled = calendar_adapter is not None

    logger.info(f"{'Outbound' if scenario else 'Inbound'} — org: {org['name']} | lang: {lang} | scenario: {scenario}")

    # Handoff keyword listesi (runtime'da kontrol için)
    handoff_keywords = []
    if playbook:
        handoff_keywords = playbook.get("handoff_triggers", {}).get("keywords", [])

    # ── İnbound ───────────────────────────────────────────────────────────────
    if not scenario:
        initial_kb = ""  # Başlangıçta KB yükleme — şehir/ofis varsayımını önler, sorular gelince dinamik yüklenir
        system_prompt = build_system_prompt(org, playbook, intake, initial_kb, calendar_enabled, lang)
        opening    = (playbook or {}).get("opening_message") or f"Merhaba, {org['name']}."
        direction  = "inbound"
        phone_from = _get_sip_caller_number(ctx) or meta.get("phone_from", "")
        phone_to   = os.environ.get("PLATFORM_INBOUND_NUMBER", "")

        contact_id, lead_id = await upsert_contact_and_lead(
            org_id, phone_from, org["name"], source="voice_inbound"
        )

    # ── Outbound ──────────────────────────────────────────────────────────────
    else:
        contact_name  = meta.get("contact_name", "")
        phone_to      = meta.get("phone_to", "")
        lead_id       = meta.get("lead_id") or None
        contact_id    = meta.get("contact_id") or None
        context_note  = meta.get("context_note", "")
        appt_time     = meta.get("appointment_time", "")
        reminder_hrs  = meta.get("reminder_hours", "24")

        # If contact_id wasn't passed in metadata, upsert from phone_to so conversation insert never fails
        if not contact_id:
            contact_id, fallback_lead_id = await upsert_contact_and_lead(
                org_id, phone_to, org["name"], source="voice_outbound"
            )
            if not lead_id:
                lead_id = fallback_lead_id

        outbound_playbook_text = playbook.get("system_prompt_template", "") if playbook else ""

        # ── First contact (workflow V3) ────────────────────────────────────
        if scenario == "first_contact":
            attempt = int(meta.get("attempt", "1"))
            run_id  = meta.get("run_id", "")
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına yeni müşteri adayı arayan {persona_name}'sın.
Bu kişi {org['name']}'a ilgi gösterdi, şimdi onunla iletişime geçiyorsun.
Arama {"tekrar " if attempt > 1 else ""}{attempt}. deneme.

KURAL: Kısa ve doğal konuş. Zorlayıcı olma. Max 3-4 tur.
KURAL: Randevu veya bilgi almak istiyorlarsa yönlendir.
KURAL: Bilgi tabanında olmayan bir şeyi asla uydurma.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name}. "
                "Bize ilgi gösterdiğinizi gördük, iki dakikanız var mı?"
            )

        # ── Warm follow-up (workflow V4) ───────────────────────────────────
        elif scenario == "warm_followup":
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına sıcak takip araması yapan {persona_name}'sın.
Bu kişiyle daha önce temas kuruldu, ilgi gösterdi.
{f"Bağlam notu: {context_note}" if context_note else ""}

KURAL: Nazikçe hatırlat, soruları yanıtla. Zorlayıcı olma.
KURAL: Max 3-4 tur konuşma.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name}. "
                "Geçen görüşmemizden sonra aklınıza takılan bir şey var mı?"
            )

        # ── Appointment confirm (workflow V5) ──────────────────────────────
        elif scenario == "appt_confirm":
            appt_display = appt_time or "yaklaşan randevunuz"
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına randevu teyit araması yapan {persona_name}'sın.
Arama amacı: Randevuyu teyit ettirmek.
{f"Randevu zamanı: {appt_display}" if appt_time else ""}

KURAL: Sadece teyit al, 2-3 turdan uzatma.
KURAL: İptal veya değişiklik istiyorlarsa kliniği aramaları gerektiğini söyle.
KURAL: "Başka bir konuda yardımcı olabilir miyim?" YASAK.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name} arıyorum. "
                + (f"{appt_display} randevunuzu teyit etmek istedim. " if appt_time else "Yaklaşan randevunuzu teyit etmek istedim. ")
                + "Randevunuz için uygun musunuz?"
            )

        # ── No-show follow-up (workflow V7) ───────────────────────────────
        elif scenario == "noshow_followup":
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına no-show takip araması yapan {persona_name}'sın.
Bu kişi bugünkü randevusuna gelmedi. Anlayışlı ve nazik ol.

KURAL: Suçlayıcı olma. Anlayışla yaklaş.
KURAL: Yeni bir randevu teklif et, zorlama.
KURAL: Max 3-4 tur.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name} arıyorum. "
                "Bugün sizi bekliyorduk, her şey yolunda mı? Randevunuzu kaçırdığınızı gördük."
            )

        # ── Satisfaction survey (workflow V8) ──────────────────────────────
        elif scenario == "satisfaction_survey":
            run_id = meta.get("run_id", "")
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına memnuniyet anketi araması yapan {persona_name}'sın.
Bu kişi yakın zamanda hizmet aldı, kısa bir geri bildirim istiyorsun.

ARAÇ: Müşteri puan verince ve yorum yaparsa save_survey_result() tool'unu çağır.
KURAL: 1-5 puan al, 1 cümle yorum al. Max 3-4 tur, kısa tut.
KURAL: "Başka bir konuda yardımcı olabilir miyim?" YASAK.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name} arıyorum. "
                "Kısa bir memnuniyet değerlendirmesi için iki dakikanız var mı? "
                "1'den 5'e kadar bir puan verebilir misiniz?"
            )

        # ── Treatment reminder (workflow V9) ───────────────────────────────
        elif scenario == "treatment_reminder":
            interval_days = meta.get("interval_days", "90")
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına periyodik kontrol hatırlatması yapan {persona_name}'sın.
Bu kişinin yaklaşık {interval_days} gün önce randevusu vardı, kontrol zamanı geldi.

KURAL: Kısa ve nazik. Randevu teklif et. Max 3 tur.
KURAL: Zorlayıcı olma.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name} arıyorum. "
                f"Periyodik kontrol zamanınız geldi, randevu almak ister misiniz?"
            )

        # ── Reactivation (workflow V10) ────────────────────────────────────
        elif scenario == "reactivation":
            offer = meta.get("offer_text", "")
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına eski müşteri aktivasyon araması yapan {persona_name}'sın.
Bu kişiyle uzun süredir temas kurulmadı.
{"Özel teklif: " + offer if offer else ""}

KURAL: Nazik ve kısa. Zorlayıcı olma.
KURAL: Varsa özel teklifi doğal bir şekilde ilet.
KURAL: Max 3-4 tur.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name} arıyorum. "
                + (f"Size özel bir haberimiz var: {offer} " if offer else "Sizi özledik! ")
                + "Uygun musunuz, iki dakikanız var mı?"
            )

        # ── Payment follow-up (workflow V11) ───────────────────────────────
        elif scenario == "payment_followup":
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına ödeme takip araması yapan {persona_name}'sın.
Bu kişinin bekleyen bir ödemesi var.

KURAL: Nazik ve anlayışlı. Suçlayıcı olma.
KURAL: Ödeme planı sunabilirsin. Kliniğin imkânlarını açıkla.
KURAL: Max 3-4 tur.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name} arıyorum. "
                "Hesabınızla ilgili kısa bir bilgilendirme için arıyorum, uygun musunuz?"
            )

        # ── Appointment reminder scenario ──────────────────────────────────
        elif scenario == "appointment_reminder":
            time_word = "Yarınki" if reminder_hrs == "24" else "Bugünkü"
            appt_display = appt_time or "yaklaşan randevunuz"
            system_prompt = f"""{outbound_playbook_text}

Sen {org['name']} adına randevu hatırlatma araması yapan {persona_name}'sın.
Arama yapılan kişi: {contact_name}
Arama amacı: Randevu hatırlatma
{f"Randevu zamanı: {appt_display}" if appt_time else ""}

KURAL: Bu çok kısa bir hatırlatma araması, 2-3 turdan uzatma.
KURAL: Randevuyu onayla. İptal veya değişiklik istiyorlarsa kliniği aramaları gerektiğini söyle.
KURAL: "Başka bir konuda yardımcı olabilir miyim?" veya benzeri kapatıcı sorular YASAK.
KURAL: Bilgi tabanında olmayan bir şeyi asla uydurma.
"""
            opening = (
                f"Merhaba{', ' + contact_name if contact_name else ''}! "
                f"Ben {org['name']}'dan {persona_name} arıyorum. "
                f"{time_word} randevunuzu hatırlatmak istedim. "
                + (f"Randevunuz {appt_display} olarak kayıtlı. " if appt_time else "")
                + "Randevunuz için hazır mısınız?"
            )

        # ── Standard outbound (followup, re_contact, etc.) ─────────────────
        else:
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

    # ── Tools ──────────────────────────────────────────────────────────────────
    _survey_run_id = meta.get("run_id", "")
    fnc_ctx = None
    needs_survey_tool = scenario == "satisfaction_survey"
    if (calendar_enabled and calendar_adapter is not None) or needs_survey_tool:
        fnc_ctx = llm.FunctionContext()

        # ── Satisfaction survey save ───────────────────────────────────────
        if needs_survey_tool:
            @fnc_ctx.ai_callable(
                description="Müşterinin verdiği puan ve yorumu kaydeder. "
                            "Puan alındıktan sonra çağır."
            )
            async def save_survey_result(
                score: Annotated[int, llm.TypeInfo(description="Memnuniyet puanı (1-5 arası tam sayı)")],
                comment: Annotated[str, llm.TypeInfo(description="Müşterinin yorumu, yoksa boş bırak")] = "",
            ) -> str:
                try:
                    sb = get_supabase()
                    sb.table("satisfaction_surveys").insert({
                        "organization_id": org_id,
                        "contact_id":      contact_id,
                        "run_id":          _survey_run_id or None,
                        "score":           max(1, min(5, score)),
                        "comment":         comment or None,
                        "low_score_notified": False,
                    }).execute()
                    logger.info(f"satisfaction_survey saved — score: {score}, run: {_survey_run_id}")
                    return f"Puan kaydedildi: {score}/5. Teşekkürler."
                except Exception as e:
                    logger.warning(f"save_survey_result failed: {e}")
                    return "Puan kaydedilemedi, ancak geri bildiriminiz için teşekkürler."

        # ── Calendar tools (only if calendar adapter is available) ───────────
        if calendar_enabled and calendar_adapter is not None:
            @fnc_ctx.ai_callable(description="Müsait randevu saatlerini listeler. Kullanıcı randevu/görüşme istediğinde çağır.")
            async def check_availability(
                date: Annotated[str, llm.TypeInfo(description="Kontrol edilecek tarih, YYYY-MM-DD formatında. Belirtilmezse yakın 3 günü döndür.")] = ""
            ) -> str:
                slots = await calendar_adapter.get_free_slots(days=3)
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
                result = await calendar_adapter.create_appointment(name, phone, datetime_str, notes)
                if result["success"]:
                    sb = get_supabase()
                    # Create voice reminder tasks (-24h and -2h)
                    asyncio.create_task(create_appointment_reminders(
                        org_id, contact_id, lead_id, conv_id, datetime_str
                    ))
                    # Save to appointments table (canonical DB source)
                    asyncio.create_task(save_appointment_to_db(
                        sb, org_id, contact_id, lead_id, conv_id,
                        datetime_str, notes=notes,
                        external_id=result.get("appointment_id"),
                    ))
                    return f"Randevunuz oluşturuldu: {name}, {datetime_str}. Onay bilgisi size iletilecektir."
                return "Randevu oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin veya bizi arayın."

    # ── Session ───────────────────────────────────────────────────────────────
    VOICE_IDS = {
        "tr": os.environ.get("CARTESIA_VOICE_ID_TR", "c1cfee3d-532d-47f8-8dd2-8e5b2b66bf1d"),
        "en": os.environ.get("CARTESIA_VOICE_ID_EN", "62ae83ad-4f6a-430b-af41-a9bede9286ca"),
    }
    tts_lang = lang if lang in VOICE_IDS else "tr"

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language=tts_lang),
        llm=llm_instance,
        tts=cartesia.TTS(
            model="sonic-3",
            voice=VOICE_IDS[tts_lang],
            language=tts_lang,
        ),
        vad=silero.VAD.load(),
        **({"fnc_ctx": fnc_ctx} if fnc_ctx else {}),
    )

    call_start     = datetime.now(timezone.utc)
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
            run_id=meta.get("run_id"),
            callback_url=meta.get("callback_url"),
        ))

    await session.generate_reply(instructions=opening)


async def _save_all(
    org_id, direction, call_start, transcript,
    phone_from, phone_to, contact_id, lead_id,
    conv_id, intake, handoff_reason, room_name,
    run_id=None, callback_url=None,
):
    """Çağrı bittikten sonra tüm DB yazımlarını sırayla yap."""
    duration = int((datetime.now(timezone.utc) - call_start).total_seconds())

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

    # ── Workflow engine callback ───────────────────────────────────────────────
    # Eğer bu çağrı bir workflow_run tarafından tetiklendiyse sonucu bildir.
    # < 15 saniye = cevap alınamadı (no_answer); ≥ 15 saniye = başarılı görüşme.
    if run_id and callback_url:
        call_status = "no_answer" if duration < 15 else "success"
        cb_payload = json.dumps({
            "run_id": run_id,
            "status": call_status,
            "result": {
                "call_duration_seconds": duration,
                "next_action": "retry" if call_status == "no_answer" else None,
            },
        }).encode()
        try:
            import urllib.request as _ureq
            req = _ureq.Request(
                callback_url, data=cb_payload,
                headers={"Content-Type": "application/json"}, method="POST"
            )
            _ureq.urlopen(req, timeout=10)
            logger.info(f"Workflow callback sent: {call_status} for run {run_id}")
        except Exception as e:
            logger.warning(f"Workflow callback failed: {e}")


# ── Başlat ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        agent_name="stoaix-platform",
    ))
