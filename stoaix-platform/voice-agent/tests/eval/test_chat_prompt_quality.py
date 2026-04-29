"""
Chat prompt yapı testleri — LLM gerektirmez, unit test.

build_chat_system_prompt() çıktısını statik olarak analiz eder:
- Guardrails var mı?
- Hard blocks mevcut mu?
- Intake tanımlı mı?
- Placeholder'lar doğru mu?

8 klinik tipi × ~5 kontrol = ~40 test
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.eval.production_prompts import (
    CHAT_CLINIC_TYPE_CONTENT,
    build_chat_system_prompt,
    CHAT_GUARDRAILS_TEXT,
)

CHAT_CLINIC_TYPES = list(CHAT_CLINIC_TYPE_CONTENT.keys())

ORG_NAME = "Test Kliniği"
PERSONA_NAME = "Elif"


@pytest.fixture(params=CHAT_CLINIC_TYPES, ids=CHAT_CLINIC_TYPES)
def chat_prompt(request):
    return build_chat_system_prompt(request.param, ORG_NAME, PERSONA_NAME)


@pytest.fixture(params=CHAT_CLINIC_TYPES, ids=CHAT_CLINIC_TYPES)
def chat_data(request):
    ct = request.param
    return {
        "clinic_type": ct,
        "prompt": build_chat_system_prompt(ct, ORG_NAME, PERSONA_NAME),
        "content": CHAT_CLINIC_TYPE_CONTENT[ct],
    }


# ── Guardrails Tests ─────────���───────────────────────────────────────────────

class TestChatGuardrailsPresence:
    """Chat guardrails'in prompt'ta bulunduğunu doğrula."""

    def test_prompt_contains_guardrails_text(self, chat_prompt):
        # CHAT_GUARDRAILS_TEXT prompt'un sonuna ekleniyor
        assert "teşhis" in chat_prompt.lower() or "tedavi önerme" in chat_prompt.lower()

    def test_prompt_contains_no_drug_advice(self, chat_prompt):
        assert "ilaç" in chat_prompt.lower() or "reçete" in chat_prompt.lower()

    def test_prompt_contains_handoff_instruction(self, chat_prompt):
        assert "danışman" in chat_prompt.lower() or "devir" in chat_prompt.lower()

    def test_prompt_org_name_substituted(self, chat_prompt):
        assert ORG_NAME in chat_prompt
        assert "{KLINIK_ADI}" not in chat_prompt

    def test_prompt_persona_name_substituted(self, chat_prompt):
        assert PERSONA_NAME in chat_prompt
        assert "{PERSONA_ADI}" not in chat_prompt


# ── Hard Blocks Tests ──────────────────��───────────────────────────��─────────

class TestChatHardBlocks:
    """Her klinik tipi için hard block tanımlı olmalı."""

    def test_has_hard_blocks(self, chat_data):
        blocks = chat_data["content"].get("hard_blocks", [])
        assert len(blocks) >= 2, f"{chat_data['clinic_type']} has fewer than 2 hard blocks"

    def test_hard_blocks_have_keywords(self, chat_data):
        for block in chat_data["content"].get("hard_blocks", []):
            assert "keywords" in block, "Hard block missing keywords"
            assert len(block["keywords"]) >= 1

    def test_hard_blocks_have_response(self, chat_data):
        for block in chat_data["content"].get("hard_blocks", []):
            assert "response" in block, "Hard block missing response"
            assert len(block["response"]) >= 10


# ── Intake Tests ─────────────────────────────��───────────────────────────────

class TestChatIntake:
    """Intake alanları doğru tanımlı mı?"""

    def test_has_intake_fields(self, chat_data):
        intake = chat_data["content"].get("intake", [])
        assert len(intake) >= 2, f"{chat_data['clinic_type']} has fewer than 2 intake fields"

    def test_has_full_name_field(self, chat_data):
        keys = [f["key"] for f in chat_data["content"].get("intake", [])]
        assert "full_name" in keys, f"{chat_data['clinic_type']} missing full_name"

    def test_has_must_fields(self, chat_data):
        must = [f for f in chat_data["content"].get("intake", []) if f.get("priority") == "must"]
        assert len(must) >= 1, f"{chat_data['clinic_type']} has no must fields"


# ── Prompt Structure Tests ───────────────────────────────────────────────────

class TestChatPromptStructure:
    """Prompt yapısı doğru mu?"""

    def test_prompt_not_empty(self, chat_prompt):
        assert len(chat_prompt) > 100

    def test_prompt_contains_rol_section(self, chat_prompt):
        assert "# ROL" in chat_prompt

    def test_prompt_contains_qualification_flow(self, chat_prompt):
        assert "NİTELEME" in chat_prompt or "sırayla" in chat_prompt.lower()

    def test_prompt_contains_devir_kriteri(self, chat_prompt):
        assert "DEVİR" in chat_prompt or "danışman" in chat_prompt.lower()

    def test_prompt_length_reasonable(self, chat_prompt):
        word_count = len(chat_prompt.split())
        assert word_count < 5000, f"Chat prompt too long: {word_count} words"
        assert word_count > 30, f"Chat prompt too short: {word_count} words"
