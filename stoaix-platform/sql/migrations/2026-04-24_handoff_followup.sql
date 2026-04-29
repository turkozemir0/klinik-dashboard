-- ─────────────────────────────────────────────────────────────────────────────
-- Handoff Follow-Up Mechanism
-- 1. leads.handoff_at — handoff zamanını kaydeder
-- 2. sequence_stage CHECK'e handoff_check_4h / handoff_check_24h ekler
-- 3. fn_cancel_handoff_tasks — lead status değişince pending handoff taskları iptal
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. handoff_at sütunu
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS handoff_at timestamptz;

-- 2. sequence_stage CHECK constraint güncelle
ALTER TABLE public.follow_up_tasks
  DROP CONSTRAINT IF EXISTS follow_up_tasks_sequence_stage_check;

ALTER TABLE public.follow_up_tasks
  ADD CONSTRAINT follow_up_tasks_sequence_stage_check
  CHECK (sequence_stage IN (
    -- Organik follow-up (inbound lead'ler)
    'first_reminder',
    'warm_day4',
    'warm_day11',
    'warm_to_cold',
    'cold_month1',
    'cold_month2',
    'cold_final',
    -- Re-engagement (CRM import)
    're_contact_1',
    're_contact_2',
    're_contact_3',
    -- Randevu hatırlatma (voice outbound)
    'appointment_reminder_24h',
    'appointment_reminder_2h',
    -- Handoff follow-up
    'handoff_check_4h',
    'handoff_check_24h'
  ));

-- 3. Trigger: handoff geçişlerinde ilgili follow-up taskları iptal et
CREATE OR REPLACE FUNCTION fn_cancel_handoff_tasks()
RETURNS trigger AS $$
BEGIN
  -- Lead handed_off'A geçince → tüm pending organik follow-up taskları iptal
  IF NEW.status = 'handed_off' AND OLD.status <> 'handed_off' THEN
    UPDATE follow_up_tasks
       SET status = 'cancelled'
     WHERE lead_id = NEW.id
       AND status = 'pending'
       AND task_type <> 'handoff_reminder';
  END IF;

  -- Lead handed_off'TAN çıkınca → handoff reminder taskları iptal
  IF OLD.status = 'handed_off' AND NEW.status <> 'handed_off' THEN
    UPDATE follow_up_tasks
       SET status = 'cancelled'
     WHERE lead_id = NEW.id
       AND task_type = 'handoff_reminder'
       AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cancel_handoff_tasks ON public.leads;
CREATE TRIGGER trg_cancel_handoff_tasks
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION fn_cancel_handoff_tasks();

-- Index: handoff reminder task sorguları için
CREATE INDEX IF NOT EXISTS idx_tasks_handoff_reminder
  ON public.follow_up_tasks (scheduled_at, status)
  WHERE task_type = 'handoff_reminder' AND status = 'pending';
