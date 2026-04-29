"""
8 klinik sektörü için standart mock veri seti.
Her fixture: org, playbook, intake, mock_kb, sample_queries.
"""

CLINIC_FIXTURES = {
    "hair_transplant": {
        "org": {
            "id": "test-hair-org",
            "name": "Test Saç Ekimi Kliniği",
            "sector": "clinic",
            "ai_persona": {
                "persona_name": "Ayşe",
                "language": "tr",
                "clinic_type": "hair_transplant",
                "fallback_responses": {"no_kb_match": "Bu konuda elimde bilgi yok."},
            },
            "channel_config": {"voice": {"language": "tr"}},
            "crm_config": {},
            "_plan": "business",
        },
        "playbook": {
            "system_prompt_template": "Sen Test Saç Ekimi Kliniği adına arayan Ayşe'sin. Saç ekimi alanında bilgi veriyorsun.",
            "opening_message": "Merhaba! Ben Test Saç Ekimi Kliniği'ndan Ayşe, iki dakikanız var mı?",
            "hard_blocks": [
                {
                    "trigger_id": "block_0",
                    "action": "soft_block",
                    "keywords": ["garanti", "kesin sonuç"],
                    "response": "Garanti veremeyiz ama başarı oranımız çok yüksek.",
                },
                {
                    "trigger_id": "block_1",
                    "action": "soft_block",
                    "keywords": ["rakip", "başka klinik"],
                    "response": "Sadece klinikimizi anlatabiliyorum.",
                },
            ],
            "routing_rules": [],
            "handoff_triggers": {"keywords": ["avukat", "şikâyet", "dava"]},
            "few_shot_examples": [],
            "features": {"calendar_booking": True, "model": "claude-sonnet-4-6"},
        },
        "intake": [
            {"key": "full_name",        "label": "Ad Soyad",           "type": "text",  "priority": "must",   "voice_prompt": "Adınızı öğrenebilir miyim?"},
            {"key": "phone",            "label": "Telefon",            "type": "phone", "priority": "must",   "voice_prompt": "Telefon numaranızı alabilir miyim?"},
            {"key": "service_interest", "label": "İlgilenilen Yöntem", "type": "text",  "priority": "must",   "voice_prompt": "FUE mi DHI mi düşünüyorsunuz?"},
            {"key": "greft_estimate",   "label": "Greft Tahmini",      "type": "text",  "priority": "should", "voice_prompt": "Yaklaşık kaç greft işlem düşünüyorsunuz?"},
            {"key": "budget_range",     "label": "Bütçe",              "type": "text",  "priority": "should", "voice_prompt": "Bütçe aralığınız nedir?"},
            {"key": "is_foreign",       "label": "Yurt Dışı Hasta",    "type": "text",  "priority": "should", "voice_prompt": "Yurt dışından mı teşrif edeceksiniz?"},
        ],
        "mock_kb": [
            {"title": "FUE Saç Ekimi",     "description_for_ai": "FUE tekniği bireysel folikül çıkarma yöntemidir.",  "similarity": 0.88},
            {"title": "DHI Saç Ekimi",     "description_for_ai": "DHI direkt implantasyon yöntemidir.",               "similarity": 0.72},
            {"title": "Fiyatlar",          "description_for_ai": "FUE €2/greft, DHI €2.5/greft fiyatlarıyla sunulur.", "similarity": 0.65},
            {"title": "Düşük Benzerlik",   "description_for_ai": "alakasız içerik",                                    "similarity": 0.21},
        ],
        "sample_queries": [
            ("FUE ile DHI farkı nedir?", ["FUE", "DHI"]),
            ("ne kadar tutar?",          ["fiyat", "greft", "€"]),
            ("garanti veriyor musunuz?", []),
        ],
    },

    "dental": {
        "org": {
            "id": "test-dental-org",
            "name": "Test Diş Kliniği",
            "sector": "clinic",
            "ai_persona": {
                "persona_name": "Merve",
                "language": "tr",
                "clinic_type": "dental",
                "fallback_responses": {"no_kb_match": "Bu konuda elimde bilgi yok."},
            },
            "channel_config": {"voice": {"language": "tr"}},
            "crm_config": {},
            "_plan": "professional",
        },
        "playbook": {
            "system_prompt_template": "Sen Test Diş Kliniği adına arayan Merve'sin. Diş sağlığı alanında bilgi veriyorsun.",
            "opening_message": "Merhaba! Ben Test Diş Kliniği'nden Merve, nasıl yardımcı olabilirim?",
            "hard_blocks": [
                {
                    "trigger_id": "block_0",
                    "action": "soft_block",
                    "keywords": ["ağrı kesici", "ilaç tavsiye"],
                    "response": "İlaç tavsiyesi veremiyorum, doktorunuza danışmanızı öneririm.",
                },
            ],
            "routing_rules": [],
            "handoff_triggers": {"keywords": ["şiddetli ağrı", "acil", "şikayet"]},
            "few_shot_examples": [],
            "features": {"calendar_booking": True, "model": "claude-sonnet-4-6"},
        },
        "intake": [
            {"key": "full_name",          "label": "Ad Soyad",        "type": "text",  "priority": "must",   "voice_prompt": "Adınızı öğrenebilir miyim?"},
            {"key": "phone",              "label": "Telefon",         "type": "phone", "priority": "must",   "voice_prompt": "Telefon numaranızı alabilir miyim?"},
            {"key": "service_interest",   "label": "Hizmet",          "type": "text",  "priority": "must",   "voice_prompt": "İmplant mı, ortodonti mi, estetik diş mi ilgileniyorsunuz?"},
            {"key": "tooth_concern",      "label": "Diş Şikayeti",    "type": "text",  "priority": "should", "voice_prompt": "Mevcut bir şikayetiniz var mı, yoksa estetik amaçlı mı?"},
            {"key": "previous_treatment", "label": "Önceki Tedavi",   "type": "text",  "priority": "should", "voice_prompt": "Bu konuda daha önce tedavi aldınız mı?"},
            {"key": "budget_range",       "label": "Bütçe",           "type": "text",  "priority": "should", "voice_prompt": "Yaklaşık bir bütçe düşünüyor musunuz?"},
        ],
        "mock_kb": [
            {"title": "İmplant Tedavisi",  "description_for_ai": "Dental implant kayıp diş yerine titanyum vida ile kalıcı çözümdür.", "similarity": 0.85},
            {"title": "Ortodonti",         "description_for_ai": "Şeffaf plak veya tel tedavisiyle diş hizalama yapılır.",              "similarity": 0.78},
            {"title": "Estetik Dolgu",     "description_for_ai": "Kompozit dolgu ile doğal görünümlü onarım sağlanır.",                  "similarity": 0.60},
            {"title": "Alakasız",          "description_for_ai": "alakasız içerik",                                                       "similarity": 0.18},
        ],
        "sample_queries": [
            ("implant ne kadar sürer?", ["implant"]),
            ("diş teli var mı?",        ["ortodonti", "plak", "tel"]),
            ("acil diş çekimi",         []),
        ],
    },

    "medical_aesthetics": {
        "org": {
            "id": "test-med-aes-org",
            "name": "Test Medikal Estetik Merkezi",
            "sector": "clinic",
            "ai_persona": {
                "persona_name": "Selin",
                "language": "tr",
                "clinic_type": "medical_aesthetics",
                "fallback_responses": {"no_kb_match": "Bu konuda elimde bilgi yok."},
            },
            "channel_config": {"voice": {"language": "tr"}},
            "crm_config": {},
            "_plan": "business",
        },
        "playbook": {
            "system_prompt_template": "Sen Test Medikal Estetik Merkezi adına arayan Selin'sin.",
            "opening_message": "Merhaba! Ben Test Medikal Estetik'ten Selin, size nasıl yardımcı olabilirim?",
            "hard_blocks": [
                {
                    "trigger_id": "block_0",
                    "action": "soft_block",
                    "keywords": ["garanti", "kalıcı sonuç"],
                    "response": "Her uygulamanın süresi kişiye göre değişir, garanti veremiyoruz.",
                },
            ],
            "routing_rules": [],
            "handoff_triggers": {"keywords": ["alerjik reaksiyon", "şikayet", "dava"]},
            "few_shot_examples": [],
            "features": {"calendar_booking": True, "model": "claude-sonnet-4-6"},
        },
        "intake": [
            {"key": "full_name",        "label": "Ad Soyad",          "type": "text",  "priority": "must"},
            {"key": "phone",            "label": "Telefon",           "type": "phone", "priority": "must"},
            {"key": "service_interest", "label": "Hizmet",            "type": "text",  "priority": "must",   "voice_prompt": "Botoks mu, dolgu mu, yoksa başka bir uygulama mı düşünüyorsunuz?"},
            {"key": "treatment_area",   "label": "Uygulama Bölgesi",  "type": "text",  "priority": "should", "voice_prompt": "Hangi bölge için düşünüyorsunuz, yüz mü, vücut mu?"},
            {"key": "skin_concern",     "label": "Cilt Şikayeti",     "type": "text",  "priority": "should", "voice_prompt": "Çözüm aradığınız belirli bir cilt sorununuz var mı?"},
            {"key": "budget_range",     "label": "Bütçe",             "type": "text",  "priority": "should"},
        ],
        "mock_kb": [
            {"title": "Botoks",         "description_for_ai": "Botoks enjeksiyonu kırışıklıkları geçici olarak azaltır.",         "similarity": 0.90},
            {"title": "Dolgu",          "description_for_ai": "Hyalüronik asit dolgu ile hacim ve kontur iyileştirmesi yapılır.", "similarity": 0.82},
            {"title": "Lazer Cilt",     "description_for_ai": "Lazer tedavisiyle leke ve kırışıklık azaltılır.",                   "similarity": 0.55},
            {"title": "Alakasız",       "description_for_ai": "alakasız içerik",                                                   "similarity": 0.15},
        ],
        "sample_queries": [
            ("botoks ne kadar sürer?", ["Botoks", "kırışıklık"]),
            ("dolgu fiyatı nedir?",    ["dolgu", "Hyalüronik"]),
            ("garanti var mı?",        []),
        ],
    },

    "surgical_aesthetics": {
        "org": {
            "id": "test-surg-aes-org",
            "name": "Test Cerrahi Estetik Kliniği",
            "sector": "clinic",
            "ai_persona": {
                "persona_name": "Deniz",
                "language": "tr",
                "clinic_type": "surgical_aesthetics",
                "fallback_responses": {"no_kb_match": "Bu konuda elimde bilgi yok."},
            },
            "channel_config": {"voice": {"language": "tr"}},
            "crm_config": {},
            "_plan": "custom",
        },
        "playbook": {
            "system_prompt_template": "Sen Test Cerrahi Estetik Kliniği adına arayan Deniz'sin.",
            "opening_message": "Merhaba! Ben Cerrahi Estetik Kliniği'nden Deniz, iki dakikanız var mı?",
            "hard_blocks": [
                {
                    "trigger_id": "block_0",
                    "action": "soft_block",
                    "keywords": ["garanti", "risk yok"],
                    "response": "Her cerrahi işlemde doktorunuz riski sizinle paylaşacak.",
                },
                {
                    "trigger_id": "block_1",
                    "action": "soft_block",
                    "keywords": ["rakip", "başka doktor"],
                    "response": "Sadece kliniğimizi anlatabiliyorum.",
                },
            ],
            "routing_rules": [],
            "handoff_triggers": {"keywords": ["avukat", "şikâyet", "dava", "komplikasyon"]},
            "few_shot_examples": [],
            "features": {"calendar_booking": True, "model": "claude-sonnet-4-6"},
        },
        "intake": [
            {"key": "full_name",          "label": "Ad Soyad",          "type": "text",  "priority": "must"},
            {"key": "phone",              "label": "Telefon",           "type": "phone", "priority": "must"},
            {"key": "service_interest",   "label": "Operasyon",         "type": "text",  "priority": "must",   "voice_prompt": "Rinoplasti mi, liposuction mu, başka bir operasyon mu düşünüyorsunuz?"},
            {"key": "procedure_interest", "label": "Prosedür Detay",    "type": "text",  "priority": "should", "voice_prompt": "Bu operasyonu daha önce düşünüyor muydunuz, ilk kez mi araştırıyorsunuz?"},
            {"key": "recovery_timeline",  "label": "İyileşme Süreci",   "type": "text",  "priority": "should", "voice_prompt": "İyileşme süreci için ne kadar zaman ayırabilirsiniz?"},
            {"key": "is_foreign",         "label": "Yurt Dışı Hasta",   "type": "text",  "priority": "should"},
        ],
        "mock_kb": [
            {"title": "Rinoplasti",      "description_for_ai": "Burun estetiği operasyonu, şekil ve fonksiyon düzeltimi.",    "similarity": 0.87},
            {"title": "Liposuction",     "description_for_ai": "Yağ aldırma operasyonu, vücut konturlama için kullanılır.",   "similarity": 0.80},
            {"title": "Meme Estetiği",   "description_for_ai": "Büyütme, küçültme veya dikme operasyonları yapılır.",          "similarity": 0.62},
            {"title": "Alakasız",        "description_for_ai": "alakasız içerik",                                              "similarity": 0.12},
        ],
        "sample_queries": [
            ("rinoplasti ne kadar sürer?", ["Rinoplasti", "burun"]),
            ("liposuction fiyatı?",        ["Liposuction", "yağ"]),
            ("garanti var mı?",            []),
        ],
    },

    "physiotherapy": {
        "org": {
            "id": "test-physio-org",
            "name": "Test Fizyoterapi Merkezi",
            "sector": "clinic",
            "ai_persona": {
                "persona_name": "Zeynep",
                "language": "tr",
                "clinic_type": "physiotherapy",
                "fallback_responses": {"no_kb_match": "Bu konuda elimde bilgi yok."},
            },
            "channel_config": {"voice": {"language": "tr"}},
            "crm_config": {},
            "_plan": "professional",
        },
        "playbook": {
            "system_prompt_template": "Sen Test Fizyoterapi Merkezi adına arayan Zeynep'sin.",
            "opening_message": "Merhaba! Ben Test Fizyoterapi Merkezi'nden Zeynep, nasıl yardımcı olabilirim?",
            "hard_blocks": [
                {
                    "trigger_id": "block_0",
                    "action": "soft_block",
                    "keywords": ["ilaç", "ameliyat öneri"],
                    "response": "İlaç veya ameliyat tavsiyesi veremiyorum, doktorunuza danışın.",
                },
            ],
            "routing_rules": [],
            "handoff_triggers": {"keywords": ["acil", "felç", "kırık", "şikayet"]},
            "few_shot_examples": [],
            "features": {"calendar_booking": True, "model": "claude-sonnet-4-6"},
        },
        "intake": [
            {"key": "full_name",      "label": "Ad Soyad",        "type": "text",  "priority": "must"},
            {"key": "phone",          "label": "Telefon",         "type": "phone", "priority": "must"},
            {"key": "service_interest","label": "Hizmet",         "type": "text",  "priority": "must",   "voice_prompt": "Hangi bölge için fizyoterapi almak istiyorsunuz?"},
            {"key": "complaint_area", "label": "Şikayet Bölgesi", "type": "text",  "priority": "should", "voice_prompt": "Bel mi, diz mi, omuz mu, hangi bölgede şikayetiniz var?"},
            {"key": "pain_duration",  "label": "Şikayet Süresi",  "type": "text",  "priority": "should", "voice_prompt": "Bu şikayet ne zamandır devam ediyor?"},
            {"key": "injury_type",    "label": "Yaralanma Tipi",  "type": "text",  "priority": "should", "voice_prompt": "Spor sakatlığı mı, ameliyat sonrası rehabilitasyon mu, kronik ağrı mı?"},
        ],
        "mock_kb": [
            {"title": "Bel Fıtığı Tedavisi",  "description_for_ai": "Manuel terapi ve egzersizle bel fıtığı ağrısı azaltılır.",      "similarity": 0.86},
            {"title": "Diz Rehabilitasyonu",  "description_for_ai": "Ameliyat sonrası veya sakatlanma sonrası diz egzersiz programı.", "similarity": 0.79},
            {"title": "Omuz Tedavisi",         "description_for_ai": "Rotator cuff problemleri için manuel terapi uygulanır.",          "similarity": 0.58},
            {"title": "Alakasız",              "description_for_ai": "alakasız içerik",                                                  "similarity": 0.20},
        ],
        "sample_queries": [
            ("bel ağrısı için ne yapıyorsunuz?", ["bel", "terapi"]),
            ("kaç seans gerekir?",               ["egzersiz", "program"]),
            ("ilaç öneriyor musunuz?",           []),
        ],
    },

    "ophthalmology": {
        "org": {
            "id": "test-ophthal-org",
            "name": "Test Göz Kliniği",
            "sector": "clinic",
            "ai_persona": {
                "persona_name": "Elif",
                "language": "tr",
                "clinic_type": "ophthalmology",
                "fallback_responses": {"no_kb_match": "Bu konuda elimde bilgi yok."},
            },
            "channel_config": {"voice": {"language": "tr"}},
            "crm_config": {},
            "_plan": "business",
        },
        "playbook": {
            "system_prompt_template": "Sen Test Göz Kliniği adına arayan Elif'sin. Göz sağlığı alanında bilgi veriyorsun.",
            "opening_message": "Merhaba! Ben Test Göz Kliniği'nden Elif, nasıl yardımcı olabilirim?",
            "hard_blocks": [
                {
                    "trigger_id": "block_0",
                    "action": "soft_block",
                    "keywords": ["garanti", "kesin görme"],
                    "response": "Her hastanın sonucu farklı olabilir, garanti veremiyoruz.",
                },
            ],
            "routing_rules": [],
            "handoff_triggers": {"keywords": ["acil görme kaybı", "travma", "şikayet"]},
            "few_shot_examples": [],
            "features": {"calendar_booking": True, "model": "claude-sonnet-4-6"},
        },
        "intake": [
            {"key": "full_name",       "label": "Ad Soyad",          "type": "text",  "priority": "must"},
            {"key": "phone",           "label": "Telefon",           "type": "phone", "priority": "must"},
            {"key": "service_interest","label": "Hizmet",            "type": "text",  "priority": "must",   "voice_prompt": "Lazer tedavisi mi, katarakt ameliyatı mı, yoksa kontrol muayenesi mi?"},
            {"key": "vision_problem",  "label": "Görme Sorunu",      "type": "text",  "priority": "should", "voice_prompt": "Miyop mu, hipermetrop mu, astigmat mı, hangisi sizin durumunuz?"},
            {"key": "glasses_user",    "label": "Gözlük/Lens",       "type": "text",  "priority": "should", "voice_prompt": "Gözlük veya lens kullanıyor musunuz, ne zamandır?"},
            {"key": "prior_surgery",   "label": "Önceki Operasyon",  "type": "text",  "priority": "should", "voice_prompt": "Daha önce göz operasyonu geçirdiniz mi?"},
        ],
        "mock_kb": [
            {"title": "LASIK Lazer",     "description_for_ai": "LASIK lazer ile miyop, hipermetrop, astigmat düzeltilebilir.",    "similarity": 0.91},
            {"title": "Katarakt",        "description_for_ai": "Katarakt ameliyatında bulanık lens değiştirilir.",                 "similarity": 0.84},
            {"title": "Göz İçi Lens",    "description_for_ai": "ICL lens gözün içine yerleştirilen kalıcı çözüm sunar.",          "similarity": 0.67},
            {"title": "Alakasız",        "description_for_ai": "alakasız içerik",                                                   "similarity": 0.10},
        ],
        "sample_queries": [
            ("lazer tedavisi nasıl oluyor?", ["LASIK", "lazer", "miyop"]),
            ("katarakt ameliyatı ne zaman?", ["Katarakt", "lens"]),
            ("garanti var mı?",              []),
        ],
    },

    "general_practice": {
        "org": {
            "id": "test-gp-org",
            "name": "Test Aile Sağlığı Merkezi",
            "sector": "clinic",
            "ai_persona": {
                "persona_name": "Aslı",
                "language": "tr",
                "clinic_type": "general_practice",
                "fallback_responses": {"no_kb_match": "Bu konuda elimde bilgi yok."},
            },
            "channel_config": {"voice": {"language": "tr"}},
            "crm_config": {},
            "_plan": "essential",
        },
        "playbook": {
            "system_prompt_template": "Sen Test Aile Sağlığı Merkezi adına arayan Aslı'sın.",
            "opening_message": "Merhaba! Ben Test Aile Sağlığı Merkezi'nden Aslı, nasıl yardımcı olabilirim?",
            "hard_blocks": [
                {
                    "trigger_id": "block_0",
                    "action": "soft_block",
                    "keywords": ["ilaç yaz", "reçete"],
                    "response": "Reçete düzenlemek için doktorunuzla görüşmeniz gerekiyor.",
                },
            ],
            "routing_rules": [],
            "handoff_triggers": {"keywords": ["acil", "ambulans", "kalp krizi", "şikayet"]},
            "few_shot_examples": [],
            "features": {"calendar_booking": True, "model": "claude-sonnet-4-6"},
        },
        "intake": [
            {"key": "full_name",          "label": "Ad Soyad",        "type": "text",  "priority": "must"},
            {"key": "phone",              "label": "Telefon",         "type": "phone", "priority": "must"},
            {"key": "service_interest",   "label": "Hizmet",          "type": "text",  "priority": "must",   "voice_prompt": "Muayene mi, kronik takip mi, aşı mı, ne için randevu almak istiyorsunuz?"},
            {"key": "chief_complaint",    "label": "Ana Şikayet",     "type": "text",  "priority": "should", "voice_prompt": "Kısaca şikayetinizi anlatabilir misiniz?"},
            {"key": "age_group",          "label": "Yaş Grubu",       "type": "text",  "priority": "should", "voice_prompt": "Yaklaşık yaşınızı öğrenebilir miyim?"},
            {"key": "chronic_conditions", "label": "Kronik Hastalık", "type": "text",  "priority": "should", "voice_prompt": "Bilinen kronik bir hastalığınız var mı, ilaç kullanıyor musunuz?"},
        ],
        "mock_kb": [
            {"title": "Muayene Randevusu",  "description_for_ai": "Genel muayene için randevu alınabilir, online veya telefon.",       "similarity": 0.83},
            {"title": "Aşı Takvimi",        "description_for_ai": "Yetişkin ve çocuk aşı takvimleri merkezimizde uygulanmaktadır.",    "similarity": 0.75},
            {"title": "Kronik Hastalık Takibi","description_for_ai": "Diyabet, hipertansiyon gibi kronik hastalıklar takip edilir.",   "similarity": 0.68},
            {"title": "Alakasız",           "description_for_ai": "alakasız içerik",                                                    "similarity": 0.14},
        ],
        "sample_queries": [
            ("randevu almak istiyorum",    ["randevu"]),
            ("aşı yaptırabilir miyim?",   ["aşı", "takvim"]),
            ("reçete yazabilir misiniz?", []),
        ],
    },

    "other": {
        "org": {
            "id": "test-other-org",
            "name": "Test Sağlık Merkezi",
            "sector": "clinic",
            "ai_persona": {
                "persona_name": "Büşra",
                "language": "tr",
                "clinic_type": "other",
                "fallback_responses": {"no_kb_match": "Bu konuda elimde bilgi yok."},
            },
            "channel_config": {"voice": {"language": "tr"}},
            "crm_config": {},
            "_plan": "essential",
        },
        "playbook": {
            "system_prompt_template": "Sen Test Sağlık Merkezi adına arayan Büşra'sın.",
            "opening_message": "Merhaba! Ben Test Sağlık Merkezi'nden Büşra, nasıl yardımcı olabilirim?",
            "hard_blocks": [
                {
                    "trigger_id": "block_0",
                    "action": "soft_block",
                    "keywords": ["garanti", "kesin tedavi"],
                    "response": "Her hastanın durumu farklıdır, garanti veremiyoruz.",
                },
            ],
            "routing_rules": [],
            "handoff_triggers": {"keywords": ["şikayet", "avukat", "dava"]},
            "few_shot_examples": [],
            "features": {"calendar_booking": False, "model": "claude-sonnet-4-6"},
        },
        "intake": [
            {"key": "full_name",        "label": "Ad Soyad",           "type": "text",  "priority": "must",   "voice_prompt": "Adınızı ve soyadınızı öğrenebilir miyim?"},
            {"key": "phone",            "label": "Telefon",            "type": "phone", "priority": "must",   "voice_prompt": "Telefon numaranızı alabilir miyim?"},
            {"key": "service_interest", "label": "İlgilenilen Hizmet", "type": "text",  "priority": "must",   "voice_prompt": "Hangi hizmetimiz hakkında bilgi almak istiyorsunuz?"},
            {"key": "timeline",         "label": "Zaman Çizelgesi",    "type": "text",  "priority": "should", "voice_prompt": "Ne zaman başlamayı düşünüyorsunuz?"},
            {"key": "budget_range",     "label": "Bütçe",              "type": "text",  "priority": "should"},
            {"key": "notes",            "label": "Notlar",             "type": "text",  "priority": "should"},
        ],
        "mock_kb": [
            {"title": "Genel Hizmetler", "description_for_ai": "Merkezimizde çeşitli sağlık hizmetleri sunulmaktadır.", "similarity": 0.70},
            {"title": "Fiyat Listesi",   "description_for_ai": "Hizmet fiyatları talep üzerine paylaşılmaktadır.",      "similarity": 0.55},
            {"title": "Çalışma Saatleri","description_for_ai": "Hafta içi 09:00-18:00, cumartesi 09:00-13:00.",         "similarity": 0.45},
            {"title": "Alakasız",        "description_for_ai": "alakasız içerik",                                        "similarity": 0.22},
        ],
        "sample_queries": [
            ("hizmetleriniz neler?",    ["hizmet"]),
            ("fiyatlar nedir?",         ["fiyat"]),
            ("garanti veriyor musunuz?",[]),
        ],
    },
}
