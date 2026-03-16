-- Add AI language preference to clinics table
-- This controls which language the AI assistant uses when responding to patients.
-- Separate from clinic_users.language which controls the dashboard UI language.
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS lang VARCHAR(2) NOT NULL DEFAULT 'tr';

ALTER TABLE clinics
  ADD CONSTRAINT clinics_lang_check
  CHECK (lang IN ('tr', 'en'));
