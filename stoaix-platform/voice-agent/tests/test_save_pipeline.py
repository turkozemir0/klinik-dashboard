"""
Tests for the save pipeline (Faz 4 bug fixes).
DB tamamen mock — extract_collected_data/generate_call_summary gerçek API çağrısı yapar
ancak hata senaryoları için mock'lanır.
"""

import pytest
import json
from unittest.mock import MagicMock, AsyncMock, patch


# ── extract_collected_data ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_extract_returns_extraction_failed_on_json_error():
    """JSON parse hatası → _extraction_failed=True döner, exception yutulmaz."""
    import agent
    with patch.object(agent, "extract_collected_data", wraps=agent.extract_collected_data):
        # OpenAI'nin bozuk JSON döndürdüğü senaryo
        bad_response = MagicMock()
        bad_response.choices[0].message.content = "not json {"
        with patch("openai.OpenAI") as mock_oa_cls:
            mock_oa = MagicMock()
            mock_oa.chat.completions.create.return_value = bad_response
            mock_oa_cls.return_value = mock_oa
            intake = [{"key": "full_name", "label": "Ad Soyad"}]
            transcript = [{"role": "user", "content": "Adım Ali"}]
            result = await agent.extract_collected_data(transcript, intake)
            assert result.get("_extraction_failed") is True
            assert "_error" in result


@pytest.mark.asyncio
async def test_extract_returns_extraction_failed_on_api_error():
    """API hatası → _extraction_failed=True döner, exception yutulmaz."""
    import agent
    with patch("openai.OpenAI") as mock_oa_cls:
        mock_oa = MagicMock()
        mock_oa.chat.completions.create.side_effect = RuntimeError("API down")
        mock_oa_cls.return_value = mock_oa
        intake = [{"key": "full_name", "label": "Ad Soyad"}]
        transcript = [{"role": "user", "content": "Test"}]
        result = await agent.extract_collected_data(transcript, intake)
        assert result.get("_extraction_failed") is True


@pytest.mark.asyncio
async def test_extract_returns_empty_for_empty_transcript():
    """Boş transcript → {} döner (API çağrısı yapılmaz)."""
    import agent
    result = await agent.extract_collected_data([], [{"key": "full_name"}])
    assert result == {}


# ── generate_call_summary ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_summary_returns_empty_string_on_error():
    """API hatası → boş string döner (crash yok), error log beklenir."""
    import agent
    with patch("openai.OpenAI") as mock_oa_cls:
        mock_oa = MagicMock()
        mock_oa.chat.completions.create.side_effect = RuntimeError("timeout")
        mock_oa_cls.return_value = mock_oa
        transcript = [{"role": "user", "content": "test"}]
        result = await agent.generate_call_summary(transcript, {}, "Test Org")
        assert result == ""


@pytest.mark.asyncio
async def test_summary_returns_empty_for_empty_transcript():
    """Boş transcript → boş string (API çağrısı yapılmaz)."""
    import agent
    result = await agent.generate_call_summary([], {}, "Test Org")
    assert result == ""


# ── update_lead_data — PROTECTED_STATUSES ────────────────────────────────────

@pytest.mark.asyncio
async def test_protected_status_not_overwritten():
    """handed_off lead'in status'ü in_progress'e düşürülmemeli."""
    import agent

    mock_sb = MagicMock()
    # Mevcut lead status = handed_off (korunan)
    mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = \
        MagicMock(data={"status": "handed_off"})
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

    with patch("agent.get_supabase", return_value=mock_sb):
        intake = [{"key": "full_name", "label": "Ad", "priority": "must"}]
        collected = {"full_name": "Ali"}
        await agent.update_lead_data("lead-id", intake, collected, "summary")

    # update çağrısında status "in_progress" geçmemeli
    update_call = mock_sb.table.return_value.update.call_args
    payload = update_call[0][0]
    assert "status" not in payload, "Korunan status geçilmemeli"


@pytest.mark.asyncio
async def test_new_lead_status_updated():
    """'new' status'ündeki lead, veri toplandığında 'in_progress'e güncellenmeli."""
    import agent

    mock_sb = MagicMock()
    mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = \
        MagicMock(data={"status": "new"})
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

    with patch("agent.get_supabase", return_value=mock_sb):
        intake = [{"key": "full_name", "label": "Ad", "priority": "must"}]
        collected = {"full_name": "Ali"}
        await agent.update_lead_data("lead-id", intake, collected)

    update_call = mock_sb.table.return_value.update.call_args
    payload = update_call[0][0]
    assert payload.get("status") == "in_progress"


# ── voice_calls metadata enrichment ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_save_call_includes_save_version():
    """save_call sonucunda metadata'da save_version='v2' bulunmalı."""
    import agent
    from datetime import datetime, timezone

    captured_payload = {}

    def fake_insert(payload):
        captured_payload.update(payload)
        m = MagicMock()
        m.execute.return_value = MagicMock()
        return m

    mock_sb = MagicMock()
    mock_sb.table.return_value.insert.side_effect = fake_insert

    with patch("agent.get_supabase", return_value=mock_sb):
        metadata = {
            "livekit_room": "room-1",
            "extraction_status": "ok",
            "extraction_error": None,
            "summary_generated": True,
            "save_version": "v2",
        }
        await agent.save_call(
            org_id="org-1",
            direction="inbound",
            call_start=datetime.now(timezone.utc),
            duration=120,
            transcript=[],
            metadata=metadata,
        )

    assert captured_payload.get("metadata", {}).get("save_version") == "v2"
