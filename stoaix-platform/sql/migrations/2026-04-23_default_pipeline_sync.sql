-- ============================================================
-- Lead Status ↔ Default Pipeline Stage Auto-Sync
-- 2026-04-23
--
-- leads.status = tek kaynak (source of truth)
-- Default pipeline otomatik yansıma. Custom pipeline'lar manual.
-- ============================================================

-- ── A) "Takipte" (nurturing) stage ekle ─────────────────────────────────────

-- A1: Mevcut default pipeline stage position'larını kaydır
-- qualified: 3→4, converted: 4→5, lost: 5→6
UPDATE public.pipeline_stages ps
SET position = ps.position + 1
FROM public.pipelines p
WHERE ps.pipeline_id = p.id
  AND p.is_default = true
  AND ps.maps_to_status IN ('qualified', 'converted', 'lost');

-- A2: Nurturing stage ekle (position 3)
INSERT INTO public.pipeline_stages (pipeline_id, name, color, position, maps_to_status, is_system)
SELECT p.id, 'Takipte', '#8b5cf6', 3, 'nurturing', true
FROM public.pipelines p
WHERE p.is_default = true
  AND NOT EXISTS (
    SELECT 1 FROM public.pipeline_stages ps2
    WHERE ps2.pipeline_id = p.id AND ps2.maps_to_status = 'nurturing'
  );

-- A3: fn_create_default_pipeline güncelle (yeni org'lar 7 stage ile oluşsun)
CREATE OR REPLACE FUNCTION public.fn_create_default_pipeline()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE pid uuid;
BEGIN
  INSERT INTO public.pipelines (organization_id, name, is_default, color, position)
  VALUES (NEW.id, 'Lead Lifecycle', true, '#6366f1', 0)
  RETURNING id INTO pid;

  INSERT INTO public.pipeline_stages
    (pipeline_id, name, color, position, maps_to_status, is_system)
  VALUES
    (pid, 'Yeni',           '#94a3b8', 0, 'new',         true),
    (pid, 'Aktif',          '#3b82f6', 1, 'in_progress', true),
    (pid, 'Temsilci Talep', '#f59e0b', 2, 'handed_off',  true),
    (pid, 'Takipte',        '#8b5cf6', 3, 'nurturing',   true),
    (pid, 'Randevu',        '#22c55e', 4, 'qualified',   true),
    (pid, 'Dönüştü',        '#10b981', 5, 'converted',   true),
    (pid, 'Kaybedildi',     '#ef4444', 6, 'lost',        true);

  RETURN NEW;
END;
$$;

-- ── B) Trigger: leads.status → default pipeline stage ───────────────────────

CREATE OR REPLACE FUNCTION public.fn_sync_lead_to_default_pipeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pipeline_id uuid;
  v_stage_id    uuid;
BEGIN
  -- Sadece status değiştiyse (INSERT veya UPDATE)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN

    -- Default pipeline bul
    SELECT p.id INTO v_pipeline_id
    FROM public.pipelines p
    WHERE p.organization_id = NEW.organization_id
      AND p.is_default = true
    LIMIT 1;

    IF v_pipeline_id IS NULL THEN
      RETURN NEW;  -- pipeline yoksa skip
    END IF;

    -- Eşleşen stage bul
    SELECT ps.id INTO v_stage_id
    FROM public.pipeline_stages ps
    WHERE ps.pipeline_id = v_pipeline_id
      AND ps.maps_to_status = NEW.status
    LIMIT 1;

    IF v_stage_id IS NULL THEN
      RETURN NEW;  -- eşleşen stage yoksa graceful skip
    END IF;

    -- UPSERT: lead_pipeline_stages
    INSERT INTO public.lead_pipeline_stages (lead_id, pipeline_id, stage_id, moved_at, moved_by)
    VALUES (NEW.id, v_pipeline_id, v_stage_id, now(), NULL)
    ON CONFLICT (lead_id, pipeline_id)
    DO UPDATE SET
      stage_id = EXCLUDED.stage_id,
      moved_at = EXCLUDED.moved_at,
      moved_by = NULL;  -- sistem taşıması

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_lead_default_pipeline ON public.leads;
CREATE TRIGGER trg_sync_lead_default_pipeline
  AFTER INSERT OR UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_lead_to_default_pipeline();

-- ── C) Backfill: mevcut lead'leri default pipeline stage'lerine yerleştir ───

INSERT INTO public.lead_pipeline_stages (lead_id, pipeline_id, stage_id, moved_at, moved_by)
SELECT
  l.id,
  p.id,
  ps.id,
  COALESCE(l.updated_at, l.created_at, now()),
  NULL
FROM public.leads l
JOIN public.pipelines p
  ON p.organization_id = l.organization_id
  AND p.is_default = true
JOIN public.pipeline_stages ps
  ON ps.pipeline_id = p.id
  AND ps.maps_to_status = l.status
ON CONFLICT (lead_id, pipeline_id) DO NOTHING;

-- ── Verification query (run after migration) ────────────────────────────────
-- SELECT
--   'orphaned_leads' AS check,
--   COUNT(*) AS count
-- FROM public.leads l
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.lead_pipeline_stages lps
--   JOIN public.pipelines p ON p.id = lps.pipeline_id AND p.is_default = true
--   WHERE lps.lead_id = l.id
-- );
