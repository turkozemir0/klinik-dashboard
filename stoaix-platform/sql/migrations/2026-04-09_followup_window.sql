-- ─────────────────────────────────────────────────────────────────────────────
-- Follow-up task: window_expires_at + template_name columns
-- window_expires_at: task is only sent if NOW() < window_expires_at
--   (prevents re_contact messages after 24h inactivity window closes)
-- template_name: WhatsApp template to use (required for 360dialog template send)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.follow_up_tasks
  ADD COLUMN IF NOT EXISTS window_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS template_name TEXT;

-- Index for n8n poll: find pending re_contact tasks within their window
CREATE INDEX IF NOT EXISTS idx_tasks_recontact_window
  ON public.follow_up_tasks (organization_id, scheduled_at, window_expires_at)
  WHERE status = 'pending' AND sequence_stage LIKE 're_contact_%';

-- Unique constraint for upsert: one pending re_contact stage per contact per org
-- Allows chat-engine to use upsert with ignoreDuplicates safely
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_contact_stage_unique
  ON public.follow_up_tasks (organization_id, contact_id, sequence_stage)
  WHERE status = 'pending';

-- ─────────────────────────────────────────────────────────────────────────────
-- agent_playbooks: handoff_bridge_message column
-- Custom message sent to the customer when AI hands off to a human agent.
-- Falls back to a hardcoded default in chat-engine.ts if NULL.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.agent_playbooks
  ADD COLUMN IF NOT EXISTS handoff_bridge_message TEXT;
