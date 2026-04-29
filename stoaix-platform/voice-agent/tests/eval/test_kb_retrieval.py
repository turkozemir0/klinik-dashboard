"""
KB arama kalitesi testleri — LLM gerektirmez, unit test.

Mock KB data ile vector search sonuç kalitesini test eder.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.fixtures.clinic_fixtures import CLINIC_FIXTURES

# KB sonuçlarını similarity'ye göre filtreleyen helper
SIMILARITY_THRESHOLD = 0.3


def filter_kb_results(mock_kb: list, threshold: float = SIMILARITY_THRESHOLD) -> list:
    """Mock KB'den similarity threshold'u geçenleri similarity'ye göre sırala."""
    filtered = [item for item in mock_kb if item.get("similarity", 0) >= threshold]
    return sorted(filtered, key=lambda x: x["similarity"], reverse=True)


def format_kb_context(kb_results: list) -> str:
    """KB sonuçlarını prompt'a eklenecek formata çevir."""
    if not kb_results:
        return ""
    return "\n".join(
        f"- {item['title']}: {item['description_for_ai']}"
        for item in kb_results
    )


# ── Parametrize ──────────────────────────────────────────────────────────────

CLINIC_TYPES = list(CLINIC_FIXTURES.keys())


@pytest.fixture(params=CLINIC_TYPES, ids=CLINIC_TYPES)
def clinic_kb(request):
    return {
        "clinic_type": request.param,
        "mock_kb": CLINIC_FIXTURES[request.param]["mock_kb"],
    }


# ── Similarity Filtering Tests ───────────────────────────────────────────────

class TestSimilarityFiltering:

    def test_high_similarity_returned_first(self, clinic_kb):
        """Yüksek benzerlik skoru olan sonuç ilk sırada olmalı."""
        results = filter_kb_results(clinic_kb["mock_kb"])
        if len(results) >= 2:
            assert results[0]["similarity"] >= results[1]["similarity"]

    def test_low_similarity_filtered(self, clinic_kb):
        """0.3 altı benzerlik filtrelenmeli."""
        results = filter_kb_results(clinic_kb["mock_kb"])
        for item in results:
            assert item["similarity"] >= SIMILARITY_THRESHOLD, (
                f"Item '{item['title']}' has similarity {item['similarity']} < {SIMILARITY_THRESHOLD}"
            )

    def test_irrelevant_content_excluded(self, clinic_kb):
        """'Alakasız' / düşük similarity item'lar filtrelenmeli."""
        all_items = clinic_kb["mock_kb"]
        low_items = [i for i in all_items if i["similarity"] < SIMILARITY_THRESHOLD]
        results = filter_kb_results(all_items)
        for low in low_items:
            assert low not in results

    def test_at_least_one_result(self, clinic_kb):
        """Her klinik tipinde en az 1 yüksek similarity sonuç olmalı."""
        results = filter_kb_results(clinic_kb["mock_kb"])
        assert len(results) >= 1, f"No KB results for {clinic_kb['clinic_type']}"


# ── KB Context Formatting Tests ──────────────────────────────────────────────

class TestKBContextFormatting:

    def test_format_includes_title(self, clinic_kb):
        """Format çıktısı title içermeli."""
        results = filter_kb_results(clinic_kb["mock_kb"])
        context = format_kb_context(results)
        for item in results:
            assert item["title"] in context

    def test_format_includes_description(self, clinic_kb):
        """Format çıktısı description_for_ai içermeli."""
        results = filter_kb_results(clinic_kb["mock_kb"])
        context = format_kb_context(results)
        for item in results:
            assert item["description_for_ai"] in context

    def test_empty_kb_returns_empty_string(self):
        """Boş KB → boş string."""
        assert format_kb_context([]) == ""

    def test_format_excludes_irrelevant(self, clinic_kb):
        """Format'a sadece threshold üstü item'lar girmeli."""
        results = filter_kb_results(clinic_kb["mock_kb"])
        context = format_kb_context(results)
        all_items = clinic_kb["mock_kb"]
        excluded = [i for i in all_items if i["similarity"] < SIMILARITY_THRESHOLD]
        for item in excluded:
            if item["description_for_ai"] != "alakasız içerik":
                assert item["title"] not in context


# ── Sample Query Tests ───────────────────────────────────────────────────────

class TestSampleQueries:
    """clinic_fixtures'daki sample_queries ile KB sonuç kalitesini test et."""

    @pytest.mark.parametrize("clinic_type", CLINIC_TYPES)
    def test_sample_queries_have_expected_keywords(self, clinic_type):
        """Her sample query için beklenen keyword'ler KB'de bulunmalı."""
        fixture = CLINIC_FIXTURES[clinic_type]
        results = filter_kb_results(fixture["mock_kb"])
        kb_text = " ".join(
            f"{item['title']} {item['description_for_ai']}" for item in results
        )

        for query, expected_keywords in fixture["sample_queries"]:
            for kw in expected_keywords:
                assert kw.lower() in kb_text.lower(), (
                    f"[{clinic_type}] Query '{query}': keyword '{kw}' not in KB results"
                )

    @pytest.mark.parametrize("clinic_type", CLINIC_TYPES)
    def test_all_clinic_types_have_sample_queries(self, clinic_type):
        """Her klinik tipinde en az 2 sample query olmalı."""
        fixture = CLINIC_FIXTURES[clinic_type]
        assert len(fixture["sample_queries"]) >= 2, (
            f"{clinic_type} has fewer than 2 sample queries"
        )
