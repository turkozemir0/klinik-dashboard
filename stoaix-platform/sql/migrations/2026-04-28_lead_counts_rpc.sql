-- 8 ayrı COUNT query → tek RPC (CRM sayfası performans optimizasyonu)
CREATE OR REPLACE FUNCTION get_lead_counts(p_org_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'all',         count(*),
    'new',         count(*) filter (where status = 'new'),
    'in_progress', count(*) filter (where status = 'in_progress'),
    'handed_off',  count(*) filter (where status = 'handed_off'),
    'hot',         count(*) filter (where qualification_score >= 70),
    'warm',        count(*) filter (where qualification_score >= 40 and qualification_score < 70),
    'cold',        count(*) filter (where qualification_score < 40),
    'today',       count(*) filter (where created_at >= current_date)
  )
  FROM leads
  WHERE organization_id = p_org_id;
$$;
