-- =============================================================================
-- Workflow Trigger Fix — Hardcode URL + Secret
-- Supabase Cloud'da ALTER DATABASE SET izni yok; direkt hardcode ediyoruz.
-- =============================================================================

-- ADIM 1: Bu dosyayı çalıştırmadan önce aşağıdaki sabit değerleri belirle:
--   _DASHBOARD_URL : https://platform.stoaix.com
--   _INTERNAL_SECRET : Kw9XpdxedhX1VoijU7JA
--   Aynı secret değerini Vercel'e WORKFLOW_INTERNAL_SECRET olarak ekle.

-- ── fn_notify_workflow_lead ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_notify_workflow_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://platform.stoaix.com/api/workflows/process-trigger',
    body    := json_build_object(
      'event',  'lead_created',
      'org_id', NEW.organization_id,
      'ref_id', NEW.id,
      'data',   row_to_json(NEW)
    )::text,
    headers := '{"Content-Type":"application/json","x-internal-secret":"REPLACE_WITH_YOUR_SECRET"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- ── fn_notify_workflow_appointment ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_notify_workflow_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://platform.stoaix.com/api/workflows/process-trigger',
    body    := json_build_object(
      'event',  'appointment_created',
      'org_id', NEW.organization_id,
      'ref_id', NEW.id,
      'data',   row_to_json(NEW)
    )::text,
    headers := '{"Content-Type":"application/json","x-internal-secret":"REPLACE_WITH_YOUR_SECRET"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- ── fn_notify_workflow_appointment_status ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_notify_workflow_appointment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _event_name text;
BEGIN
  IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
    _event_name := 'appointment_noshow';
  ELSIF NEW.status = 'attended' AND OLD.status != 'attended' THEN
    _event_name := 'post_appointment';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := 'https://platform.stoaix.com/api/workflows/process-trigger',
    body    := json_build_object(
      'event',  _event_name,
      'org_id', NEW.organization_id,
      'ref_id', NEW.id,
      'data',   row_to_json(NEW)
    )::text,
    headers := '{"Content-Type":"application/json","x-internal-secret":"REPLACE_WITH_YOUR_SECRET"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
