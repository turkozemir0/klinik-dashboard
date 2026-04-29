"""
Prompt yapı testleri — LLM gerektirmez, unit test.

build_system_prompt() çıktısını statik olarak analiz eder:
- Guardrails var mı?
- Intake fields dahil mi?
- Handoff keywords dahil mi?
- Hard blocks dahil mi?
- Siz formu kuralı var mı?
- Tek soru kuralı var mı?
- Teşhis yasağı var mı?
- Max cümle kuralı var mı?
- Opening message var mı?
- Must field'lar var mı?
- Prompt uzunluğu makul mü?
"""

import sys
import os
import re
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.eval.conftest_eval import build_prompt_for_clinic, CLINIC_TYPES, _build_real_org
from tests.fixtures.clinic_fixtures import CLINIC_FIXTURES
from prompt_rules import (
    PLATFORM_GUARDRAILS,
    VOICE_CONVERSATION_RULES,
    NATURALNESS_RULES,
    REGISTER_RULES,
    OBJECTION_RULES,
)


# ── Parametrize: her klinik tipi için test çalışır ────────────────────────────

@pytest.fixture(params=CLINIC_TYPES, ids=CLINIC_TYPES)
def prompt(request):
    return build_prompt_for_clinic(request.param)


@pytest.fixture(params=CLINIC_TYPES, ids=CLINIC_TYPES)
def clinic_data(request):
    return {
        "clinic_type": request.param,
        "prompt": build_prompt_for_clinic(request.param),
        **_build_real_org(request.param),
    }


# ── Guardrails Tests ─────────────────────────────────────────────────────────

class TestGuardrailsPresence:
    """Platform güvenlik kurallarının prompt'ta bulunduğunu doğrula."""

    def test_prompt_contains_guardrails(self, prompt):
        assert "GÜVENLİK KURALLARI" in prompt

    def test_prompt_contains_no_diagnosis_rule(self, prompt):
        assert "teşhis" in prompt.lower()

    def test_prompt_contains_no_drug_advice_rule(self, prompt):
        # "ilaç" veya "tedavi önerme" prompt'ta olmalı
        assert "tedavi önerme" in prompt.lower() or "ilaç" in prompt.lower()

    def test_prompt_contains_emergency_handoff(self, prompt):
        # Acil durum kelimelerinin prompt'ta olması gerekir
        assert "acil" in prompt.lower()

    def test_prompt_contains_no_competitor_rule(self, prompt):
        assert "rakip" in prompt.lower()

    def test_prompt_contains_identity_concealment(self, prompt):
        assert "yapay zeka" in prompt.lower() or "robot" in prompt.lower()


# ── Intake & Qualification Tests ──────────────────────────────────────────────

class TestIntakeFields:
    """Intake alanlarının prompt'a dahil edildiğini doğrula."""

    def test_prompt_contains_intake_fields(self, clinic_data):
        prompt = clinic_data["prompt"]
        must_fields = [f for f in clinic_data["intake"] if f.get("priority") == "must"]
        for field in must_fields:
            assert field["label"] in prompt, f"Must field '{field['label']}' not in prompt"

    def test_prompt_contains_voice_prompts(self, clinic_data):
        prompt = clinic_data["prompt"]
        must_fields = [
            f for f in clinic_data["intake"]
            if f.get("priority") == "must" and f.get("voice_prompt")
        ]
        for field in must_fields:
            assert field["voice_prompt"] in prompt, (
                f"Voice prompt '{field['voice_prompt']}' not in prompt"
            )


# ── Handoff & Hard Blocks Tests ──────────────────────────────────────────────

class TestHandoffAndBlocks:
    """Handoff triggers ve hard blocks'un prompt'ta olduğunu doğrula."""

    def test_prompt_contains_handoff_keywords(self, clinic_data):
        prompt = clinic_data["prompt"]
        keywords = clinic_data["playbook"].get("handoff_triggers", {}).get("keywords", [])
        if keywords:
            # En az bir handoff keyword prompt'ta olmalı
            found = any(kw in prompt for kw in keywords)
            assert found, f"No handoff keywords found in prompt. Expected: {keywords}"

    def test_prompt_contains_hard_blocks(self, clinic_data):
        prompt = clinic_data["prompt"]
        blocks = clinic_data["playbook"].get("hard_blocks", [])
        for block in blocks:
            response = block.get("response", "")
            if response:
                assert response in prompt, f"Hard block response not in prompt: '{response[:50]}...'"


# ── Conversation Rules Tests ─────────────────────────────────────────────────

class TestConversationRules:
    """Konuşma kurallarının prompt'ta olduğunu doğrula."""

    def test_prompt_siz_form_instruction(self, prompt):
        assert '"siz"' in prompt.lower() or "siz" in prompt.lower()

    def test_prompt_single_question_rule(self, prompt):
        assert "1 soru" in prompt or "tek soru" in prompt.lower() or "yalnızca 1" in prompt

    def test_prompt_max_sentence_rule(self, prompt):
        assert "2 cümle" in prompt or "maksimum 2" in prompt

    def test_prompt_no_diagnosis_rule(self, prompt):
        assert "teşhis" in prompt.lower()

    def test_prompt_numbers_as_words_rule(self, prompt):
        assert "yazıyla" in prompt.lower()


# ── Cross-Cutting Tests ──────────────────────────────────────────────────────

class TestCrossCutting:
    """Tüm klinik tiplerinde ortak özellikler."""

    def test_all_clinic_types_have_opening_message(self):
        for ct in CLINIC_TYPES:
            fixture = CLINIC_FIXTURES[ct]
            opening = fixture["playbook"].get("opening_message", "")
            assert opening, f"{ct} has no opening_message"

    def test_all_clinic_types_have_must_fields(self):
        for ct in CLINIC_TYPES:
            fixture = CLINIC_FIXTURES[ct]
            must = [f for f in fixture["intake"] if f.get("priority") == "must"]
            assert len(must) >= 2, f"{ct} has fewer than 2 must fields"

    def test_all_clinic_types_have_full_name_and_phone(self):
        for ct in CLINIC_TYPES:
            fixture = CLINIC_FIXTURES[ct]
            keys = [f["key"] for f in fixture["intake"]]
            assert "full_name" in keys, f"{ct} missing full_name intake field"
            assert "phone" in keys, f"{ct} missing phone intake field"

    def test_prompt_length_reasonable(self):
        """Prompt uzunluğu makul olmalı (< 8000 kelime ~ 12000 token)."""
        for ct in CLINIC_TYPES:
            prompt = build_prompt_for_clinic(ct)
            word_count = len(prompt.split())
            assert word_count < 8000, f"{ct} prompt too long: {word_count} words"
            assert word_count > 50, f"{ct} prompt too short: {word_count} words"

    def test_prompt_contains_kb_section(self):
        """Her prompt'ta KB bölümü olmalı."""
        for ct in CLINIC_TYPES:
            prompt = build_prompt_for_clinic(ct)
            assert "BİLGİ TABANI" in prompt or "RAG" in prompt

    def test_prompt_contains_hallucination_rule(self):
        """Her prompt'ta halüsinasyon kuralı olmalı."""
        for ct in CLINIC_TYPES:
            prompt = build_prompt_for_clinic(ct)
            assert "HALÜSİNASYON" in prompt

    def test_prompt_calendar_section_when_enabled(self):
        """calendar_booking True olan kliniklerde RANDEVU bölümü olmalı."""
        for ct in CLINIC_TYPES:
            data = _build_real_org(ct)
            calendar = data["playbook"].get("features", {}).get("calendar_booking", False)
            prompt = build_prompt_for_clinic(ct)
            if calendar:
                assert "RANDEVU" in prompt, f"{ct} has calendar but no RANDEVU section"
