"""detect_language_heuristic() unit testleri — tüm desteklenen diller."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from agent import detect_language_heuristic


# ── Turkish (default — should return None) ─────────────────────────────────

def test_turkish_chars_stay_tr():
    assert detect_language_heuristic("Merhaba, nasılsınız?") is None
    assert detect_language_heuristic("Randevu almak istiyorum, lütfen") is None
    assert detect_language_heuristic("Günaydın, bilgi almak istiyorum") is None
    assert detect_language_heuristic("Şu anda müsait misiniz?") is None


def test_empty_stays_tr():
    assert detect_language_heuristic("") is None
    assert detect_language_heuristic("   ") is None


def test_single_word_stays_tr():
    """Tek kelime yeterli değil — false positive önleme."""
    assert detect_language_heuristic("Hello") is None
    assert detect_language_heuristic("Hey") is None
    assert detect_language_heuristic("Bonjour") is None
    assert detect_language_heuristic("Hola") is None


def test_mixed_tr_en_stays_tr():
    """Turkish chars override English words."""
    assert detect_language_heuristic("Hello, randevu almak istiyorum") is None
    assert detect_language_heuristic("I need bilgi, lütfen") is None


# ── English ────────────────────────────────────────────────────────────────

def test_english_detection():
    assert detect_language_heuristic("Hi, I would like to book an appointment") == "en"
    assert detect_language_heuristic("Hello, I need information please") == "en"
    assert detect_language_heuristic("Can I have an appointment?") == "en"
    assert detect_language_heuristic("Yes, I want to call about the treatment") == "en"
    assert detect_language_heuristic("Do you have availability?") == "en"


# ── Arabic (script-based) ─────────────────────────────────────────────────

def test_arabic_detection():
    assert detect_language_heuristic("مرحبا، أريد حجز موعد") == "ar"
    assert detect_language_heuristic("السلام عليكم") == "ar"
    assert detect_language_heuristic("هل يمكنني الحصول على معلومات؟") == "ar"


# ── Russian (script-based) ────────────────────────────────────────────────

def test_russian_detection():
    assert detect_language_heuristic("Здравствуйте, я хочу записаться") == "ru"
    assert detect_language_heuristic("Мне нужна инф��рмация") == "ru"
    assert detect_language_heuristic("Привет, можно записаться на прием?") == "ru"


# ── Chinese (script-based) ────────────────────────────────────────────────

def test_chinese_detection():
    assert detect_language_heuristic("你好，我想预约") == "zh"
    assert detect_language_heuristic("请问可以预约吗") == "zh"
    assert detect_language_heuristic("我需要咨询") == "zh"


# ── German (special chars + word-based) ───────────────────────────────────

def test_german_special_chars():
    """ä, ß → immediate DE detection (ö/ü shared with TR, not DE-exclusive)."""
    assert detect_language_heuristic("Straße") == "de"
    assert detect_language_heuristic("Ich hätte gerne einen Termin") == "de"
    assert detect_language_heuristic("Ärztliche Beratung bitte") == "de"


def test_german_word_based():
    """Without special chars, ≥2 DE words needed."""
    assert detect_language_heuristic("Hallo, ich brauche eine Beratung") == "de"
    assert detect_language_heuristic("Ja, bitte einen Termin vereinbaren") == "de"


# ── French (special chars + word-based) ───────────────────────────────────

def test_french_special_chars():
    """é, è, ê, ç, à → immediate FR detection."""
    assert detect_language_heuristic("Je voudrais prendre rendez-vous, s'il vous plaît") == "fr"
    assert detect_language_heuristic("Bonjour, j'ai besoin d'une consultation") == "fr"


def test_french_word_based():
    assert detect_language_heuristic("Bonjour, je voudrais une consultation") == "fr"
    assert detect_language_heuristic("Oui, merci pour votre aide") == "fr"


# ── Spanish (special chars + word-based) ──────────────────────────────────

def test_spanish_special_chars():
    """ñ, ¿, ¡ → immediate ES detection."""
    assert detect_language_heuristic("¿Puedo hacer una cita?") == "es"
    assert detect_language_heuristic("Mañana por favor") == "es"


def test_spanish_word_based():
    assert detect_language_heuristic("Hola, quiero una consulta por favor") == "es"
    assert detect_language_heuristic("Buenos dias, necesito reservar una cita") == "es"


# ── Italian (word-based only — no unique special chars) ───────────────────

def test_italian_word_based():
    assert detect_language_heuristic("Ciao, vorrei prenotare un appuntamento") == "it"
    assert detect_language_heuristic("Buongiorno, ho bisogno di un consulto") == "it"
    assert detect_language_heuristic("Posso prenotare per favore?") == "it"


# ── Portuguese (special chars + word-based) ───────────────────────────────

def test_portuguese_special_chars():
    """ã, õ → immediate PT detection (without ç which overlaps with TR)."""
    assert detect_language_heuristic("Bom dia, tenho questões") == "pt"
    assert detect_language_heuristic("Não tenho certeza sobre o tratamento") == "pt"


def test_portuguese_word_based():
    assert detect_language_heuristic("Oi, quero marcar uma consulta") == "pt"
    assert detect_language_heuristic("Preciso agendar um horario, obrigado") == "pt"


# ── Edge cases ────────────────────────────────────────────────────────────

def test_turkish_chars_override_all():
    """Turkish chars always win, even if other language indicators present."""
    assert detect_language_heuristic("Hello, ich möchte, nasılsınız?") is None
    assert detect_language_heuristic("مرحبا, günaydın") is None


def test_ambiguous_latin_stays_tr():
    """Generic Latin text without enough indicators → default TR."""
    assert detect_language_heuristic("Ok") is None
    assert detect_language_heuristic("Hmm") is None
    assert detect_language_heuristic("Test test") is None


def test_numbers_only_stays_tr():
    assert detect_language_heuristic("12345") is None
    assert detect_language_heuristic("+90 555 123 4567") is None
