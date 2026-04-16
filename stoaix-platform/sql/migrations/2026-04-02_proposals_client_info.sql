-- Proposal'a müşteri snapshot alanları eklendi
-- Telefon araması ile oluşturulan tekliflerde isim/telefon saklanır

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT;
