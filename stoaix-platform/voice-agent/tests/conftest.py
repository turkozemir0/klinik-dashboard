"""
Shared fixtures for stoaix voice agent tests.

DB tamamen mock — gerçek Supabase, LiveKit veya telefon bağlantısı yok.
"""

import os
import pytest
from tests.fixtures.clinic_fixtures import CLINIC_FIXTURES

# Test ortamı için sahte env vars (agent.py load_dotenv öncesi gerekli)
os.environ.setdefault("PLATFORM_SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("PLATFORM_SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")
os.environ.setdefault("OPENAI_API_KEY", os.environ.get("OPENAI_API_KEY", "test-openai-key"))
os.environ.setdefault("CARTESIA_API_KEY", "test-cartesia-key")
os.environ.setdefault("DEEPGRAM_API_KEY", "test-deepgram-key")
os.environ.setdefault("LIVEKIT_URL", "wss://test.livekit.cloud")
os.environ.setdefault("LIVEKIT_API_KEY", "test-lk-key")
os.environ.setdefault("LIVEKIT_API_SECRET", "test-lk-secret")
os.environ.setdefault("CARTESIA_VOICE_ID_TR", "c1cfee3d-532d-47f8-8dd2-8e5b2b66bf1d")
os.environ.setdefault("CARTESIA_VOICE_ID_EN", "b7d50908-b17c-442d-ad8d-810c63997ed9")


@pytest.fixture
def mock_org():
    return {
        "id": "test-org-id",
        "name": "Test Klinik",
        "ai_persona": {"persona_name": "Elif", "language": "tr"},
        "channel_config": {"voice": {"language": "tr"}, "voice_inbound": {"active": True}},
        "crm_config": {},
        "_plan": "business",
    }


@pytest.fixture
def mock_playbook():
    return {
        "system_prompt_template": "Sen Test Klinik adına arayan Elif'sin.",
        "opening_message": "Merhaba, Test Klinik.",
        "handoff_triggers": {"keywords": ["insan", "yetkili", "yönetici"]},
        "routing_rules": [],
        "hard_blocks": [],
        "few_shot_examples": [],
        "features": {"model": "claude-sonnet-4-6", "calendar_booking": False},
    }


@pytest.fixture
def mock_intake():
    return [
        {"key": "full_name", "label": "Ad Soyad", "priority": "must",  "type": "text",
         "voice_prompt": "Adınızı öğrenebilir miyim?"},
        {"key": "phone",     "label": "Telefon",  "priority": "must",  "type": "phone",
         "voice_prompt": "Telefon numaranızı alabilir miyim?"},
        {"key": "city",      "label": "Şehir",    "priority": "should","type": "text",
         "voice_prompt": "Hangi şehirdesiniz?"},
    ]


@pytest.fixture
def mock_supabase(mocker, mock_org, mock_playbook, mock_intake):
    """Tüm Supabase çağrılarını mock'la — DB'ye hiç dokunma."""
    import sys
    # agent modülü import edilmeden önce supabase mock'u zaten kurulu olmalı
    mocker.patch("agent.load_org", return_value=mock_org)
    mocker.patch("agent.load_playbook", return_value=mock_playbook)
    mocker.patch("agent.load_intake_schema", return_value=mock_intake)
    mocker.patch("agent.vector_search_kb", return_value="")
    mocker.patch("agent.get_supabase")
    mocker.patch("agent.save_messages")
    mocker.patch("agent.save_call")
    mocker.patch("agent.update_lead_data")
    mocker.patch("agent.close_conversation")
    mocker.patch("agent.create_conversation", return_value="test-conv-id")
    mocker.patch("agent.upsert_contact_and_lead", return_value=("test-contact-id", "test-lead-id"))


@pytest.fixture(params=list(CLINIC_FIXTURES.keys()))
def sector_fixture(request):
    """8 sektör için parametrize fixture — her test 8 kez çalışır."""
    return CLINIC_FIXTURES[request.param]


@pytest.fixture
def sector_mock_supabase(mocker, sector_fixture):
    """Sektöre özgü mock — gerçek DB/LLM yok."""
    mocker.patch("agent.load_org",           return_value=sector_fixture["org"])
    mocker.patch("agent.load_playbook",      return_value=sector_fixture["playbook"])
    mocker.patch("agent.load_intake_schema", return_value=sector_fixture["intake"])
    mocker.patch("agent.vector_search_kb",   return_value="")
    mocker.patch("agent.get_supabase")
    mocker.patch("agent.save_messages")
    mocker.patch("agent.save_call")
    mocker.patch("agent.update_lead_data")
    mocker.patch("agent.close_conversation")
    mocker.patch("agent.create_conversation", return_value="test-conv-id")
    mocker.patch("agent.upsert_contact_and_lead", return_value=("test-contact-id", "test-lead-id"))


@pytest.fixture(scope="session")
def judge_llm():
    """
    LLM-as-a-judge için gpt-4o-mini.
    Gerçek OPENAI_API_KEY gerektirir. CI'da atlanır.
    """
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key or api_key == "test-openai-key":
        pytest.skip("OPENAI_API_KEY not set — skipping LLM-judge tests")
    from openai import OpenAI
    return OpenAI(api_key=api_key)
