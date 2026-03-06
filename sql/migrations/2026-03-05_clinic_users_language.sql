-- Add language preference to clinic_users
ALTER TABLE clinic_users
  ADD COLUMN IF NOT EXISTS language VARCHAR(2) NOT NULL DEFAULT 'tr';

-- Ensure only valid values
ALTER TABLE clinic_users
  ADD CONSTRAINT clinic_users_language_check
  CHECK (language IN ('tr', 'en'));
