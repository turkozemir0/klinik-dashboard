-- ═══════════════════════════════════════════════════════════════
-- stoaix AI Klinik System — ROW LEVEL SECURITY (RLS)
-- 02_functions.sql'den sonra çalıştır
-- ═══════════════════════════════════════════════════════════════

-- ─── RLS'İ AKTİFLEŞTİR ───────────────────────────────────────
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoff_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- ─── CLINICS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "clinic_users can read own clinic" ON public.clinics;
CREATE POLICY "clinic_users can read own clinic"
  ON public.clinics FOR SELECT
  USING (id = get_my_clinic_id() OR is_super_admin());

DROP POLICY IF EXISTS "super admin can update clinics" ON public.clinics;
CREATE POLICY "super admin can update clinics"
  ON public.clinics FOR UPDATE
  USING (is_super_admin());

DROP POLICY IF EXISTS "super admin can insert clinics" ON public.clinics;
CREATE POLICY "super admin can insert clinics"
  ON public.clinics FOR INSERT
  WITH CHECK (is_super_admin());

-- ─── CLINIC_USERS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "users can see own clinic_user row" ON public.clinic_users;
CREATE POLICY "users can see own clinic_user row"
  ON public.clinic_users FOR SELECT
  USING (user_id = auth.uid() OR is_super_admin());

-- ─── SUPER_ADMIN_USERS ────────────────────────────────────────
DROP POLICY IF EXISTS "only super admins can read super_admin_users" ON public.super_admin_users;
CREATE POLICY "only super admins can read super_admin_users"
  ON public.super_admin_users FOR SELECT
  USING (is_super_admin());

-- ─── INVITE_TOKENS ────────────────────────────────────────────
DROP POLICY IF EXISTS "anyone can read token" ON public.invite_tokens;
CREATE POLICY "anyone can read token"
  ON public.invite_tokens FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin can create token" ON public.invite_tokens;
CREATE POLICY "admin can create token"
  ON public.invite_tokens FOR INSERT
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "admin or user can update token" ON public.invite_tokens;
CREATE POLICY "admin or user can update token"
  ON public.invite_tokens FOR UPDATE
  USING (is_super_admin() OR used_by = auth.uid());

-- ─── CLINIC_REGISTRATIONS ─────────────────────────────────────
DROP POLICY IF EXISTS "user can see own registration" ON public.clinic_registrations;
CREATE POLICY "user can see own registration"
  ON public.clinic_registrations FOR SELECT
  USING (user_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "user can create registration" ON public.clinic_registrations;
CREATE POLICY "user can create registration"
  ON public.clinic_registrations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR user_id = (auth.jwt() ->> 'sub')::uuid
  );

DROP POLICY IF EXISTS "admin can update registrations" ON public.clinic_registrations;
CREATE POLICY "admin can update registrations"
  ON public.clinic_registrations FOR UPDATE
  USING (is_super_admin());

-- ─── ONBOARDING_SUBMISSIONS ───────────────────────────────────
DROP POLICY IF EXISTS "clinic can see own submissions" ON public.onboarding_submissions;
CREATE POLICY "clinic can see own submissions"
  ON public.onboarding_submissions FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

DROP POLICY IF EXISTS "clinic can upsert own submissions" ON public.onboarding_submissions;
CREATE POLICY "clinic can upsert own submissions"
  ON public.onboarding_submissions FOR INSERT
  WITH CHECK (clinic_id = get_my_clinic_id());

DROP POLICY IF EXISTS "clinic can update own pending submissions" ON public.onboarding_submissions;
CREATE POLICY "clinic can update own pending submissions"
  ON public.onboarding_submissions FOR UPDATE
  USING (
    (clinic_id = get_my_clinic_id() AND status = 'pending')
    OR is_super_admin()
  );

-- ─── ONBOARDING_PROGRESS ──────────────────────────────────────
DROP POLICY IF EXISTS "clinic can see own progress" ON public.onboarding_progress;
CREATE POLICY "clinic can see own progress"
  ON public.onboarding_progress FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

DROP POLICY IF EXISTS "clinic can update own progress" ON public.onboarding_progress;
CREATE POLICY "clinic can update own progress"
  ON public.onboarding_progress FOR ALL
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

-- ─── SERVICES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "clinic users can read own services" ON public.services;
CREATE POLICY "clinic users can read own services"
  ON public.services FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

DROP POLICY IF EXISTS "super admin can update services" ON public.services;
CREATE POLICY "super admin can update services"
  ON public.services FOR UPDATE
  USING (is_super_admin());

DROP POLICY IF EXISTS "super admin can insert services" ON public.services;
CREATE POLICY "super admin can insert services"
  ON public.services FOR INSERT
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "super admin can delete services" ON public.services;
CREATE POLICY "super admin can delete services"
  ON public.services FOR DELETE
  USING (is_super_admin());

-- ─── FAQS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clinic users can read own faqs" ON public.faqs;
CREATE POLICY "clinic users can read own faqs"
  ON public.faqs FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

DROP POLICY IF EXISTS "super admin can manage faqs" ON public.faqs;
CREATE POLICY "super admin can manage faqs"
  ON public.faqs FOR ALL
  USING (is_super_admin());

-- ─── KB_CHANGE_REQUESTS ───────────────────────────────────────
DROP POLICY IF EXISTS "clinic users can see own requests" ON public.kb_change_requests;
CREATE POLICY "clinic users can see own requests"
  ON public.kb_change_requests FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

DROP POLICY IF EXISTS "clinic users can insert own requests" ON public.kb_change_requests;
CREATE POLICY "clinic users can insert own requests"
  ON public.kb_change_requests FOR INSERT
  WITH CHECK (clinic_id = get_my_clinic_id() AND requested_by = auth.uid());

DROP POLICY IF EXISTS "only super admin can update requests" ON public.kb_change_requests;
CREATE POLICY "only super admin can update requests"
  ON public.kb_change_requests FOR UPDATE
  USING (is_super_admin());

-- ─── CONVERSATIONS ────────────────────────────────────────────
DROP POLICY IF EXISTS "clinic users can read own conversations" ON public.conversations;
CREATE POLICY "clinic users can read own conversations"
  ON public.conversations FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

-- ─── MESSAGES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "clinic users can read own messages" ON public.messages;
CREATE POLICY "clinic users can read own messages"
  ON public.messages FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

-- ─── HANDOFF_LOGS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "clinic users can read own handoff logs" ON public.handoff_logs;
CREATE POLICY "clinic users can read own handoff logs"
  ON public.handoff_logs FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

-- ─── DAILY_STATS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "clinic users can read own daily stats" ON public.daily_stats;
CREATE POLICY "clinic users can read own daily stats"
  ON public.daily_stats FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

-- ─── SUPPORT_TICKETS ──────────────────────────────────────────
DROP POLICY IF EXISTS "clinic can see own tickets" ON public.support_tickets;
CREATE POLICY "clinic can see own tickets"
  ON public.support_tickets FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

DROP POLICY IF EXISTS "clinic can create ticket" ON public.support_tickets;
CREATE POLICY "clinic can create ticket"
  ON public.support_tickets FOR INSERT
  WITH CHECK (clinic_id = get_my_clinic_id() AND submitted_by = auth.uid());

DROP POLICY IF EXISTS "admin can update tickets" ON public.support_tickets;
CREATE POLICY "admin can update tickets"
  ON public.support_tickets FOR UPDATE
  USING (is_super_admin());

SELECT 'RLS politikaları kurulumu tamamlandı ✅' as durum;
