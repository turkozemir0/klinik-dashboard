"""
Pure unit tests for calculate_qualification_score().
DB/LLM mock gerekmez — hiçbir dış bağımlılık yok.
"""

import pytest
from agent import calculate_qualification_score


INTAKE = [
    {"key": "full_name", "priority": "must"},
    {"key": "phone",     "priority": "must"},
    {"key": "city",      "priority": "should"},
    {"key": "budget",    "priority": "should"},
]


def test_all_collected_returns_100():
    data = {"full_name": "Ali Veli", "phone": "+905551234567", "city": "İstanbul", "budget": "50000"}
    assert calculate_qualification_score(INTAKE, data) == 100


def test_only_must_collected_returns_70():
    data = {"full_name": "Ali Veli", "phone": "+905551234567"}
    score = calculate_qualification_score(INTAKE, data)
    assert score == 70


def test_empty_data_returns_0():
    assert calculate_qualification_score(INTAKE, {}) == 0


def test_no_intake_returns_0():
    assert calculate_qualification_score([], {"full_name": "Test"}) == 0


def test_partial_must_gives_partial_score():
    # Sadece 1/2 must toplanmış → 35
    data = {"full_name": "Ali"}
    score = calculate_qualification_score(INTAKE, data)
    assert score == 35


def test_score_capped_at_100():
    # Extra bilgi olsa bile 100'ü geçmemeli
    data = {"full_name": "X", "phone": "Y", "city": "Z", "budget": "50", "extra": "data"}
    score = calculate_qualification_score(INTAKE, data)
    assert score <= 100


def test_null_values_not_counted():
    # None değerler toplanmamış sayılmalı
    data = {"full_name": "Ali", "phone": None, "city": None}
    score = calculate_qualification_score(INTAKE, data)
    assert score == 35  # sadece full_name → 1/2 must → 35
