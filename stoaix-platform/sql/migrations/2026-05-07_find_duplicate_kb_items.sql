-- KB Benzerlik Kontrolü: cosine similarity ile çakışan çiftleri bulan RPC
-- Her çift (a, b) tam olarak bir kez listelenir (a.id < b.id koşuluyla)

CREATE OR REPLACE FUNCTION find_duplicate_kb_items(
  p_org_id   uuid,
  p_threshold float DEFAULT 0.85
)
RETURNS TABLE (
  a_id                 uuid,
  a_title              text,
  a_item_type          text,
  a_description_for_ai text,
  b_id                 uuid,
  b_title              text,
  b_item_type          text,
  b_description_for_ai text,
  similarity           float
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id,
    a.title,
    a.item_type,
    a.description_for_ai,
    b.id,
    b.title,
    b.item_type,
    b.description_for_ai,
    round((1 - (a.embedding <=> b.embedding))::numeric, 2)::float AS similarity
  FROM knowledge_items a
  JOIN knowledge_items b ON a.id < b.id
  WHERE a.organization_id = p_org_id
    AND b.organization_id = p_org_id
    AND a.is_active = true
    AND b.is_active = true
    AND a.embedding IS NOT NULL
    AND b.embedding IS NOT NULL
    AND 1 - (a.embedding <=> b.embedding) > p_threshold
  ORDER BY similarity DESC
  LIMIT 50;
$$;
