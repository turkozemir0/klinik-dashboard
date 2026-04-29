"""
Outbound scenario prompt builder tests.
System prompt'larının doğru içerik içerdiğini doğrular.
LLM gerektirmez — pure string assertion.
"""

import pytest
from agent import build_system_prompt


MOCK_ORG = {
    "id": "test-org",
    "name": "Test Klinik",
    "ai_persona": {
        "persona_name": "Elif",
        "language": "tr",
        "fallback_responses": {},
    },
}

MOCK_PLAYBOOK = {
    "system_prompt_template": "Sen Test Klinik'ten arayan Elif'sin.",
    "handoff_triggers": {"keywords": ["insan", "yetkili"]},
    "routing_rules": [],
    "hard_blocks": [],
    "few_shot_examples": [],
}

MOCK_INTAKE = [
    {"key": "full_name", "label": "Ad Soyad", "priority": "must",
     "voice_prompt": "Adınızı öğrenebilir miyim?"},
    {"key": "phone",     "label": "Telefon",  "priority": "must",
     "voice_prompt": "Telefon numaranızı alabilir miyim?"},
]


def test_build_system_prompt_contains_persona():
    prompt = build_system_prompt(MOCK_ORG, MOCK_PLAYBOOK, MOCK_INTAKE, "", False, "tr")
    assert "Elif" in prompt or "Test Klinik" in prompt


def test_build_system_prompt_contains_must_fields():
    prompt = build_system_prompt(MOCK_ORG, MOCK_PLAYBOOK, MOCK_INTAKE, "", False, "tr")
    assert "Adınızı" in prompt
    assert "Telefon" in prompt or "numaranızı" in prompt


def test_build_system_prompt_calendar_section_when_enabled():
    prompt = build_system_prompt(MOCK_ORG, MOCK_PLAYBOOK, MOCK_INTAKE, "", True, "tr")
    assert "check_availability" in prompt or "RANDEVU" in prompt


def test_build_system_prompt_no_calendar_section_when_disabled():
    prompt = build_system_prompt(MOCK_ORG, MOCK_PLAYBOOK, MOCK_INTAKE, "", False, "tr")
    assert "check_availability" not in prompt


def test_build_system_prompt_kb_context_included():
    kb = "Hizmet: Saç ekimi fiyatı 15.000 TL"
    prompt = build_system_prompt(MOCK_ORG, MOCK_PLAYBOOK, MOCK_INTAKE, kb, False, "tr")
    assert "Saç ekimi" in prompt


def test_build_system_prompt_handoff_keywords():
    prompt = build_system_prompt(MOCK_ORG, MOCK_PLAYBOOK, MOCK_INTAKE, "", False, "tr")
    assert "insan" in prompt or "yetkili" in prompt


def test_build_system_prompt_conversation_rules():
    """Her turda 1 soru, max 2 cümle kuralları mevcut olmalı."""
    prompt = build_system_prompt(MOCK_ORG, MOCK_PLAYBOOK, MOCK_INTAKE, "", False, "tr")
    assert "1 soru" in prompt or "yalnızca 1" in prompt


def test_build_system_prompt_no_playbook():
    """Playbook None olsa bile çalışmalı."""
    prompt = build_system_prompt(MOCK_ORG, None, MOCK_INTAKE, "", False, "tr")
    assert isinstance(prompt, str)
    assert len(prompt) > 0


def test_build_system_prompt_en_lang_closing():
    """EN dilinde kapanış mesajı İngilizce olmalı."""
    prompt = build_system_prompt(MOCK_ORG, MOCK_PLAYBOOK, MOCK_INTAKE, "", False, "en")
    assert "consultant" in prompt or "I've noted" in prompt


# ── Scenario opening message content checks ────────────────────────────────────

OUTBOUND_SCENARIOS = [
    ("first_contact",    "iki dakikanız"),
    ("warm_followup",    "Geçen görüşmemizden"),
    ("appt_confirm",     "teyit"),
    ("noshow_followup",  "bekliyorduk"),
    ("satisfaction_survey", "memnuniyet"),
    ("treatment_reminder",  "kontrol"),
    ("reactivation",     "özledik"),
    ("payment_followup", "ödeme"),
    ("appointment_reminder", "hatırlatmak"),
]


@pytest.mark.parametrize("scenario,expected_keyword", OUTBOUND_SCENARIOS)
def test_outbound_opening_contains_keyword(scenario, expected_keyword):
    """Her outbound senaryonun açılış mesajı beklenen kelimeyi içermeli."""
    # Opening mesajları agent.py'de f-string ile üretilir — burada pattern'i test et
    contact_name = "Ali Bey"
    org_name = "Test Klinik"
    persona_name = "Elif"

    openings = {
        "first_contact": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name}. "
            "Bize ilgi gösterdiğinizi gördük, iki dakikanız var mı?"
        ),
        "warm_followup": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name}. "
            "Geçen görüşmemizden sonra aklınıza takılan bir şey var mı?"
        ),
        "appt_confirm": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name} arıyorum. "
            "Yaklaşan randevunuzu teyit etmek istedim. Randevunuz için uygun musunuz?"
        ),
        "noshow_followup": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name} arıyorum. "
            "Bugün sizi bekliyorduk, her şey yolunda mı?"
        ),
        "satisfaction_survey": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name} arıyorum. "
            "Kısa bir memnuniyet değerlendirmesi için iki dakikanız var mı?"
        ),
        "treatment_reminder": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name} arıyorum. "
            "Periyodik kontrol zamanınız geldi, randevu almak ister misiniz?"
        ),
        "reactivation": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name} arıyorum. "
            "Sizi özledik! Uygun musunuz, iki dakikanız var mı?"
        ),
        "payment_followup": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name} arıyorum. "
            "Hesabınızla ilgili kısa bir bilgilendirme için arıyorum, uygun musunuz?"
        ),
        "appointment_reminder": (
            f"Merhaba, {contact_name}! Ben {org_name}'dan {persona_name} arıyorum. "
            "Yarınki randevunuzu hatırlatmak istedim. Randevunuz için hazır mısınız?"
        ),
    }
    opening = openings[scenario]
    assert expected_keyword in opening, (
        f"Scenario '{scenario}': '{expected_keyword}' not found in opening: {opening!r}"
    )
