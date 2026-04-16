-- Migration: 2026-04-16_appointments_type_source
-- Adds appointment_type, title, source, external_id columns to appointments table
-- Creates dedup index for Google sync upserts and filter index for calendar page

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS appointment_type text
    NOT NULL DEFAULT 'consultation'
    CHECK (appointment_type IN ('consultation','operation','follow_up','other')),
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS source text
    NOT NULL DEFAULT 'platform'
    CHECK (source IN ('platform','google','dentsoft','ai','ghl')),
  ADD COLUMN IF NOT EXISTS external_id text;

-- Dedup index for Google sync upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_external_id_org
  ON public.appointments(organization_id, source, external_id)
  WHERE external_id IS NOT NULL;

-- Filter-by-source index for calendar page
CREATE INDEX IF NOT EXISTS idx_appointments_org_source_scheduled
  ON public.appointments(organization_id, source, scheduled_at);

COMMENT ON COLUMN public.appointments.appointment_type IS 'consultation | operation | follow_up | other';
COMMENT ON COLUMN public.appointments.title IS 'Optional display title; falls back to contact name';
COMMENT ON COLUMN public.appointments.source IS 'platform | google | dentsoft | ai | ghl';
COMMENT ON COLUMN public.appointments.external_id IS 'Google Calendar event ID, GHL appointment ID, etc.';
