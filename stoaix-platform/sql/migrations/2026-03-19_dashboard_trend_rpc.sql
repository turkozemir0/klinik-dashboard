-- ═══════════════════════════════════════════════════════════════
-- Migration: get_dashboard_trend RPC
-- Dashboard overview sayfasındaki trend chart için
-- 2026-03-19
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_dashboard_trend(
  p_org_id uuid,
  p_days   int DEFAULT 14
)
RETURNS TABLE (
  date          text,
  conversations bigint,
  hot_leads     bigint,
  handoffs      bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH date_series AS (
    SELECT generate_series(
      current_date - (p_days - 1) * interval '1 day',
      current_date,
      interval '1 day'
    )::date AS day
  )
  SELECT
    to_char(ds.day, 'YYYY-MM-DD') AS date,
    COUNT(DISTINCT c.id) FILTER (WHERE c.started_at::date = ds.day) AS conversations,
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at::date = ds.day AND l.qualification_score >= 70) AS hot_leads,
    COUNT(DISTINCT h.id) FILTER (WHERE h.created_at::date = ds.day) AS handoffs
  FROM date_series ds
  LEFT JOIN public.conversations c
    ON c.organization_id = p_org_id AND c.started_at::date = ds.day
  LEFT JOIN public.leads l
    ON l.organization_id = p_org_id AND l.created_at::date = ds.day
  LEFT JOIN public.handoff_logs h
    ON h.organization_id = p_org_id AND h.created_at::date = ds.day
  GROUP BY ds.day
  ORDER BY ds.day;
$$;
