-- Index optimizations for high-frequency queries
-- Safe to run: CREATE INDEX IF NOT EXISTS — idempotent, no downtime risk

-- 1. workflow_runs: status + created_at filtering (dashboard workflows page)
-- Existing idx_workflow_runs_org(organization_id, created_at DESC) lacks status
CREATE INDEX IF NOT EXISTS idx_workflow_runs_org_status
  ON public.workflow_runs(organization_id, status, created_at DESC);

-- 2. messages: conversation + role + ordering (inbox last message fetch)
-- Existing idx_messages_conv(conversation_id) lacks role and created_at
CREATE INDEX IF NOT EXISTS idx_messages_conv_role_created
  ON public.messages(conversation_id, role, created_at DESC);

-- 3. conversations: started_at DESC ordering (inbox cursor pagination)
-- Existing idx_convs_org(organization_id) lacks started_at
CREATE INDEX IF NOT EXISTS idx_convs_org_started
  ON public.conversations(organization_id, started_at DESC);
