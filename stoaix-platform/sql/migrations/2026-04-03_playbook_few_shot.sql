-- Playbook'a few_shot_examples kolonu ekle
-- Format: [{"user": "...", "assistant": "..."}]
-- Maksimum 3-5 örnek önerilir. Varsayılan boş array.

ALTER TABLE public.agent_playbooks
  ADD COLUMN IF NOT EXISTS few_shot_examples jsonb NOT NULL DEFAULT '[]'::jsonb;
