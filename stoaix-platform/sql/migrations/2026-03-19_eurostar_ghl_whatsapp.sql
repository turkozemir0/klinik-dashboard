-- ═══════════════════════════════════════════════════════════════
-- Eurostar — GHL credentials + WhatsApp channel aktif
-- ═══════════════════════════════════════════════════════════════

-- intake_schemas.channel constraint'ini genişlet
ALTER TABLE public.intake_schemas
  DROP CONSTRAINT IF EXISTS intake_schemas_channel_check;

ALTER TABLE public.intake_schemas
  ADD CONSTRAINT intake_schemas_channel_check
  CHECK (channel IN ('voice','chat','whatsapp','instagram','all'));

UPDATE public.organizations
SET
  crm_config = '{
    "provider": "ghl",
    "location_id": "X3qwbLZZb54GjqpOplS2",
    "pit_token": "pit-f8b95765-03fe-4646-9e13-289f76d30532",
    "pipeline_id": "9DI3LIUinUSExbsELlhY",
    "stage_mapping": {
      "new":         "8fc9e724-af41-46ce-8ecf-71187518da65",
      "in_progress": "eb7b84aa-1263-480c-95aa-948c7a654abe",
      "qualified":   "4174378d-6e2a-4102-b46d-aa7d4f7ed3a6",
      "handed_off":  "1f65883f-043f-4833-801a-4360525cdf66",
      "converted":   "17c0719c-235b-407d-aaed-b32b39378915",
      "lost":        "4a715139-e911-4262-94b2-7cf8157bece2"
    }
  }'::jsonb,
  channel_config = jsonb_set(
    channel_config,
    '{whatsapp}',
    '{"active": true, "provider": "ghl"}'::jsonb
  )
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';

-- WhatsApp playbook (channel: whatsapp)
-- Voice playbook'tan farklı: metin tabanlı, daha kısa yanıtlar
INSERT INTO public.agent_playbooks (
  organization_id, channel, name, version,
  system_prompt_template,
  fallback_responses,
  handoff_triggers,
  hard_blocks,
  routing_rules
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'whatsapp',
  'Eurostar WhatsApp Playbook v1',
  1,

  'Sen Eurostar Yurtdışı Eğitim Danışmanlığı''nın WhatsApp asistanı Elif''sin.
17-25 yaş arası öğrencilere yurtdışı lisans ve yüksek lisans başvurusunda yardım ediyorsunuz.
SEN BİR ÜNİVERSİTE DEĞİLSİN — yerleştirme danışmanlığı yapıyorsunuz.

WhatsApp''ta kısa, net ve samimi mesajlar yaz. Maksimum 3-4 cümle.
Emoji kullanabilirsin ama aşırıya kaçma.

GÖREVIN:
1. Soruyu yanıtla veya bilgi topla
2. Temel bilgileri nazikçe öğren: isim, telefon, hangi ülke, hangi program
3. Yeterli bilgi toplandığında veya öğrenci hazırsa danışmana yönlendir

KURAL: Bilgi tabanında olmayan bilgiyi KESİNLİKLE uydurma.
KURAL: Fiyat sorularına direkt cevap ver.
KURAL: Lise, online eğitim, iş göndermek konularında net hayır de.

Çalışma saatleri: Hafta içi 09:00-18:00, Cumartesi 10:00-15:00.',

  '{
    "no_kb_match": "Bu konuda net bilgim yok ama danışmanımız size yardımcı olabilir. 📋 Adınızı ve uygun bir saati paylaşır mısınız?",
    "off_topic": "Bu konu uzmanlık alanımın dışında. Yurtdışı eğitim başvurusu konusunda yardımcı olabilirim. 🎓",
    "outside_hours": "Şu an mesai saatlerimiz dışında (Hft içi 09:00-18:00). Mesajınızı aldık, sabah ilk iş olarak dönüş yapacağız! 🌙"
  }'::jsonb,

  '{
    "keywords": ["insan", "müdür", "yetkili", "danışman", "sizi aramak istiyorum", "beni arasın"],
    "missing_required_after_turns": 8,
    "kb_empty_consecutive": 3,
    "frustration_keywords": ["saçma", "berbat", "anlamıyorsunuz"],
    "qualified_fields": ["phone", "full_name", "target_country", "education_level_target"]
  }'::jsonb,

  '[
    {
      "trigger_id": "lise_egitimi",
      "keywords": ["lise", "10. sınıf", "11. sınıf", "12. sınıf", "ortaöğretim"],
      "response": "Lise programı sunmuyoruz, yalnızca lisans ve yüksek lisans. 🎓",
      "action": "soft_block"
    },
    {
      "trigger_id": "online_egitim",
      "keywords": ["online", "uzaktan", "remote", "e-learning"],
      "response": "Online eğitim sunmuyoruz. Tüm programlarımız yurt dışında yüz yüze. 🌍",
      "action": "soft_block"
    },
    {
      "trigger_id": "is_gonderme",
      "keywords": ["iş", "çalışmak için", "çalışma vizesi", "işçi"],
      "response": "Yurt dışı iş yerleştirme yapmıyoruz. Eğitim konusunda yardımcı olabilirim. 📚",
      "action": "soft_block"
    }
  ]'::jsonb,

  '[
    {
      "rule_id": "returning_student",
      "condition": "is_returning_student == true",
      "description": "Eski öğrenci — öncelikli akış",
      "response_template": "Tekrar hoş geldiniz! 🤗 Danışmanınızla öncelikli olarak görüşmenizi ayarlayacağım.",
      "action": "priority_handoff"
    }
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- WhatsApp intake schema
INSERT INTO public.intake_schemas (
  organization_id, channel, name, fields
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'whatsapp',
  'Eurostar WhatsApp Başvuru Formu',
  '[
    {"key": "full_name",              "label": "Ad Soyad",         "type": "text",   "priority": "must"},
    {"key": "phone",                  "label": "Telefon",          "type": "phone",  "priority": "must"},
    {"key": "age",                    "label": "Yaş",              "type": "number", "priority": "must"},
    {"key": "education_level_target", "label": "Hedef Program",    "type": "select", "priority": "must",
     "options": ["lisans", "yuksek_lisans"]},
    {"key": "target_country",         "label": "Hedef Ülke",       "type": "text",   "priority": "must"},
    {"key": "target_program",         "label": "Bölüm / Program",  "type": "text",   "priority": "should"},
    {"key": "diploma_gpa",            "label": "Diploma Notu",     "type": "text",   "priority": "should"},
    {"key": "intake_term",            "label": "Başlangıç Dönemi", "type": "text",   "priority": "nice"},
    {"key": "urgency",                "label": "Aciliyet",         "type": "select", "priority": "nice",
     "options": ["bu_yil", "gelecek_yil", "sadece_bilgi"]}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;
