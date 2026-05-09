-- Meta Conversions API (CAPI) — Nitelikli Lead Geri Bildirimi
-- crm_sync_logs entity_type → 'capi_event' eklenmesi
ALTER TABLE crm_sync_logs DROP CONSTRAINT IF EXISTS crm_sync_logs_entity_type_check;
ALTER TABLE crm_sync_logs ADD CONSTRAINT crm_sync_logs_entity_type_check
  CHECK (entity_type IN ('contact','lead','handoff','capi_event'));

-- Feature kaydı
INSERT INTO features (key, module, name, is_boolean)
VALUES ('meta_capi', 'advertising', 'Meta Conversions API', true)
ON CONFLICT (key) DO NOTHING;

-- Plan entitlements (tüm planlarda açık)
INSERT INTO plan_entitlements (plan_id, feature_key, enabled) VALUES
  ('essential',    'meta_capi', true),
  ('professional', 'meta_capi', true),
  ('business',     'meta_capi', true),
  ('custom',       'meta_capi', true)
ON CONFLICT (plan_id, feature_key) DO NOTHING;
