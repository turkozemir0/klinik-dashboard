-- Website Form Webhook feature + plan entitlements
-- Lead acquisition = zero marginal cost → enabled for all plans

INSERT INTO features (key, module, name, is_boolean)
VALUES ('website_form_webhook', 'api', 'Website Form Webhook', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value)
VALUES
  ('essential',    'website_form_webhook', true, NULL),
  ('professional', 'website_form_webhook', true, NULL),
  ('business',     'website_form_webhook', true, NULL),
  ('custom',       'website_form_webhook', true, NULL)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;
