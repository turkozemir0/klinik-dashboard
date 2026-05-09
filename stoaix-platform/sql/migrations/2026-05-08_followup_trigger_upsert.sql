-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: fn_create_first_followup duplicate key hatasını önle
-- Aynı contact için zaten pending first_reminder varsa sessizce atla.
-- idx_tasks_contact_stage_unique constraint'i ile uyumlu hale getir.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_create_first_followup()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.follow_up_tasks (
    organization_id,
    lead_id,
    contact_id,
    task_type,
    sequence_stage,
    channel,
    scheduled_at,
    status
  ) VALUES (
    NEW.organization_id,
    NEW.id,
    NEW.contact_id,
    'whatsapp_followup',
    'first_reminder',
    CASE NEW.source_channel
      WHEN 'instagram' THEN 'instagram'
      ELSE 'whatsapp'
    END,
    NOW() + INTERVAL '24 hours',
    'pending'
  )
  ON CONFLICT (organization_id, contact_id, sequence_stage)
    WHERE status = 'pending'
  DO NOTHING;

  RETURN NEW;
END;
$$;
