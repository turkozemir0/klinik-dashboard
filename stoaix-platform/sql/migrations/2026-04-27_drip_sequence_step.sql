-- Multi-step drip sequence tracking
-- Adds sequence_step to workflow_runs for multi-step outreach sequences

ALTER TABLE workflow_runs
  ADD COLUMN IF NOT EXISTS sequence_step integer DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_workflow_runs_sequence
  ON workflow_runs (org_workflow_id, contact_id, sequence_step, status);
