-- ═══════════════════════════════════════════════════════════════
-- Faz 1A — Rol Sistemi Genişletme
-- org_users: patron, satisci, muhasebe rolleri eklendi
-- invite_tokens: role kolonu eklendi
-- leads.assigned_to: uuid FK'ya çevrildi
-- ═══════════════════════════════════════════════════════════════

-- org_users.role CHECK constraint genişletilir
ALTER TABLE public.org_users DROP CONSTRAINT IF EXISTS org_users_role_check;
ALTER TABLE public.org_users ADD CONSTRAINT org_users_role_check
  CHECK (role IN ('admin', 'viewer', 'yönetici', 'satisci', 'muhasebe'));

-- invite_tokens'a role kolonu eklenir
ALTER TABLE public.invite_tokens
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
  CHECK (role IN ('admin', 'viewer', 'yönetici', 'satisci', 'muhasebe'));

-- leads.assigned_to: text → uuid FK (mevcut null verilerle uyumlu)
ALTER TABLE public.leads ALTER COLUMN assigned_to TYPE uuid USING NULL;
ALTER TABLE public.leads ADD CONSTRAINT leads_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
