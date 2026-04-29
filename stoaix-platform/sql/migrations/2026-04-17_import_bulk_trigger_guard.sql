-- =============================================================================
-- Import Bulk Trigger Guard
-- CSV import ile eklenen lead'lere otomatik workflow tetiklenmesin.
-- collected_data->>'_bulk_import' = 'true' ise trigger atlanır.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_notify_workflow_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Bulk import'tan gelen lead'lere workflow tetikleme
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
    headers := '{"Content-Type":"application/json","x-internal-secret":"<VERCEL_ENV_VAR>"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
