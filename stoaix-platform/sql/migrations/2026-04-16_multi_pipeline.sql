-- ============================================================
-- Multi-Pipeline CRM
-- 2026-04-16
-- ============================================================

-- ── 1. Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pipelines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  is_default      boolean NOT NULL DEFAULT false,
  color           text NOT NULL DEFAULT '#6366f1',
  position        integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pipelines_org_default
  ON public.pipelines(organization_id) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_pipelines_org
  ON public.pipelines(organization_id, position);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id    uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name           text NOT NULL,
  color          text NOT NULL DEFAULT '#6b7280',
  position       integer NOT NULL DEFAULT 0,
  maps_to_status text,          -- only for default pipeline: 'new'|'in_progress'|...
  is_system      boolean NOT NULL DEFAULT false,  -- system stages cannot be deleted
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pstages_pipeline
  ON public.pipeline_stages(pipeline_id, position);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lead_pipeline_stages (
  lead_id     uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  stage_id    uuid NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  moved_at    timestamptz DEFAULT now(),
  moved_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (lead_id, pipeline_id)
);

CREATE INDEX IF NOT EXISTS idx_lps_pipeline
  ON public.lead_pipeline_stages(pipeline_id, stage_id);

CREATE INDEX IF NOT EXISTS idx_lps_lead
  ON public.lead_pipeline_stages(lead_id);

-- ── 2. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.pipelines            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- pipelines
CREATE POLICY "pipelines_select" ON public.pipelines
  FOR SELECT USING (is_super_admin() OR has_org_access(organization_id));

CREATE POLICY "pipelines_insert" ON public.pipelines
  FOR INSERT WITH CHECK (is_super_admin() OR get_org_role(organization_id) = 'admin');

CREATE POLICY "pipelines_update" ON public.pipelines
  FOR UPDATE USING (is_super_admin() OR get_org_role(organization_id) = 'admin');

CREATE POLICY "pipelines_delete" ON public.pipelines
  FOR DELETE USING (
    is_super_admin() OR
    (get_org_role(organization_id) = 'admin' AND is_default = false)
  );

-- pipeline_stages
CREATE POLICY "pstages_select" ON public.pipeline_stages
  FOR SELECT USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_id AND has_org_access(p.organization_id)
    )
  );

CREATE POLICY "pstages_insert" ON public.pipeline_stages
  FOR INSERT WITH CHECK (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_id AND get_org_role(p.organization_id) = 'admin'
    )
  );

CREATE POLICY "pstages_update" ON public.pipeline_stages
  FOR UPDATE USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_id AND get_org_role(p.organization_id) = 'admin'
    )
  );

CREATE POLICY "pstages_delete" ON public.pipeline_stages
  FOR DELETE USING (
    is_super_admin() OR
    (
      is_system = false AND
      EXISTS (
        SELECT 1 FROM public.pipelines p
        WHERE p.id = pipeline_id AND get_org_role(p.organization_id) = 'admin'
      )
    )
  );

-- lead_pipeline_stages
CREATE POLICY "lps_all" ON public.lead_pipeline_stages
  FOR ALL USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_id AND has_org_access(p.organization_id)
    )
  );

-- ── 3. Billing ────────────────────────────────────────────────────────────────

INSERT INTO features (key, module, name, usage_metric, is_boolean)
VALUES ('multi_pipeline', 'leads', 'Çoklu Pipeline', NULL, true)
ON CONFLICT (key) DO UPDATE
  SET module = EXCLUDED.module,
      name   = EXCLUDED.name;

INSERT INTO plan_entitlements (plan_id, feature_key, enabled, limit_value)
VALUES
  ('legacy',   'multi_pipeline', true,  NULL),
  ('lite',     'multi_pipeline', false, NULL),
  ('plus',     'multi_pipeline', true,  3),
  ('advanced', 'multi_pipeline', true,  NULL),
  ('agency',   'multi_pipeline', true,  NULL)
ON CONFLICT (plan_id, feature_key) DO UPDATE
  SET enabled     = EXCLUDED.enabled,
      limit_value = EXCLUDED.limit_value;

-- ── 4. Seed existing orgs ─────────────────────────────────────────────────────

INSERT INTO public.pipelines (organization_id, name, is_default, color, position)
SELECT id, 'Lead Lifecycle', true, '#6366f1', 0
FROM public.organizations
WHERE id NOT IN (
  SELECT organization_id FROM public.pipelines WHERE is_default = true
);

INSERT INTO public.pipeline_stages (pipeline_id, name, color, position, maps_to_status, is_system)
SELECT p.id, s.name, s.color, s.position, s.maps_to_status, true
FROM public.pipelines p
CROSS JOIN (VALUES
  ('Yeni',           '#94a3b8', 0, 'new'),
  ('Aktif',          '#3b82f6', 1, 'in_progress'),
  ('Temsilci Talep', '#f59e0b', 2, 'handed_off'),
  ('Randevu',        '#22c55e', 3, 'qualified'),
  ('Dönüştü',        '#10b981', 4, 'converted'),
  ('Kaybedildi',     '#ef4444', 5, 'lost')
) AS s(name, color, position, maps_to_status)
WHERE p.is_default = true
  AND p.id NOT IN (
    SELECT pipeline_id FROM public.pipeline_stages WHERE is_system = true
  );

-- ── 5. Trigger for new orgs ───────────────────────────────────────────────────

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
    (pid, 'Randevu',        '#22c55e', 3, 'qualified',   true),
    (pid, 'Dönüştü',        '#10b981', 4, 'converted',   true),
    (pid, 'Kaybedildi',     '#ef4444', 5, 'lost',        true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_default_pipeline ON public.organizations;
CREATE TRIGGER trg_org_default_pipeline
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_default_pipeline();

-- ── 6. Verification query (run after migration) ───────────────────────────────
-- SELECT p.name, COUNT(ps.id) as stage_count
-- FROM pipelines p
-- JOIN pipeline_stages ps ON ps.pipeline_id = p.id
-- GROUP BY p.name;
