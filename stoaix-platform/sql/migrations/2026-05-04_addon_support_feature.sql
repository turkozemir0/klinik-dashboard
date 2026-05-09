-- dedicated_support feature (boolean, addon ile açılır)
INSERT INTO features (key, module, name, is_boolean, usage_metric)
VALUES ('dedicated_support', 'support', 'Dedicated Support', true, NULL)
ON CONFLICT (key) DO NOTHING;

-- Plan entitlements: hiçbir planda varsayılan olarak yok, addon ile açılır
INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value)
VALUES
  ('essential', 'dedicated_support', false, NULL),
  ('professional', 'dedicated_support', false, NULL),
  ('business', 'dedicated_support', false, NULL),
  ('custom', 'dedicated_support', true, NULL),
  ('legacy', 'dedicated_support', true, NULL)
ON CONFLICT (plan_id, feature_key) DO NOTHING;
