-- ═══════════════════════════════════════════════════════════════
-- Knowledge Items Vector Search RPC
-- Voice agent bu fonksiyonu çağırarak KB sorgular
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.match_knowledge_items(
  org_id       uuid,
  query_vector vector(1536),
  match_count  int DEFAULT 5
)
RETURNS TABLE (
  id                 uuid,
  item_type          text,
  title              text,
  description_for_ai text,
  similarity         float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    item_type,
    title,
    description_for_ai,
    1 - (embedding <=> query_vector) AS similarity
  FROM public.knowledge_items
  WHERE organization_id = org_id
    AND is_active = true
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_vector
  LIMIT match_count;
$$;
