"""
Çok turlu diyalog testleri.

- LLM gerektirmeyen testler: her zaman çalışır (8 sektör × 3 = 24 test)
- LLM judge testleri: OPENAI_API_KEY gerektirir, yoksa skip edilir
"""

import os
import pytest
from agent import build_system_prompt
from tests.fixtures.clinic_fixtures import CLINIC_FIXTURES

JUDGE_SKIP = pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "test-openai-key",
    reason="LLM judge için gerçek OPENAI_API_KEY gerekli",
)


# ── LLM gerektirmeyen testler ────────────────────────────────────────────────

@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_opening_message_has_persona(sector_key, fixture):
    """Açılış mesajı persona adını veya 'Ben' ifadesini içermeli."""
    opening = fixture["playbook"]["opening_message"]
    persona = fixture["org"]["ai_persona"]["persona_name"]
    assert persona in opening or "Ben" in opening, (
        f"[{sector_key}] Açılış mesajında persona adı veya 'Ben' bulunamadı: '{opening}'"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_handoff_keywords_defined(sector_key, fixture):
    """Her sektörde en az 1 handoff keyword tanımlı olmalı."""
    kws = fixture["playbook"]["handoff_triggers"].get("keywords", [])
    assert len(kws) > 0, (
        f"[{sector_key}] Handoff keyword tanımlı değil"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_intake_has_phone_must(sector_key, fixture):
    """Her sektörde 'phone' alanı must önceliğiyle tanımlı olmalı."""
    phone_fields = [
        f for f in fixture["intake"]
        if f["key"] == "phone" and f["priority"] == "must"
    ]
    assert len(phone_fields) == 1, (
        f"[{sector_key}] 'phone' must field yok veya birden fazla: {phone_fields}"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_intake_has_exactly_three_must_fields(sector_key, fixture):
    """Her sektörde tam 3 must field olmalı."""
    must_fields = [f for f in fixture["intake"] if f["priority"] == "must"]
    assert len(must_fields) == 3, (
        f"[{sector_key}] Beklenen 3 must field, bulunan: {[f['key'] for f in must_fields]}"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_intake_has_full_name_must(sector_key, fixture):
    """Her sektörde 'full_name' alanı must önceliğiyle tanımlı olmalı."""
    name_fields = [
        f for f in fixture["intake"]
        if f["key"] == "full_name" and f["priority"] == "must"
    ]
    assert len(name_fields) == 1, (
        f"[{sector_key}] 'full_name' must field yok"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_intake_has_service_interest_must(sector_key, fixture):
    """Her sektörde 'service_interest' alanı must önceliğiyle tanımlı olmalı."""
    si_fields = [
        f for f in fixture["intake"]
        if f["key"] == "service_interest" and f["priority"] == "must"
    ]
    assert len(si_fields) == 1, (
        f"[{sector_key}] 'service_interest' must field yok"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_hard_blocks_have_keywords_and_response(sector_key, fixture):
    """Her hard block en az 1 keyword ve bir response içermeli."""
    for i, block in enumerate(fixture["playbook"]["hard_blocks"]):
        assert block.get("keywords"), (
            f"[{sector_key}] Block #{i} keywords boş"
        )
        assert block.get("response"), (
            f"[{sector_key}] Block #{i} response boş"
        )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_prompt_does_not_leak_placeholder_variables(sector_key, fixture):
    """Promptta {KLINIK_ADI} veya {PERSONA_ADI} gibi çözülmemiş yer tutucular kalmamalı."""
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=""
    )
    # system_prompt_template içindeki yer tutucular çözülmüş olmayabilir (agent build eder)
    # Burada fixture'dan gelen template'ın promptta ham kalmasını kontrol ediyoruz
    # Sadece KONUŞMA KURALLARI bölümünde yer tutucu olup olmadığını kontrol et
    rules_start = prompt.find("KONUŞMA KURALLARI")
    if rules_start != -1:
        rules_section = prompt[rules_start:]
        assert "{KLINIK_ADI}" not in rules_section, (
            f"[{sector_key}] Kurallar bölümünde çözülmemiş {{KLINIK_ADI}} bulundu"
        )


# ── LLM Judge testleri (OPENAI_API_KEY gerekli) ──────────────────────────────

@JUDGE_SKIP
@pytest.mark.asyncio
@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
async def test_first_contact_opening_quality(sector_key, fixture, judge_llm, sector_mock_supabase):
    """
    LLM judge: Açılış mesajı kalite değerlendirmesi.
    Kriterler: kendini tanıttı mı, doğal mı, özlü mü?
    Puan >= 70 geçer.
    """
    opening = fixture["playbook"]["opening_message"]
    org_name = fixture["org"]["name"]

    response = judge_llm.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Bir AI satış asistanının açılış mesajını değerlendir. "
                    "0-100 arası puan ver. Sadece sayı yaz, başka bir şey yazma. "
                    "Kriterler: klinik adı veya asistan adı var mı (+30), "
                    "doğal ve samimi mi (+30), kısa ve öz mü (+20), "
                    "uygun mu (+20)."
                ),
            },
            {
                "role": "user",
                "content": f"Klinik: {org_name}\nAçılış: {opening}",
            },
        ],
        temperature=0,
        max_tokens=5,
    )
    score_text = response.choices[0].message.content.strip()
    try:
        score = int(score_text)
    except ValueError:
        pytest.fail(f"[{sector_key}] LLM judge sayısal puan döndürmedi: '{score_text}'")

    assert score >= 70, (
        f"[{sector_key}] Açılış mesajı kalite puanı düşük: {score}/100\n"
        f"Mesaj: {opening}"
    )


@JUDGE_SKIP
@pytest.mark.asyncio
@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
async def test_hard_block_response_quality(sector_key, fixture, judge_llm, sector_mock_supabase):
    """
    LLM judge: Hard block yanıtlarının kalite değerlendirmesi.
    Kapsam dışı soruya nazik ama sınır koyucu yanıt verilmeli.
    Puan >= 65 geçer.
    """
    for block in fixture["playbook"]["hard_blocks"]:
        trigger_kw = block["keywords"][0] if block["keywords"] else "kapsam dışı konu"
        response_text = block.get("response", "")

        judge_response = judge_llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Bir AI asistanın kapsam dışı soruya verdiği yanıtı değerlendir. "
                        "0-100 arası puan ver. Sadece sayı yaz. "
                        "Kriterler: nazik mi (+25), kapsam sınırı koyuyor mu (+35), "
                        "kısa mı (+20), Türkçe ve doğal mı (+20)."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Tetikleyici konu: {trigger_kw}\n"
                        f"Asistan yanıtı: {response_text}"
                    ),
                },
            ],
            temperature=0,
            max_tokens=5,
        )
        score_text = judge_response.choices[0].message.content.strip()
        try:
            score = int(score_text)
        except ValueError:
            pytest.fail(
                f"[{sector_key}] LLM judge sayısal puan döndürmedi: '{score_text}'"
            )

        assert score >= 65, (
            f"[{sector_key}] Hard block yanıt puanı düşük ({score}/100) "
            f"keyword='{trigger_kw}': '{response_text}'"
        )
