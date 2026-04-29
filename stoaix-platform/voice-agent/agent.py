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
import time
import urllib.parse
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from prompt_rules import (
    PLATFORM_GUARDRAILS,
    VOICE_CONVERSATION_RULES,
    NATURALNESS_RULES,
    REGISTER_RULES,
    OBJECTION_RULES,
    get_voice_rules,
    language_instruction,
    inbound_language_instruction,
    LANGUAGE_NAMES,
)
from livekit.agents import (
    Agent,
    AgentSession,
    AudioConfig,
    AutoSubscribe,
    BackgroundAudioPlayer,
    BuiltinAudioClip,
    JobContext,
    WorkerOptions,
    cli,
    function_tool,
    llm,
)
from livekit.agents.voice import room_io

try:
    from livekit.agents import RunContext
except ImportError:
    from livekit.agents.voice import RunContext  # type: ignore
from livekit.plugins import cartesia, deepgram, openai, anthropic, silero

try:
    from livekit.plugins.turn_detector import MultilingualModel
    _TURN_DETECTOR_CLS = MultilingualModel
except ImportError:
    try:
        from livekit.plugins.turn_detector import EOUModel
        _TURN_DETECTOR_CLS = EOUModel
        logging.getLogger("stoaix-platform").warning(
            "MultilingualModel unavailable — falling back to EOUModel"
        )
    except ImportError:
        _TURN_DETECTOR_CLS = None
        logging.getLogger("stoaix-platform").warning(
            "turn_detector plugin unavailable — VAD-only mode"
        )

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
    org = res.data

    # Subscription plan — tier check için (Advanced+ = çok dilli ses)
    sub = sb.table("org_subscriptions") \
        .select("plan_id, status") \
        .eq("organization_id", org_id) \
        .limit(1) \
        .execute()
    org["_plan"] = sub.data[0]["plan_id"] if sub.data else "legacy"
    return org


async def load_playbook(org_id: str, channel: str = "voice", scenario: str | None = None) -> dict | None:
    sb = get_supabase()

    # Scenario-specific playbook varsa onu tercih et
    if scenario:
        res = sb.table("agent_playbooks") \
            .select("*") \
            .eq("organization_id", org_id) \
            .eq("is_active", True) \
            .eq("channel", channel) \
            .eq("scenario", scenario) \
            .order("version", desc=True) \
            .limit(1) \
            .execute()
        if res.data:
            return res.data[0]

    # Ana (inbound) playbook — scenario IS NULL
    res = sb.table("agent_playbooks") \
        .select("*") \
        .eq("organization_id", org_id) \
        .eq("is_active", True) \
        .eq("channel", channel) \
        .is_("scenario", "null") \
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
        .is_("scenario", "null") \
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

        lines = []
        for date, times in slots.items():
            if not times:
                continue
            d = datetime.strptime(date, "%Y-%m-%d")
            day_names = DAYS_I18N.get("tr")
            lines.append(f"{day_names[d.weekday() + 1 if d.weekday() < 6 else 0]} ({date}): {', '.join(times[:5])}")
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


class DentsoftCalendarAdapter(CalendarAdapter):
    """DentSoft calendar adapter — slot çekme + randevu oluşturma."""

    DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

    def __init__(self, cal_config: dict):
        self.api_url    = (cal_config.get("api_url") or "").rstrip("/")
        self.api_key    = cal_config.get("api_key") or ""
        self.clinic_id  = cal_config.get("clinic_id") or ""
        self.doctor_id  = cal_config.get("default_doctor_id") or ""

    async def _fetch(self, path: str, method: str = "GET", form_data: dict | None = None) -> dict | None:
        """DentSoft API helper. Returns Response payload or None on error."""
        import aiohttp
        url     = f"{self.api_url}{path}"
        headers = {"Authorization": f"Bearer {self.api_key}", "Accept": "application/json"}
        try:
            async with aiohttp.ClientSession() as session:
                if method == "GET":
                    async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        if resp.status != 200:
                            return None
                        data = await resp.json()
                else:
                    fd = aiohttp.FormData()
                    for k, v in (form_data or {}).items():
                        fd.add_field(k, str(v))
                    async with session.post(url, headers=headers, data=fd, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        if resp.status != 200:
                            return None
                        data = await resp.json()
                if data.get("Status", {}).get("Code") != 100:
                    logger.warning(f"[dentsoft] API error: {data.get('Status', {}).get('Message')}")
                    return None
                return data.get("Response")
        except Exception as e:
            logger.warning(f"[dentsoft] _fetch failed ({path}): {e}")
            return None

    async def get_free_slots(self, days: int = 3) -> str:
        if not self.doctor_id:
            return ""
        today = datetime.now().strftime("%Y-%m-%d")
        params = urllib.parse.urlencode({
            "ClinicID":  self.clinic_id,
            "UserID":    self.doctor_id,
            "Date":      today,
            "Range":     f"1-{days * 5}",
            "Available": "Available",
        })
        data = await self._fetch(f"/Api/v1/Doctor/OnlineWork?{params}")
        if not data:
            return ""

        raw_slots = data if isinstance(data, list) else data.get("Slots", [])
        grouped: dict[str, list[str]] = {}
        for slot in raw_slots:
            slot_date = (slot.get("Date") or slot.get("WorkDate") or "")[:10]
            slot_time = (slot.get("Time") or slot.get("StartTime") or slot.get("Hour") or "")[:5]
            if slot_date and slot_time:
                grouped.setdefault(slot_date, []).append(slot_time)

        lines = []
        for date_key in sorted(grouped.keys())[:days]:
            d        = datetime.strptime(date_key, "%Y-%m-%d")
            day_name = self.DAYS_TR[d.weekday() + 1 if d.weekday() < 6 else 0]
            times    = ", ".join(grouped[date_key][:8])
            lines.append(f"  {day_name} ({date_key}): {times}")
        return "\n".join(lines) if lines else ""

    async def create_appointment(self, name, phone, datetime_str, notes="") -> dict:
        if not self.doctor_id:
            return {"success": False, "appointment_id": None, "error": "default_doctor_id not configured"}
        form_data = {
            "FullName":      name,
            "ContactMobile": phone,
            "Date":          datetime_str[:10],
            "Time":          datetime_str[11:16],
            "Note":          notes,
            "PatientNumber": "",
        }
        path = f"/Api/v1/Appointment/New/{urllib.parse.quote(self.clinic_id)}/{urllib.parse.quote(self.doctor_id)}"
        data = await self._fetch(path, method="POST", form_data=form_data)
        if data is None:
            return {"success": False, "appointment_id": None, "error": "DentSoft appointment creation failed"}
        appt_id = data.get("PNR") or data.get("AppointmentID") or data.get("ID")
        return {"success": True, "appointment_id": str(appt_id) if appt_id else None, "error": None}


def get_calendar_adapter(org: dict) -> CalendarAdapter | None:
    """
    Returns the appropriate CalendarAdapter for the org, or None if not configured.

    Resolution order:
    1. channel_config.calendar.provider = 'google'    → GoogleCalendarAdapter
    2. channel_config.calendar.provider = 'dentsoft'  → DentsoftCalendarAdapter
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
        if not cal_config.get("api_url") or not cal_config.get("api_key") or not cal_config.get("clinic_id"):
            return None
        return DentsoftCalendarAdapter(cal_config)

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


# ── Language detection helpers ─────────────────────────────────────────────────

def detect_language_heuristic(text: str) -> str | None:
    """
    İlk user utterance'dan dil algıla. None = TR (switch gerekmez).

    Algılama sırası:
      1. Türkçe özel karakterler (şçğıöü) → None (TR, switch yok)
      2. Script-based: Arapça / Kiril / Çince yazı sistemi → kesin algılama
      3. Latin-script özel karakterler: ß/äöü → DE, éèç → FR, ñ → ES, ãõ → PT
      4. Kelime tabanlı: ≥2 indicator kelime eşleşmesi → en yüksek skor kazanır
      5. Hiçbiri → None (TR default)
    """
    if not text or not text.strip():
        return None

    # 1. Turkish special chars → stay TR
    if any(c in _TR_CHARS for c in text):
        return None

    # 2. Script-based detection (non-Latin scripts — very high confidence)
    for c in text:
        cp = ord(c)
        if cp in _ARABIC_RANGE:
            return "ar"
        if cp in _CYRILLIC_RANGE:
            return "ru"
        if cp in _CJK_RANGE:
            return "zh"

    # 3. Latin-script special chars (high confidence)
    chars = set(text)
    if chars & _DE_CHARS:
        return "de"
    if chars & _FR_CHARS:
        return "fr"
    if chars & _ES_CHARS:
        return "es"
    if chars & _PT_CHARS:
        return "pt"

    # 4. Word-based detection (Latin-script languages without special chars)
    words = set(re.sub(r"[^\w\s]", "", text.lower()).split())
    if not words:
        return None

    best_lang = None
    best_score = 0
    for lang_code, indicators in _LANG_INDICATORS.items():
        score = len(words & indicators)
        if score > best_score:
            best_score = score
            best_lang = lang_code

    if best_score >= 2:
        return best_lang

    return None


async def _save_contact_language(contact_id: str, lang: str):
    try:
        get_supabase().table("contacts").update(
            {"preferred_language": lang}
        ).eq("id", contact_id).execute()
    except Exception as e:
        logger.warning(f"Failed to save contact language: {e}")


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

    # ═══ TR: Mevcut Türkçe prompt — AYNEN korunur ═══
    if lang == "tr":
        calendar_section = (
            "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "RANDEVU ALMA:\n"
            "1. Kullanıcı randevu/görüşme/uygun saat talep ederse → check_availability çağır.\n"
            "2. Kullanıcı uygun bir saati seçince ve ad+telefon alınmışsa → book_appointment çağır.\n"
            "3. Randevu onaylandığında tarih/saati yazıyla tekrarla ve teyit al.\n"
            "SIRA ÖNEMLİ: Önce check_availability, sonra book_appointment. Tersini yapma."
        ) if calendar_enabled else ""

        return f"""{PLATFORM_GUARDRAILS}

{base_prompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KONUŞMA KURALLARI (KATI — İSTİSNASIZ UYGULANIR):
{VOICE_CONVERSATION_RULES}

{NATURALNESS_RULES}

{REGISTER_RULES}

{OBJECTION_RULES}

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
{calendar_section}{few_shot_section}"""

    # ═══ Non-TR: International prompt ═══
    conv_rules, nat_rules, reg_rules, obj_rules = get_voice_rules(lang)
    lang_inst = language_instruction(lang)

    calendar_section_intl = (
        "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "APPOINTMENT BOOKING:\n"
        "1. If the user asks for an appointment/meeting/available time → call check_availability.\n"
        "2. When they pick a time and name+phone are collected → call book_appointment.\n"
        "3. When confirmed, repeat date/time verbally and get acknowledgement.\n"
        "ORDER MATTERS: First check_availability, then book_appointment. Never reverse."
    ) if calendar_enabled else ""

    completion_msg = "I've noted your information, one of our consultants will reach out to you shortly."

    return f"""{PLATFORM_GUARDRAILS}
{lang_inst}

{base_prompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION RULES (STRICT — NO EXCEPTIONS):
{conv_rules}

{nat_rules}

{reg_rules}

{obj_rules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BASE (RAG — relevant content for this conversation):
{kb_context if kb_context else "(No query yet — will be loaded when user asks a question)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED INFORMATION (must collect):
{must_prompts}

DATA COLLECTION STYLE (VERY IMPORTANT):
- When caller states their topic, acknowledge in 1 sentence, move to first question immediately.
- Don't give detailed explanations — only if directly asked, 1-2 sentences max.
- Asking all fields at once is FORBIDDEN. Ask one by one, in order.
- If the user already shared a piece of information, don't ask again.
- When all required info is collected: "{completion_msg}" and politely end the call.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING RULES:{routing_text if routing_text else " (no rules defined)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUT-OF-SCOPE TOPICS:{blocks_text if blocks_text else " (no blocks defined)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDOFF TRIGGERS:
If these words are heard, IMMEDIATELY transfer to consultant: {handoff_keywords}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HALLUCINATION RULE:
{fallback_no_kb}
{calendar_section_intl}{few_shot_section}"""


# ── Outbound guardrails builder ──────────────────────────────────────────────

def build_outbound_guardrails(lang: str, playbook: dict | None) -> str:
    """Outbound aramalar için hafif guardrail katmanı.

    Inbound'daki build_system_prompt() ile aynı güvenlik kurallarını
    (PLATFORM_GUARDRAILS + ses konuşma + doğallık + register + hard blocks + handoff)
    outbound prompt'larına ekler. OBJECTION_RULES dahil değil çünkü outbound
    senaryolar kısa (3-4 tur) ve niteleme yapmıyor.
    """
    conv_rules, nat_rules, reg_rules, _obj_rules = get_voice_rules(lang)

    # Hard blocks
    blocks = playbook.get("hard_blocks", []) if playbook else []
    blocks_text = ""
    if blocks:
        lines = []
        for b in blocks:
            kw = ", ".join(b.get("keywords", []))
            resp = b.get("response", "")
            lines.append(f"- Anahtar kelimeler: {kw} → \"{resp}\"")
        blocks_text = "\nKAPSAM DIŞI KONULAR:\n" + "\n".join(lines)

    # Handoff triggers
    triggers = playbook.get("handoff_triggers", {}) if playbook else {}
    handoff_kw = ", ".join(triggers.get("keywords", []))
    handoff_text = (
        f"\nHANDOFF: Müşteri şu kelimelerden birini söylerse transferi başlat: {handoff_kw}"
        if handoff_kw else ""
    )

    # Few-shot examples (max 3, only if playbook has them)
    few_shots = playbook.get("few_shot_examples", []) if playbook else []
    few_shot_text = ""
    if few_shots:
        pairs = [
            f"Hasta: \"{ex.get('user', '')}\"\nAsistan: \"{ex.get('assistant', '')}\""
            for ex in few_shots[:3]
        ]
        few_shot_text = "\n━━━━ ÖRNEK KONUŞMALAR ━━━━\n" + "\n\n".join(pairs)

    return f"""{PLATFORM_GUARDRAILS}

━━━━ SES KONUŞMA KURALLARI ━━━━
{conv_rules}
{nat_rules}
{reg_rules}
{blocks_text}
{handoff_text}
{few_shot_text}
""".strip()


# ── Agent sınıfı ───────────────────────────────────────────────────────────────

class PlatformAgent(Agent):
    def __init__(self, instructions: str, org_id: str, lang: str = "tr", tools: list | None = None):
        super().__init__(instructions=instructions, tools=tools or [])
        self.org_id        = org_id
        self.lang          = lang
        self._kb_queried   = set()
        self._kb_cache     = {}    # {query_text: (result, timestamp)}
        self._kb_cache_ttl = 120   # 2 dakika

    async def on_user_turn_completed(self, turn_ctx, new_message):
        user_text = ""
        if hasattr(new_message, "content"):
            c = new_message.content
            user_text = c if isinstance(c, str) else str(c)

        if not user_text:
            return

        # Cache kontrolü — aynı veya çok benzer sorguyu tekrar atma
        now = time.time()
        for cached_q, (cached_result, ts) in list(self._kb_cache.items()):
            if now - ts > self._kb_cache_ttl:
                del self._kb_cache[cached_q]
                continue
            words_new = set(user_text.lower().split())
            words_cached = set(cached_q.lower().split())
            if words_new and words_cached:
                overlap = len(words_new & words_cached) / max(len(words_new), len(words_cached))
                if overlap > 0.7:
                    if cached_result:
                        turn_ctx.add_message(
                            role="system",
                            content=f"[KB Bağlamı — Bu soruyla ilgili bilgi tabanı içeriği:]\n{cached_result}"
                        )
                    return

        kb_result = await vector_search_kb(self.org_id, user_text)
        self._kb_cache[user_text] = (kb_result, now)
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


async def extract_collected_data(transcript: list, intake_fields: list, lang: str = "tr") -> dict:
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

        if lang == "tr":
            prompt = f"""Aşağıdaki sesli görüşme transkripsiyonundan şu bilgileri çıkar ve JSON formatında döndür.
Her field için kullanıcının verdiği değeri yaz, vermemişse null koy.

Toplanacak bilgiler:
{field_defs}

Konuşma:
{transcript_text[:4000]}

Sadece JSON döndür. Örnek: {{"full_name": "Ali Veli", "phone": null, "budget": "50000"}}"""
        else:
            prompt = f"""Extract the following information from this voice call transcript. Return as JSON.
For each field, write the value the user provided. If not provided, use null.

Fields to extract:
{field_defs}

Transcript:
{transcript_text[:4000]}

Return only JSON. Example: {{"full_name": "John Doe", "phone": null, "budget": "50000"}}"""

        resp = oa.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=500,
        )
        return json.loads(resp.choices[0].message.content)
    except json.JSONDecodeError as e:
        logger.error(f"extract_collected_data JSON parse failed: {e}")
        return {"_extraction_failed": True, "_error": "json_parse"}
    except Exception as e:
        logger.error(f"extract_collected_data API failed: {e}", exc_info=True)
        return {"_extraction_failed": True, "_error": str(e)[:100]}


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


async def generate_call_summary(transcript: list, collected_data: dict, org_name: str, lang: str = "tr") -> str:
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

        if lang == "tr":
            prompt = f"""Aşağıdaki sesli görüşmeyi 2-3 cümleyle özetle. Türkçe yaz.
Müşterinin ilgilendiği konu, temel bilgileri ve sonraki adım varsa belirt.
Toplanan veriler: {data_str or 'yok'}

Konuşma:
{transcript_text[:3000]}

Özet:"""
        else:
            prompt = f"""Summarize this voice call in 2-3 sentences. Write in English.
Mention the customer's topic of interest, key information, and next steps if any.
Collected data: {data_str or 'none'}

Transcript:
{transcript_text[:3000]}

Summary:"""

        resp = oa.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"generate_call_summary failed: {e}", exc_info=True)
        return ""


PROTECTED_STATUSES = {"qualified", "handed_off", "converted", "lost", "nurturing"}


async def update_lead_data(lead_id: str, intake_fields: list, collected_data: dict, summary: str = ""):
    """collected_data, data_completeness, missing_fields, score ve özet güncelle."""
    if not lead_id:
        return
    try:
        sb = get_supabase()
        must_keys = {f["key"] for f in intake_fields if f.get("priority") == "must"}

        completeness = {
            f["key"]: ("collected" if collected_data.get(f["key"]) else "not_collected")
            for f in intake_fields
        }
        missing = [k for k in must_keys if not collected_data.get(k)]
        score   = calculate_qualification_score(intake_fields, collected_data)

        # Mevcut lead status'ünü çek — korunan statüleri geçme
        current_res = sb.table("leads").select("status").eq("id", lead_id).single().execute()
        current_status = (current_res.data or {}).get("status", "new")

        update_payload = {
            "collected_data":      collected_data,
            "data_completeness":   completeness,
            "missing_fields":      missing,
            "qualification_score": score,
        }
        if current_status not in PROTECTED_STATUSES:
            update_payload["status"] = "in_progress" if collected_data else "new"
        if summary:
            update_payload["ai_summary"] = summary

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
            "metadata":        metadata or {},
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


# ── Multilang OPENINGS ─────────────────────────────────────────────────────────

OPENINGS = {
    "first_contact": {
        "tr": "Merhaba{name}! Ben {org}'dan {persona}. Bize ilgi gösterdiğinizi gördük, iki dakikanız var mı?",
        "en": "Hello{name}! I'm {persona} from {org}. We noticed your interest, do you have a moment?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. لاحظنا اهتمامك، هل لديك دقيقة؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Wir haben Ihr Interesse bemerkt, haben Sie einen Moment?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. Мы заметили ваш интерес, у вас есть минутка?",
    },
    "warm_followup": {
        "tr": "Merhaba{name}! Ben {org}'dan {persona}. Geçen görüşmemizden sonra aklınıza takılan bir şey var mı?",
        "en": "Hello{name}! I'm {persona} from {org}. After our last conversation, do you have any questions?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. بعد محادثتنا الأخيرة، هل لديك أي أسئلة؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Haben Sie nach unserem letzten Gespräch noch Fragen?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. После нашего разговора у вас остались вопросы?",
    },
    "appt_confirm": {
        "tr": "Merhaba{name}! Ben {org} kliniğinden {persona}. {appt} randevunuzu teyit etmek istedim, uygun musunuz?",
        "en": "Hello{name}! I'm {persona} from {org}. I'm calling to confirm your appointment {appt}. Are you available?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. أتصل لتأكيد موعدك {appt}. هل أنت متاح؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Ich rufe an, um Ihren Termin {appt} zu bestätigen. Passt es Ihnen?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. Звоню подтвердить вашу запись {appt}. Вам удобно?",
    },
    "noshow_followup": {
        "tr": "Merhaba{name}! Ben {org} kliniğinden {persona}. Bugün sizi bekliyorduk, her şey yolunda mı?",
        "en": "Hello{name}! I'm {persona} from {org}. We were expecting you today — is everything alright?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. كنا ننتظرك اليوم، هل كل شيء على ما يرام؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Wir haben Sie heute erwartet — ist alles in Ordnung?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. Мы ждали вас сегодня — всё ли в порядке?",
    },
    "satisfaction_survey": {
        "tr": "Merhaba{name}! Ben {org} kliniğinden {persona}. Kısa bir memnuniyet değerlendirmesi için iki dakikanız var mı?",
        "en": "Hello{name}! I'm {persona} from {org}. Do you have two minutes for a brief satisfaction survey?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. هل لديك دقيقتان لاستبيان رضا قصير؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Haben Sie zwei Minuten für eine kurze Zufriedenheitsumfrage?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. У вас есть пара минут для краткого опроса удовлетворённости?",
    },
    "treatment_reminder": {
        "tr": "Merhaba{name}! Ben {org} kliniğinden {persona}. Periyodik kontrol zamanınız geldi, randevu almak ister misiniz?",
        "en": "Hello{name}! I'm {persona} from {org}. It's time for your periodic check-up — would you like to schedule an appointment?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. حان وقت فحصك الدوري، هل تود حجز موعد؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Es ist Zeit für Ihre regelmäßige Kontrolle — möchten Sie einen Termin vereinbaren?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. Пришло время планового осмотра — хотите записаться?",
    },
    "reactivation": {
        "tr": "Merhaba{name}! Ben {org} kliniğinden {persona}. {offer}Kısa bir süreniz var mı?",
        "en": "Hello{name}! I'm {persona} from {org}. {offer}Do you have a moment?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. {offer}هل لديك دقيقة؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. {offer}Haben Sie einen Moment?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. {offer}У вас есть минутка?",
    },
    "payment_followup": {
        "tr": "Merhaba{name}! Ben {org} kliniğinden {persona}. Hesabınızla ilgili kısa bir bilgilendirme yapmak istiyordum, uygun musunuz?",
        "en": "Hello{name}! I'm {persona} from {org}. I'm calling with a brief update about your account — is now a good time?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. أتصل بخصوص تحديث قصير عن حسابك، هل الوقت مناسب؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Ich rufe wegen einer kurzen Information zu Ihrem Konto an — passt es gerade?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. Звоню с кратким обновлением по вашему счёту — удобно сейчас?",
    },
    "appointment_reminder": {
        "tr": "Merhaba{name}! Ben {org} kliniğinden {persona}. {time_word} randevunuzu hatırlatmak istedim, hazır mısınız?",
        "en": "Hello{name}! I'm {persona} from {org}. I'm calling to remind you about your {time_word} appointment. Are you ready?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. أتصل لتذكيرك بموعدك {time_word}. هل أنت مستعد؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Ich rufe an, um Sie an Ihren {time_word} Termin zu erinnern. Sind Sie bereit?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. Напоминаю о вашей {time_word} записи. Вы готовы?",
    },
    "default": {
        "tr": "Merhaba{name}! Ben {org} kliniğinden {persona}. Şu an uygun musunuz, iki dakikanız var mı?",
        "en": "Hello{name}! I'm {persona} from {org}. Do you have a moment?",
        "ar": "مرحباً{name}! أنا {persona} من {org}. هل لديك دقيقة؟",
        "de": "Hallo{name}! Ich bin {persona} von {org}. Haben Sie einen Moment?",
        "ru": "Здравствуйте{name}! Я {persona} из {org}. У вас есть минутка?",
    },
}

INBOUND_GREETINGS = {
    "tr": "Merhaba, {org}.",
    "en": "Hello, welcome to {org}.",
    "ar": "مرحباً، أهلاً بكم في {org}.",
    "de": "Hallo, willkommen bei {org}.",
    "ru": "Здравствуйте, добро пожаловать в {org}.",
}

# Calendar day names per language
DAYS_I18N = {
    "tr": ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
    "en": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "ar": ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    "de": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    "ru": ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
}

# ── Inbound language detection ────────────────────────────────────────────────
_LANG_DETECT_PLANS = {"professional", "business", "custom", "legacy"}
_PROFESSIONAL_LANGS = {"tr", "en"}
_BUSINESS_LANGS = {"tr", "en", "ar", "de", "es", "fr", "it", "pt", "ru", "zh"}

_TR_CHARS = frozenset("şçğıöüŞÇĞİÖÜ")  # ö/ü shared with DE but common in TR — TR priority

# Script-based detection — unique character ranges (very high accuracy)
_ARABIC_RANGE = range(0x0600, 0x06FF + 1)   # Arabic script
_CYRILLIC_RANGE = range(0x0400, 0x04FF + 1)  # Cyrillic (Russian etc.)
_CJK_RANGE = range(0x4E00, 0x9FFF + 1)       # CJK Unified Ideographs (Chinese)

# Word-based indicators per language (Latin-script languages need ≥2 matches)
_LANG_INDICATORS = {
    "en": frozenset({
        "hi", "hello", "hey", "i", "my", "want", "need", "can", "would",
        "please", "appointment", "call", "yes", "no", "the", "is", "are",
        "do", "have", "about", "information", "like", "book",
    }),
    "de": frozenset({
        "ich", "hallo", "guten", "tag", "morgen", "bitte", "termin",
        "möchte", "brauche", "kann", "mein", "eine", "einen", "ja",
        "nein", "und", "oder", "danke", "sprechen", "arzt", "zahnarzt",
        "behandlung", "beratung", "vereinbaren",
    }),
    "fr": frozenset({
        "je", "bonjour", "salut", "voudrais", "besoin", "rendez",
        "vous", "merci", "oui", "non", "une", "pour", "avec",
        "suis", "avoir", "consultation", "docteur", "clinique",
        "prendre", "veuillez", "pouvez",
    }),
    "es": frozenset({
        "hola", "quiero", "necesito", "cita", "por", "favor",
        "una", "tengo", "puedo", "puede", "con", "para",
        "consulta", "doctor", "gracias", "buenos", "buenas",
        "dias", "tardes", "llamar", "reservar",
    }),
    "it": frozenset({
        "ciao", "buongiorno", "buonasera", "vorrei", "ho",
        "bisogno", "appuntamento", "per", "favore", "posso",
        "una", "con", "grazie", "dottore", "clinica",
        "prenotare", "consulto", "sono", "vorrebbe",
    }),
    "pt": frozenset({
        "oi", "bom", "dia", "boa", "tarde", "noite", "quero",
        "preciso", "consulta", "uma", "com", "por", "favor",
        "obrigado", "obrigada", "doutor", "posso", "tenho",
        "marcar", "agendar", "gostaria",
    }),
}

# Special chars that strongly hint at a specific language
_DE_CHARS = frozenset("äÄß")  # ö/ü shared with TR — only DE-exclusive chars here
_FR_CHARS = frozenset("éèêëàùûîôÉÈÊËÀÙÛÎÔ")  # ç/Ç shared with TR — excluded
_ES_CHARS = frozenset("ñÑ¿¡")
_PT_CHARS = frozenset("ãõÃÕ")


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
    playbook = await load_playbook(org_id, channel="voice", scenario=scenario)
    intake   = await load_intake_schema(org_id, channel="voice")

    # Model öncelik sırası: 1. room metadata (test UI / dispatch), 2. playbook features, 3. default
    features  = (playbook or {}).get("features", {}) if playbook else {}
    llm_model = (
        meta.get("model")
        or features.get("model")
        or "claude-sonnet-4-6"
    )
    if llm_model.startswith("claude-"):
        llm_instance = anthropic.LLM(model=llm_model)
    else:
        llm_instance = openai.LLM(model=llm_model)

    persona      = org.get("ai_persona", {})
    persona_name = persona.get("persona_name", "Asistan")
    room_name    = ctx.room.name

    # Language resolution chain: contact.preferred_language → meta.lang → org persona → "tr"
    _contact_lang = None
    _meta_contact_id = meta.get("contact_id")
    if _meta_contact_id:
        try:
            _cl_res = get_supabase().table("contacts").select("preferred_language").eq("id", _meta_contact_id).maybeSingle().execute()
            if _cl_res.data and _cl_res.data.get("preferred_language"):
                _contact_lang = _cl_res.data["preferred_language"]
        except Exception:
            pass
    lang = _contact_lang or meta.get("lang") or persona.get("language", "tr")

    # Early plan gating — non-TR/EN needs business/custom/legacy
    _org_plan = org.get("_plan", "legacy")
    _MULTILANG_PLANS_EARLY = {"business", "custom", "legacy"}
    if lang not in ("tr", "en") and _org_plan not in _MULTILANG_PLANS_EARLY:
        logger.info(f"Plan {_org_plan} → lang {lang} blocked, fallback to TR")
        lang = "tr"

    # Calendar feature — provider-agnostic adapter (features already loaded above)
    calendar_adapter = get_calendar_adapter(org) if features.get("calendar_booking", False) else None
    calendar_enabled = calendar_adapter is not None

    logger.info(f"{'Outbound' if scenario else 'Inbound'} — org: {org['name']} | lang: {lang} | scenario: {scenario} | pb_voice_id: {features.get('tts_voice_id', '')}")

    # Handoff keyword listesi (runtime'da kontrol için)
    handoff_keywords = []
    if playbook:
        handoff_keywords = playbook.get("handoff_triggers", {}).get("keywords", [])

    # ── İnbound ───────────────────────────────────────────────────────────────
    if not scenario:
        initial_kb = ""  # Başlangıçta KB yükleme — şehir/ofis varsayımını önler, sorular gelince dinamik yüklenir
        system_prompt = build_system_prompt(org, playbook, intake, initial_kb, calendar_enabled, lang)
        # Bilingual instruction: plan destekliyorsa LLM'e "arayan hangi dilde konuşursa o dilde yanıt ver" talimatı
        if _org_plan in _LANG_DETECT_PLANS:
            system_prompt += inbound_language_instruction(_org_plan)
        # DB'deki opening_message her zaman öncelikli — dil fark etmez
        _db_opening = (playbook or {}).get("opening_message")
        if _db_opening:
            opening = _db_opening
        elif lang == "tr":
            opening = f"Merhaba, {org['name']}."
        else:
            opening = INBOUND_GREETINGS.get(lang, INBOUND_GREETINGS["en"]).format(org=org['name'])
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
        outbound_guardrails = build_outbound_guardrails(lang, playbook)

        # Helper: org name'de zaten "klinik/kliniği" varsa "kliniğinden" ekleme
        def _org_from():
            n = org['name']
            low = n.lower()
            if any(k in low for k in ("klinik", "kliniği", "clinic")):
                return f"{n}'nden"
            return f"{n} kliniğinden"

        # Helper for multilang opening from OPENINGS dict
        def _opening(scenario_key, **kwargs):
            """Get opening for current lang with fallback to default."""
            tpl = OPENINGS.get(scenario_key, OPENINGS["default"]).get(lang)
            if not tpl:
                tpl = OPENINGS.get(scenario_key, OPENINGS["default"]).get("en", "")
            name_part = ", " + contact_name if contact_name else ""
            return tpl.format(
                name=name_part,
                org=org['name'],
                persona=persona_name,
                **kwargs,
            )

        # ── First contact (workflow V3) ────────────────────────────────────
        if scenario == "first_contact":
            attempt = int(meta.get("attempt", "1"))
            run_id  = meta.get("run_id", "")
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına yeni müşteri adayı arayan {persona_name}'sın.
Bu kişi {org['name']}'a ilgi gösterdi, şimdi onunla iletişime geçiyorsun.
Arama {"tekrar " if attempt > 1 else ""}{attempt}. deneme.

KURAL: Kısa ve doğal konuş. Zorlayıcı olma. Max 3-4 tur.
KURAL: Randevu veya bilgi almak istiyorlarsa yönlendir.
KURAL: Bilgi tabanında olmayan bir şeyi asla uydurma.
"""
                opening = (
                    f"Merhaba{', ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    "Bize ilgi gösterdiğinizi gördük, iki dakikanız var mı?"
                )
            else:
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']} to reach a new prospect.
This person showed interest in {org['name']}, you are now contacting them.
Call attempt: {attempt}.

RULE: Be brief and natural. Don't be pushy. Max 3-4 turns.
RULE: If they want an appointment or information, guide them.
RULE: Never make up information not in the knowledge base.
"""
                opening = _opening("first_contact")

        # ── Warm follow-up (workflow V4) ───────────────────────────────────
        elif scenario == "warm_followup":
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına sıcak takip araması yapan {persona_name}'sın.
Bu kişiyle daha önce temas kuruldu, ilgi gösterdi.
{f"Bağlam notu: {context_note}" if context_note else ""}

KURAL: Nazikçe hatırlat, soruları yanıtla. Zorlayıcı olma.
KURAL: Max 3-4 tur konuşma.
"""
                opening = (
                    f"Merhaba{', ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    "Geçen görüşmemizden sonra aklınıza takılan bir şey var mı?"
                )
            else:
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} making a warm follow-up call on behalf of {org['name']}.
This person was contacted before and showed interest.
{f"Context note: {context_note}" if context_note else ""}

RULE: Gently remind, answer questions. Don't be pushy.
RULE: Max 3-4 turns.
"""
                opening = _opening("warm_followup")

        # ── Appointment confirm (workflow V5) ──────────────────────────────
        elif scenario == "appt_confirm":
            appt_display = appt_time or ("yaklaşan randevunuz" if lang == "tr" else "your upcoming appointment")
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına randevu teyit araması yapan {persona_name}'sın.
Arama amacı: Randevuyu teyit ettirmek.
{f"Randevu zamanı: {appt_display}" if appt_time else ""}

KURAL: Sadece teyit al, 2-3 turdan uzatma.
KURAL: İptal veya değişiklik istiyorlarsa kliniği aramaları gerektiğini söyle.
KURAL: "Başka bir konuda yardımcı olabilir miyim?" YASAK.
"""
                opening = (
                    f"Merhaba{' ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    + (f"{appt_display} randevunuzu teyit etmek istedim, " if appt_time else "Yaklaşan randevunuzu teyit etmek istedim, ")
                    + "uygun musunuz?"
                )
            else:
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']} to confirm an appointment.
{f"Appointment time: {appt_display}" if appt_time else ""}

RULE: Only get confirmation, keep it to 2-3 turns max.
RULE: If they want to cancel or reschedule, tell them to call the clinic.
RULE: "Is there anything else I can help with?" is FORBIDDEN.
"""
                opening = _opening("appt_confirm", appt=appt_display)

        # ── No-show follow-up (workflow V7) ───────────────────────────────
        elif scenario == "noshow_followup":
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına no-show takip araması yapan {persona_name}'sın.
Bu kişi bugünkü randevusuna gelmedi. Anlayışlı ve nazik ol.

KURAL: Suçlayıcı olma. Anlayışla yaklaş.
KURAL: Yeni bir randevu teklif et, zorlama.
KURAL: Max 3-4 tur.
"""
                opening = (
                    f"Merhaba{' ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    "Bugün sizi bekliyorduk, her şey yolunda mı?"
                )
            else:
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']} for a no-show follow-up.
This person missed their appointment today. Be understanding and kind.

RULE: Don't be accusatory. Approach with understanding.
RULE: Offer a new appointment, don't push.
RULE: Max 3-4 turns.
"""
                opening = _opening("noshow_followup")

        # ── Satisfaction survey (workflow V8) ──────────────────────────────
        elif scenario == "satisfaction_survey":
            run_id = meta.get("run_id", "")
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına memnuniyet anketi araması yapan {persona_name}'sın.
Bu kişi yakın zamanda hizmet aldı, kısa bir geri bildirim istiyorsun.

ARAÇ: Müşteri puan verince ve yorum yaparsa save_survey_result() tool'unu çağır.
KURAL: 1-5 puan al, 1 cümle yorum al. Max 3-4 tur, kısa tut.
KURAL: "Başka bir konuda yardımcı olabilir miyim?" YASAK.
"""
                opening = (
                    f"Merhaba{' ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    "Kısa bir memnuniyet değerlendirmesi için iki dakikanız var mı?"
                )
            else:
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']} for a satisfaction survey.
This person recently received service, you want brief feedback.

TOOL: When the customer gives a score and comment, call save_survey_result().
RULE: Get a 1-5 score, 1 sentence comment. Max 3-4 turns, keep it short.
RULE: "Is there anything else I can help with?" is FORBIDDEN.
"""
                opening = _opening("satisfaction_survey")

        # ── Treatment reminder (workflow V9) ───────────────────────────────
        elif scenario == "treatment_reminder":
            interval_days = meta.get("interval_days", "90")
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına periyodik kontrol hatırlatması yapan {persona_name}'sın.
Bu kişinin yaklaşık {interval_days} gün önce randevusu vardı, kontrol zamanı geldi.

KURAL: Kısa ve nazik. Randevu teklif et. Max 3 tur.
KURAL: Zorlayıcı olma.
"""
                opening = (
                    f"Merhaba{' ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    "Periyodik kontrol zamanınız geldi, randevu almak ister misiniz?"
                )
            else:
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']} for a periodic check-up reminder.
This person had an appointment about {interval_days} days ago, it's time for a follow-up.

RULE: Be brief and kind. Offer an appointment. Max 3 turns.
RULE: Don't be pushy.
"""
                opening = _opening("treatment_reminder")

        # ── Reactivation (workflow V10) ────────────────────────────────────
        elif scenario == "reactivation":
            offer = meta.get("offer_text", "")
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına eski müşteri aktivasyon araması yapan {persona_name}'sın.
Bu kişiyle uzun süredir temas kurulmadı.
{"Özel teklif: " + offer if offer else ""}

KURAL: Nazik ve kısa. Zorlayıcı olma.
KURAL: Varsa özel teklifi doğal bir şekilde ilet.
KURAL: Max 3-4 tur.
"""
                opening = (
                    f"Merhaba{' ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    + (f"{offer} " if offer else "Sizi bir süredir göremedik. ")
                    + "Kısa bir süreniz var mı?"
                )
            else:
                lang_inst = language_instruction(lang)
                offer_text = f"Special offer: {offer}. " if offer else ""
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']} for a reactivation call.
This person hasn't been contacted in a long time.
{f"Special offer: {offer}" if offer else ""}

RULE: Be kind and brief. Don't be pushy.
RULE: If there's a special offer, deliver it naturally.
RULE: Max 3-4 turns.
"""
                opening = _opening("reactivation", offer=offer_text)

        # ── Payment follow-up (workflow V11) ───────────────────────────────
        elif scenario == "payment_followup":
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına ödeme takip araması yapan {persona_name}'sın.
Bu kişinin bekleyen bir ödemesi var.

KURAL: Nazik ve anlayışlı. Suçlayıcı olma.
KURAL: Ödeme planı sunabilirsin. Kliniğin imkânlarını açıkla.
KURAL: Max 3-4 tur.
"""
                opening = (
                    f"Merhaba{' ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    "Hesabınızla ilgili kısa bir bilgilendirme yapmak istiyordum, uygun musunuz?"
                )
            else:
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']} for a payment follow-up.
This person has a pending payment.

RULE: Be kind and understanding. Don't be accusatory.
RULE: You can offer a payment plan. Explain the clinic's options.
RULE: Max 3-4 turns.
"""
                opening = _opening("payment_followup")

        # ── Appointment reminder scenario ──────────────────────────────────
        elif scenario == "appointment_reminder":
            appt_display = appt_time or ("yaklaşan randevunuz" if lang == "tr" else "your upcoming appointment")
            if lang == "tr":
                time_word = "Yarınki" if reminder_hrs == "24" else "Bugünkü"
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

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
                    f"Merhaba{' ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    f"{time_word} randevunuzu hatırlatmak istedim. "
                    + (f"Randevunuz {appt_display} olarak kayıtlı, " if appt_time else "")
                    + "hazır mısınız?"
                )
            else:
                time_word = "tomorrow's" if reminder_hrs == "24" else "today's"
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']} for an appointment reminder.
Person being called: {contact_name}
Purpose: Appointment reminder
{f"Appointment time: {appt_display}" if appt_time else ""}

RULE: This is a very short reminder call, keep it to 2-3 turns max.
RULE: Confirm the appointment. If they want to cancel or reschedule, tell them to call the clinic.
RULE: "Is there anything else I can help with?" or similar closing questions are FORBIDDEN.
RULE: Never make up information not in the knowledge base.
"""
                opening = _opening("appointment_reminder", time_word=time_word)

        # ── Standard outbound (followup, re_contact, etc.) ─────────────────
        else:
            if lang == "tr":
                system_prompt = f"""{outbound_guardrails}

{outbound_playbook_text}

Sen {org['name']} adına arayan {persona_name}'sın.
Arama yapılan kişi: {contact_name}
Arama amacı: {scenario}
{f"Bağlam notu: {context_note}" if context_note else ""}

KURAL: Kısa ve doğal konuş. Zorlayıcı olma.
KURAL: Bilgi tabanında olmayan bir şeyi asla uydurma.
"""
                opening = (
                    f"Merhaba{' ' + contact_name if contact_name else ''}! "
                    f"Ben {_org_from()} {persona_name}. "
                    "Şu an uygun musunuz, iki dakikanız var mı?"
                )
            else:
                lang_inst = language_instruction(lang)
                system_prompt = f"""{outbound_guardrails}
{lang_inst}

{outbound_playbook_text}

You are {persona_name} calling on behalf of {org['name']}.
Person being called: {contact_name}
Call purpose: {scenario}
{f"Context note: {context_note}" if context_note else ""}

RULE: Be brief and natural. Don't be pushy.
RULE: Never make up information not in the knowledge base.
"""
                opening = _opening("default")

        # Playbook'taki opening_message varsa hardcoded opening'i ezsin
        _pb_opening = (playbook or {}).get("opening_message")
        if _pb_opening:
            opening = _pb_opening

        direction  = "outbound"
        phone_from = os.environ.get("PLATFORM_OUTBOUND_NUMBER", "")

    # ── Conversation aç ───────────────────────────────────────────────────────
    conv_id = await create_conversation(org_id, contact_id, lead_id, room_name)

    # ── Tools (function_tool pattern — v1.5+) ─────────────────────────────────
    _survey_run_id = meta.get("run_id", "")
    tools_list = []
    needs_survey_tool = scenario == "satisfaction_survey"

    # ── Satisfaction survey save ─────────────────────────────────────────
    if needs_survey_tool:
        @function_tool()
        async def save_survey_result(
            context: RunContext,
            score: int,
            comment: str = "",
        ) -> str:
            """Müşterinin verdiği puan ve yorumu kaydeder. Puan alındıktan sonra çağır.

            Args:
                score: Memnuniyet puanı (1-5 arası tam sayı)
                comment: Müşterinin yorumu, yoksa boş bırak
            """
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
        tools_list.append(save_survey_result)

    # ── Calendar tools (only if calendar adapter is available) ────────────
    if calendar_enabled and calendar_adapter is not None:
        @function_tool()
        async def check_availability(
            context: RunContext,
            date: str = "",
        ) -> str:
            """Müsait randevu saatlerini listeler. Kullanıcı randevu, görüşme veya müsait saat sorduğunda HEMEN çağır. book_appointment'tan ÖNCE mutlaka bu tool'u çağır.

            Args:
                date: Kontrol edilecek tarih, YYYY-MM-DD formatında. Belirtilmezse yakın 3 günü döndür.
            """
            slots = await calendar_adapter.get_free_slots(days=3)
            if not slots:
                return "TAKVİM_HATA: Takvime şu an erişemiyorum. Kullanıcıya ekibimizin en kısa sürede kendisini arayacağını söyle ve görüşmeyi nazikçe sonlandır."
            return f"Müsait saatler:\n{slots}"

        @function_tool()
        async def book_appointment(
            context: RunContext,
            name: str,
            phone: str,
            datetime_str: str,
            notes: str = "",
        ) -> str:
            """Randevu oluşturur. SADECE şu koşullar sağlandığında çağır: (1) ad ve telefon alınmış, (2) check_availability ile uygun saat belirlenmiş, (3) hasta randevu almak istediğini açıkça onaylamış.

            Args:
                name: Randevu sahibinin adı soyadı
                phone: Telefon numarası, +90 ile başlayan format
                datetime_str: Randevu tarihi ve saati, YYYY-MM-DDTHH:MM formatında
                notes: Ek notlar veya özel istekler
            """
            result = await calendar_adapter.create_appointment(name, phone, datetime_str, notes)
            if result["success"]:
                sb = get_supabase()
                try:
                    await save_appointment_to_db(
                        sb, org_id, contact_id, lead_id, conv_id,
                        datetime_str, notes=notes,
                        external_id=result.get("appointment_id"),
                    )
                    asyncio.create_task(create_appointment_reminders(
                        org_id, contact_id, lead_id, conv_id, datetime_str
                    ))
                    return f"Randevunuz oluşturuldu: {name}, {datetime_str}. Onay bilgisi size iletilecektir."
                except Exception as e:
                    logger.error(f"book_appointment DB save failed: {e}")
                    return "Kayıt hatası oluştu, lütfen tekrar deneyin."
            return "Randevu oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin veya bizi arayın."
        tools_list.append(check_availability)
        tools_list.append(book_appointment)

    # ── Session ───────────────────────────────────────────────────────────────
    CARTESIA_VOICES = {
        "tr": os.environ.get("CARTESIA_VOICE_ID_TR", "c1cfee3d-532d-47f8-8dd2-8e5b2b66bf1d"),
        "en": os.environ.get("CARTESIA_VOICE_ID_EN", "62ae83ad-4f6a-430b-af41-a9bede9286ca"),
        "ar": os.environ.get("CARTESIA_VOICE_ID_AR", ""),
        "de": os.environ.get("CARTESIA_VOICE_ID_DE", ""),
        "ru": os.environ.get("CARTESIA_VOICE_ID_RU", ""),
        "fr": os.environ.get("CARTESIA_VOICE_ID_FR", ""),
        "es": os.environ.get("CARTESIA_VOICE_ID_ES", ""),
        "it": os.environ.get("CARTESIA_VOICE_ID_IT", ""),
        "pt": os.environ.get("CARTESIA_VOICE_ID_PT", ""),
        "zh": os.environ.get("CARTESIA_VOICE_ID_ZH", ""),
    }
    MULTILANG_PLANS = {"business", "custom", "legacy"}

    # Dil önceliği: channel_config.voice.language > meta/persona lang
    org_lang_raw = org.get("channel_config", {}).get("voice", {}).get("language") or lang

    # Tier kısıtlaması: Lite/Plus → sadece TR/EN
    org_plan = org.get("_plan", "legacy")
    if org_lang_raw not in ("tr", "en") and org_plan not in MULTILANG_PLANS:
        logger.info(f"Plan {org_plan} → multi-language blocked, fallback to TR")
        tts_lang = "tr"
    else:
        # Ses ID'si yoksa (env boş) TR'ye düş
        tts_lang = org_lang_raw if CARTESIA_VOICES.get(org_lang_raw) else "tr"

    # Öncelik: playbook features.tts_voice_id > env var CARTESIA_VOICE_ID_XX > default TR
    _pb_voice_id = features.get("tts_voice_id", "").strip()
    voice_id = _pb_voice_id if _pb_voice_id else (CARTESIA_VOICES.get(tts_lang) or CARTESIA_VOICES["tr"])

    STT_LANG_MAP = {"tr": "tr", "en": "en", "ar": "ar", "de": "de", "ru": "ru", "fr": "fr", "es": "es"}
    stt_language = STT_LANG_MAP.get(tts_lang, "tr")

    # Klinik terminolojisi — Deepgram Nova-3 keyterm prompting ile TR doğruluğu artır
    clinic_keyterms = [
        "implant", "veneer", "botoks", "rinoplasti",
        "diş", "protez", "ortodonti", "zirkonyum",
        "saç ekimi", "PRP", "mezoterapi",
    ]

    session = AgentSession(
        stt=deepgram.STT(
            model="nova-3",
            language=stt_language,
            endpointing_ms=300,
            keyterm=clinic_keyterms,
        ),
        llm=llm_instance,
        tts=cartesia.TTS(
            model="sonic-3",
            voice=voice_id,
            language=tts_lang,
        ),
        vad=silero.VAD.load(
            min_speech_duration=0.3,      # 300ms — kısa gürültü/echo'yu filtrele (varsayılan 50ms çok düşük)
            activation_threshold=0.55,    # biraz daha seçici (varsayılan 0.5)
        ),
        **({"turn_detection": _TURN_DETECTOR_CLS()} if _TURN_DETECTOR_CLS else {}),
        allow_interruptions=True,
        min_interruption_duration=0.3,        # 300ms barge-in eşiği
        min_interruption_words=1,             # 1 kelime ile interrupt
        min_endpointing_delay=0.5,
        max_endpointing_delay=6.0,            # Türkçe uzun cümle desteği
    )

    call_start     = datetime.now(timezone.utc)
    transcript     = []
    handoff_reason = None   # handoff tetiklendiyse sebebi
    _lang_switched = False  # ilk utterance'da dil algılama yapıldı mı

    @session.on("conversation_item_added")
    def on_item(ev):
        nonlocal handoff_reason, _lang_switched
        item    = ev.item
        role    = getattr(item, "role", None)
        content = getattr(item, "content", None)
        if role and content:
            text = content if isinstance(content, str) else str(content)
            transcript.append({"role": role, "content": text})

            # Inbound dil algılama — ilk user utterance'da bir kez çalışır
            if (
                role == "user"
                and not _lang_switched
                and not scenario                        # sadece inbound
                and _org_plan in _LANG_DETECT_PLANS
            ):
                _lang_switched = True
                allowed = _BUSINESS_LANGS if _org_plan in ("business", "custom", "legacy") else _PROFESSIONAL_LANGS
                detected = detect_language_heuristic(text)
                if detected and detected != "tr" and detected in allowed:
                    new_voice = CARTESIA_VOICES.get(detected)
                    if new_voice:
                        try:
                            session.stt.update_options(language=detected)
                            session.tts.update_options(voice=new_voice, language=detected)
                            logger.info(f"Lang switch: TR → {detected.upper()}")
                        except Exception as e:
                            logger.warning(f"Lang switch failed: {e}")
                    if contact_id:
                        asyncio.create_task(_save_contact_language(contact_id, detected))

            # Handoff keyword kontrolü (user mesajlarında)
            if role == "user" and handoff_keywords and handoff_reason is None:
                text_lower = text.lower()
                for kw in handoff_keywords:
                    if kw.lower() in text_lower:
                        handoff_reason = "user_requested"
                        logger.info(f"Handoff triggered by keyword: {kw}")
                        break

    await session.start(
        agent=PlatformAgent(
            instructions=system_prompt,
            org_id=org_id,
            lang=tts_lang,
            tools=tools_list if tools_list else None,
        ),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(noise_cancellation=True),
        ),
    )

    # ── Mic hemen kapat — session.start ile opening arasındaki gürültüyü engelle
    session.input.set_audio_enabled(False)

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
        async def _safe_save():
            try:
                await _save_all(
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
                    lang=lang,
                    org_lang=persona.get("language", "tr"),
                )
            except Exception as e:
                logger.error(f"CRITICAL _save_all failed — call may not be recorded: {e}", exc_info=True)
        asyncio.create_task(_safe_save())

    # Opening — session.say() ile LLM'i bypass et, metni doğrudan TTS'e gönder
    # generate_reply() kullanılırsa LLM gürültüyü "user konuştu" diye yorumlayıp
    # opening'e "sizi duyamıyorum" ekliyor. say() bu sorunu kökten çözer.
    session.clear_user_turn()
    speech = session.say(opening, allow_interruptions=True)
    await speech.wait_for_playout()
    session.clear_user_turn()
    session.input.set_audio_enabled(True)


async def _save_all(
    org_id, direction, call_start, transcript,
    phone_from, phone_to, contact_id, lead_id,
    conv_id, intake, handoff_reason, room_name,
    run_id=None, callback_url=None, lang="tr", org_lang="tr",
):
    """Çağrı bittikten sonra: immediate saves + callback hemen, extraction background'da."""
    duration = int((datetime.now(timezone.utc) - call_start).total_seconds())
    has_extraction = bool(lead_id and intake)

    # ── IMMEDIATE: Messages + conversation status ─────────────────────────────
    await save_messages(conv_id, org_id, transcript)

    if handoff_reason:
        if conv_id:
            try:
                get_supabase().table("conversations").update({"status": "handed_off"}).eq("id", conv_id).execute()
            except Exception as e:
                logger.warning(f"conversation handoff update failed: {e}")
    else:
        if conv_id:
            await close_conversation(conv_id)

    # ── IMMEDIATE: Voice call kaydet (extraction pending) ─────────────────────
    call_metadata = {
        "livekit_room":       room_name,
        "extraction_status":  "pending" if has_extraction else "n/a",
        "save_version":       "v3",
    }
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
        metadata=call_metadata,
    )

    # ── IMMEDIATE: Workflow callback (extraction beklenmeden) ─────────────────
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

    logger.info(f"Immediate save done — duration: {duration}s, handoff: {handoff_reason}")

    # ── BACKGROUND: Extraction + summary (2-6s LLM çağrıları) ────────────────
    if has_extraction:
        asyncio.create_task(_extract_and_update(
            org_id=org_id, lead_id=lead_id, conv_id=conv_id,
            transcript=transcript, intake=intake,
            handoff_reason=handoff_reason,
            room_name=room_name, lang=lang, org_lang=org_lang,
            duration=duration,
        ))


async def _extract_and_update(
    org_id, lead_id, conv_id, transcript, intake,
    handoff_reason, room_name, lang, org_lang, duration,
):
    """Background: LLM extraction + summary + lead update. Callback zaten gönderildi."""
    try:
        collected_data = await extract_collected_data(transcript, intake, lang)
        summary = await generate_call_summary(transcript, collected_data, org_id, org_lang)
        await update_lead_data(lead_id, intake, collected_data, summary)

        must_keys = {f["key"] for f in intake if f.get("priority") == "must"}
        missing_fields = [k for k in must_keys if not collected_data.get(k)]

        if handoff_reason:
            await save_handoff(
                org_id=org_id,
                lead_id=lead_id,
                conv_id=conv_id,
                trigger_reason=handoff_reason,
                summary=summary or f"Handoff tetiklendi ({handoff_reason}). Süre: {duration}s.",
                collected_data=collected_data,
                missing_fields=missing_fields,
            )

        # Voice call metadata güncelle — extraction sonucu
        extraction_status = "failed" if collected_data.get("_extraction_failed") else "ok"
        try:
            sb = get_supabase()
            sb.table("voice_calls").update({
                "metadata": {
                    "livekit_room":       room_name,
                    "extraction_status":  extraction_status,
                    "extraction_error":   collected_data.get("_error"),
                    "summary_generated":  bool(summary),
                    "save_version":       "v3",
                },
            }).eq("organization_id", org_id).eq(
                "livekit_room_name", room_name
            ).execute()
        except Exception as e:
            logger.warning(f"voice_calls metadata update failed: {e}")

        logger.info(f"Extraction completed — room: {room_name}, status: {extraction_status}")
    except Exception as e:
        logger.error(f"Background extraction failed — room: {room_name}: {e}", exc_info=True)


# ── Başlat ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        agent_name="stoaix-platform",
    ))
