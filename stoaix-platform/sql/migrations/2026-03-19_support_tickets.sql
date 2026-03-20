-- ═══════════════════════════════════════════════════════════════
-- Migration: support_tickets tablosu
-- 2026-03-19
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject         text        NOT NULL,
  message         text        NOT NULL,
  status          text        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority        text        NOT NULL DEFAULT 'normal'
                              CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by      uuid        REFERENCES auth.users(id),
  admin_notes     text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_tickets_org    ON public.support_tickets(organization_id);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_tickets_time   ON public.support_tickets(created_at DESC);

-- ─── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Super admin: tüm ticket'ları görür ve günceller
CREATE POLICY "super_admin_all_tickets"
  ON public.support_tickets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Org users: sadece kendi org'larının ticket'larını görür + ekleyebilir
CREATE POLICY "org_users_view_own_tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE user_id = auth.uid()
        AND organization_id = support_tickets.organization_id
    )
  );

CREATE POLICY "org_users_insert_ticket"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE user_id = auth.uid()
        AND organization_id = support_tickets.organization_id
    )
  );

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
