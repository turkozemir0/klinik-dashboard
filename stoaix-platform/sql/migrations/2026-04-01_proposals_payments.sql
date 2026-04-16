-- ═══════════════════════════════════════════════════════════════
-- Faz 1D — Teklifler + Ödeme Takvimleri
-- proposals: teklif başlık/açıklama/tutar/durum
-- payment_schedules: taksit vade/tutar/durum
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.proposals (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id         uuid          NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_by      uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  title           text          NOT NULL,
  description     text,
  total_amount    numeric(12,2) NOT NULL DEFAULT 0,
  currency        text          NOT NULL DEFAULT 'TRY',
  status          text          NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','accepted','rejected','signed')),
  sent_at         timestamptz,
  accepted_at     timestamptz,
  signed_at       timestamptz,
  notes           text,
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now()
);

CREATE TRIGGER trg_proposals_updated BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_select" ON public.proposals FOR SELECT
  USING (is_super_admin() OR has_org_access(organization_id));

CREATE POLICY "proposals_insert" ON public.proposals FOR INSERT
  WITH CHECK (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici','satisci'));

CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici','satisci'));

CREATE POLICY "proposals_delete" ON public.proposals FOR DELETE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));


CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id     uuid          NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  amount          numeric(12,2) NOT NULL,
  due_date        date          NOT NULL,
  status          text          NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','paid','overdue')),
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz   DEFAULT now()
);

ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON public.payment_schedules FOR SELECT
  USING (is_super_admin() OR has_org_access(organization_id));

CREATE POLICY "payments_insert" ON public.payment_schedules FOR INSERT
  WITH CHECK (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici','muhasebe'));

CREATE POLICY "payments_update" ON public.payment_schedules FOR UPDATE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici','muhasebe'));

CREATE POLICY "payments_delete" ON public.payment_schedules FOR DELETE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));
