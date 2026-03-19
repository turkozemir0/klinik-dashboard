-- Add website column to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS website text;
