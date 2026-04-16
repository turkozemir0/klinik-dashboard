-- ═══════════════════════════════════════════════════════════════
-- Faz 1E — CSV Import Jobs
-- import_jobs: CSV import iş takibi
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','completed','failed')),
  total_rows      integer     DEFAULT 0,
  processed_rows  integer     DEFAULT 0,
  inserted_count  integer     DEFAULT 0,
  duplicate_count integer     DEFAULT 0,
  error_count     integer     DEFAULT 0,
  error_details   jsonb       DEFAULT '[]',
  source_filename text,
  created_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_select" ON public.import_jobs FOR SELECT
  USING (is_super_admin() OR has_org_access(organization_id));

CREATE POLICY "import_insert" ON public.import_jobs FOR INSERT
  WITH CHECK (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "import_update" ON public.import_jobs FOR UPDATE
  USING (is_super_admin() OR has_org_access(organization_id));
