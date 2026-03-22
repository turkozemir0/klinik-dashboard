-- Migration: leads tablosuna ai_summary kolonu ekle
-- 2026-03-21

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ai_summary text;
