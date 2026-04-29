-- Migration: contacts.preferred_language for multilingual voice
-- Date: 2026-04-20

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT NULL;
COMMENT ON COLUMN public.contacts.preferred_language IS 'ISO 639-1 (tr/en/ar/de/ru). NULL = org default.';
