-- Pricing update May 2026
-- Essential $79→$99, Professional $149→$199, Business $299→$399
-- Business plan has no free trial (trial_days = 0)
-- Annual prices: 20% discount (12 months * monthly * 0.8)

UPDATE plans SET price_monthly = 99,  price_annual = 948,  trial_days = 7 WHERE id = 'essential';
UPDATE plans SET price_monthly = 199, price_annual = 1908, trial_days = 7 WHERE id = 'professional';
UPDATE plans SET price_monthly = 399, price_annual = 3828, trial_days = 0 WHERE id = 'business';
