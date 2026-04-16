-- ─────────────────────────────────────────────────────────────────────────────
-- Appointment Reminder Tasks
-- sequence_stage CHECK constraint'ine appointment_reminder aşamaları eklenir.
-- variables JSONB sütununa appointment_time saklanır.
-- ─────────────────────────────────────────────────────────────────────────────

-- Mevcut CHECK constraint'i güncelle
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
    'appointment_reminder_2h'
  ));

-- variables sütunu zaten var (01_schema.sql'de tanımlanmış)
-- appointment_reminder task'leri variables JSONB'e appointment_time kaydeder:
-- { "appointment_time": "2026-04-15T10:00:00", ... }

-- Index: voice reminder task'leri için n8n sorgusunu hızlandır
CREATE INDEX IF NOT EXISTS idx_tasks_appt_reminder
  ON public.follow_up_tasks (organization_id, scheduled_at, status)
  WHERE task_type = 'appointment_reminder' AND channel = 'voice';
