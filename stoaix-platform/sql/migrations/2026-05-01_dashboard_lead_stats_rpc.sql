-- B3: DB-side lead stats aggregation (replaces fetching all leads to JS)
CREATE OR REPLACE FUNCTION get_lead_stats(p_org_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'hot', COUNT(*) FILTER (WHERE qualification_score >= 70),
    'warm', COUNT(*) FILTER (WHERE qualification_score >= 40 AND qualification_score < 70),
    'cold', COUNT(*) FILTER (WHERE qualification_score < 40),
    'avg_score', COALESCE(ROUND(AVG(qualification_score)), 0)
  )
  FROM leads
  WHERE organization_id = p_org_id;
$$;

-- B4: DB-side call stats aggregation
CREATE OR REPLACE FUNCTION get_call_stats(p_org_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'missed', COUNT(*) FILTER (WHERE status = 'missed'),
    'avg_duration', COALESCE(
      ROUND(AVG(duration_seconds) FILTER (WHERE status = 'completed')),
      0
    )
  )
  FROM voice_calls
  WHERE organization_id = p_org_id;
$$;
