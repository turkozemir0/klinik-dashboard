-- ESTELiFE KB Bulk Safety Cleanup
-- Org: ecd032a8-f40c-4171-947a-b6417461e987
--
-- Fiyat, graft sayısı ve garanti ifadelerini TÜM KB item'lardan temizle.
-- description_for_ai alanlarının sonuna uyarı ekle.

-- 1. FİYAT İÇEREN TÜM İTEMLARA UYARI EKLE
-- (Eğer zaten uyarı yoksa)
UPDATE knowledge_items
SET
  description_for_ai = description_for_ai
    || E'\n\nWICHTIG FÜR DEN AGENTEN: Nenne KEINE konkreten Preise, Euro-Beträge oder Preisbereiche aus diesem Text. Sage stattdessen: "Der Preis wird individuell bei der kostenlosen Analyse bestimmt."',
  updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND is_active = true
  AND (description_for_ai ILIKE '%€%'
    OR description_for_ai ILIKE '%euro%'
    OR description_for_ai ILIKE '%preis%'
    OR description_for_ai ILIKE '%kosten%')
  AND description_for_ai NOT LIKE '%WICHTIG FÜR DEN AGENTEN: Nenne KEINE konkreten Preise%';

-- 2. GRAFT-ZAHLEN İÇEREN TÜM İTEMLARA UYARI EKLE
UPDATE knowledge_items
SET
  description_for_ai = description_for_ai
    || E'\n\nWICHTIG FÜR DEN AGENTEN: Nenne KEINE konkreten Graft-Zahlen oder Bereiche. Sage stattdessen: "Die Graftanzahl wird individuell bei der Analyse bestimmt."',
  updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND is_active = true
  AND (description_for_ai ~* '\d{3,5}\s*(graft|Graft)'
    OR description_for_ai ILIKE '%graftanzahl%'
    OR description_for_ai ILIKE '%grafts%')
  AND description_for_ai NOT LIKE '%WICHTIG FÜR DEN AGENTEN: Nenne KEINE konkreten Graft%';

-- 3. GARANTİ İFADELERİ İÇEREN TÜM İTEMLARA UYARI EKLE
UPDATE knowledge_items
SET
  description_for_ai = description_for_ai
    || E'\n\nWICHTIG FÜR DEN AGENTEN: Nenne KEINE Garantien, Prozentsätze oder Erfolgsraten. Sage stattdessen: "Die Erfolgsrate ist sehr hoch. Details bespricht Dr. Yildirim persönlich."',
  updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND is_active = true
  AND (description_for_ai ILIKE '%garantie%'
    OR description_for_ai ILIKE '%garantiert%'
    OR description_for_ai ~* '\d{2,3}\s*%'
    OR description_for_ai ILIKE '%erfolgsrate%'
    OR description_for_ai ILIKE '%einheilungsgrad%')
  AND description_for_ai NOT LIKE '%WICHTIG FÜR DEN AGENTEN: Nenne KEINE Garantien%';
