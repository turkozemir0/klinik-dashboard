-- Add timezone column to organizations.
-- Outreach workflows use this field to evaluate business hours per org.
-- Examples: Europe/Berlin, Europe/Istanbul, Asia/Dubai, America/New_York

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Berlin';

-- Example backfill for TR orgs:
-- UPDATE public.organizations SET timezone = 'Europe/Istanbul' WHERE name ILIKE '%eurostar%';
