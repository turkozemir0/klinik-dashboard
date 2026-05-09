-- pg_trgm extension'ı aktif et (Supabase'de genellikle zaten açık)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- KB duplicate tespiti — v2: başlık benzerliği filtresi eklendi
-- False positive nedeni: farklı üniversiteler aynı LLM şablonundan üretildiği için
-- embedding'leri birbirine yakın. Başlıklar yeterince farklıysa → atla.
CREATE OR REPLACE FUNCTION find_duplicate_kb_items(
  p_org_id      uuid,
  p_threshold   float DEFAULT 0.90,       -- embedding cosine eşiği (0.85 → 0.90)
  p_title_sim   float DEFAULT 0.30        -- başlık trigram benzerlik eşiği
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
    a.id, a.title, a.item_type, a.description_for_ai,
    b.id, b.title, b.item_type, b.description_for_ai,
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
    AND similarity(a.title, b.title) > p_title_sim   -- başlık trigram filtresi
  ORDER BY similarity DESC
  LIMIT 50;
$$;
