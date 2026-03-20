-- ═══════════════════════════════════════════════════════════════
-- stoaix Platform — Row Level Security
-- 01_schema.sql'den sonra çalıştır
-- ═══════════════════════════════════════════════════════════════

-- ─── Helper Functions ─────────────────────────────────────────

-- Kullanıcının super admin olup olmadığı
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admin_users
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanıcının belirli bir org'a erişimi var mı
CREATE OR REPLACE FUNCTION public.has_org_access(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_users
    WHERE user_id = auth.uid()
    AND organization_id = org_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanıcının org'daki rolü
CREATE OR REPLACE FUNCTION public.get_org_role(org_id uuid)
RETURNS text AS $$
  SELECT role FROM public.org_users
  WHERE user_id = auth.uid()
  AND organization_id = org_id
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── RLS Aktif ────────────────────────────────────────────────
ALTER TABLE public.organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_calls       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_schemas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_playbooks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoff_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs     ENABLE ROW LEVEL SECURITY;

-- ─── ORGANIZATIONS ────────────────────────────────────────────
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (
    is_super_admin() OR has_org_access(id)
  );

CREATE POLICY "org_insert" ON public.organizations
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE USING (
    is_super_admin() OR get_org_role(id) = 'admin'
  );

-- ─── ORG_USERS ────────────────────────────────────────────────
CREATE POLICY "org_users_select" ON public.org_users
  FOR SELECT USING (
    is_super_admin() OR user_id = auth.uid() OR has_org_access(organization_id)
  );

CREATE POLICY "org_users_insert" ON public.org_users
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "org_users_delete" ON public.org_users
  FOR DELETE USING (is_super_admin());

-- ─── SUPER_ADMIN_USERS ────────────────────────────────────────
CREATE POLICY "superadmin_select" ON public.super_admin_users
  FOR SELECT USING (is_super_admin() OR user_id = auth.uid());

CREATE POLICY "superadmin_insert" ON public.super_admin_users
  FOR INSERT WITH CHECK (is_super_admin());

-- ─── INVITE_TOKENS ────────────────────────────────────────────
CREATE POLICY "invite_select" ON public.invite_tokens
  FOR SELECT USING (
    is_super_admin() OR
    token = current_setting('request.jwt.claims', true)::jsonb->>'invite_token'
  );

CREATE POLICY "invite_insert" ON public.invite_tokens
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "invite_update" ON public.invite_tokens
  FOR UPDATE USING (is_super_admin() OR used_by = auth.uid());

-- ─── Org-scoped tablolar için genel pattern ───────────────────
-- contacts, leads, conversations, messages, voice_calls,
-- knowledge_items, intake_schemas, agent_playbooks,
-- handoff_logs, follow_up_tasks, crm_sync_logs

DO $$ DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'contacts','leads','conversations','messages','voice_calls',
    'knowledge_items','intake_schemas','agent_playbooks',
    'handoff_logs','follow_up_tasks','crm_sync_logs'
  ] LOOP
    EXECUTE format('
      CREATE POLICY "%s_select" ON public.%s
        FOR SELECT USING (is_super_admin() OR has_org_access(organization_id));
      CREATE POLICY "%s_insert" ON public.%s
        FOR INSERT WITH CHECK (is_super_admin() OR has_org_access(organization_id));
      CREATE POLICY "%s_update" ON public.%s
        FOR UPDATE USING (is_super_admin() OR has_org_access(organization_id));
      CREATE POLICY "%s_delete" ON public.%s
        FOR DELETE USING (is_super_admin() OR get_org_role(organization_id) = ''admin'');
    ', t, t, t, t, t, t, t, t);
  END LOOP;
END $$;
