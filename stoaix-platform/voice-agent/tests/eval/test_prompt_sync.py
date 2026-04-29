"""
TS ↔ JSON ↔ Python prompt sync testleri.

1. JSON fixture'ın agent-templates.ts ile sync olduğunu doğrular (hash check)
2. Klinik tipi key paritesini doğrular
3. Placeholder tutarlılığını doğrular
4. JSON'dan yüklenen içeriğin beklenen yapıda olduğunu doğrular

LLM gerektirmez.

JSON güncelleme:
  cd dashboard && npx tsx scripts/generate-prompt-fixtures.ts
"""

import hashlib
import json
import os
import re
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.eval.production_prompts import CLINIC_TYPE_CONTENT, CHAT_CLINIC_TYPE_CONTENT

# ── Paths ──────────────────────────────────────────────────────────────────────

_EVAL_DIR = os.path.dirname(__file__)
_FIXTURE_PATH = os.path.join(_EVAL_DIR, 'prompt-fixtures.json')
_TS_FILE = os.path.join(_EVAL_DIR, '..', '..', '..', 'dashboard', 'lib', 'agent-templates.ts')

# ── Helpers ────────────────────────────────────────────────────────────────────

_KEY_RE = re.compile(
    r'^\s+(hair_transplant|dental|medical_aesthetics|surgical_aesthetics'
    r'|physiotherapy|ophthalmology|general_practice|other)\s*:',
    re.MULTILINE,
)


def _parse_ts_clinic_keys(marker: str) -> set[str]:
    """TS dosyasında `marker` satırından sonraki Record bloğundaki key'leri al."""
    with open(_TS_FILE, encoding='utf-8') as f:
        content = f.read()
    idx = content.find(marker)
    if idx == -1:
        return set()
    next_const = content.find("\nconst ", idx + len(marker))
    next_export = content.find("\nexport ", idx + len(marker))
    ends = [e for e in [next_const, next_export] if e > 0]
    end = min(ends) if ends else idx + 60000
    block = content[idx:end]
    return set(_KEY_RE.findall(block))


def _load_fixture():
    with open(_FIXTURE_PATH, encoding='utf-8') as f:
        return json.load(f)


def _compute_ts_hash() -> str:
    with open(_TS_FILE, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def fixture_data():
    return _load_fixture()


@pytest.fixture(scope="module")
def ts_voice_keys():
    return _parse_ts_clinic_keys("const CLINIC_TYPE_CONTENT: Record<string")


@pytest.fixture(scope="module")
def ts_wa_keys():
    return _parse_ts_clinic_keys("const CLINIC_TYPE_CONTENT_WA: Record<string")


@pytest.fixture(scope="module")
def py_voice_keys():
    return set(CLINIC_TYPE_CONTENT.keys())


@pytest.fixture(scope="module")
def py_chat_keys():
    return set(CHAT_CLINIC_TYPE_CONTENT.keys())


# ── Sync guard: JSON ↔ TS hash ────────────────────────────────────────────────

class TestSyncGuard:
    """prompt-fixtures.json'ın agent-templates.ts ile sync olduğunu doğrula."""

    def test_fixture_file_exists(self):
        assert os.path.isfile(_FIXTURE_PATH), (
            "prompt-fixtures.json bulunamadı. "
            "Oluşturmak için: cd dashboard && npx tsx scripts/generate-prompt-fixtures.ts"
        )

    def test_source_hash_matches(self, fixture_data):
        """TS dosyası değişmiş ama JSON güncellenmemişse FAIL."""
        stored_hash = fixture_data["_meta"]["source_hash"]
        current_hash = _compute_ts_hash()
        assert stored_hash == current_hash, (
            f"agent-templates.ts değişmiş ama prompt-fixtures.json güncellenmemiş!\n"
            f"  Stored:  {stored_hash[:16]}...\n"
            f"  Current: {current_hash[:16]}...\n"
            f"  Çözüm: cd dashboard && npx tsx scripts/generate-prompt-fixtures.ts"
        )

    def test_fixture_has_meta(self, fixture_data):
        assert "_meta" in fixture_data
        assert "source_hash" in fixture_data["_meta"]
        assert "source_file" in fixture_data["_meta"]

    def test_fixture_has_all_clinic_types(self, fixture_data):
        expected = {
            "hair_transplant", "dental", "medical_aesthetics",
            "surgical_aesthetics", "physiotherapy", "ophthalmology",
            "general_practice", "other",
        }
        assert set(fixture_data["clinic_types"]) == expected

    def test_fixture_voice_and_chat_sections(self, fixture_data):
        assert "voice" in fixture_data
        assert "chat" in fixture_data
        for ct in fixture_data["clinic_types"]:
            assert ct in fixture_data["voice"], f"voice missing: {ct}"
            assert ct in fixture_data["chat"], f"chat missing: {ct}"


# ── Voice: TS ↔ Python key parity ─────────────────────────────────────────────

class TestVoiceSync:
    def test_ts_voice_keys_not_empty(self, ts_voice_keys):
        assert len(ts_voice_keys) >= 8, f"TS voice keys too few: {ts_voice_keys}"

    def test_py_voice_keys_not_empty(self, py_voice_keys):
        assert len(py_voice_keys) >= 8, f"Python voice keys too few: {py_voice_keys}"

    def test_ts_has_all_py_voice_keys(self, ts_voice_keys, py_voice_keys):
        missing = py_voice_keys - ts_voice_keys
        assert not missing, f"Python voice keys missing from TS: {missing}"

    def test_py_has_all_ts_voice_keys(self, ts_voice_keys, py_voice_keys):
        missing = ts_voice_keys - py_voice_keys
        assert not missing, f"TS voice keys missing from Python: {missing}"


# ── Chat/WA: TS ↔ Python key parity ──────────────────────────────────────────

class TestChatSync:
    def test_ts_wa_keys_not_empty(self, ts_wa_keys):
        assert len(ts_wa_keys) >= 8, f"TS WA keys too few: {ts_wa_keys}"

    def test_py_chat_keys_not_empty(self, py_chat_keys):
        assert len(py_chat_keys) >= 8, f"Python chat keys too few: {py_chat_keys}"

    def test_ts_has_all_py_chat_keys(self, ts_wa_keys, py_chat_keys):
        missing = py_chat_keys - ts_wa_keys
        assert not missing, f"Python chat keys missing from TS WA: {missing}"

    def test_py_has_all_ts_wa_keys(self, ts_wa_keys, py_chat_keys):
        missing = ts_wa_keys - py_chat_keys
        assert not missing, f"TS WA keys missing from Python chat: {missing}"


# ── Placeholder consistency ──────────────────────────────────────────────────

class TestPlaceholderSync:
    """Her iki tarafta aynı placeholder pattern kullanılıyor mu?"""

    def test_voice_prompts_use_correct_placeholders(self, py_voice_keys):
        for key in py_voice_keys:
            template = CLINIC_TYPE_CONTENT[key]["system_prompt_template"]
            assert "{org_name}" not in template, f"{key} voice still uses {{org_name}}"
            assert "{persona_name}" not in template, f"{key} voice still uses {{persona_name}}"
            assert "{KLINIK_ADI}" in template, f"{key} voice missing {{KLINIK_ADI}}"
            assert "{PERSONA_ADI}" in template, f"{key} voice missing {{PERSONA_ADI}}"

    def test_chat_prompts_use_correct_placeholders(self, py_chat_keys):
        for key in py_chat_keys:
            template = CHAT_CLINIC_TYPE_CONTENT[key]["system_prompt_template"]
            assert "{org_name}" not in template, f"{key} chat still uses {{org_name}}"
            assert "{persona_name}" not in template, f"{key} chat still uses {{persona_name}}"
            assert "{KLINIK_ADI}" in template, f"{key} chat missing {{KLINIK_ADI}}"
            assert "{PERSONA_ADI}" in template, f"{key} chat missing {{PERSONA_ADI}}"


# ── Content structure validation ─────────────────────────────────────────────

class TestContentStructure:
    """JSON'dan yüklenen verinin beklenen yapıda olduğunu doğrula."""

    @pytest.mark.parametrize("ct", list(CLINIC_TYPE_CONTENT.keys()))
    def test_voice_has_required_fields(self, ct):
        data = CLINIC_TYPE_CONTENT[ct]
        assert "system_prompt_template" in data
        assert "hard_blocks" in data
        assert "intake" in data
        assert len(data["system_prompt_template"]) > 100
        assert len(data["hard_blocks"]) >= 1
        assert len(data["intake"]) >= 2

    @pytest.mark.parametrize("ct", list(CHAT_CLINIC_TYPE_CONTENT.keys()))
    def test_chat_has_required_fields(self, ct):
        data = CHAT_CLINIC_TYPE_CONTENT[ct]
        assert "system_prompt_template" in data
        assert "hard_blocks" in data
        assert "intake" in data
        assert len(data["system_prompt_template"]) > 50
        assert len(data["hard_blocks"]) >= 1

    @pytest.mark.parametrize("ct", list(CLINIC_TYPE_CONTENT.keys()))
    def test_voice_blocks_have_keywords_array(self, ct):
        for block in CLINIC_TYPE_CONTENT[ct]["hard_blocks"]:
            assert isinstance(block["keywords"], list), f"{ct}: keywords should be list"
            assert len(block["keywords"]) >= 1
            assert isinstance(block["response"], str)

    @pytest.mark.parametrize("ct", list(CHAT_CLINIC_TYPE_CONTENT.keys()))
    def test_chat_blocks_have_keywords_array(self, ct):
        for block in CHAT_CLINIC_TYPE_CONTENT[ct]["hard_blocks"]:
            assert isinstance(block["keywords"], list), f"{ct}: keywords should be list"
            assert len(block["keywords"]) >= 1
            assert isinstance(block["response"], str)
