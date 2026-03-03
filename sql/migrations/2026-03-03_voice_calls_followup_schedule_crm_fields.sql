-- Migration: 2026-03-03
-- Adds: voice_calls table, follow_up_schedule table, CRM abstraction fields on clinics

-- ============================================================
-- 1. follow_up_schedule
-- Multi-layered follow-up scheduling (D+1, D+3, D+7, D+14,
-- D+30, D+60, D+90, D+180). Solves WF3 timer-reset bug by
-- persisting each follow-up as a discrete row with its own
-- scheduled_at timestamp that never changes.
-- ============================================================

CREATE TABLE IF NOT EXISTS follow_up_schedule (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID        REFERENCES conversations(id) ON DELETE CASCADE,
  clinic_id           UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  ghl_contact_id      TEXT        NOT NULL,
  followup_type       TEXT        NOT NULL,   -- 'day1','day3','day7','day14','day30','day60','day90','day180'
  scheduled_at        TIMESTAMPTZ NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'sent', 'cancelled')),
  message_sent        TEXT,
  n8n_execution_id    TEXT,
  sent_at             TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fus_scheduled_pending
  ON follow_up_schedule(scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_fus_conversation_id
  ON follow_up_schedule(conversation_id);

CREATE INDEX IF NOT EXISTS idx_fus_clinic_id
  ON follow_up_schedule(clinic_id);

ALTER TABLE follow_up_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_users_see_own_followups"
  ON follow_up_schedule FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. voice_calls
-- Infrastructure for voice agent readiness (not active yet).
-- Stores inbound/outbound call metadata, recordings,
-- transcripts, and AI summaries.
-- ============================================================

CREATE TABLE IF NOT EXISTS voice_calls (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  conversation_id  UUID        REFERENCES conversations(id) ON DELETE SET NULL,
  ghl_contact_id   TEXT,
  direction        TEXT        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status           TEXT        NOT NULL DEFAULT 'initiated'
                               CHECK (status IN (
                                 'initiated','ringing','in_progress',
                                 'completed','failed','no_answer','busy'
                               )),
  phone_from       TEXT,
  phone_to         TEXT,
  duration_seconds INTEGER,
  recording_url    TEXT,
  transcript       TEXT,
  ai_summary       TEXT,
  outcome          TEXT,       -- 'appointment_booked','callback_requested',
                               --  'not_interested','voicemail','other'
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  metadata         JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_calls_clinic_id
  ON voice_calls(clinic_id);

CREATE INDEX IF NOT EXISTS idx_voice_calls_conversation_id
  ON voice_calls(conversation_id);

CREATE INDEX IF NOT EXISTS idx_voice_calls_ghl_contact_id
  ON voice_calls(ghl_contact_id);

CREATE INDEX IF NOT EXISTS idx_voice_calls_created_at
  ON voice_calls(created_at DESC);

ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_users_see_own_voice_calls"
  ON voice_calls FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. CRM abstraction fields on clinics
-- crm_provider: which CRM is in use (default 'ghl')
-- crm_config:   provider-specific keys/IDs as JSONB
--               so existing ghl_* columns stay backward-
--               compatible while new providers store their
--               config here.
-- ============================================================

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS crm_provider TEXT    NOT NULL DEFAULT 'ghl',
  ADD COLUMN IF NOT EXISTS crm_config   JSONB   NOT NULL DEFAULT '{}'::JSONB;

COMMENT ON COLUMN clinics.crm_provider IS
  'CRM provider identifier: ghl | kommo | zoho | salesforce | hubspot | custom';

COMMENT ON COLUMN clinics.crm_config IS
  'Provider-specific config (API keys, pipeline IDs, etc.) '
  'stored as JSONB. Structure varies per provider.';

-- ============================================================
-- 4. Realtime publication for new tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE follow_up_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_calls;
