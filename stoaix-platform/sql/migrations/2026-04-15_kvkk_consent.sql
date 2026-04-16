-- Migration: KVKK Consent & Data Subject Requests
-- Date: 2026-04-15
-- Supabase SQL Editor'dan çalıştır

-- ─── consent_records ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL, -- 'privacy_policy' | 'data_processing' | 'marketing'
  version      text NOT NULL DEFAULT '2026-04-15',
  accepted_at  timestamptz NOT NULL DEFAULT now(),
  ip_address   text,
  user_agent   text
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_org_id  ON consent_records(org_id);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Users can read/insert their own consent records
CREATE POLICY "users own consent records"
  ON consent_records
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admins can see all
CREATE POLICY "super admins see all consent records"
  ON consent_records FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM super_admin_users WHERE user_id = auth.uid())
  );

-- ─── data_subject_requests ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email        text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('deletion', 'export', 'rectification')),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  notes        text,
  created_at   timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_dsr_org_id ON data_subject_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON data_subject_requests(status);

ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own requests
CREATE POLICY "users manage own dsr"
  ON data_subject_requests
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admins can see all
CREATE POLICY "super admins see all dsr"
  ON data_subject_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM super_admin_users WHERE user_id = auth.uid())
  );

-- Super admins can update status
CREATE POLICY "super admins update dsr"
  ON data_subject_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM super_admin_users WHERE user_id = auth.uid())
  );
