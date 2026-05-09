-- 2026-05-10: contacts tablosuna contact-level progressive summary ekle
-- Chat (handoff anında) ve Voice (her çağrı sonunda) güncellenir.

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS contact_summary            text,
  ADD COLUMN IF NOT EXISTS contact_summary_updated_at timestamptz;

COMMENT ON COLUMN public.contacts.contact_summary IS
  'AI-generated progressive summary: hastanın ilgi alanı, endişeleri, karar süreci. '
  'Chat: sadece handoff anında güncellenir. Voice: her çağrı sonrası güncellenir.';
