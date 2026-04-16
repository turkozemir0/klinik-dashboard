-- Migration: System Alerts (n8n / infrastructure health)
-- Date: 2026-04-15
-- Supabase SQL Editor'dan çalıştır

CREATE TABLE IF NOT EXISTS system_alerts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service    text NOT NULL CHECK (service IN ('n8n', 'supabase', 'livekit', 'stripe')),
  status     text NOT NULL CHECK (status IN ('ok', 'degraded', 'down')),
  latency_ms int,
  message    text,
  created_at timestamptz DEFAULT now()
);

-- Keep only last 1000 alerts (purge old ones periodically)
CREATE INDEX IF NOT EXISTS idx_system_alerts_service_created ON system_alerts(service, created_at DESC);

ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Only super admins can see alerts
CREATE POLICY "super admins read system alerts"
  ON system_alerts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM super_admin_users WHERE user_id = auth.uid())
  );

-- Service role (API) can insert
CREATE POLICY "service role insert system alerts"
  ON system_alerts FOR INSERT
  WITH CHECK (true);
