-- ═══════════════════════════════════════════════════════════════
-- Faz 1C — Bildirimler Tablosu
-- user_id NULL = tüm org broadcast
-- Realtime aktif edildi
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text        NOT NULL CHECK (type IN ('handoff','hot_lead','new_message','takeover')),
  lead_id         uuid        REFERENCES public.leads(id) ON DELETE CASCADE,
  conversation_id uuid        REFERENCES public.conversations(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  body            text,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_org    ON public.notifications(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON public.notifications(organization_id, user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: org üyesi kendi + broadcast (user_id IS NULL) notifları görür
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (
  is_super_admin() OR (has_org_access(organization_id) AND (user_id IS NULL OR user_id = auth.uid()))
);

CREATE POLICY "notif_insert" ON public.notifications FOR INSERT
  WITH CHECK (is_super_admin() OR has_org_access(organization_id));

CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (
  is_super_admin() OR (has_org_access(organization_id) AND (user_id IS NULL OR user_id = auth.uid()))
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
