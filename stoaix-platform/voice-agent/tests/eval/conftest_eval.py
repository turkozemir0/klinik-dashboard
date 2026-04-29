"""
Eval-specific fixtures.

real_org_fixture  — CLINIC_FIXTURES + production_prompts birleştirerek gerçek prompt üretir
full_system_prompt — build_system_prompt() çağırarak final prompt döner
judge_client      — OpenAI GPT-4o-mini (OPENAI_API_KEY yoksa skip)
anthropic_client  — Anthropic Claude (ANTHROPIC_API_KEY yoksa skip)
"""

import os
import sys
import pytest

# voice-agent/ root'u path'e ekle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.fixtures.clinic_fixtures import CLINIC_FIXTURES
from tests.eval.production_prompts import CLINIC_TYPE_CONTENT
from agent import build_system_prompt

CLINIC_TYPES = list(CLINIC_FIXTURES.keys())


def _build_real_org(clinic_type: str) -> dict:
    """CLINIC_FIXTURES + production_prompts birleştirerek gerçekçi org/playbook/intake üret."""
    fixture = CLINIC_FIXTURES[clinic_type]
    prod = CLINIC_TYPE_CONTENT.get(clinic_type, {})

    org = dict(fixture["org"])
    playbook = dict(fixture["playbook"])
    intake = list(fixture["intake"])

    # production_prompts'tan system_prompt_template'i kullan (varsa)
    if prod.get("system_prompt_template"):
        playbook["system_prompt_template"] = prod["system_prompt_template"].format(
            KLINIK_ADI=org["name"],
            PERSONA_ADI=org["ai_persona"]["persona_name"],
        )

    return {
        "org": org,
        "playbook": playbook,
        "intake": intake,
        "mock_kb": fixture.get("mock_kb", []),
    }


@pytest.fixture(params=CLINIC_TYPES, ids=CLINIC_TYPES)
def real_org_fixture(request):
    """Her klinik tipi için production-equivalent fixture."""
    return _build_real_org(request.param)


@pytest.fixture(params=CLINIC_TYPES, ids=CLINIC_TYPES)
def full_system_prompt(request):
    """build_system_prompt() ile gerçek prompt üretir — mock yok."""
    data = _build_real_org(request.param)
    kb_text = "\n".join(
        f"- {item['title']}: {item['description_for_ai']}"
        for item in data["mock_kb"]
        if item.get("similarity", 0) >= 0.3
    )
    prompt = build_system_prompt(
        org=data["org"],
        playbook=data["playbook"],
        intake_fields=data["intake"],
        kb_context=kb_text,
        calendar_enabled=data["playbook"].get("features", {}).get("calendar_booking", False),
        lang=data["org"]["ai_persona"].get("language", "tr"),
    )
    return {
        "clinic_type": request.param,
        "prompt": prompt,
        "org": data["org"],
        "playbook": data["playbook"],
        "intake": data["intake"],
    }


@pytest.fixture(scope="session")
def judge_client():
    """LLM-as-Judge için GPT-4o-mini. OPENAI_API_KEY yoksa skip."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key or api_key == "test-openai-key":
        pytest.skip("OPENAI_API_KEY not set — skipping LLM-judge tests")
    from openai import OpenAI
    return OpenAI(api_key=api_key)


@pytest.fixture(scope="session")
def anthropic_client():
    """Konuşma simülasyonu için Anthropic Claude. ANTHROPIC_API_KEY yoksa skip."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key or api_key == "test-anthropic-key":
        pytest.skip("ANTHROPIC_API_KEY not set — skipping conversation sim tests")
    from anthropic import Anthropic
    return Anthropic(api_key=api_key)


def build_prompt_for_clinic(clinic_type: str) -> str:
    """Tek bir klinik tipi için build_system_prompt çağır — test helper."""
    data = _build_real_org(clinic_type)
    kb_text = "\n".join(
        f"- {item['title']}: {item['description_for_ai']}"
        for item in data["mock_kb"]
        if item.get("similarity", 0) >= 0.3
    )
    return build_system_prompt(
        org=data["org"],
        playbook=data["playbook"],
        intake_fields=data["intake"],
        kb_context=kb_text,
        calendar_enabled=data["playbook"].get("features", {}).get("calendar_booking", False),
        lang=data["org"]["ai_persona"].get("language", "tr"),
    )
