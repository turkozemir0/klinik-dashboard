-- ─────────────────────────────────────────────────────────────────────────────
-- Re-engagement sequence stages
-- sequence_stage CHECK constraint'ine re_contact_1/2/3 ekleniyor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Mevcut CHECK constraint'i kaldır (PostgreSQL adı otomatik atar)
ALTER TABLE public.follow_up_tasks
  DROP CONSTRAINT IF EXISTS follow_up_tasks_sequence_stage_check;

-- Yeni constraint: mevcut + re-engagement aşamaları
ALTER TABLE public.follow_up_tasks
  ADD CONSTRAINT follow_up_tasks_sequence_stage_check
  CHECK (sequence_stage IN (
    -- Organik follow-up (inbound'dan gelen lead'ler)
    'first_reminder',
    'warm_day4',
    'warm_day11',
    'warm_to_cold',
    'cold_month1',
    'cold_month2',
    'cold_final',
    -- Re-engagement (eski CRM'den import edilen soğuk lead'ler)
    're_contact_1',
    're_contact_2',
    're_contact_3'
  ));

-- get_followup_stats RPC'sini re_contact aşamaları için güncelle
-- (stage_order'a yeni satırlar ekleniyor)
CREATE OR REPLACE FUNCTION public.get_followup_stats(p_org_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(

    'by_stage', (
      SELECT COALESCE(json_agg(row_to_json(s) ORDER BY s.stage_order), '[]')
      FROM (
        SELECT
          sequence_stage AS stage,
          CASE sequence_stage
            WHEN 'first_reminder' THEN 1
            WHEN 'warm_day4'      THEN 2
            WHEN 'warm_day11'     THEN 3
            WHEN 'warm_to_cold'   THEN 4
            WHEN 'cold_month1'    THEN 5
            WHEN 'cold_month2'    THEN 6
            WHEN 'cold_final'     THEN 7
            WHEN 're_contact_1'   THEN 10
            WHEN 're_contact_2'   THEN 11
            WHEN 're_contact_3'   THEN 12
            ELSE 99
          END AS stage_order,
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
