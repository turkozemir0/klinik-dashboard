-- Demo Account System: schema changes
-- 2026-04-23

-- 1. Add is_demo flag to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- 2. Demo visits tracking (partner analytics)
CREATE TABLE IF NOT EXISTS demo_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text,
  ip_hash text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 3. Demo usage rate limiting (per partner per day)
CREATE TABLE IF NOT EXISTS demo_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL,
  metric text NOT NULL,        -- 'voice_minutes' | 'chatbot_messages'
  value numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(ref_code, metric, date)
);

-- RLS
ALTER TABLE demo_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_usage ENABLE ROW LEVEL SECURITY;

-- Admin can read demo_visits
CREATE POLICY "admin_read_demo_visits" ON demo_visits
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM super_admin_users WHERE user_id = auth.uid()));

-- Admin can read demo_usage
CREATE POLICY "admin_read_demo_usage" ON demo_usage
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM super_admin_users WHERE user_id = auth.uid()));

-- Service role handles inserts/updates (via API routes with service client)
-- No insert/update policies needed for anon — service role bypasses RLS
