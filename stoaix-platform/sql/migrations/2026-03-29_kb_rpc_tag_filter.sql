-- 2026-03-29_kb_rpc_tag_filter.sql
-- match_knowledge_items RPC'ye opsiyonel ülke tag filtresi eklendi.
-- Voice agent artık sorguda ülke ismi geçince yalnızca o ülkenin
-- KB item'larında similarity search yapıyor (193 item yerine 5-30 item).
-- Ayrıca RPC'ye tags alanı da eklendi (ileride kullanım için).

CREATE OR REPLACE FUNCTION public.match_knowledge_items(
  org_id       uuid,
  query_vector vector(1536),
  match_count  int     DEFAULT 5,
  filter_tags  text[]  DEFAULT NULL   -- opsiyonel: ['iran'] gibi geçilirse sadece o tag'e sahip item'lar
)
RETURNS TABLE (
  id                 uuid,
  item_type          text,
  title              text,
  description_for_ai text,
  data               jsonb,
  tags               text[],
  similarity         float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ki.id,
    ki.item_type,
    ki.title,
    ki.description_for_ai,
    ki.data,
    ki.tags,
    1 - (ki.embedding <=> query_vector) AS similarity
  FROM public.knowledge_items ki
  WHERE ki.organization_id = org_id
    AND ki.is_active = true
    AND (filter_tags IS NULL OR ki.tags && filter_tags)
  ORDER BY ki.embedding <=> query_vector
  LIMIT match_count;
$$;
