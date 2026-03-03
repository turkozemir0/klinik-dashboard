-- Migration: 2026-03-03 — CRM Gateway
-- Adds: crm_action_logs tablosu, crm_config custom_fields güncelleme

-- ═══════════════════════════════════════════════════════════════
-- 1. crm_action_logs — Gateway observability tablosu
--    Her CRM action çağrısı buraya loglanır
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS crm_action_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        uuid        REFERENCES clinics(id) ON DELETE CASCADE,
  conversation_id  uuid        REFERENCES conversations(id) ON DELETE SET NULL,
  correlation_id   text        NOT NULL,
  idempotency_key  text,
  provider         text        NOT NULL,
  action           text        NOT NULL,
  params           jsonb       DEFAULT '{}',
  status           text        NOT NULL CHECK (status IN ('success', 'failed', 'not_supported')),
  error_type       text        CHECK (error_type IN ('retryable', 'non_retryable', 'auth_error', 'not_supported')),
  error_message    text,
  duration_ms      integer,
  provider_response jsonb      DEFAULT '{}',
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_logs_clinic     ON crm_action_logs(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_logs_action     ON crm_action_logs(action, status);
CREATE INDEX IF NOT EXISTS idx_crm_logs_correlation ON crm_action_logs(correlation_id);

ALTER TABLE crm_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_sees_all_crm_logs"
  ON crm_action_logs FOR SELECT
  USING (is_super_admin());

CREATE POLICY "clinic_users_see_own_crm_logs"
  ON crm_action_logs FOR SELECT
  USING (clinic_id = get_my_clinic_id());

ALTER PUBLICATION supabase_realtime ADD TABLE crm_action_logs;

-- ═══════════════════════════════════════════════════════════════
-- 2. crm_config — custom_fields ekle
--    Gateway, logical alan adını (lead_score) GHL field ID'sine maplar
--    Bu ID'ler klinik bazlı GHL custom field ID'leridir
-- ═══════════════════════════════════════════════════════════════

UPDATE clinics
SET crm_config = crm_config || jsonb_build_object(
  'custom_fields', jsonb_build_object(
    'lead_score',              '9cZwMpve2bzDM0mNQ08Q',
    'qualification_status',    'ABqnbHbNfG6aDlFVAztP',
    'interested_service',      'KUjTWtCUUVoYpy2UgJxa',
    'pain_point',              '8xETKWnQ53EnCQMXdnKz',
    'timeline',                'U2yNuDV5l9oMT7x6XLX3',
    'conversation_id',         'B7dIFrR44PwVM8n87yyw',
    'budget_awareness',        'FMS0gxGnyIv3TNObPdJU',
    'previous_consultation',   'yeYqHGTcqWZNMGPob2YG',
    'ai_summary',              'LjAXj1FT3s6GnBO85pFq',
    'ai_suggested_approach',   '1NAEgwt7JS1EF1J1uXHj',
    'service_detail',          'a4FUZNdUU4qar1HMtNAi',
    'image_shared',            'ESUJMTgVCvQr1IHLhwEK'
  )
)
WHERE crm_provider = 'ghl'
  AND NOT (crm_config ? 'custom_fields');

SELECT 'CRM Gateway migration tamamlandı ✅' AS durum;
