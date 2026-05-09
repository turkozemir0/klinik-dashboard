-- ============================================================================
-- Migration: Pricing v3 — Fiyat güncellemesi + AI Konuşma feature + Voice dakika limitleri
-- Created: 2026-05-03
-- Description:
--   - Plan fiyatları güncellendi: Essential $129, Professional $249, Business $599
--   - Yıllık %20 indirim: $1238.40 / $2390.40 / $5750.40
--   - conversation_overage_rate kolonu eklendi ($0.09/konuşma)
--   - voice_overage_rate güncellendi ($0.19/dk)
--   - Yeni feature: ai_conversations (metered)
--   - Voice dakika limitleri güncellendi: Professional 200dk, Business 500dk shared pool
--   - AI konuşma limitleri: Essential 1000, Professional 2000, Business 5000
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- STEP 1: Plan fiyatlarını güncelle
-- ═══════════════════════════════════════════════════════════════

UPDATE plans SET price_monthly = 129, price_annual = 1238.40, voice_overage_rate = NULL WHERE id = 'essential';
UPDATE plans SET price_monthly = 249, price_annual = 2390.40, voice_overage_rate = 0.19 WHERE id = 'professional';
UPDATE plans SET price_monthly = 599, price_annual = 5750.40, voice_overage_rate = 0.19, trial_days = 0 WHERE id = 'business';

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: conversation_overage_rate kolonu ekle
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE plans ADD COLUMN IF NOT EXISTS conversation_overage_rate numeric(10,4);
UPDATE plans SET conversation_overage_rate = 0.09 WHERE id IN ('essential','professional','business');

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Yeni feature: ai_conversations
-- ═══════════════════════════════════════════════════════════════

INSERT INTO features (key, module, name, usage_metric, is_boolean)
VALUES ('ai_conversations', 'chat', 'AI Konuşmalar', 'ai_conversation_count', false)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- STEP 4: AI konuşma entitlements
-- ═══════════════════════════════════════════════════════════════

INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  ('essential',    'ai_conversations', true, 1000),
  ('professional', 'ai_conversations', true, 2000),
  ('business',     'ai_conversations', true, 5000),
  ('custom',       'ai_conversations', true, NULL),
  ('legacy',       'ai_conversations', true, NULL)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

-- ═══════════════════════════════════════════════════════════════
-- STEP 5: Voice dakika güncellemeleri
-- ═══════════════════════════════════════════════════════════════

-- Professional: 200dk/ay (sadece inbound)
UPDATE plan_entitlements SET limit_value = 200 WHERE plan_id = 'professional' AND feature_key = 'voice_agent_inbound';

-- Business: 500dk/ay shared pool (inbound + outbound + reminder hepsi aynı 'voice_minutes' metriği)
UPDATE plan_entitlements SET limit_value = 500 WHERE plan_id = 'business' AND feature_key = 'voice_agent_inbound';
UPDATE plan_entitlements SET limit_value = 500 WHERE plan_id = 'business' AND feature_key = 'voice_agent_outbound';
UPDATE plan_entitlements SET limit_value = 500 WHERE plan_id = 'business' AND feature_key = 'voice_appointment_reminder';

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- DOWN (Rollback):
-- BEGIN;
-- UPDATE plans SET price_monthly = 79, price_annual = 756.00, voice_overage_rate = NULL WHERE id = 'essential';
-- UPDATE plans SET price_monthly = 149, price_annual = 1428.00, voice_overage_rate = 0.05 WHERE id = 'professional';
-- UPDATE plans SET price_monthly = 299, price_annual = 2868.00, voice_overage_rate = 0.05, trial_days = 7 WHERE id = 'business';
-- ALTER TABLE plans DROP COLUMN IF EXISTS conversation_overage_rate;
-- DELETE FROM features WHERE key = 'ai_conversations';
-- DELETE FROM plan_entitlements WHERE feature_key = 'ai_conversations';
-- UPDATE plan_entitlements SET limit_value = 150 WHERE plan_id = 'professional' AND feature_key = 'voice_agent_inbound';
-- UPDATE plan_entitlements SET limit_value = 300 WHERE plan_id = 'business' AND feature_key = 'voice_agent_inbound';
-- UPDATE plan_entitlements SET limit_value = 300 WHERE plan_id = 'business' AND feature_key = 'voice_agent_outbound';
-- UPDATE plan_entitlements SET limit_value = 300 WHERE plan_id = 'business' AND feature_key = 'voice_appointment_reminder';
-- COMMIT;
-- ═══════════════════════════════════════════════════════════════
