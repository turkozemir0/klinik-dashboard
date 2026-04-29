"""
KB (Bilgi Tabanı) relevance testleri.
Mock embedding kullanır — gerçek OpenAI çağrısı yok.
16 test, CI/CD uyumlu.
"""

import pytest
from agent import build_system_prompt
from tests.fixtures.clinic_fixtures import CLINIC_FIXTURES

SIMILARITY_THRESHOLD = 0.3


def _build_kb_text(items: list, threshold: float = SIMILARITY_THRESHOLD) -> str:
    """similarity >= threshold olan itemları KB metnine dönüştür."""
    valid = [i for i in items if i["similarity"] >= threshold]
    if not valid:
        return ""
    return "\n\n---\n\n".join(
        f"[{i['title']}]\n{i['description_for_ai']}" for i in valid
    )


# ── Eşik filtresi testleri ───────────────────────────────────────────────────

def test_kb_similarity_threshold_excludes_low():
    """similarity < 0.3 olan itemlar KB metnine dahil edilmemeli."""
    items = [
        {"title": "Yüksek", "description_for_ai": "ilgili içerik", "similarity": 0.85},
        {"title": "Düşük",  "description_for_ai": "alakasız içerik", "similarity": 0.25},
    ]
    kb_text = _build_kb_text(items)
    assert "ilgili içerik" in kb_text
    assert "alakasız içerik" not in kb_text


def test_kb_all_low_similarity_returns_empty():
    """Tüm itemlar eşiğin altındaysa boş string dönmeli."""
    items = [
        {"title": "A", "description_for_ai": "x", "similarity": 0.10},
        {"title": "B", "description_for_ai": "y", "similarity": 0.20},
    ]
    assert _build_kb_text(items) == ""


def test_kb_exact_threshold_included():
    """Tam eşik değerindeki (0.3) item dahil edilmeli."""
    items = [{"title": "Tam Eşik", "description_for_ai": "tam eşik içerik", "similarity": 0.30}]
    kb_text = _build_kb_text(items)
    assert "tam eşik içerik" in kb_text


# ── Prompt entegrasyonu testleri ─────────────────────────────────────────────

@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_kb_empty_returns_valid_prompt(sector_key, fixture):
    """KB boşken prompt geçerli ve yeterince uzun olmalı."""
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=""
    )
    assert len(prompt) > 200, (
        f"[{sector_key}] KB boşken prompt çok kısa: {len(prompt)} karakter"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_kb_injected_when_present(sector_key, fixture):
    """Geçerli KB itemları (similarity >= 0.3) promptta görünmeli."""
    valid_items = [i for i in fixture["mock_kb"] if i["similarity"] >= SIMILARITY_THRESHOLD]
    if not valid_items:
        pytest.skip(f"[{sector_key}] Geçerli KB item yok")

    kb_text = _build_kb_text(fixture["mock_kb"])
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=kb_text
    )
    assert any(i["title"] in prompt for i in valid_items), (
        f"[{sector_key}] Geçerli KB itemların hiçbiri promptta bulunamadı"
    )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_low_similarity_items_excluded_from_prompt(sector_key, fixture):
    """similarity < 0.3 itemların description içeriği promptta olmamalı."""
    low_items = [i for i in fixture["mock_kb"] if i["similarity"] < SIMILARITY_THRESHOLD]
    if not low_items:
        pytest.skip(f"[{sector_key}] Düşük benzerlikli item yok")

    # Sadece geçerli itemları içeren KB text oluştur
    kb_text = _build_kb_text(fixture["mock_kb"])
    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=kb_text
    )
    for item in low_items:
        assert item["description_for_ai"] not in prompt, (
            f"[{sector_key}] Düşük benzerlikli item '{item['title']}' promptta bulundu"
        )


@pytest.mark.parametrize("sector_key,fixture", CLINIC_FIXTURES.items())
def test_kb_section_present_when_content_provided(sector_key, fixture):
    """KB içeriği verildiğinde promptta BİLGİ TABANI bölümü olmalı."""
    kb_text = _build_kb_text(fixture["mock_kb"])
    if not kb_text:
        pytest.skip(f"[{sector_key}] Geçerli KB item yok")

    prompt = build_system_prompt(
        fixture["org"], fixture["playbook"], fixture["intake"], kb_context=kb_text
    )
    assert "BİLGİ TABANI" in prompt, (
        f"[{sector_key}] KB içeriği verildiğinde BİLGİ TABANI bölümü bulunamadı"
    )
