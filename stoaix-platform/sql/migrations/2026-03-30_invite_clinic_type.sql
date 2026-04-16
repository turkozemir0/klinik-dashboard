-- invite_tokens tablosuna clinic_type kolonu eklenir
-- Admin davet oluştururken branşı seçer; müşteri clinic-type sayfasını atlar

ALTER TABLE invite_tokens
  ADD COLUMN IF NOT EXISTS clinic_type TEXT DEFAULT 'other';
