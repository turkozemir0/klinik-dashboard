-- ═══════════════════════════════════════════════════════════════
-- Faz 1B — Konuşma Modu (AI ↔ İnsan Devralma)
-- conversations: mode, taken_over_by, taken_over_at kolonları eklendi
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'human')),
  ADD COLUMN IF NOT EXISTS taken_over_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS taken_over_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_convs_mode ON public.conversations(organization_id, mode);
