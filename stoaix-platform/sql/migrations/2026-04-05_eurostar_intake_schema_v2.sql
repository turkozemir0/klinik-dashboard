-- 2026-04-05_eurostar_intake_schema_v2.sql
-- Intake schema'yı playbook v4 ile senkronize et:
--   - 15 alan → 5 alan
--   - phone "must" kaldırıldı (SIP caller ID'den otomatik geliyor)
--   - target_program "nice" → program_interest "must" (ilk soru)
--   - full_name → first_name
--   - criminal_record, marital_status, nationality, is_returning_student kaldırıldı
--   - priority sırası playbook konuşma akışıyla eşleşti

UPDATE intake_schemas
SET
  fields = '[
    {
      "key":          "program_interest",
      "label":        "İlgilenilen Bölüm / Alan",
      "type":         "text",
      "priority":     "must",
      "voice_prompt": "Hangi bölüm ya da ülkeyi düşünüyorsunuz?"
    },
    {
      "key":          "first_name",
      "label":        "İsim",
      "type":         "text",
      "priority":     "must",
      "voice_prompt": "Adınızı alabilir miyim?"
    },
    {
      "key":          "city",
      "label":        "Şehir",
      "type":         "text",
      "priority":     "must",
      "voice_prompt": "Hangi şehirden arıyorsunuz?",
      "note":         "İstanbul dışıysa şehir routing_rules tetikler"
    },
    {
      "key":          "age",
      "label":        "Yaş",
      "type":         "number",
      "priority":     "should",
      "voice_prompt": "Kaç yaşındasınız?"
    },
    {
      "key":          "diploma_grade",
      "label":        "Diploma Notu",
      "type":         "text",
      "priority":     "should",
      "voice_prompt": "Lise diploma notunuz nedir?"
    }
  ]'::jsonb
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND channel = 'voice';
