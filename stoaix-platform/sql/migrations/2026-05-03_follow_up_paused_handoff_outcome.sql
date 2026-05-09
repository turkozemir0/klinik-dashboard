-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 2: follow_up_tasks.is_paused → satışçı takibi durdurabilsin
-- Phase 3: handoff_logs.handoff_outcome + outcome_notes → handoff sonucu takip
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. follow_up_tasks: is_paused ────────────────────────────────────────────

ALTER TABLE public.follow_up_tasks
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT false;

-- Partial index: n8n chatbot_followup sorgusu için (is_paused=false olan pending'ler)
CREATE INDEX IF NOT EXISTS idx_tasks_pending_not_paused
  ON public.follow_up_tasks (organization_id, scheduled_at)
  WHERE status = 'pending' AND is_paused = false;

-- ── 2. handoff_logs: handoff_outcome + outcome_notes ─────────────────────────

ALTER TABLE public.handoff_logs
  ADD COLUMN IF NOT EXISTS handoff_outcome TEXT
    CHECK (handoff_outcome IN ('converted', 'no_answer', 'lost', 'in_progress')),
  ADD COLUMN IF NOT EXISTS outcome_notes   TEXT,
  ADD COLUMN IF NOT EXISTS outcome_at      TIMESTAMPTZ;

-- ── 3. RLS: is_paused sütunu org_user'lar tarafından yazılabilsin ─────────────
-- Mevcut org_user CRUD politikası follow_up_tasks üzerinde zaten UPDATE kapsıyor,
-- is_paused de aynı politikadan faydalanır — ek politika gerekmez.
