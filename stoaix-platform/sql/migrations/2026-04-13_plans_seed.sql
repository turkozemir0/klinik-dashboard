-- ═══════════════════════════════════════════════════════════════
-- 2026-04-13_plans_seed.sql
-- Plans + Features + Plan Entitlements — Seed Data
--
-- Bağımlılık: 2026-04-13_billing_foundation.sql önce çalıştırılmalı.
--
-- Planlar: lite / plus / advanced / agency (+ legacy)
-- Features: 25 adet
-- Matris: 5 plan × 25 feature = 125 satır
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. INSERT PLANS (4 adet) ────────────────────────────────────
-- price_monthly : aylık fiyat (USD)
-- price_annual  : yıllık toplam (USD) = aylık-annual-rate × 12

INSERT INTO plans (id, name, price_monthly, price_annual, currency, voice_overage_rate, whatsapp_overage_rate, max_team_members, trial_days, sort_order, is_active)
VALUES
  ('lite',     'Lite',      79.00,   756.00, 'USD', 0.05, 0.005,  2,    7, 1, true),
  ('plus',     'Plus',     149.00,  1428.00, 'USD', 0.05, 0.005,  5,    7, 2, true),
  ('advanced', 'Advanced', 299.00,  2868.00, 'USD', 0.05, 0.005, 10,    7, 3, true),
  ('agency',   'Agency',   499.00,  4788.00, 'USD', 0.05, 0.005, NULL,  7, 4, true)
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

-- ─── 2. INSERT FEATURES (25 adet) ────────────────────────────────

INSERT INTO features (key, module, name, usage_metric, is_boolean) VALUES
  -- WhatsApp (3)
  ('whatsapp_inbound',           'whatsapp',      'WhatsApp Gelen Mesaj',   'whatsapp_inbound_msgs',  false),
  ('whatsapp_outbound',          'whatsapp',      'WhatsApp Giden Mesaj',   'whatsapp_outbound_msgs', false),
  ('whatsapp_templates',         'whatsapp',      'WhatsApp Template',      'template_count',         false),

  -- Inbox (1)
  ('unified_inbox',              'inbox',         'Unified Inbox',          NULL,                     true),

  -- Voice (3)
  ('voice_agent_inbound',        'voice',         'Voice Agent (Gelen)',    'voice_minutes',          false),
  ('voice_agent_outbound',       'voice',         'Voice Agent (Giden)',    'voice_minutes',          false),
  ('voice_appointment_reminder', 'voice',         'Randevu Hatırlatıcı',   'voice_minutes',          false),

  -- Knowledge Base (2)
  ('kb_read',                    'knowledge_base','KB Okuma',               NULL,                     true),
  ('kb_write',                   'knowledge_base','KB Yazma',               'kb_item_count',          false),

  -- Leads (3)
  ('leads_manage',               'leads',         'Lead Yönetimi',          NULL,                     true),
  ('leads_kanban',               'leads',         'Kanban Board',           NULL,                     true),
  ('leads_import_csv',           'leads',         'CSV Import',             'import_row_count',       false),

  -- Proposals (2)
  ('proposals_manage',           'proposals',     'Teklif Yönetimi',        NULL,                     true),
  ('proposals_payments',         'proposals',     'Ödeme Takibi',           NULL,                     true),

  -- Calendar (1)
  ('calendar_manage',            'calendar',      'Takvim Yönetimi',        NULL,                     true),

  -- Follow-up (2)
  ('followup_sequences',         'followup',      'Otomatik Takip',         NULL,                     true),
  ('followup_manual',            'followup',      'Manuel Takip',           NULL,                     true),

  -- Instagram (1)
  ('instagram_dm',               'instagram',     'Instagram DM',           'instagram_messages',     false),

  -- Analytics (3)
  ('analytics_basic',            'analytics',     'Temel Analitik',         NULL,                     true),
  ('analytics_advanced',         'analytics',     'Gelişmiş Analitik',      NULL,                     true),
  ('analytics_export',           'analytics',     'Analitik Export',        NULL,                     true),

  -- API (1)
  ('outbound_webhooks',          'api',           'Outbound Webhook',       NULL,                     true),

  -- CRM (1)
  ('dentsoft_integration',       'crm',           'Dentsoft Entegrasyonu',  NULL,                     true),

  -- Support (1)
  ('support_tickets',            'support',       'Destek Talepleri',       NULL,                     true),

  -- Team (1)
  ('multi_team',                 'team',          'Çoklu Ekip',             'team_member_count',      false)
ON CONFLICT (key) DO UPDATE SET
  module       = EXCLUDED.module,
  name         = EXCLUDED.name,
  usage_metric = EXCLUDED.usage_metric,
  is_boolean   = EXCLUDED.is_boolean;

-- ─── 3. PLAN_ENTITLEMENTS MATRİSİ (5 plan × 25 feature) ─────────
-- enabled=true  + limit_value=NULL → sınırsız
-- enabled=true  + limit_value=N    → N limitli
-- enabled=false + limit_value=NULL → kapalı

-- LEGACY: tüm feature'lar unlimited (dinamik SELECT ile)
INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value)
SELECT 'legacy', key, true, NULL FROM features
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled     = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value;

-- LITE ($79/mo) — Temel paket
INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  ('lite', 'whatsapp_inbound',           true,  500),
  ('lite', 'whatsapp_outbound',          true,  500),
  ('lite', 'whatsapp_templates',         true,  5),
  ('lite', 'unified_inbox',              true,  NULL),
  ('lite', 'voice_agent_inbound',        false, NULL),
  ('lite', 'voice_agent_outbound',       false, NULL),
  ('lite', 'voice_appointment_reminder', false, NULL),
  ('lite', 'kb_read',                    true,  NULL),
  ('lite', 'kb_write',                   true,  50),
  ('lite', 'leads_manage',               true,  NULL),
  ('lite', 'leads_kanban',               false, NULL),
  ('lite', 'leads_import_csv',           false, NULL),
  ('lite', 'proposals_manage',           false, NULL),
  ('lite', 'proposals_payments',         false, NULL),
  ('lite', 'calendar_manage',            false, NULL),
  ('lite', 'followup_sequences',         false, NULL),
  ('lite', 'followup_manual',            true,  NULL),
  ('lite', 'instagram_dm',               false, NULL),
  ('lite', 'analytics_basic',            true,  NULL),
  ('lite', 'analytics_advanced',         false, NULL),
  ('lite', 'analytics_export',           false, NULL),
  ('lite', 'outbound_webhooks',          false, NULL),
  ('lite', 'dentsoft_integration',       false, NULL),
  ('lite', 'support_tickets',            false, NULL),
  ('lite', 'multi_team',                 true,  2)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

-- PLUS ($149/mo) — Büyüyen klinikler
INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  ('plus', 'whatsapp_inbound',           true,  2000),
  ('plus', 'whatsapp_outbound',          true,  2000),
  ('plus', 'whatsapp_templates',         true,  20),
  ('plus', 'unified_inbox',              true,  NULL),
  ('plus', 'voice_agent_inbound',        true,  100),
  ('plus', 'voice_agent_outbound',       false, NULL),
  ('plus', 'voice_appointment_reminder', true,  30),
  ('plus', 'kb_read',                    true,  NULL),
  ('plus', 'kb_write',                   true,  300),
  ('plus', 'leads_manage',               true,  NULL),
  ('plus', 'leads_kanban',               true,  NULL),
  ('plus', 'leads_import_csv',           true,  500),
  ('plus', 'proposals_manage',           true,  NULL),
  ('plus', 'proposals_payments',         true,  NULL),
  ('plus', 'calendar_manage',            true,  NULL),
  ('plus', 'followup_sequences',         true,  NULL),
  ('plus', 'followup_manual',            true,  NULL),
  ('plus', 'instagram_dm',               true,  1000),
  ('plus', 'analytics_basic',            true,  NULL),
  ('plus', 'analytics_advanced',         true,  NULL),
  ('plus', 'analytics_export',           false, NULL),
  ('plus', 'outbound_webhooks',          true,  NULL),
  ('plus', 'dentsoft_integration',       false, NULL),
  ('plus', 'support_tickets',            true,  NULL),
  ('plus', 'multi_team',                 true,  5)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

-- ADVANCED ($299/mo) — Tam özellikli klinikler
INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  ('advanced', 'whatsapp_inbound',           true,  NULL),
  ('advanced', 'whatsapp_outbound',          true,  NULL),
  ('advanced', 'whatsapp_templates',         true,  NULL),
  ('advanced', 'unified_inbox',              true,  NULL),
  ('advanced', 'voice_agent_inbound',        true,  500),
  ('advanced', 'voice_agent_outbound',       true,  500),
  ('advanced', 'voice_appointment_reminder', true,  100),
  ('advanced', 'kb_read',                    true,  NULL),
  ('advanced', 'kb_write',                   true,  NULL),
  ('advanced', 'leads_manage',               true,  NULL),
  ('advanced', 'leads_kanban',               true,  NULL),
  ('advanced', 'leads_import_csv',           true,  NULL),
  ('advanced', 'proposals_manage',           true,  NULL),
  ('advanced', 'proposals_payments',         true,  NULL),
  ('advanced', 'calendar_manage',            true,  NULL),
  ('advanced', 'followup_sequences',         true,  NULL),
  ('advanced', 'followup_manual',            true,  NULL),
  ('advanced', 'instagram_dm',               true,  NULL),
  ('advanced', 'analytics_basic',            true,  NULL),
  ('advanced', 'analytics_advanced',         true,  NULL),
  ('advanced', 'analytics_export',           true,  NULL),
  ('advanced', 'outbound_webhooks',          true,  NULL),
  ('advanced', 'dentsoft_integration',       true,  NULL),
  ('advanced', 'support_tickets',            true,  NULL),
  ('advanced', 'multi_team',                 true,  10)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

-- AGENCY ($499/mo) — Ajanslar / çoklu lokasyon
INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
  ('agency', 'whatsapp_inbound',           true,  NULL),
  ('agency', 'whatsapp_outbound',          true,  NULL),
  ('agency', 'whatsapp_templates',         true,  NULL),
  ('agency', 'unified_inbox',              true,  NULL),
  ('agency', 'voice_agent_inbound',        true,  NULL),
  ('agency', 'voice_agent_outbound',       true,  NULL),
  ('agency', 'voice_appointment_reminder', true,  NULL),
  ('agency', 'kb_read',                    true,  NULL),
  ('agency', 'kb_write',                   true,  NULL),
  ('agency', 'leads_manage',               true,  NULL),
  ('agency', 'leads_kanban',               true,  NULL),
  ('agency', 'leads_import_csv',           true,  NULL),
  ('agency', 'proposals_manage',           true,  NULL),
  ('agency', 'proposals_payments',         true,  NULL),
  ('agency', 'calendar_manage',            true,  NULL),
  ('agency', 'followup_sequences',         true,  NULL),
  ('agency', 'followup_manual',            true,  NULL),
  ('agency', 'instagram_dm',               true,  NULL),
  ('agency', 'analytics_basic',            true,  NULL),
  ('agency', 'analytics_advanced',         true,  NULL),
  ('agency', 'analytics_export',           true,  NULL),
  ('agency', 'outbound_webhooks',          true,  NULL),
  ('agency', 'dentsoft_integration',       true,  NULL),
  ('agency', 'support_tickets',            true,  NULL),
  ('agency', 'multi_team',                 true,  NULL)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled, limit_value = EXCLUDED.limit_value;

-- ═══════════════════════════════════════════════════════════════
-- DOWN (Rollback):
-- DELETE FROM plan_entitlements WHERE plan_id IN ('legacy','lite','plus','advanced','agency');
-- DELETE FROM features;
-- DELETE FROM plans WHERE id IN ('lite','plus','advanced','agency');
-- ═══════════════════════════════════════════════════════════════
