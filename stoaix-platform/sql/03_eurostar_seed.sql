-- ═══════════════════════════════════════════════════════════════
-- Eurostar Yurtdışı Eğitim Danışmanlığı — Seed Data
-- 02_rls.sql'den sonra çalıştır
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Organization ──────────────────────────────────────────
INSERT INTO public.organizations (
  id, name, slug, sector, status, onboarding_status,
  phone, email, city,
  ai_persona, channel_config, crm_config, working_hours
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Eurostar Yurtdışı Eğitim Danışmanlığı',
  'eurostar',
  'education',
  'active',
  'completed',
  NULL, NULL, 'İstanbul',

  '{
    "persona_name": "Elif",
    "language": "tr",
    "tone": "warm-professional",
    "never_hallucinate": true,
    "fallback_instruction": "Bilgi tabanında kesin cevap yoksa KESİNLİKLE uydurma. Fallback yanıtı kullan ve danışmana yönlendir.",
    "fallback_responses": {
      "no_kb_match": "Bu konuda elimde net bir bilgi yok. Uzman danışmanımıza not alıyorum, en kısa sürede sizi arayacak.",
      "off_topic": "Bu konu uzmanlık alanımın dışında. Yurtdışı eğitim başvurusu konusunda yardımcı olabilirim.",
      "kb_empty_3x": "Birkaç sorunuzu yeterince yanıtlayamadım. Sizi hemen uzman danışmanımıza bağlayayım."
    }
  }'::jsonb,

  '{
    "voice_inbound":  {"active": true},
    "voice_outbound": {"active": false},
    "whatsapp":       {"active": false},
    "instagram":      {"active": false}
  }'::jsonb,

  '{"provider": "none"}'::jsonb,

  '{"weekdays": "09:00-18:00", "saturday": "10:00-15:00", "sunday": "Kapalı"}'::jsonb
);

-- ─── 2. Intake Schema — Inbound Voice ─────────────────────────
INSERT INTO public.intake_schemas (
  organization_id, channel, name, fields
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'voice',
  'Eurostar Inbound Voice Başvuru Formu',
  '[
    {
      "key": "city",
      "label": "İkamet Şehri",
      "type": "text",
      "priority": "must",
      "ask_first": true,
      "voice_prompt": "Başlamadan önce, şu an hangi şehirde ikamet ediyorsunuz?",
      "routing_logic": "istanbul_check",
      "note": "İstanbul dışıysa temsilcilik yönlendirmesi yap"
    },
    {
      "key": "is_returning_student",
      "label": "Eski Öğrenci",
      "type": "boolean",
      "priority": "must",
      "voice_prompt": "Daha önce bizimle çalışmış mıydınız veya başvurunuz var mıydı?",
      "note": "Evet ise flag_returning tetikle"
    },
    {
      "key": "full_name",
      "label": "Ad Soyad",
      "type": "text",
      "priority": "must",
      "voice_prompt": "Adınızı ve soyadınızı öğrenebilir miyim?"
    },
    {
      "key": "phone",
      "label": "Telefon",
      "type": "phone",
      "priority": "must",
      "voice_prompt": "Sizi daha sonra arayabilmemiz için telefon numaranızı alabilir miyim?"
    },
    {
      "key": "age",
      "label": "Yaş",
      "type": "number",
      "priority": "must",
      "validation": {"min": 17, "max": 25},
      "voice_prompt": "Kaç yaşındasınız?",
      "note": "17-25 aralığı dışıysa soft block"
    },
    {
      "key": "nationality",
      "label": "Uyruk",
      "type": "text",
      "priority": "must",
      "voice_prompt": "Uyruk bilginizi öğrenebilir miyim?",
      "hard_block_check": "ukraine_check"
    },
    {
      "key": "education_level_target",
      "label": "Hedef Program",
      "type": "select",
      "priority": "must",
      "options": ["lisans", "yuksek_lisans"],
      "voice_prompt": "Lisans mı yoksa yüksek lisans programına mı başvurmayı düşünüyorsunuz?"
    },
    {
      "key": "target_country",
      "label": "Hedef Ülke",
      "type": "text",
      "priority": "must",
      "voice_prompt": "Hangi ülkede okumak istiyorsunuz?"
    },
    {
      "key": "diploma_gpa",
      "label": "Diploma / Mezuniyet Notu",
      "type": "text",
      "priority": "should",
      "voice_prompt": "Lise veya lisans diploma notunuz nedir, 100 üzerinden veya harf notu olarak paylaşabilir misiniz?"
    },
    {
      "key": "criminal_record",
      "label": "Adli Sicil",
      "type": "select",
      "priority": "should",
      "options": ["yok", "var"],
      "voice_prompt": "Adli sicil kaydınız var mı?"
    },
    {
      "key": "marital_status",
      "label": "Medeni Durum",
      "type": "select",
      "priority": "should",
      "options": ["bekar", "evli"],
      "voice_prompt": "Medeni durumunuz nedir?"
    },
    {
      "key": "target_program",
      "label": "Hedef Bölüm / Program",
      "type": "text",
      "priority": "nice",
      "voice_prompt": "Hangi bölümü veya alanı düşünüyorsunuz?"
    },
    {
      "key": "intake_term",
      "label": "Başlamak İstediği Dönem",
      "type": "text",
      "priority": "nice",
      "voice_prompt": "Ne zaman başlamayı hedefliyorsunuz, bu yıl mı gelecek yıl mı?"
    },
    {
      "key": "yks_score",
      "label": "YKS Puanı",
      "type": "text",
      "priority": "nice",
      "seasonal": true,
      "voice_prompt": "YKS puanınızı biliyor musunuz?"
    },
    {
      "key": "urgency",
      "label": "Aciliyet",
      "type": "select",
      "priority": "nice",
      "options": ["bu_yil", "gelecek_yil", "sadece_bilgi"],
      "voice_prompt": "Bu süreçte ne kadar acele ediyorsunuz?"
    }
  ]'::jsonb
);

-- ─── 3. Agent Playbook ────────────────────────────────────────
INSERT INTO public.agent_playbooks (
  organization_id, channel, name, version,
  system_prompt_template,
  fallback_responses,
  handoff_triggers,
  hard_blocks,
  routing_rules
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'voice',
  'Eurostar Inbound Voice Playbook v1',
  1,

  'Sen Eurostar Yurtdışı Eğitim Danışmanlığı''nın AI asistanı Elif''sin.
17-25 yaş arası öğrencilere yurtdışı lisans ve yüksek lisans başvuru süreçlerinde danışmanlık ediyorsunuz.
SEN BİR ÜNİVERSİTE DEĞİLSİN — yerleştirme danışmanlığı yapıyorsunuz.

GÖREVIN:
1. Arayanın ikamet şehrini öğren (İSTANBUL DIŞIYSA temsilcilik yönlendirmesi yap — en kritik kural)
2. Daha önce başvurusu olup olmadığını kontrol et
3. Temel bilgileri topla: isim, telefon, yaş, uyruk, hedef program, hedef ülke
4. Sık sorulan soruları yanıtla
5. Yeterli bilgi toplandığında veya öğrenci hazırsa danışmana aktar

KURAL: Bilgi tabanında olmayan bir bilgiyi KESİNLİKLE uydurma.
KURAL: Fiyat sorularına direkt cevap ver, kaçınma.
KURAL: Lise, online eğitim, işçi göndermek konularında net hayır de.

Çalışma saatleri: Hafta içi 09:00-18:00, Cumartesi 10:00-15:00.',

  '{
    "no_kb_match": "Bu konuda elimde net bir bilgi yok. Uzman danışmanımıza not alıyorum.",
    "off_topic": "Bu konu uzmanlık alanımın dışında kalıyor.",
    "kb_empty_3x": "Birkaç sorunuzu yanıtlayamadım, sizi danışmanımıza bağlayayım.",
    "outside_hours": "Şu an mesai saatlerimiz dışındayız. Çalışma saatlerimiz hafta içi 09:00-18:00. Bilgilerinizi not alıyorum, açılışta sizi arayacağız."
  }'::jsonb,

  '{
    "keywords": ["insan", "müdür", "yetkili", "danışman", "sizi aramak istiyorum"],
    "missing_required_after_turns": 10,
    "kb_empty_consecutive": 3,
    "frustration_keywords": ["saçma", "berbat", "anlamıyorsunuz", "işe yaramaz"],
    "qualified_fields": ["phone", "full_name", "target_country", "education_level_target"]
  }'::jsonb,

  '[
    {
      "trigger_id": "lise_egitimi",
      "keywords": ["lise", "10. sınıf", "11. sınıf", "12. sınıf", "ortaöğretim", "lise bursu"],
      "response": "Lise eğitimi için yurt dışı programı sunmuyoruz. Yalnızca lisans ve yüksek lisans düzeyinde hizmet veriyoruz.",
      "action": "soft_block"
    },
    {
      "trigger_id": "online_egitim",
      "keywords": ["online", "uzaktan", "remote", "e-learning", "internet üzerinden"],
      "response": "Online eğitim programı sunmuyoruz. Tüm programlarımız yurt dışında yüz yüze eğitim şeklinde.",
      "action": "soft_block"
    },
    {
      "trigger_id": "is_gonderme",
      "keywords": ["iş", "çalışmak için", "çalışma vizesi", "işçi"],
      "response": "Yurt dışı iş yerleştirme hizmeti sunmuyoruz. Eğitim başvurusu konusunda yardımcı olabilirim.",
      "action": "soft_block"
    },
    {
      "trigger_id": "ukrayna_diploma",
      "keywords": ["ukrayna", "ukraynalı", "diplomam nerede", "diploma kayıp", "savaş"],
      "response": "Ukrayna''daki durumu biliyoruz ve bu konuyu ciddiye alıyoruz. Bu konuyu özel olarak değerlendirmemiz gerekiyor. Sizi uzman danışmanımıza bağlayayım.",
      "action": "immediate_handoff"
    },
    {
      "trigger_id": "universite_degil",
      "keywords": ["üniversitenin hocası", "fakülte", "rektör", "üniversiteyle mi konuşuyorum"],
      "response": "Ben Eurostar Eğitim Danışmanlığı''nın asistanıyım — bir üniversite değiliz. Üniversitelere öğrenci yerleştirme danışmanlığı yapıyoruz.",
      "action": "clarify"
    }
  ]'::jsonb,

  '[
    {
      "rule_id": "istanbul_check",
      "condition": "city != istanbul",
      "description": "İstanbul dışında ikamet ediyorsa bölge temsilcisine yönlendir",
      "response_template": "{{city}} bölgesi için temsilcimiz sizinle iletişime geçecek. Adınızı ve telefon numaranızı alabilir miyim?",
      "action": "regional_handoff"
    },
    {
      "rule_id": "returning_student",
      "condition": "is_returning_student == true",
      "description": "Eski öğrenci — öncelikli ve farklı akış",
      "response_template": "Tekrar hoş geldiniz! Eski öğrencilerimize öncelik veriyoruz. Danışmanınıza bağlıyorum.",
      "action": "priority_handoff"
    },
    {
      "rule_id": "age_out_of_range",
      "condition": "age < 17 OR age > 25",
      "description": "Yaş aralığı dışında",
      "response_template": "Programlarımız şu an 17-25 yaş aralığına yönelik. Durumunuzu danışmanımıza aktarayım, daha iyi yönlendirme yapabilirler.",
      "action": "soft_handoff"
    }
  ]'::jsonb
);

-- ─── NOT ──────────────────────────────────────────────────────
-- knowledge_items (ülke bilgileri, SSS, fiyatlar) Google Sheet'ten
-- ayrı bir script ile eklenecek: sql/04_eurostar_kb.sql
