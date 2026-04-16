-- ============================================================================
-- Migration: Billing Foundation Tables
-- Created: 2026-04-13
-- Description:
--   Creates comprehensive billing infrastructure for multi-tenant platform.
--   Includes: plans, features, entitlements, subscriptions, usage tracking,
--   and Stripe integration foundation. Organizations marked 'legacy' by default.
-- ============================================================================

-- 1. Add plan_id to organizations table (legacy default)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_id text DEFAULT 'legacy';

-- 2. Features registry (module → metric mapping)
CREATE TABLE IF NOT EXISTS features (
  key          text PRIMARY KEY,
  module       text NOT NULL,
  name         text NOT NULL,
  description  text,
  usage_metric text,
  is_boolean   boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "features_public_read" ON features FOR SELECT USING (true);
CREATE POLICY "features_service_write" ON features USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Pricing plans (monthly/annual, Stripe integration)
CREATE TABLE IF NOT EXISTS plans (
  id                      text PRIMARY KEY,
  name                    text NOT NULL,
  stripe_product_id       text,
  stripe_price_monthly    text,
  stripe_price_annual     text,
  price_monthly           numeric(10,2),
  price_annual            numeric(10,2),
  currency                text DEFAULT 'USD',
  voice_overage_rate      numeric(10,4),
  whatsapp_overage_rate   numeric(10,4),
  max_team_members        int,
  trial_days              int DEFAULT 0,
  sort_order              int DEFAULT 0,
  is_active               boolean DEFAULT true,
  created_at              timestamptz DEFAULT now()
);
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON plans FOR SELECT USING (true);
CREATE POLICY "plans_service_write" ON plans USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Plan feature entitlements (which features per plan + limits)
CREATE TABLE IF NOT EXISTS plan_entitlements (
  plan_id       text REFERENCES plans(id) ON DELETE CASCADE,
  feature_key   text REFERENCES features(key) ON DELETE CASCADE,
  enabled       boolean DEFAULT false,
  limit_value   int,
  config        jsonb,
  PRIMARY KEY (plan_id, feature_key)
);
ALTER TABLE plan_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_entitlements_public_read" ON plan_entitlements FOR SELECT USING (true);
CREATE POLICY "plan_entitlements_service_write" ON plan_entitlements USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Organization subscriptions (Stripe + billing state)
CREATE TABLE IF NOT EXISTS org_subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  plan_id                 text REFERENCES plans(id),
  status                  text DEFAULT 'active',
  -- status: active | trialing | past_due | grace_period | canceled | suspended | legacy
  stripe_customer_id      text UNIQUE,
  stripe_subscription_id  text UNIQUE,
  billing_interval        text DEFAULT 'monthly',
  trial_ends_at           timestamptz,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean DEFAULT false,
  canceled_at             timestamptz,
  grace_period_ends_at    timestamptz,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_subscriptions_own_org" ON org_subscriptions FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM org_users WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );
CREATE POLICY "org_subscriptions_service_write" ON org_subscriptions USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Per-organization feature overrides (enable/disable/extend limits)
CREATE TABLE IF NOT EXISTS org_entitlement_overrides (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key       text REFERENCES features(key) ON DELETE CASCADE,
  enabled           boolean NOT NULL,
  limit_override    int,
  reason            text,
  -- reason: 'user_disabled' | 'user_enabled' | 'admin_grant' | 'admin_revoke' | 'addon_purchase' | 'promo'
  expires_at        timestamptz,
  created_by        uuid,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (organization_id, feature_key)
);
ALTER TABLE org_entitlement_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_entitlement_overrides_own_org" ON org_entitlement_overrides FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM org_users WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );
CREATE POLICY "org_entitlement_overrides_service_write" ON org_entitlement_overrides USING (auth.jwt() ->> 'role' = 'service_role');

-- 7. Usage tracking (monthly periods per org per metric)
CREATE TABLE IF NOT EXISTS usage_counters (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organizations(id) ON DELETE CASCADE,
  billing_period    text NOT NULL,   -- format: '2026-04' (YYYY-MM)
  metric            text NOT NULL,
  used_value        int DEFAULT 0,
  stripe_reported   boolean DEFAULT false,
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (organization_id, billing_period, metric)
);
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_counters_own_org" ON usage_counters FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM org_users WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );
CREATE POLICY "usage_counters_service_write" ON usage_counters USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. Billing events (Stripe webhook log)
CREATE TABLE IF NOT EXISTS billing_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id   text UNIQUE NOT NULL,
  event_type        text NOT NULL,
  organization_id   uuid REFERENCES organizations(id) ON DELETE SET NULL,
  payload           jsonb,
  processed_at      timestamptz DEFAULT now()
);
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_events_service_only" ON billing_events USING (auth.jwt() ->> 'role' = 'service_role');

-- 9. RPC: increment_usage (idempotent)
CREATE OR REPLACE FUNCTION increment_usage(
  p_org_id uuid, p_period text, p_metric text, p_amount int DEFAULT 1
) RETURNS void AS $$
  INSERT INTO usage_counters (organization_id, billing_period, metric, used_value)
  VALUES (p_org_id, p_period, p_metric, p_amount)
  ON CONFLICT (organization_id, billing_period, metric)
  DO UPDATE SET used_value = usage_counters.used_value + p_amount, updated_at = now();
$$ LANGUAGE sql SECURITY DEFINER;

-- 10. RPC: decrement_usage (clamps to 0)
CREATE OR REPLACE FUNCTION decrement_usage(
  p_org_id uuid, p_period text, p_metric text, p_amount int DEFAULT 1
) RETURNS void AS $$
  UPDATE usage_counters
  SET used_value = GREATEST(0, used_value - p_amount), updated_at = now()
  WHERE organization_id = p_org_id AND billing_period = p_period AND metric = p_metric;
$$ LANGUAGE sql SECURITY DEFINER;

-- 11. Seed: Legacy plan (default for all existing orgs)
INSERT INTO plans (id, name, sort_order, is_active, trial_days)
VALUES ('legacy', 'Legacy', 0, false, 0)
ON CONFLICT (id) DO NOTHING;

-- 12. Seed: Migrate existing organizations to legacy subscription
INSERT INTO org_subscriptions (organization_id, plan_id, status)
SELECT id, 'legacy', 'legacy'
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM org_subscriptions WHERE organization_id IS NOT NULL)
ON CONFLICT (organization_id) DO NOTHING;

UPDATE organizations SET plan_id = 'legacy' WHERE plan_id IS NULL;

-- ============================================================================
-- DOWN (rollback):
-- ============================================================================
-- DROP TABLE IF EXISTS billing_events CASCADE;
-- DROP TABLE IF EXISTS usage_counters CASCADE;
-- DROP TABLE IF EXISTS org_entitlement_overrides CASCADE;
-- DROP TABLE IF EXISTS org_subscriptions CASCADE;
-- DROP TABLE IF EXISTS plan_entitlements CASCADE;
-- DROP TABLE IF EXISTS plans CASCADE;
-- DROP TABLE IF EXISTS features CASCADE;
-- DROP FUNCTION IF EXISTS increment_usage(uuid, text, text, int);
-- DROP FUNCTION IF EXISTS decrement_usage(uuid, text, text, int);
-- ALTER TABLE organizations DROP COLUMN IF EXISTS plan_id;
