-- =============================================================================
-- Secret Rotation — Workflow trigger fonksiyonlarını yeni secret ile güncelle
-- Eski secret GitHub'a sızmıştı, rotate edildi.
-- =============================================================================
-- Bu dosyayı Supabase SQL Editor'dan çalıştır.
-- NOT: Yeni secret'ı bu dosyaya YAZMA, Supabase SQL Editor'a yapıştırırken
--      <NEW_SECRET> yerine Vercel'deki WORKFLOW_INTERNAL_SECRET değerini koy.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_notify_workflow_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.collected_data->>'_bulk_import') = 'true' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := 'https://platform.stoaix.com/api/workflows/process-trigger',
    body    := json_build_object(
      'event',  'lead_created',
      'org_id', NEW.organization_id,
      'ref_id', NEW.id,
      'data',   row_to_json(NEW)
    )::text,
    headers := '{"Content-Type":"application/json","x-internal-secret":"<NEW_SECRET>"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

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
    headers := '{"Content-Type":"application/json","x-internal-secret":"<NEW_SECRET>"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

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
    headers := '{"Content-Type":"application/json","x-internal-secret":"<NEW_SECRET>"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
