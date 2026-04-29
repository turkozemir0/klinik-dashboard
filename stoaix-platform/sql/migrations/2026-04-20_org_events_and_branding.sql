BEGIN;

-- org_events: flat behavior logging
CREATE TABLE IF NOT EXISTS public.org_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type  text        NOT NULL,
  metadata    jsonb       DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_org_events_org_type ON org_events(org_id, event_type);
CREATE INDEX idx_org_events_org_date ON org_events(org_id, created_at DESC);

ALTER TABLE org_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_events_read_own" ON org_events
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM org_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "org_events_service_write" ON org_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMIT;
