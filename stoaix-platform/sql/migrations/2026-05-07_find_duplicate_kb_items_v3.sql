-- KB duplicate tespiti — v3: item_type'a göre başlık stratejisi
-- Sorun: university_programs başlıkları şehir + "ÜNİVERSİTESİ" + "(ülke)" içerdiğinden
-- trigram benzerliği her zaman yüksek → tüm false positive'ler geçiyordu.
-- Çözüm: yapısal item türleri için sadece birebir başlık eşleşmesi.
CREATE OR REPLACE FUNCTION find_duplicate_kb_items(
  p_org_id      uuid,
  p_threshold   float DEFAULT 0.90,
  p_title_sim   float DEFAULT 0.30
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
    AND (
      -- Yapısal item'lar (üniversite, ülke, ofis): sadece birebir başlık kopyası
      (
        a.item_type IN ('university_programs', 'country_overview', 'office_location')
        AND a.title = b.title
      )
      OR
      -- İçerik item'ları (SSS, fiyat, politika, vb.): embedding + başlık trigram filtresi
      (
        a.item_type NOT IN ('university_programs', 'country_overview', 'office_location')
        AND similarity(a.title, b.title) > p_title_sim
      )
    )
  ORDER BY similarity DESC
  LIMIT 50;
$$;
