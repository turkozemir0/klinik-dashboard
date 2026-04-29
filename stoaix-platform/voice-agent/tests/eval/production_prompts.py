"""
Her klinik tipi için production-equivalent sistem prompt içerikleri.

Single source of truth: dashboard/lib/agent-templates.ts
→ generate-prompt-fixtures.ts ile JSON'a export edilir
→ Bu dosya JSON'dan okur.

Intake alanları TS tarafında yok — bu dosyada tanımlı kalır.
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from prompt_rules import (
    PLATFORM_GUARDRAILS,
    VOICE_CONVERSATION_RULES,
    NATURALNESS_RULES,
    REGISTER_RULES,
    OBJECTION_RULES,
    CHAT_GUARDRAILS_TEXT,
)

# ── Backward compat alias ────────────────────────────────────────────────────

BASE_VOICE_RULES = "\n".join([
    VOICE_CONVERSATION_RULES,
    NATURALNESS_RULES,
    REGISTER_RULES,
    OBJECTION_RULES,
])

BASE_CHAT_RULES = CHAT_GUARDRAILS_TEXT

# ── JSON fixture yükle (TS → JSON single source of truth) ────────────────────

_FIXTURE_PATH = os.path.join(os.path.dirname(__file__), 'prompt-fixtures.json')
with open(_FIXTURE_PATH, encoding='utf-8') as _f:
    _FIXTURES = json.load(_f)


# ── Voice intake alanları (TS'de yok, burada tanımlı) ────────────────────────

_VOICE_INTAKE = {
    "hair_transplant": [
        {"key": "full_name",        "label": "Ad Soyad",           "priority": "must",   "voice_prompt": "Adınızı öğrenebilir miyim?"},
        {"key": "phone",            "label": "Telefon",            "priority": "must",   "voice_prompt": "Telefon numaranızı alabilir miyim?"},
        {"key": "service_interest", "label": "İlgilenilen Yöntem", "priority": "must",   "voice_prompt": "FUE mi DHI mi düşünüyorsunuz?"},
        {"key": "greft_estimate",   "label": "Greft Tahmini",      "priority": "should", "voice_prompt": "Yaklaşık kaç greft düşünüyorsunuz?"},
        {"key": "budget_range",     "label": "Bütçe",              "priority": "should", "voice_prompt": "Bütçe aralığınız nedir?"},
        {"key": "is_foreign",       "label": "Yurt Dışı Hasta",    "priority": "should", "voice_prompt": "Yurt dışından mı teşrif edeceksiniz?"},
    ],
    "dental": [
        {"key": "full_name",          "label": "Ad Soyad",        "priority": "must",   "voice_prompt": "Adınızı öğrenebilir miyim?"},
        {"key": "phone",              "label": "Telefon",         "priority": "must",   "voice_prompt": "Telefon numaranızı alabilir miyim?"},
        {"key": "service_interest",   "label": "Hizmet",          "priority": "must",   "voice_prompt": "İmplant mı, ortodonti mi, estetik diş mi ilgileniyorsunuz?"},
        {"key": "tooth_concern",      "label": "Diş Şikayeti",    "priority": "should", "voice_prompt": "Mevcut bir şikayetiniz var mı?"},
        {"key": "previous_treatment", "label": "Önceki Tedavi",   "priority": "should", "voice_prompt": "Bu konuda daha önce tedavi aldınız mı?"},
        {"key": "budget_range",       "label": "Bütçe",           "priority": "should", "voice_prompt": "Yaklaşık bir bütçe düşünüyor musunuz?"},
    ],
    "medical_aesthetics": [
        {"key": "full_name",        "label": "Ad Soyad",         "priority": "must"},
        {"key": "phone",            "label": "Telefon",          "priority": "must"},
        {"key": "service_interest", "label": "Hizmet",           "priority": "must",   "voice_prompt": "Botoks mu, dolgu mu, başka bir uygulama mı düşünüyorsunuz?"},
        {"key": "treatment_area",   "label": "Bölge",            "priority": "should", "voice_prompt": "Hangi bölge için düşünüyorsunuz?"},
        {"key": "skin_concern",     "label": "Cilt Şikayeti",    "priority": "should", "voice_prompt": "Çözüm aradığınız belirli bir cilt sorununuz var mı?"},
        {"key": "budget_range",     "label": "Bütçe",            "priority": "should"},
    ],
    "surgical_aesthetics": [
        {"key": "full_name",          "label": "Ad Soyad",       "priority": "must"},
        {"key": "phone",              "label": "Telefon",        "priority": "must"},
        {"key": "service_interest",   "label": "Operasyon",      "priority": "must",   "voice_prompt": "Rinoplasti mi, liposuction mu, başka bir operasyon mu düşünüyorsunuz?"},
        {"key": "procedure_interest", "label": "Prosedür Detay", "priority": "should", "voice_prompt": "Bu operasyonu daha önce düşünüyor muydunuz?"},
        {"key": "recovery_timeline",  "label": "İyileşme",       "priority": "should", "voice_prompt": "İyileşme süreci için ne kadar zaman ayırabilirsiniz?"},
        {"key": "is_foreign",         "label": "Yurt Dışı",      "priority": "should"},
    ],
    "physiotherapy": [
        {"key": "full_name",       "label": "Ad Soyad",        "priority": "must"},
        {"key": "phone",           "label": "Telefon",         "priority": "must"},
        {"key": "service_interest","label": "Hizmet",          "priority": "must",   "voice_prompt": "Hangi bölge için fizyoterapi almak istiyorsunuz?"},
        {"key": "complaint_area",  "label": "Şikayet Bölgesi", "priority": "should", "voice_prompt": "Bel mi, diz mi, omuz mu, hangi bölgede şikayetiniz var?"},
        {"key": "pain_duration",   "label": "Şikayet Süresi",  "priority": "should", "voice_prompt": "Bu şikayet ne zamandır devam ediyor?"},
        {"key": "injury_type",     "label": "Yaralanma Tipi",  "priority": "should", "voice_prompt": "Spor sakatlığı mı, kronik ağrı mı, ameliyat sonrası mı?"},
    ],
    "ophthalmology": [
        {"key": "full_name",        "label": "Ad Soyad",        "priority": "must"},
        {"key": "phone",            "label": "Telefon",         "priority": "must"},
        {"key": "service_interest", "label": "Hizmet",          "priority": "must",   "voice_prompt": "Lazer tedavisi mi, katarakt mı, kontrol muayenesi mi?"},
        {"key": "vision_problem",   "label": "Görme Sorunu",    "priority": "should", "voice_prompt": "Miyop mu, hipermetrop mu, astigmat mı?"},
        {"key": "glasses_user",     "label": "Gözlük/Lens",     "priority": "should", "voice_prompt": "Kaç yıldır gözlük kullanıyorsunuz?"},
        {"key": "prior_surgery",    "label": "Önceki Ameliyat", "priority": "should", "voice_prompt": "Daha önce göz ameliyatı geçirdiniz mi?"},
    ],
    "general_practice": [
        {"key": "full_name",          "label": "Ad Soyad",        "priority": "must"},
        {"key": "phone",              "label": "Telefon",         "priority": "must"},
        {"key": "service_interest",   "label": "Hizmet",          "priority": "must",   "voice_prompt": "Muayene mi, kronik takip mi, aşı mı, ne için randevu istiyorsunuz?"},
        {"key": "chief_complaint",    "label": "Ana Şikayet",     "priority": "should", "voice_prompt": "Kısaca şikayetinizi anlatabilir misiniz?"},
        {"key": "age_group",          "label": "Yaş Grubu",       "priority": "should", "voice_prompt": "Yaklaşık yaşınızı öğrenebilir miyim?"},
        {"key": "chronic_conditions", "label": "Kronik Hastalık", "priority": "should", "voice_prompt": "Bilinen kronik bir hastalığınız var mı?"},
    ],
    "other": [
        {"key": "full_name",        "label": "Ad Soyad",           "priority": "must",   "voice_prompt": "Adınızı öğrenebilir miyim?"},
        {"key": "phone",            "label": "Telefon",            "priority": "must",   "voice_prompt": "Telefon numaranızı alabilir miyim?"},
        {"key": "service_interest", "label": "İlgilenilen Hizmet", "priority": "must",   "voice_prompt": "Hangi hizmetimiz hakkında bilgi almak istiyorsunuz?"},
        {"key": "timeline",         "label": "Zaman",              "priority": "should", "voice_prompt": "Ne zaman başlamayı düşünüyorsunuz?"},
    ],
}

_CHAT_INTAKE = {
    "hair_transplant": [
        {"key": "full_name",        "label": "Ad Soyad",           "priority": "must"},
        {"key": "service_interest", "label": "İlgilenilen Yöntem", "priority": "must"},
        {"key": "timeline",         "label": "Zaman",              "priority": "should"},
        {"key": "is_foreign",       "label": "Yurt Dışı Hasta",    "priority": "should"},
    ],
    "dental": [
        {"key": "full_name",        "label": "Ad Soyad",   "priority": "must"},
        {"key": "service_interest", "label": "Hizmet",     "priority": "must"},
        {"key": "tooth_concern",    "label": "Şikayet",    "priority": "should"},
    ],
    "medical_aesthetics": [
        {"key": "full_name",        "label": "Ad Soyad", "priority": "must"},
        {"key": "service_interest", "label": "Hizmet",   "priority": "must"},
        {"key": "treatment_area",   "label": "Bölge",    "priority": "should"},
    ],
    "surgical_aesthetics": [
        {"key": "full_name",        "label": "Ad Soyad",  "priority": "must"},
        {"key": "service_interest", "label": "Operasyon", "priority": "must"},
        {"key": "is_foreign",       "label": "Yurt Dışı", "priority": "should"},
    ],
    "physiotherapy": [
        {"key": "full_name",       "label": "Ad Soyad",        "priority": "must"},
        {"key": "complaint_area",  "label": "Şikayet Bölgesi", "priority": "must"},
        {"key": "pain_duration",   "label": "Şikayet Süresi",  "priority": "should"},
    ],
    "ophthalmology": [
        {"key": "full_name",        "label": "Ad Soyad", "priority": "must"},
        {"key": "service_interest", "label": "Hizmet",   "priority": "must"},
        {"key": "glasses_user",     "label": "Gözlük",   "priority": "should"},
    ],
    "general_practice": [
        {"key": "full_name",        "label": "Ad Soyad", "priority": "must"},
        {"key": "service_interest", "label": "Hizmet",   "priority": "must"},
        {"key": "chief_complaint",  "label": "Şikayet",  "priority": "should"},
    ],
    "other": [
        {"key": "full_name",        "label": "Ad Soyad", "priority": "must"},
        {"key": "service_interest", "label": "Hizmet",   "priority": "must"},
        {"key": "timeline",         "label": "Zaman",    "priority": "should"},
    ],
}


# ── JSON'dan CLINIC_TYPE_CONTENT (voice) oluştur ─────────────────────────────

CLINIC_TYPE_CONTENT = {}
for _ct in _FIXTURES['clinic_types']:
    _voice = _FIXTURES['voice'][_ct]
    CLINIC_TYPE_CONTENT[_ct] = {
        "system_prompt_template": _voice['system_prompt_template'],
        "hard_blocks": _voice['hard_blocks'],
        "intake": _VOICE_INTAKE.get(_ct, _VOICE_INTAKE["other"]),
    }


# ── JSON'dan CHAT_CLINIC_TYPE_CONTENT oluştur ────────────────────────────────

CHAT_CLINIC_TYPE_CONTENT = {}
for _ct in _FIXTURES['clinic_types']:
    _chat = _FIXTURES['chat'][_ct]
    CHAT_CLINIC_TYPE_CONTENT[_ct] = {
        "system_prompt_template": _chat['system_prompt_template'],
        "hard_blocks": _chat['hard_blocks'],
        "intake": _CHAT_INTAKE.get(_ct, _CHAT_INTAKE["other"]),
    }


def build_chat_system_prompt(clinic_type: str, org_name: str, persona_name: str) -> str:
    """
    Chat (WhatsApp/Instagram) için production-equivalent tam sistem prompt'u oluşturur.
    """
    ct = CHAT_CLINIC_TYPE_CONTENT.get(clinic_type, CHAT_CLINIC_TYPE_CONTENT["other"])
    template = ct["system_prompt_template"].format(
        KLINIK_ADI=org_name, PERSONA_ADI=persona_name
    )
    return f"{template}\n\n{CHAT_GUARDRAILS_TEXT}"


# ── WhatsApp özel şablon içerikleri ─────────────────────────────────────────────

WHATSAPP_TEMPLATE_CONTENT = {

    "reactivation_wa": {
        "system_prompt": """# ROL
Sen {KLINIK_ADI} kliniğinin WhatsApp asistanısın. Adın {PERSONA_ADI}. Daha önce ilgi göstermiş ama randevu almamış kişilere nazikçe ulaşıyorsun.

# İLKELER
- Samimi, baskısız ve kısa yaz
- Kişinin adını kullan
- Önce engeli anla, sonra çözüm sun
- Acil eylem bekleme — kapıyı açık bırak

# MESAJLAŞMA KURALLARI
- Her mesajda 1 soru
- Maks 2-3 cümle, düz metin
- Markdown kullanma

# DEVİR KRİTERİ
Randevu almak istiyorsa → insan temsilciye yönlendir

# OPT-OUT
"Mesaj atmayın / aramayın / istemiyorum" diyorsa → "Elbette, sizi rahatsız etmeyeceğiz. İhtiyaç duyduğunuzda buradayız, iyi günler!" de ve konuşmayı bitir.""",

        "opening_message": "Merhaba! {KLINIK_ADI} kliniğimizi bir süre önce araştırdığınızı gördük. Hâlâ düşünüyor musunuz, aklınızda soru kalan noktalar var mı? 😊",

        "scenarios": {
            "reactive_interested": {
                "label": "İlgilenen Müşteri",
                "patient_persona": (
                    "Kliniği hatırlayan, tekrar randevu almak isteyen ama hafif tereddütlü müşteri. "
                    "Randevu ne zaman alabileceğini veya sürecin nasıl işlediğini soruyor. "
                    "Kısa ve gerçekçi yanıtlar ver, maks 2 cümle."
                ),
                "initial": "Evet, hâlâ ilgileniyorum aslında. Ne zaman randevu alabilirim?",
            },
            "reactive_price_barrier": {
                "label": "Fiyat Engeli",
                "patient_persona": (
                    "Fiyatları yüksek bulduğu için bırakmış, hâlâ ilgili müşteri. "
                    "Fiyatların değişip değişmediğini soruyor, indirim veya taksit arıyor. "
                    "Kısa ve gerçekçi yanıtlar ver, maks 2 cümle."
                ),
                "initial": "Fiyatlar değişti mi, biraz pahalı bulmuştum o zaman.",
            },
            "reactive_unsubscribe": {
                "label": "Mesaj Reddi (Opt-out)",
                "patient_persona": (
                    "Artık ilgilenmediğini, mesaj atılmamasını isteyen müşteri. "
                    "Net ve kısa söylüyor. Israr edilirse rahatsız olur. Maks 2 cümle."
                ),
                "initial": "Mesaj atmayın artık, istemiyorum.",
            },
        },
    },

    "noshow_followup_wa": {
        "system_prompt": """# ROL
Sen {KLINIK_ADI} kliniğinin WhatsApp asistanısın. Adın {PERSONA_ADI}. Bugün randevusu olan ama gelemeyen müşterilere ulaşıyorsun.

# İLKELER
- Suçlama değil, anlayış göster
- Empatik ve kısa yaz
- Yeni randevu için teklif sun
- Kişi gelememesinin nedenini paylaşırsa not al

# MESAJLAŞMA KURALLARI
- Her mesajda 1 soru
- Maks 2-3 cümle, düz metin
- Markdown kullanma

# DEVİR KRİTERİ
Yeni randevu isterse → danışmana aktar""",

        "opening_message": "Merhaba! Bugünkü randevunuzu kaçırdığınızı fark ettik. Umarız her şey yolundadır. Yeni bir randevu ayarlamamı ister misiniz?",

        "scenarios": {
            "apologetic_reschedule": {
                "label": "Özür Dileyip Yeniden Randevu İstiyor",
                "patient_persona": (
                    "Özür dileyen, acil bir işi çıktığını söyleyen ve yeniden randevu almak isteyen müşteri. "
                    "Uygun gün sorar. Kısa ve olumlu, maks 2 cümle."
                ),
                "initial": "Özür dilerim, acil bir işim çıktı. Yeniden randevu ayarlayabilir miyiz?",
            },
            "silent_ignore": {
                "label": "Yanıt Vermiyor",
                "patient_persona": (
                    "Gelen mesajı okuyup yanıt vermeyen, sessiz kalan müşteri. "
                    "Sadece 'Tamam' veya 'Görüldü' gibi minimal yanıtlar ver. Maks 1 cümle."
                ),
                "initial": "Tamam.",
            },
            "declines": {
                "label": "Gelmeyeceğini Bildiriyor",
                "patient_persona": (
                    "Artık gelemeyeceğini belirten, randevuyu iptal etmek isteyen müşteri. "
                    "Net ve kısa söylüyor. Maks 2 cümle."
                ),
                "initial": "Artık gelemeyeceğim, randevumu iptal etmek istiyorum.",
            },
        },
    },

    "post_consultation_wa": {
        "system_prompt": """# ROL
Sen {KLINIK_ADI} kliniğinin WhatsApp asistanısın. Adın {PERSONA_ADI}. Konsültasyon yapılmış ama henüz karar vermemiş potansiyel müşterilerle iletişime geçiyorsun.

# İLKELER
- Samimi ve baskısız ol
- Müşterinin kafasındaki soru işaretlerini gider
- Olumlu bir deneyim bırak
- Karar vermek için ek bilgiye ihtiyacı varsa uzmanla bağlantı kur

# MESAJLAŞMA KURALLARI
- Her mesajda 1 soru
- Maks 2-3 cümle, düz metin
- Markdown kullanma

# DEVİR KRİTERİ
"Randevu almak istiyorum" veya "ilerleyelim" diyorsa → insan temsilciye yönlendir""",

        "opening_message": "Merhaba! Geçen ziyaretiniz için teşekkürler 😊 Aklınızda soru kalan noktalar var mı?",

        "scenarios": {
            "satisfied_convert": {
                "label": "Memnun, Randevu Almak İstiyor",
                "patient_persona": (
                    "Konsültasyondan memnun kalan, karar vermiş ve randevu almak isteyen müşteri. "
                    "Sürecin nasıl ilerleyeceğini soruyor. Maks 2 cümle."
                ),
                "initial": "Beğendim, ilerlemek istiyorum. Randevu nasıl alacağım?",
            },
            "needs_more_time": {
                "label": "Düşünmesi Lazım",
                "patient_persona": (
                    "Kararını henüz veremeyen, biraz daha düşünmek isteyen müşteri. "
                    "Tereddütlü ama kapıyı kapatmıyor. Maks 2 cümle."
                ),
                "initial": "Düşünmem lazım biraz, eşimle konuşacağım.",
            },
            "price_objection": {
                "label": "Fiyat İtirazı",
                "patient_persona": (
                    "Konsültasyondan sonra fiyatları yüksek bulan, taksit veya indirim arayan müşteri. "
                    "Net fiyat veya alternatif istiyor. Maks 2 cümle."
                ),
                "initial": "Fiyatları biraz yüksek bulduk, taksit seçeneği var mı?",
            },
        },
    },
}


def build_full_system_prompt(clinic_type: str, org_name: str, persona_name: str, kb_context: str = "") -> str:
    """
    Production-equivalent tam sistem prompt'u oluşturur.
    agent.py'deki build_system_prompt mantığını taklit eder.
    """
    ct = CLINIC_TYPE_CONTENT.get(clinic_type, CLINIC_TYPE_CONTENT["other"])

    template = ct["system_prompt_template"].format(
        KLINIK_ADI=org_name, PERSONA_ADI=persona_name
    )

    # Must field prompts
    must_fields = [f for f in ct["intake"] if f.get("priority") == "must"]
    must_prompts = "\n".join(
        f"- {f['label']}: \"{f.get('voice_prompt', f['label'])}\"" for f in must_fields
    )

    # Should field prompts
    should_fields = [f for f in ct["intake"] if f.get("priority") == "should"]
    should_prompts = "\n".join(
        f"- {f['label']}: \"{f.get('voice_prompt', f['label'])}\"" for f in should_fields
    )

    # Hard block text
    blocks_text = ""
    for b in ct["hard_blocks"]:
        kw = ", ".join(b.get("keywords", []))
        blocks_text += f"\n- Anahtar kelimeler: {kw} → \"{b.get('response', '')}\""

    kb_section = kb_context if kb_context else "(Kullanıcı soru sorunca KB'den çekilecek)"

    # Few-shot examples
    few_shots = _FIXTURES["voice"].get(clinic_type, _FIXTURES["voice"]["other"]).get("few_shot_examples", [])
    few_shot_text = ""
    if few_shots:
        few_shot_text = "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nÖRNEK KONUŞMALAR:\n"
        for ex in few_shots:
            few_shot_text += f"\nHasta: \"{ex['user']}\"\nAsistan: \"{ex['assistant']}\"\n"

    return f"""{PLATFORM_GUARDRAILS}

{template}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KONUŞMA KURALLARI (KATI — İSTİSNASIZ UYGULANIR):
{VOICE_CONVERSATION_RULES}

{NATURALNESS_RULES}

{REGISTER_RULES}

{OBJECTION_RULES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BİLGİ TABANI:
{kb_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPLANMASI GEREKEN BİLGİLER (zorunlu):
{must_prompts}

Fırsat olduğunda toplanabilir:
{should_prompts}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERİ TOPLAMA TARZI:
- Bilgileri DOĞAL konuşma akışı içinde, birer birer topla.
- Müşteriye "form dolduruyormuş" hissi verme.
- Bir bilgiyi zaten vermiş olabilir — tekrar sorma.
- Detay açıklama yapma, sadece sor.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KAPSAM DIŞI KONULAR:{blocks_text if blocks_text else " (tanımlı blok yok)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDOFF TETİKLEYİCİLER:
- Müşteri açıkça "insan ile konuşmak istiyorum" veya "yöneticiyle görüşeyim" derse → handoff başlat.
- 2+ kez aynı soruya tatmin edici cevap veremediysen → handoff başlat.
- Müşteri sinirli veya şikayetçi → handoff başlat.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HALÜSİNASYON KURALI:
Bilgi tabanında olmayan bilgiyi UYDURMA. Emin olmadığın konularda: "Bu konuda uzmanımız size en doğru bilgiyi verecektir." de.

Tüm zorunlu bilgiler toplandığında: "Bilgilerinizi not aldım, bir danışmanımız sizi en kısa sürede arayacak." de ve görüşmeyi nazikçe sonlandır.
{few_shot_text}"""


# ── Özel görev şablonları (sektörden bağımsız, outbound/teyit) ─────────────────

VOICE_TEMPLATE_CONTENT = {

    "appointment_confirm": {
        "system_prompt": """# ROL
Sen {KLINIK_ADI} kliniğinin asistanısın. Adın {PERSONA_ADI}. Bu aramayı randevu teyidi veya hatırlatması amacıyla yapıyorsun.

# GÖREV
- Müşteriyi ismiyle selamla
- Randevu tarih/saatini belirt ve teyit iste
- Müşteri gelip gelemeyeceğini öğren
- İptal veya erteleme isterse notu al ve ilgili birime ilet

# KURALLAR
- Maks 2 cümle, net ve kısa
- Emoji veya markdown kullanma — TTS okur
- Müşteri teyit edince kibarca kapat — gereksiz konuşma uzatma
- Medikal soru gelirse: "Bu konuyu kliniğimizi ararken uzmanımıza sorabilirsiniz." de
- Fiyat sorusuna kesin rakam verme; "Randevu sırasında uzmanımız bilgi verecektir." de""",

        "opening_message": "Merhaba, ben {KLINIK_ADI} kliniğinden {PERSONA_ADI}. Yaklaşan randevunuzu teyit etmek için arıyorum, uygun bir anınız var mı?",

        "scenarios": {
            "confirm_ok": {
                "label": "Randevu Teyit (Olumlu)",
                "patient_persona": (
                    "Randevusunu hatırlayan, teyit eden ve gelmeyi planlayan müşteri. "
                    "Kısa ve olumlu yanıtlar ver, belki ek bir soru sor. Maks 2 cümle."
                ),
                "initial": "Evet, randevumu hatırlıyorum. O gün müsaitim, geleceğim.",
            },
            "confirm_cancel": {
                "label": "İptal İsteği",
                "patient_persona": (
                    "Randevusunu iptal etmek isteyen müşteri. Zorunlu bir işi çıktı. "
                    "Belki yeni randevu istiyor, belki sadece iptal. Maks 2 cümle."
                ),
                "initial": "Aslında o gün gelemeyeceğim, zorunlu bir işim çıktı. Randevumu iptal edebilir miyiz?",
            },
            "confirm_reschedule": {
                "label": "Erteleme ve Yeni Tarih",
                "patient_persona": (
                    "Randevusunu başka bir güne almak isteyen müşteri. "
                    "Tarih önerir, alternatif ister. Maks 2 cümle."
                ),
                "initial": "Randevumu bir gün öne alabilir miyiz? Çarşamba günü daha uygun.",
            },
        },
    },

    "reactivation_voice": {
        "system_prompt": """# ROL
Sen {KLINIK_ADI} kliniğinin asistanısın. Adın {PERSONA_ADI}. Bir süredir görüşülemeyen müşterilere geri dönüş yapmak için arıyorsun.

# GÖREV
- Müşteriyi ismiyle samimiyetle selamla
- Kliniği hatırlat, kısa neden açıkla
- İhtiyacı veya engeli anlamaya çalış
- Yeni bir randevu veya bilgi için kapı aç

# KURALLAR
- Maks 2 cümle. Baskı yapma, ısrarcı olma.
- Müşteri ilgilenmiyorsa HEMEN nazikçe kapat, israr etme
- "Aramayın / listeden çıkarın" diyorsa: "Elbette, sizi listeden çıkarıyorum. İyi günler." de ve bitir
- Emoji veya markdown kullanma — TTS okur
- Empati önce, teklif sonra
- Fiyat sorusuna kesin rakam verme; "Konsültasyonda netleştirelim" de
- Medikal tavsiye asla verme""",

        "opening_message": "Merhaba, ben {KLINIK_ADI} kliniğinden {PERSONA_ADI}. Sizi bir süredir göremedik, nasılsınız?",

        "scenarios": {
            "reactive_interested": {
                "label": "İlgilenen Müşteri",
                "patient_persona": (
                    "Kliniği hatırlayan, tekrar gelmek isteyen ama hafif tereddütlü müşteri. "
                    "Belki bir soru soruyor, belki bütçeyi soruyor. Maks 2 cümle."
                ),
                "initial": "Ah evet, kliniğinizi hatırladım. Aslında tekrar gelmek istiyordum.",
            },
            "reactive_price_barrier": {
                "label": "Fiyat Engeli",
                "patient_persona": (
                    "Fiyatları yüksek bulduğu için bırakmış müşteri. "
                    "Hâlâ ilgili ama net fiyat istiyor. Maks 2 cümle."
                ),
                "initial": "Fiyatlar çok yüksekti o zaman, bu yüzden bırakmıştım. Fiyatlar değişti mi?",
            },
            "reactive_optout": {
                "label": "Arama Reddi (Opt-out)",
                "patient_persona": (
                    "Artık ilgilenmediğini belirten, listeden çıkmak isteyen müşteri. "
                    "Net ve kısa söylüyor. Israr edilirse rahatsız olur. Maks 2 cümle."
                ),
                "initial": "Artık ilgilenmiyorum, lütfen bir daha aramayın, listeden çıkarın.",
            },
        },
    },
}
