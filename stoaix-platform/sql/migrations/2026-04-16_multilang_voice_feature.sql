-- Çok Dilli Ses özelliği (Advanced+ plan)
-- TR/EN dışı diller sadece advanced ve agency planlarda aktif.
-- legacy = check.ts ALLOW_ALL mantığıyla otomatik true.

INSERT INTO features (key, module, name, is_boolean, usage_metric)
VALUES ('multi_language_voice', 'voice', 'Çok Dilli Ses (TR/EN dışı)', true, null)
ON CONFLICT (key) DO NOTHING;

INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value)
VALUES
  ('lite',     'multi_language_voice', false, null),
  ('plus',     'multi_language_voice', false, null),
  ('advanced', 'multi_language_voice', true,  null),
  ('agency',   'multi_language_voice', true,  null)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;
-- Not: legacy planlar check.ts içinde ALLOW_ALL kuralıyla otomatik true alır.
