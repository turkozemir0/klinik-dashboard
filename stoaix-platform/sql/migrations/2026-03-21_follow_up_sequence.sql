-- ─────────────────────────────────────────────────────────────────────────────
-- Follow-up sequence tracking
-- Adds sequence_stage, sent_at, channel, conversation_id, sent_message columns
-- to follow_up_tasks + auto-trigger for first_reminder + reporting RPC.
--
-- Sequence timeline (days after lead creation):
--   first_reminder → +1d
--   warm_day4      → +4d
--   warm_day11     → +11d
--   warm_to_cold   → +14d
--   cold_month1    → +30d
--   cold_month2    → +60d
--   cold_final     → +90d
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New columns ────────────────────────────────────────────────────────────

ALTER TABLE public.follow_up_tasks
  ADD COLUMN IF NOT EXISTS sequence_stage TEXT
    CHECK (sequence_stage IN (
      'first_reminder', 'warm_day4', 'warm_day11', 'warm_to_cold',
      'cold_month1', 'cold_month2', 'cold_final'
    )),
  ADD COLUMN IF NOT EXISTS sent_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS channel         TEXT NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sent_message    TEXT;  -- AI tarafından üretilen ve gönderilen mesaj

-- ── 2. Indexes ────────────────────────────────────────────────────────────────

-- N8n'in 15 dakikada bir çalıştıracağı sorgu için partial index
CREATE INDEX IF NOT EXISTS idx_tasks_pending_due
  ON public.follow_up_tasks (organization_id, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tasks_sequence
  ON public.follow_up_tasks (organization_id, sequence_stage, status);

-- ── 3. Auto-trigger: yeni lead → first_reminder task ─────────────────────────

CREATE OR REPLACE FUNCTION public.fn_create_first_followup()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- source_channel 'voice' veya 'web' ise whatsapp ile takip başlat
  INSERT INTO public.follow_up_tasks (
    organization_id,
    lead_id,
    contact_id,
    task_type,
    sequence_stage,
    channel,
    scheduled_at,
    status
  ) VALUES (
    NEW.organization_id,
    NEW.id,
    NEW.contact_id,
    'whatsapp_followup',
    'first_reminder',
    CASE NEW.source_channel
      WHEN 'instagram' THEN 'instagram'
      ELSE 'whatsapp'
    END,
    NOW() + INTERVAL '24 hours',
    'pending'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_first_followup ON public.leads;
CREATE TRIGGER trg_lead_first_followup
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_create_first_followup();

-- ── 4. RPC: Follow-up funnel istatistikleri (dashboard reporting) ─────────────

CREATE OR REPLACE FUNCTION public.get_followup_stats(p_org_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(

    -- Aşama bazlı huni tablosu
    'by_stage', (
      SELECT COALESCE(json_agg(row_to_json(s) ORDER BY s.stage_order), '[]')
      FROM (
        SELECT
          sequence_stage                                        AS stage,
          CASE sequence_stage
            WHEN 'first_reminder' THEN 1
            WHEN 'warm_day4'      THEN 2
            WHEN 'warm_day11'     THEN 3
            WHEN 'warm_to_cold'   THEN 4
            WHEN 'cold_month1'    THEN 5
            WHEN 'cold_month2'    THEN 6
            WHEN 'cold_final'     THEN 7
            ELSE 99
          END                                                   AS stage_order,
          COUNT(*)                                              AS total,
          COUNT(*) FILTER (WHERE status = 'pending')           AS pending,
          COUNT(*) FILTER (WHERE status = 'sent')              AS sent,
          COUNT(*) FILTER (WHERE status = 'done')              AS done,
          COUNT(*) FILTER (WHERE status = 'cancelled')         AS cancelled
        FROM public.follow_up_tasks
        WHERE organization_id = p_org_id
          AND sequence_stage IS NOT NULL
        GROUP BY sequence_stage
      ) s
    ),

    -- Özet metrikler
    'upcoming_7_days', (
      SELECT COUNT(*)
      FROM public.follow_up_tasks
      WHERE organization_id = p_org_id
        AND status = 'pending'
        AND scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    ),

    'sent_today', (
      SELECT COUNT(*)
      FROM public.follow_up_tasks
      WHERE organization_id = p_org_id
        AND sent_at >= CURRENT_DATE
    ),

    'overdue', (
      SELECT COUNT(*)
      FROM public.follow_up_tasks
      WHERE organization_id = p_org_id
        AND status = 'pending'
        AND scheduled_at < NOW()
    ),

    -- Son 10 gönderilen mesaj (aktivite feed)
    'recent_sent', (
      SELECT COALESCE(json_agg(row_to_json(r)), '[]')
      FROM (
        SELECT
          ft.id,
          ft.sequence_stage,
          ft.channel,
          ft.sent_at,
          LEFT(ft.sent_message, 120) AS preview,
          c.phone
        FROM public.follow_up_tasks ft
        LEFT JOIN public.contacts c ON c.id = ft.contact_id
        WHERE ft.organization_id = p_org_id
          AND ft.sent_at IS NOT NULL
        ORDER BY ft.sent_at DESC
        LIMIT 10
      ) r
    )

  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_followup_stats(UUID) TO authenticated;

-- ── 5. RPC: Upcoming tasks listesi (n8n için değil, dashboard için) ──────────

CREATE OR REPLACE FUNCTION public.get_upcoming_followups(
  p_org_id UUID,
  p_limit  INT DEFAULT 20
)
RETURNS TABLE (
  id              UUID,
  sequence_stage  TEXT,
  channel         TEXT,
  scheduled_at    TIMESTAMPTZ,
  contact_phone   TEXT,
  contact_id      UUID,
  lead_id         UUID
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ft.id,
    ft.sequence_stage,
    ft.channel,
    ft.scheduled_at,
    c.phone  AS contact_phone,
    ft.contact_id,
    ft.lead_id
  FROM public.follow_up_tasks ft
  LEFT JOIN public.contacts c ON c.id = ft.contact_id
  WHERE ft.organization_id = p_org_id
    AND ft.status = 'pending'
  ORDER BY ft.scheduled_at ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_upcoming_followups(UUID, INT) TO authenticated;
