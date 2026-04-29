"""
Tests for calendar tools: check_availability, book_appointment.
CalendarAdapter mock ile test edilir — gerçek GHL/Google API çağrısı yok.
"""

import pytest
import json
from unittest.mock import MagicMock, AsyncMock, patch, call


# ── GHLCalendarAdapter ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_ghl_adapter_returns_slots():
    from agent import GHLCalendarAdapter
    adapter = GHLCalendarAdapter("cal-id", "pit-token")
    with patch("agent.fetch_free_slots_ghl", return_value="Pazartesi (2026-04-20): 10:00, 14:00"):
        slots = await adapter.get_free_slots()
        assert "10:00" in slots


@pytest.mark.asyncio
async def test_ghl_adapter_returns_empty_on_no_slots():
    from agent import GHLCalendarAdapter
    adapter = GHLCalendarAdapter("cal-id", "pit-token")
    with patch("agent.fetch_free_slots_ghl", return_value=""):
        slots = await adapter.get_free_slots()
        assert slots == ""


@pytest.mark.asyncio
async def test_ghl_adapter_create_appointment_success():
    from agent import GHLCalendarAdapter
    adapter = GHLCalendarAdapter("cal-id", "pit-token")
    with patch("agent.create_appointment_ghl", return_value=True):
        result = await adapter.create_appointment("Ali Veli", "+905551234567", "2026-04-20T10:00")
        assert result["success"] is True
        assert result["error"] is None


@pytest.mark.asyncio
async def test_ghl_adapter_create_appointment_failure():
    from agent import GHLCalendarAdapter
    adapter = GHLCalendarAdapter("cal-id", "pit-token")
    with patch("agent.create_appointment_ghl", return_value=False):
        result = await adapter.create_appointment("Ali Veli", "+905551234567", "2026-04-20T10:00")
        assert result["success"] is False
        assert result["error"] is not None


# ── get_calendar_adapter ──────────────────────────────────────────────────────

def test_get_calendar_adapter_none_for_no_config():
    from agent import get_calendar_adapter
    org = {"channel_config": {}, "crm_config": {}}
    assert get_calendar_adapter(org) is None


def test_get_calendar_adapter_ghl_legacy():
    from agent import get_calendar_adapter, GHLCalendarAdapter
    org = {
        "channel_config": {},
        "crm_config": {"calendar_id": "cal-1", "pit_token": "tok-1"},
    }
    adapter = get_calendar_adapter(org)
    assert isinstance(adapter, GHLCalendarAdapter)


def test_get_calendar_adapter_google():
    from agent import get_calendar_adapter, GoogleCalendarAdapter
    org = {
        "channel_config": {
            "calendar": {"provider": "google", "access_token": "ya29.xxx", "calendar_id": "primary"}
        },
        "crm_config": {},
    }
    adapter = get_calendar_adapter(org)
    assert isinstance(adapter, GoogleCalendarAdapter)


def test_get_calendar_adapter_google_no_token_returns_none():
    from agent import get_calendar_adapter
    org = {
        "channel_config": {"calendar": {"provider": "google"}},  # access_token yok
        "crm_config": {},
    }
    assert get_calendar_adapter(org) is None


def test_get_calendar_adapter_dentsoft_returns_none():
    """Dentsoft adapter henüz implement edilmedi — None dönmeli."""
    from agent import get_calendar_adapter
    org = {
        "channel_config": {"calendar": {"provider": "dentsoft"}},
        "crm_config": {},
    }
    assert get_calendar_adapter(org) is None


# ── save_appointment_to_db ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_save_appointment_to_db_inserts_row():
    from agent import save_appointment_to_db

    mock_sb = MagicMock()
    mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()

    await save_appointment_to_db(
        mock_sb, "org-1", "contact-1", "lead-1", "conv-1",
        "2026-04-20T10:00", notes="Test notu"
    )
    mock_sb.table.assert_called_with("appointments")
    insert_payload = mock_sb.table.return_value.insert.call_args[0][0]
    assert insert_payload["organization_id"] == "org-1"
    assert insert_payload["scheduled_at"] == "2026-04-20T10:00"
    assert insert_payload["notes"] == "Test notu"
    assert insert_payload["status"] == "confirmed"


# ── normalize_phone ───────────────────────────────────────────────────────────

def test_normalize_already_e164():
    from agent import normalize_phone
    assert normalize_phone("+905551234567") == "+905551234567"


def test_normalize_bare_international():
    from agent import normalize_phone
    assert normalize_phone("905551234567") == "+905551234567"


def test_normalize_double_zero_prefix():
    from agent import normalize_phone
    assert normalize_phone("00905551234567") == "+905551234567"


def test_normalize_local_unchanged():
    from agent import normalize_phone
    # Lokal format — güvenli dönüşüm yapılamaz, olduğu gibi bırakılır
    result = normalize_phone("05551234567")
    assert result == "05551234567"


def test_normalize_empty():
    from agent import normalize_phone
    assert normalize_phone("") == ""
