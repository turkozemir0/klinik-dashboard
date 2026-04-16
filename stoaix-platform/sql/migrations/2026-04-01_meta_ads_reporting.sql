-- Meta Ads account mapping + daily reporting config/logs.
-- Organization ile esas olarak Meta reklam hesabini (ad account) eslestirir.
-- Saklanacak temel kimlik: Ads Manager'da gorulen reklam hesabi ID'si.
-- API cagrilarinda gereken `act_<ID>` formu workflow tarafinda uretilir.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.meta_ad_accounts (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  account_name              text,
  meta_ad_account_id        text        NOT NULL,
  -- Numeric ad account id without `act_` prefix.
  meta_business_id          text,
  meta_business_name        text,

  access_token_ref          text,
  -- Secret reference / vault key. Plain token tutmamak icin ayrildi.

  currency                  text,
  account_status            text,
  timezone_name             text,
  report_timezone           text        NOT NULL DEFAULT 'Europe/Istanbul',

  is_active                 boolean     NOT NULL DEFAULT true,
  metadata                  jsonb       NOT NULL DEFAULT '{}'::jsonb,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT meta_ad_accounts_org_account_unique
    UNIQUE (organization_id, meta_ad_account_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_ad_accounts_org
  ON public.meta_ad_accounts(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_meta_ad_accounts_business
  ON public.meta_ad_accounts(meta_business_id);

CREATE TABLE IF NOT EXISTS public.ad_report_configs (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  meta_ad_account_id        uuid        NOT NULL REFERENCES public.meta_ad_accounts(id) ON DELETE CASCADE,

  is_enabled                boolean     NOT NULL DEFAULT true,
  schedule_type             text        NOT NULL DEFAULT 'daily'
                                        CHECK (schedule_type IN ('daily', 'weekly')),
  send_time_local           time        NOT NULL DEFAULT '00:15',
  report_timezone           text        NOT NULL DEFAULT 'Europe/Istanbul',
  period_type               text        NOT NULL DEFAULT 'yesterday'
                                        CHECK (period_type IN ('yesterday', 'last_24h')),

  from_email                text,
  from_name                 text,
  subject_template          text        NOT NULL DEFAULT '{{organization_name}} - Meta Ads gunluk raporu',
  recipient_emails          text[]      NOT NULL DEFAULT '{}',

  include_campaign_breakdown boolean    NOT NULL DEFAULT true,
  include_ai_summary        boolean     NOT NULL DEFAULT false,
  is_active                 boolean     NOT NULL DEFAULT true,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ad_report_configs_org_account_unique
    UNIQUE (organization_id, meta_ad_account_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_report_configs_org
  ON public.ad_report_configs(organization_id, is_enabled, is_active);

CREATE TABLE IF NOT EXISTS public.ad_report_runs (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  meta_ad_account_id        uuid        NOT NULL REFERENCES public.meta_ad_accounts(id) ON DELETE CASCADE,
  config_id                 uuid        REFERENCES public.ad_report_configs(id) ON DELETE SET NULL,

  provider                  text        NOT NULL DEFAULT 'meta_ads',
  period_start              timestamptz NOT NULL,
  period_end                timestamptz NOT NULL,
  period_label              text,

  status                    text        NOT NULL DEFAULT 'pending'
                                        CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  email_provider            text        DEFAULT 'resend',
  email_id                  text,

  metrics                   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  summary                   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  report_html               text,
  error_message             text,
  sent_at                   timestamptz,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ad_report_runs_dedupe
    UNIQUE (meta_ad_account_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_ad_report_runs_org
  ON public.ad_report_runs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_report_runs_account_period
  ON public.ad_report_runs(meta_ad_account_id, period_start DESC);

ALTER TABLE public.meta_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_report_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_report_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_ad_accounts_select"
  ON public.meta_ad_accounts
  FOR SELECT
  USING (is_super_admin() OR has_org_access(organization_id));

CREATE POLICY "meta_ad_accounts_insert"
  ON public.meta_ad_accounts
  FOR INSERT
  WITH CHECK (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "meta_ad_accounts_update"
  ON public.meta_ad_accounts
  FOR UPDATE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "meta_ad_accounts_delete"
  ON public.meta_ad_accounts
  FOR DELETE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "ad_report_configs_select"
  ON public.ad_report_configs
  FOR SELECT
  USING (is_super_admin() OR has_org_access(organization_id));

CREATE POLICY "ad_report_configs_insert"
  ON public.ad_report_configs
  FOR INSERT
  WITH CHECK (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "ad_report_configs_update"
  ON public.ad_report_configs
  FOR UPDATE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "ad_report_configs_delete"
  ON public.ad_report_configs
  FOR DELETE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "ad_report_runs_select"
  ON public.ad_report_runs
  FOR SELECT
  USING (is_super_admin() OR has_org_access(organization_id));

CREATE POLICY "ad_report_runs_insert"
  ON public.ad_report_runs
  FOR INSERT
  WITH CHECK (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "ad_report_runs_update"
  ON public.ad_report_runs
  FOR UPDATE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

CREATE POLICY "ad_report_runs_delete"
  ON public.ad_report_runs
  FOR DELETE
  USING (is_super_admin() OR get_org_role(organization_id) IN ('admin','yönetici'));

DROP TRIGGER IF EXISTS trg_meta_ad_accounts_updated_at ON public.meta_ad_accounts;
CREATE TRIGGER trg_meta_ad_accounts_updated_at
  BEFORE UPDATE ON public.meta_ad_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ad_report_configs_updated_at ON public.ad_report_configs;
CREATE TRIGGER trg_ad_report_configs_updated_at
  BEFORE UPDATE ON public.ad_report_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ad_report_runs_updated_at ON public.ad_report_runs;
CREATE TRIGGER trg_ad_report_runs_updated_at
  BEFORE UPDATE ON public.ad_report_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
