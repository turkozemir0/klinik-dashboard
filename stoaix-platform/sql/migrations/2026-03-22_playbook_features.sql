-- Playbook features flag kolonu
-- Her özellik org/kanal bazında açılıp kapatılabilir
-- İlk feature: calendar_booking (GHL Calendar API entegrasyonu)

ALTER TABLE public.agent_playbooks
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{"calendar_booking": false}'::jsonb;
