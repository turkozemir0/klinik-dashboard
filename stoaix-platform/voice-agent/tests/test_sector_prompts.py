"""
Sektör bazlı prompt kalitesi testleri.
LLM gerektirmez — 24 test, CI/CD uyumlu.
"""

import pytest
from agent import build_system_prompt
from tests.fixtures.clinic_fixtures import CLINIC_FIXTURES


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_system_prompt_contains_persona(sector_key, fixture):
    """Prompt, persona adını içermeli."""
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=""
    )
    persona = fixture["org"]["ai_persona"]["persona_name"]
    assert persona in prompt, (
        f"[{sector_key}] Persona adı '{persona}' promptta bulunamadı"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_system_prompt_has_must_field_prompts(sector_key, fixture):
    """Zorunlu (must) alanların key veya voice_prompt'u promptta yer almalı."""
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=""
    )
    must_fields = [f for f in fixture["intake"] if f["priority"] == "must"]
    for field in must_fields:
        # build_system_prompt, label kullanır (key değil) — label veya voice_prompt yeterli
        label_in_prompt = field.get("label", "") in prompt
        vp_snippet = field.get("voice_prompt", "")[:20]
        vp_in_prompt = bool(vp_snippet) and vp_snippet in prompt
        assert label_in_prompt or vp_in_prompt, (
            f"[{sector_key}] must field '{field['key']}' (label='{field.get('label')}') "
            f"ne label ne voice_prompt promptta yok"
        )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_hard_block_keywords_in_prompt(sector_key, fixture):
    """Hard block anahtar kelimeleri promptta görünmeli."""
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=""
    )
    for block in fixture["playbook"]["hard_blocks"]:
        for kw in block["keywords"]:
            assert kw in prompt, (
                f"[{sector_key}] Hard block keyword '{kw}' promptta bulunamadı"
            )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_prompt_minimum_length(sector_key, fixture):
    """Prompt en az 300 karakter olmalı (içerik doğrulama)."""
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=""
    )
    assert len(prompt) >= 300, (
        f"[{sector_key}] Prompt çok kısa: {len(prompt)} karakter"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_prompt_contains_handoff_keywords(sector_key, fixture):
    """Handoff keyword'leri promptta yer almalı."""
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=""
    )
    hk = fixture["playbook"]["handoff_triggers"].get("keywords", [])
    for kw in hk:
        assert kw in prompt, (
            f"[{sector_key}] Handoff keyword '{kw}' promptta bulunamadı"
        )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_prompt_has_conversation_rules(sector_key, fixture):
    """Prompt konuşma kuralları bölümünü içermeli."""
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=""
    )
    assert "KONUŞMA KURALLARI" in prompt, (
        f"[{sector_key}] Konuşma kuralları bölümü promptta yok"
    )
