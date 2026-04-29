"""
Veri çıkarma doğruluğu testleri — LLM gerekli (GPT-4o-mini).

extract_collected_data() fonksiyonunu gerçek transcript'lerle test eder.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from agent import extract_collected_data, calculate_qualification_score
from tests.fixtures.clinic_fixtures import CLINIC_FIXTURES

pytestmark = pytest.mark.llm


@pytest.fixture(scope="session")
def ensure_openai():
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key or api_key == "test-openai-key":
        pytest.skip("OPENAI_API_KEY not set")


# ── Test Transcripts ─────────────────────────────────────────────────────────

TRANSCRIPT_NAME_PHONE = [
    {"role": "assistant", "content": "Adınızı öğrenebilir miyim?"},
    {"role": "user", "content": "Ahmet Yılmaz"},
    {"role": "assistant", "content": "Telefon numaranızı alabilir miyim?"},
    {"role": "user", "content": "beş üç iki bir iki üç dört beş altı yedi"},
]

TRANSCRIPT_FULL_HAIR = [
    {"role": "assistant", "content": "Merhaba! Size nasıl yardımcı olabilirim?"},
    {"role": "user", "content": "Saç ekimi hakkında bilgi almak istiyorum"},
    {"role": "assistant", "content": "FUE mi DHI mi düşünüyorsunuz?"},
    {"role": "user", "content": "FUE istiyorum"},
    {"role": "assistant", "content": "Adınızı öğrenebilir miyim?"},
    {"role": "user", "content": "Mehmet Kaya"},
    {"role": "assistant", "content": "Telefon numaranızı alabilir miyim?"},
    {"role": "user", "content": "0532 111 22 33"},
    {"role": "assistant", "content": "Yaklaşık kaç greft düşünüyorsunuz?"},
    {"role": "user", "content": "3000 civarı dediler"},
    {"role": "assistant", "content": "Bütçe aralığınız nedir?"},
    {"role": "user", "content": "20-30 bin TL arası"},
]

TRANSCRIPT_DENTAL = [
    {"role": "assistant", "content": "Nasıl yardımcı olabilirim?"},
    {"role": "user", "content": "İmplant yaptırmak istiyorum"},
    {"role": "assistant", "content": "Adınızı öğrenebilir miyim?"},
    {"role": "user", "content": "Ayşe Demir"},
    {"role": "assistant", "content": "Telefon numaranızı alabilir miyim?"},
    {"role": "user", "content": "0544 987 65 43"},
    {"role": "assistant", "content": "Mevcut bir şikayetiniz var mı?"},
    {"role": "user", "content": "Alt çenemde 2 diş eksik"},
]

TRANSCRIPT_PARTIAL = [
    {"role": "assistant", "content": "Adınızı öğrenebilir miyim?"},
    {"role": "user", "content": "Ali"},
    {"role": "assistant", "content": "Telefon numaranızı alabilir miyim?"},
    {"role": "user", "content": "Şimdi veremem sonra ararım"},
]

TRANSCRIPT_PHONE_WRITTEN = [
    {"role": "assistant", "content": "Telefon numaranızı alabilir miyim?"},
    {"role": "user", "content": "sıfır beş üç iki dört beş altı yedi sekiz dokuz sıfır"},
]

TRANSCRIPT_EMPTY = []


# ── Extraction Tests ─────────────────────────────────────────────────────────

class TestExtractCollectedData:

    @pytest.mark.asyncio
    async def test_extract_name_and_phone(self, ensure_openai):
        intake = CLINIC_FIXTURES["hair_transplant"]["intake"]
        result = await extract_collected_data(TRANSCRIPT_NAME_PHONE, intake)
        assert result.get("full_name") is not None
        assert "Ahmet" in result["full_name"]
        # Telefon numarası çeşitli formatlarda gelebilir
        phone = (result.get("phone") or "").replace(" ", "").replace("-", "")
        assert "5321234567" in phone or "532" in phone

    @pytest.mark.asyncio
    async def test_extract_full_hair_transplant(self, ensure_openai):
        intake = CLINIC_FIXTURES["hair_transplant"]["intake"]
        result = await extract_collected_data(TRANSCRIPT_FULL_HAIR, intake)
        assert "Mehmet" in (result.get("full_name") or "")
        assert "532" in (result.get("phone") or "").replace(" ", "")
        assert result.get("service_interest") is not None
        assert "FUE" in (result.get("service_interest") or "").upper()

    @pytest.mark.asyncio
    async def test_extract_dental(self, ensure_openai):
        intake = CLINIC_FIXTURES["dental"]["intake"]
        result = await extract_collected_data(TRANSCRIPT_DENTAL, intake)
        assert "Ayşe" in (result.get("full_name") or "")
        assert "544" in (result.get("phone") or "").replace(" ", "")
        assert result.get("service_interest") is not None

    @pytest.mark.asyncio
    async def test_extract_partial_data(self, ensure_openai):
        """Eksik bilgi olduğunda null dönmeli."""
        intake = CLINIC_FIXTURES["hair_transplant"]["intake"]
        result = await extract_collected_data(TRANSCRIPT_PARTIAL, intake)
        assert result.get("full_name") is not None  # "Ali" yakalanmalı
        # phone null veya boş olmalı
        phone = result.get("phone")
        assert phone is None or phone == "" or "veremem" not in phone

    @pytest.mark.asyncio
    async def test_extract_empty_transcript(self, ensure_openai):
        """Boş transcript → boş dict."""
        intake = CLINIC_FIXTURES["hair_transplant"]["intake"]
        result = await extract_collected_data(TRANSCRIPT_EMPTY, intake)
        assert result == {}

    @pytest.mark.asyncio
    async def test_extract_phone_written_as_words(self, ensure_openai):
        """Yazıyla söylenen telefon numarasını çıkarabilmeli."""
        intake = [
            {"key": "phone", "label": "Telefon", "type": "phone", "priority": "must"},
        ]
        result = await extract_collected_data(TRANSCRIPT_PHONE_WRITTEN, intake)
        phone = (result.get("phone") or "").replace(" ", "").replace("-", "")
        assert "5324567890" in phone or "532" in phone


# ── Qualification Score Tests ────────────────────────────────────────────────

class TestQualificationScore:
    """calculate_qualification_score — LLM gerektirmez ama extraction verisi ile çalışır."""

    def test_full_score_all_fields(self):
        intake = CLINIC_FIXTURES["hair_transplant"]["intake"]
        collected = {
            "full_name": "Ahmet Yılmaz",
            "phone": "05321234567",
            "service_interest": "FUE",
            "greft_estimate": "3000",
            "budget_range": "20-30k",
            "is_foreign": "hayır",
        }
        score = calculate_qualification_score(intake, collected)
        assert score == 100

    def test_only_must_fields(self):
        intake = CLINIC_FIXTURES["hair_transplant"]["intake"]
        collected = {
            "full_name": "Ahmet Yılmaz",
            "phone": "05321234567",
            "service_interest": "FUE",
        }
        score = calculate_qualification_score(intake, collected)
        assert score == 70  # must 100% * 70 = 70

    def test_no_fields(self):
        intake = CLINIC_FIXTURES["hair_transplant"]["intake"]
        score = calculate_qualification_score(intake, {})
        assert score == 0

    def test_empty_intake(self):
        score = calculate_qualification_score([], {"full_name": "test"})
        assert score == 0

    def test_partial_must_partial_should(self):
        intake = CLINIC_FIXTURES["hair_transplant"]["intake"]
        collected = {
            "full_name": "Ahmet Yılmaz",
            "phone": "05321234567",
            # service_interest eksik
            "budget_range": "20-30k",
        }
        score = calculate_qualification_score(intake, collected)
        # must: 2/3 * 70 = 46.67, should: 1/3 * 30 = 10 → 57
        assert 55 <= score <= 60
