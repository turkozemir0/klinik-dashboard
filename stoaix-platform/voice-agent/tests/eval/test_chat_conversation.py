"""
Chat konuşma kalitesi testleri — LLM gerekli (GPT-4o-mini).

8 klinik tipi × 4 satış senaryosu = 32 test.
Threshold: overall >= 65, hard_block_compliance >= 80.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.eval.production_prompts import CHAT_CLINIC_TYPE_CONTENT, build_chat_system_prompt
from tests.eval.chat_scenarios import SALES_SCENARIOS
from tests.eval.chat_judges import (
    simulate_chat_conversation,
    judge_chat_conversation,
    ChatJudgeResult,
)

pytestmark = pytest.mark.llm

CHAT_CLINIC_TYPES = list(CHAT_CLINIC_TYPE_CONTENT.keys())

ORG_NAME = "Test Kliniği"
PERSONA_NAME = "Elif"

PASS_THRESHOLD = 65
HARD_BLOCK_THRESHOLD = 80


@pytest.fixture(scope="session")
def openai_client():
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key or api_key == "test-openai-key":
        pytest.skip("OPENAI_API_KEY not set — skipping LLM chat tests")
    from openai import OpenAI
    return OpenAI(api_key=api_key, timeout=30.0, max_retries=1)


def _run_sales_scenario(client, clinic_type: str, scenario) -> ChatJudgeResult:
    """Bir satış senaryosunu çalıştır ve judge sonucunu döndür."""
    ct = CHAT_CLINIC_TYPE_CONTENT.get(clinic_type, CHAT_CLINIC_TYPE_CONTENT["other"])
    system_prompt = build_chat_system_prompt(clinic_type, ORG_NAME, PERSONA_NAME)
    conversation = simulate_chat_conversation(
        client,
        system_prompt,
        scenario.patient_persona,
        scenario.initial_message,
    )
    return judge_chat_conversation(
        client, conversation, clinic_type, ct["intake"], ct["hard_blocks"],
    )


# ── Standart Konuşma ──────────────────────────────────────���─────────────────

class TestChatStandard:
    """Standart kullanıcı ile konuşma kalitesi."""

    @pytest.mark.parametrize("clinic_type", CHAT_CLINIC_TYPES)
    def test_standard_overall(self, openai_client, clinic_type):
        scenario = next(s for s in SALES_SCENARIOS if s.key == "standard")
        result = _run_sales_scenario(openai_client, clinic_type, scenario)
        assert result.overall >= PASS_THRESHOLD, (
            f"{clinic_type}/standard: overall={result.overall} "
            f"(expected >= {PASS_THRESHOLD}). Weakness: {result.weakness}"
        )


# ── Fiyat Sorusu ───────��────────────────────────────���───────────────────────

class TestChatPriceQuestion:
    """Fiyat sorusunda kesin fiyat vermemeli, lead'i nitelemeli."""

    @pytest.mark.parametrize("clinic_type", CHAT_CLINIC_TYPES)
    def test_price_compliance(self, openai_client, clinic_type):
        scenario = next(s for s in SALES_SCENARIOS if s.key == "price_question")
        result = _run_sales_scenario(openai_client, clinic_type, scenario)
        assert result.hard_block_compliance >= HARD_BLOCK_THRESHOLD, (
            f"{clinic_type}/price: hard_block_compliance={result.hard_block_compliance} "
            f"(expected >= {HARD_BLOCK_THRESHOLD}). Weakness: {result.weakness}"
        )

    @pytest.mark.parametrize("clinic_type", CHAT_CLINIC_TYPES)
    def test_price_overall(self, openai_client, clinic_type):
        scenario = next(s for s in SALES_SCENARIOS if s.key == "price_question")
        result = _run_sales_scenario(openai_client, clinic_type, scenario)
        assert result.overall >= PASS_THRESHOLD, (
            f"{clinic_type}/price: overall={result.overall} "
            f"(expected >= {PASS_THRESHOLD}). Weakness: {result.weakness}"
        )


# ── Garanti İsteyen ─��───────────────────────────────────────────────────────

class TestChatGuaranteeSeekerConversation:
    """Garanti sorularında kesin garanti vermemeli."""

    @pytest.mark.parametrize("clinic_type", CHAT_CLINIC_TYPES)
    def test_guarantee_compliance(self, openai_client, clinic_type):
        scenario = next(s for s in SALES_SCENARIOS if s.key == "guarantee_seeker")
        result = _run_sales_scenario(openai_client, clinic_type, scenario)
        assert result.hard_block_compliance >= HARD_BLOCK_THRESHOLD, (
            f"{clinic_type}/guarantee: hard_block_compliance={result.hard_block_compliance} "
            f"(expected >= {HARD_BLOCK_THRESHOLD}). Weakness: {result.weakness}"
        )


# ── Rakip Karşılaştırma ─────────────────────────────────────────────────────

class TestChatCompetitorQuestion:
    """Rakip klinikler hakkında yorum yapmamalı."""

    @pytest.mark.parametrize("clinic_type", CHAT_CLINIC_TYPES)
    def test_competitor_overall(self, openai_client, clinic_type):
        scenario = next(s for s in SALES_SCENARIOS if s.key == "competitor_question")
        result = _run_sales_scenario(openai_client, clinic_type, scenario)
        assert result.overall >= PASS_THRESHOLD, (
            f"{clinic_type}/competitor: overall={result.overall} "
            f"(expected >= {PASS_THRESHOLD}). Weakness: {result.weakness}"
        )
