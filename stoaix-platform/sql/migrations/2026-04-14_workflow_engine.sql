-- =============================================================================
-- Workflow Engine Migration
-- 2026-04-14_workflow_engine.sql
-- Tables: org_workflows, workflow_runs, call_queue, appointments,
--         satisfaction_surveys
-- Features + plan_entitlements
-- pg_net DB triggers for event-based workflow dispatch
-- =============================================================================

-- ── 1. org_workflows ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_workflows (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id      text        NOT NULL,
  is_active        boolean     NOT NULL DEFAULT false,
  config           jsonb       NOT NULL DEFAULT '{}',
  -- e.g. { delay_minutes:5, max_retries:3, retry_interval_hours:2,
  --        working_hours_start:'09:00', working_hours_end:'19:00',
  --        no_answer_fallback:'whatsapp', ... }
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, template_id)
);

ALTER TABLE public.org_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_workflows" ON public.org_workflows
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_users WHERE user_id = auth.uid()
    )
  );

-- ── 2. workflow_runs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_workflow_id  uuid        NOT NULL REFERENCES public.org_workflows(id),
  organization_id  uuid        NOT NULL,
  contact_id       uuid        REFERENCES public.contacts(id),
  contact_phone    text,
  trigger_type     text        NOT NULL,
  -- 'lead_created' | 'appointment_created' | 'appointment_reminder'
  -- 'appointment_noshow' | 'post_appointment' | 'no_answer' | 'no_reply'
  -- 'contact_inactive' | 'manual' | 'payment_overdue'
  trigger_ref_id   uuid,
  status           text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','success','failed','no_answer','cancelled')),
  result           jsonb       DEFAULT '{}',
  -- { call_duration_seconds, score, next_action, notes }
  n8n_execution_id text,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_runs" ON public.workflow_runs
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_workflow_runs_org
  ON public.workflow_runs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_contact
  ON public.workflow_runs(contact_id, created_at DESC);

-- ── 3. call_queue ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.call_queue (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           uuid        NOT NULL REFERENCES public.workflow_runs(id),
  organization_id  uuid        NOT NULL,
  phone            text        NOT NULL,
  script_type      text        NOT NULL,
  scheduled_at     timestamptz NOT NULL,
  attempt          int         NOT NULL DEFAULT 1,
  max_attempts     int         NOT NULL DEFAULT 3,
  status           text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','dialing','done','failed')),
  n8n_execution_id text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_queue_scheduled
  ON public.call_queue(scheduled_at)
  WHERE status = 'pending';

-- ── 4. appointments ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id       uuid        REFERENCES public.contacts(id),
  lead_id          uuid        REFERENCES public.leads(id),
  conversation_id  uuid        REFERENCES public.conversations(id),
  scheduled_at     timestamptz NOT NULL,
  duration_minutes int         NOT NULL DEFAULT 60,
  status           text        NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed','attended','no_show','cancelled','rescheduled')),
  confirmed_at     timestamptz,
  attended_at      timestamptz,
  no_show_at       timestamptz,
  notes            text,
  metadata         jsonb       DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_appointments" ON public.appointments
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_appointments_org_scheduled
  ON public.appointments(organization_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_appointments_noshow_check
  ON public.appointments(organization_id, scheduled_at, status)
  WHERE status IN ('scheduled','confirmed');

-- ── 5. satisfaction_surveys ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id       uuid        REFERENCES public.contacts(id),
  lead_id          uuid        REFERENCES public.leads(id),
  appointment_id   uuid        REFERENCES public.appointments(id),
  conversation_id  uuid        REFERENCES public.conversations(id),
  run_id           uuid        REFERENCES public.workflow_runs(id),
  score            int         CHECK (score BETWEEN 1 AND 5),
  comment          text,
  low_score_notified boolean   DEFAULT false,
  taken_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_surveys" ON public.satisfaction_surveys
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_users WHERE user_id = auth.uid()
    )
  );

-- ── 6. pg_net DB Triggers ─────────────────────────────────────────────────────
-- REQUIRES: pg_net extension active in Supabase
-- Check: SELECT * FROM pg_extension WHERE extname = 'pg_net';
--
-- REQUIRES: database settings for app.dashboard_url and app.internal_secret
-- Set via: ALTER DATABASE postgres SET "app.dashboard_url" = 'https://platform.stoaix.com';
--          ALTER DATABASE postgres SET "app.internal_secret" = '<your-secret>';
-- OR hardcode in functions below.

-- 6a. leads → lead_created trigger
CREATE OR REPLACE FUNCTION public.fn_notify_workflow_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _url    text;
  _secret text;
BEGIN
  BEGIN
    _url    := current_setting('app.dashboard_url');
    _secret := current_setting('app.internal_secret');
  EXCEPTION WHEN OTHERS THEN
    -- Settings not configured — skip silently
    RETURN NEW;
  END;

  PERFORM net.http_post(
    url     := _url || '/api/workflows/process-trigger',
    body    := json_build_object(
      'event',  'lead_created',
      'org_id', NEW.organization_id,
      'ref_id', NEW.id,
      'data',   row_to_json(NEW)
    )::text,
    headers := jsonb_build_object(
      'Content-Type',       'application/json',
      'x-internal-secret',  _secret
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail lead INSERT due to workflow trigger error
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workflow_lead_created ON public.leads;
CREATE TRIGGER trg_workflow_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_workflow_lead();

-- 6b. appointments → appointment_created trigger
CREATE OR REPLACE FUNCTION public.fn_notify_workflow_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _url    text;
  _secret text;
BEGIN
  BEGIN
    _url    := current_setting('app.dashboard_url');
    _secret := current_setting('app.internal_secret');
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  PERFORM net.http_post(
    url     := _url || '/api/workflows/process-trigger',
    body    := json_build_object(
      'event',  'appointment_created',
      'org_id', NEW.organization_id,
      'ref_id', NEW.id,
      'data',   row_to_json(NEW)
    )::text,
    headers := jsonb_build_object(
      'Content-Type',       'application/json',
      'x-internal-secret',  _secret
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workflow_appointment_created ON public.appointments;
CREATE TRIGGER trg_workflow_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_workflow_appointment();

-- 6c. appointments status UPDATE → no_show / post_appointment triggers
CREATE OR REPLACE FUNCTION public.fn_notify_workflow_appointment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _url        text;
  _secret     text;
  _event_name text;
BEGIN
  IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
    _event_name := 'appointment_noshow';
  ELSIF NEW.status = 'attended' AND OLD.status != 'attended' THEN
    _event_name := 'post_appointment';
  ELSE
    RETURN NEW;
  END IF;

  BEGIN
    _url    := current_setting('app.dashboard_url');
    _secret := current_setting('app.internal_secret');
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  PERFORM net.http_post(
    url     := _url || '/api/workflows/process-trigger',
    body    := json_build_object(
      'event',  _event_name,
      'org_id', NEW.organization_id,
      'ref_id', NEW.id,
      'data',   row_to_json(NEW)
    )::text,
    headers := jsonb_build_object(
      'Content-Type',       'application/json',
      'x-internal-secret',  _secret
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workflow_appointment_status ON public.appointments;
CREATE TRIGGER trg_workflow_appointment_status
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_workflow_appointment_status();

-- ── 7. New Features ───────────────────────────────────────────────────────────
INSERT INTO public.features (key, module, name, is_boolean) VALUES
  ('workflow_engine',           'workflows', 'İş Akışı Motoru',            true),
  ('workflow_outbound_voice',   'workflows', 'Giden Sesli Aramalar',        true),
  ('workflow_chatbot_auto',     'workflows', 'Otomatik Chatbot Yanıtı',     true),
  ('workflow_sync_flows',       'workflows', 'Senkron Akışlar (V+C)',       true),
  ('workflow_satisfaction',     'workflows', 'Memnuniyet Anketi',           true),
  ('workflow_reactivation',     'workflows', 'Uyuyan Lead Aktivasyonu',     true),
  ('workflow_payment_followup', 'workflows', 'Tahsilat Takibi',             true)
ON CONFLICT (key) DO NOTHING;

-- PLUS: Temel voice + chatbot (V3, V5, V6, C1, C3, C4)
INSERT INTO public.plan_entitlements (plan_id, feature_key, enabled) VALUES
  ('plus', 'workflow_engine',           true),
  ('plus', 'workflow_outbound_voice',   true),
  ('plus', 'workflow_chatbot_auto',     true)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ADVANCED: Tümü
INSERT INTO public.plan_entitlements (plan_id, feature_key, enabled) VALUES
  ('advanced', 'workflow_engine',           true),
  ('advanced', 'workflow_outbound_voice',   true),
  ('advanced', 'workflow_chatbot_auto',     true),
  ('advanced', 'workflow_sync_flows',       true),
  ('advanced', 'workflow_satisfaction',     true),
  ('advanced', 'workflow_reactivation',     true),
  ('advanced', 'workflow_payment_followup', true)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- AGENCY: Tümü
INSERT INTO public.plan_entitlements (plan_id, feature_key, enabled) VALUES
  ('agency', 'workflow_engine',           true),
  ('agency', 'workflow_outbound_voice',   true),
  ('agency', 'workflow_chatbot_auto',     true),
  ('agency', 'workflow_sync_flows',       true),
  ('agency', 'workflow_satisfaction',     true),
  ('agency', 'workflow_reactivation',     true),
  ('agency', 'workflow_payment_followup', true)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- LEGACY: Tümü (legacy = allow all)
INSERT INTO public.plan_entitlements (plan_id, feature_key, enabled)
  SELECT 'legacy', key, true FROM public.features WHERE module = 'workflows'
ON CONFLICT (plan_id, feature_key) DO NOTHING;
