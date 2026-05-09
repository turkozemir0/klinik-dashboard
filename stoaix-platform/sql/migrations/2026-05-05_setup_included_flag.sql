-- organizations tablosuna setup_included flag ekle
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS setup_included boolean DEFAULT false;

-- Mevcut yıllık aboneliklere otomatik set (varsa)
UPDATE organizations o
SET setup_included = true
FROM org_subscriptions s
WHERE s.organization_id = o.id
  AND s.billing_interval = 'annual'
  AND s.status IN ('active', 'trialing');
