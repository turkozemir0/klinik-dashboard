-- ============================================================================
-- Migration: Pricing Restructure — Plan Rename + Entitlements Matrix Update
-- Created: 2026-04-18
-- Description:
--   Renames plans: lite→essential, plus→professional, advanced→business, agency→custom
--   Updates entitlements matrix for new pricing strategy:
--     - Essential: Full CRM + unlimited chat, NO voice
--     - Professional: + Voice Inbound 150dk
--     - Business: + Voice In+Outbound 300dk shared pool
--     - Custom: Everything customizable
--   WA/IG/KB limits removed across all plans (cost ~$0.001/msg, no risk)
--
-- Strategy: plans.id is text PK without ON UPDATE CASCADE.
--   1. Insert new plan rows
--   2. Migrate FK refs (plan_entitlements, org_subscriptions, organizations)
--   3. Delete old plan rows
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- STEP 1: Insert new plan rows
-- ═══════════════════════════════════════════════════════════════

INSERT INTO plans (id, name, price_monthly, price_annual, currency, voice_overage_rate, whatsapp_overage_rate, max_team_members, trial_days, sort_order, is_active)
VALUES
  ('essential',    'Essential',     79.00,   756.00, 'USD', NULL,  NULL,  5,    7, 1, true),
  ('professional', 'Professional', 149.00,  1428.00, 'USD', 0.05,  NULL, 10,    7, 2, true),
  ('business',     'Business',     299.00,  2868.00, 'USD', 0.05,  NULL, 20,    7, 3, true),
  ('custom',       'Custom',       NULL,    NULL,    'USD', NULL,  NULL, NULL,   7, 4, true)
ON CONFLICT (id) DO UPDATE SET
  name                  = EXCLUDED.name,
  price_monthly         = EXCLUDED.price_monthly,
  price_annual          = EXCLUDED.price_annual,
  currency              = EXCLUDED.currency,
  voice_overage_rate    = EXCLUDED.voice_overage_rate,
  whatsapp_overage_rate = EXCLUDED.whatsapp_overage_rate,
  max_team_members      = EXCLUDED.max_team_members,
  trial_days            = EXCLUDED.trial_days,
  sort_order            = EXCLUDED.sort_order,
  is_active             = EXCLUDED.is_active;

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Migrate FK references — plan_entitlements
-- ═══════════════════════════════════════════════════════════════

-- Delete old entitlements for old plan IDs (will be re-inserted with new IDs below)
DELETE FROM plan_entitlements WHERE plan_id IN ('lite', 'plus', 'advanced', 'agency');

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Migrate FK references — org_subscriptions
-- ═══════════════════════════════════════════════════════════════

UPDATE org_subscriptions SET plan_id = 'essential'    WHERE plan_id = 'lite';
UPDATE org_subscriptions SET plan_id = 'professional' WHERE plan_id = 'plus';
UPDATE org_subscriptions SET plan_id = 'business'     WHERE plan_id = 'advanced';
UPDATE org_subscriptions SET plan_id = 'custom'       WHERE plan_id = 'agency';

-- ═══════════════════════════════════════════════════════════════
-- STEP 4: Migrate FK references — organizations.plan_id
-- ═══════════════════════════════════════════════════════════════

UPDATE organizations SET plan_id = 'essential'    WHERE plan_id = 'lite';
UPDATE organizations SET plan_id = 'professional' WHERE plan_id = 'plus';
UPDATE organizations SET plan_id = 'business'     WHERE plan_id = 'advanced';
UPDATE organizations SET plan_id = 'custom'       WHERE plan_id = 'agency';

-- ═══════════════════════════════════════════════════════════════
-- STEP 5: Delete old plan rows
-- ═══════════════════════════════════════════════════════════════

DELETE FROM plans WHERE id IN ('lite', 'plus', 'advanced', 'agency');

-- ═══════════════════════════════════════════════════════════════
-- STEP 6: Update workflow_reactivation feature — make it metered
-- ═══════════════════════════════════════════════════════════════

UPDATE features
SET is_boolean = false,
    usage_metric = 'reactivation_lead_count'
WHERE key = 'workflow_reactivation';

-- ═══════════════════════════════════════════════════════════════
-- STEP 7: Re-insert LEGACY entitlements (unchanged — all unlimited)
-- ═══════════════════════════════════════════════════════════════

-- Legacy already exists, refresh it to include any new features
INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value)
SELECT 'legacy', key, true, NULL FROM features
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled     = true,
  limit_value = NULL;

-- ═══════════════════════════════════════════════════════════════
-- STEP 8: ESSENTIAL ($79/mo) — Full CRM + Unlimited Chat, NO voice
-- ═══════════════════════════════════════════════════════════════

INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  -- WhatsApp — UNLIMITED
  ('essential', 'whatsapp_inbound',           true,  NULL),
  ('essential', 'whatsapp_outbound',          true,  NULL),
  ('essential', 'whatsapp_templates',         true,  NULL),
  -- Inbox
  ('essential', 'unified_inbox',              true,  NULL),
  -- Voice — DISABLED
  ('essential', 'voice_agent_inbound',        false, NULL),
  ('essential', 'voice_agent_outbound',       false, NULL),
  ('essential', 'voice_appointment_reminder', false, NULL),
  ('essential', 'multi_language_voice',       false, NULL),
  -- Knowledge Base — UNLIMITED
  ('essential', 'kb_read',                    true,  NULL),
  ('essential', 'kb_write',                   true,  NULL),
  -- Leads — FULL CRM
  ('essential', 'leads_manage',               true,  NULL),
  ('essential', 'leads_kanban',               true,  NULL),
  ('essential', 'leads_import_csv',           true,  NULL),
  -- Proposals
  ('essential', 'proposals_manage',           true,  NULL),
  ('essential', 'proposals_payments',         true,  NULL),
  -- Calendar
  ('essential', 'calendar_manage',            true,  NULL),
  -- Follow-up
  ('essential', 'followup_sequences',         true,  NULL),
  ('essential', 'followup_manual',            true,  NULL),
  -- Instagram — UNLIMITED
  ('essential', 'instagram_dm',               true,  NULL),
  -- Analytics
  ('essential', 'analytics_basic',            true,  NULL),
  ('essential', 'analytics_advanced',         false, NULL),
  ('essential', 'analytics_export',           false, NULL),
  -- API
  ('essential', 'outbound_webhooks',          true,  NULL),
  -- CRM
  ('essential', 'dentsoft_integration',       true,  NULL),
  -- Support
  ('essential', 'support_tickets',            true,  NULL),
  -- Team
  ('essential', 'multi_team',                 true,  5),
  -- Pipeline
  ('essential', 'multi_pipeline',             false, NULL),
  -- Workflows
  ('essential', 'workflow_engine',            true,  NULL),
  ('essential', 'workflow_outbound_voice',    false, NULL),
  ('essential', 'workflow_chatbot_auto',      true,  NULL),
  ('essential', 'workflow_sync_flows',        false, NULL),
  ('essential', 'workflow_satisfaction',      true,  NULL),  -- chat only (voice blocked by workflow_outbound_voice)
  ('essential', 'workflow_reactivation',      false, NULL),
  ('essential', 'workflow_payment_followup',  true,  NULL)   -- chat only
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

-- ═══════════════════════════════════════════════════════════════
-- STEP 9: PROFESSIONAL ($149/mo) — Essential + Voice Inbound
-- ═══════════════════════════════════════════════════════════════

INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  -- WhatsApp — UNLIMITED
  ('professional', 'whatsapp_inbound',           true,  NULL),
  ('professional', 'whatsapp_outbound',          true,  NULL),
  ('professional', 'whatsapp_templates',         true,  NULL),
  -- Inbox
  ('professional', 'unified_inbox',              true,  NULL),
  -- Voice — INBOUND ONLY 150dk
  ('professional', 'voice_agent_inbound',        true,  150),
  ('professional', 'voice_agent_outbound',       false, NULL),
  ('professional', 'voice_appointment_reminder', false, NULL),
  ('professional', 'multi_language_voice',       false, NULL),
  -- Knowledge Base — UNLIMITED
  ('professional', 'kb_read',                    true,  NULL),
  ('professional', 'kb_write',                   true,  NULL),
  -- Leads — FULL CRM
  ('professional', 'leads_manage',               true,  NULL),
  ('professional', 'leads_kanban',               true,  NULL),
  ('professional', 'leads_import_csv',           true,  NULL),
  -- Proposals
  ('professional', 'proposals_manage',           true,  NULL),
  ('professional', 'proposals_payments',         true,  NULL),
  -- Calendar
  ('professional', 'calendar_manage',            true,  NULL),
  -- Follow-up
  ('professional', 'followup_sequences',         true,  NULL),
  ('professional', 'followup_manual',            true,  NULL),
  -- Instagram — UNLIMITED
  ('professional', 'instagram_dm',               true,  NULL),
  -- Analytics
  ('professional', 'analytics_basic',            true,  NULL),
  ('professional', 'analytics_advanced',         true,  NULL),
  ('professional', 'analytics_export',           false, NULL),
  -- API
  ('professional', 'outbound_webhooks',          true,  NULL),
  -- CRM
  ('professional', 'dentsoft_integration',       true,  NULL),
  -- Support
  ('professional', 'support_tickets',            true,  NULL),
  -- Team
  ('professional', 'multi_team',                 true,  10),
  -- Pipeline
  ('professional', 'multi_pipeline',             true,  3),
  -- Workflows
  ('professional', 'workflow_engine',            true,  NULL),
  ('professional', 'workflow_outbound_voice',    false, NULL),
  ('professional', 'workflow_chatbot_auto',      true,  NULL),
  ('professional', 'workflow_sync_flows',        false, NULL),
  ('professional', 'workflow_satisfaction',      true,  NULL),  -- chat only
  ('professional', 'workflow_reactivation',      false, NULL),
  ('professional', 'workflow_payment_followup',  true,  NULL)   -- chat only
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

-- ═══════════════════════════════════════════════════════════════
-- STEP 10: BUSINESS ($299/mo) — Professional + Voice Outbound + Full workflows
-- ═══════════════════════════════════════════════════════════════

INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  -- WhatsApp — UNLIMITED
  ('business', 'whatsapp_inbound',           true,  NULL),
  ('business', 'whatsapp_outbound',          true,  NULL),
  ('business', 'whatsapp_templates',         true,  NULL),
  -- Inbox
  ('business', 'unified_inbox',              true,  NULL),
  -- Voice — 300dk shared pool (inbound + outbound)
  ('business', 'voice_agent_inbound',        true,  300),
  ('business', 'voice_agent_outbound',       true,  300),
  ('business', 'voice_appointment_reminder', true,  300),
  ('business', 'multi_language_voice',       true,  NULL),
  -- Knowledge Base — UNLIMITED
  ('business', 'kb_read',                    true,  NULL),
  ('business', 'kb_write',                   true,  NULL),
  -- Leads — FULL CRM
  ('business', 'leads_manage',               true,  NULL),
  ('business', 'leads_kanban',               true,  NULL),
  ('business', 'leads_import_csv',           true,  NULL),
  -- Proposals
  ('business', 'proposals_manage',           true,  NULL),
  ('business', 'proposals_payments',         true,  NULL),
  -- Calendar
  ('business', 'calendar_manage',            true,  NULL),
  -- Follow-up
  ('business', 'followup_sequences',         true,  NULL),
  ('business', 'followup_manual',            true,  NULL),
  -- Instagram — UNLIMITED
  ('business', 'instagram_dm',               true,  NULL),
  -- Analytics — FULL
  ('business', 'analytics_basic',            true,  NULL),
  ('business', 'analytics_advanced',         true,  NULL),
  ('business', 'analytics_export',           true,  NULL),
  -- API
  ('business', 'outbound_webhooks',          true,  NULL),
  -- CRM
  ('business', 'dentsoft_integration',       true,  NULL),
  -- Support
  ('business', 'support_tickets',            true,  NULL),
  -- Team
  ('business', 'multi_team',                 true,  20),
  -- Pipeline — UNLIMITED
  ('business', 'multi_pipeline',             true,  NULL),
  -- Workflows — ALL
  ('business', 'workflow_engine',            true,  NULL),
  ('business', 'workflow_outbound_voice',    true,  NULL),
  ('business', 'workflow_chatbot_auto',      true,  NULL),
  ('business', 'workflow_sync_flows',        true,  NULL),
  ('business', 'workflow_satisfaction',      true,  NULL),  -- voice + chat
  ('business', 'workflow_reactivation',      true,  5000),  -- 5000 lead/month
  ('business', 'workflow_payment_followup',  true,  NULL)   -- voice + chat
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

-- ═══════════════════════════════════════════════════════════════
-- STEP 11: CUSTOM (Görüşmeli) — Everything unlimited/custom
-- ═══════════════════════════════════════════════════════════════

INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  -- WhatsApp — UNLIMITED
  ('custom', 'whatsapp_inbound',           true,  NULL),
  ('custom', 'whatsapp_outbound',          true,  NULL),
  ('custom', 'whatsapp_templates',         true,  NULL),
  -- Inbox
  ('custom', 'unified_inbox',              true,  NULL),
  -- Voice — UNLIMITED (custom limits via override)
  ('custom', 'voice_agent_inbound',        true,  NULL),
  ('custom', 'voice_agent_outbound',       true,  NULL),
  ('custom', 'voice_appointment_reminder', true,  NULL),
  ('custom', 'multi_language_voice',       true,  NULL),
  -- Knowledge Base
  ('custom', 'kb_read',                    true,  NULL),
  ('custom', 'kb_write',                   true,  NULL),
  -- Leads
  ('custom', 'leads_manage',               true,  NULL),
  ('custom', 'leads_kanban',               true,  NULL),
  ('custom', 'leads_import_csv',           true,  NULL),
  -- Proposals
  ('custom', 'proposals_manage',           true,  NULL),
  ('custom', 'proposals_payments',         true,  NULL),
  -- Calendar
  ('custom', 'calendar_manage',            true,  NULL),
  -- Follow-up
  ('custom', 'followup_sequences',         true,  NULL),
  ('custom', 'followup_manual',            true,  NULL),
  -- Instagram
  ('custom', 'instagram_dm',               true,  NULL),
  -- Analytics
  ('custom', 'analytics_basic',            true,  NULL),
  ('custom', 'analytics_advanced',         true,  NULL),
  ('custom', 'analytics_export',           true,  NULL),
  -- API
  ('custom', 'outbound_webhooks',          true,  NULL),
  -- CRM
  ('custom', 'dentsoft_integration',       true,  NULL),
  -- Support
  ('custom', 'support_tickets',            true,  NULL),
  -- Team — UNLIMITED
  ('custom', 'multi_team',                 true,  NULL),
  -- Pipeline — UNLIMITED
  ('custom', 'multi_pipeline',             true,  NULL),
  -- Workflows — ALL
  ('custom', 'workflow_engine',            true,  NULL),
  ('custom', 'workflow_outbound_voice',    true,  NULL),
  ('custom', 'workflow_chatbot_auto',      true,  NULL),
  ('custom', 'workflow_sync_flows',        true,  NULL),
  ('custom', 'workflow_satisfaction',      true,  NULL),
  ('custom', 'workflow_reactivation',      true,  20000),  -- 20000 lead/month
  ('custom', 'workflow_payment_followup',  true,  NULL)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- DOWN (Rollback):
-- BEGIN;
-- -- Re-insert old plans
-- INSERT INTO plans (id, name, price_monthly, price_annual, currency, voice_overage_rate, whatsapp_overage_rate, max_team_members, trial_days, sort_order, is_active)
-- VALUES
--   ('lite',     'Lite',      79.00,   756.00, 'USD', 0.05, 0.005,  2,    7, 1, true),
--   ('plus',     'Plus',     149.00,  1428.00, 'USD', 0.05, 0.005,  5,    7, 2, true),
--   ('advanced', 'Advanced', 299.00,  2868.00, 'USD', 0.05, 0.005, 10,    7, 3, true),
--   ('agency',   'Agency',   499.00,  4788.00, 'USD', 0.05, 0.005, NULL,  7, 4, true);
-- -- Migrate back org_subscriptions, organizations, plan_entitlements...
-- COMMIT;
-- ═══════════════════════════════════════════════════════════════
