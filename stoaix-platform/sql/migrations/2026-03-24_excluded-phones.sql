-- Add excluded_phones array to organizations
-- Numbers stored in normalized E.164-like format (digits only, e.g. 905551234567)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS excluded_phones text[] DEFAULT '{}';
