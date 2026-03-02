-- ═══════════════════════════════════════════════════════════════
-- KLİNİK DASHBOARD — SUPABASE AUTH + RLS KURULUMU
-- Bu dosyayı Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. CLİNİC USERS TABLOSU ─────────────────────────────────────────────────
-- Her auth user'ı bir klinik + role ile eşleştirir

CREATE TABLE IF NOT EXISTS clinic_users (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id  UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_clinic_users_user ON clinic_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic ON clinic_users(clinic_id);


-- ─── 2. ROW LEVEL SECURITY — AÇMA ────────────────────────────────────────────

ALTER TABLE clinics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_users  ENABLE ROW LEVEL SECURITY;


-- ─── 3. YARDIMCI FONKSİYON ───────────────────────────────────────────────────
-- Mevcut kullanıcının clinic_id'sini döndürür (her policy'de tekrar kullanılır)

CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT clinic_id
  FROM clinic_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;


-- ─── 4. RLS POLİCİES ─────────────────────────────────────────────────────────

-- CLINICS
DROP POLICY IF EXISTS "clinic_users can read own clinic" ON clinics;
CREATE POLICY "clinic_users can read own clinic"
  ON clinics FOR SELECT
  USING (id = get_my_clinic_id());

-- CLINIC_USERS (kendi kaydını görüntüleyebilir)
DROP POLICY IF EXISTS "users can see own clinic_user row" ON clinic_users;
CREATE POLICY "users can see own clinic_user row"
  ON clinic_users FOR SELECT
  USING (user_id = auth.uid());

-- CONVERSATIONS
DROP POLICY IF EXISTS "clinic users can read own conversations" ON conversations;
CREATE POLICY "clinic users can read own conversations"
  ON conversations FOR SELECT
  USING (clinic_id = get_my_clinic_id());

-- MESSAGES
DROP POLICY IF EXISTS "clinic users can read own messages" ON messages;
CREATE POLICY "clinic users can read own messages"
  ON messages FOR SELECT
  USING (clinic_id = get_my_clinic_id());

-- HANDOFF LOGS
DROP POLICY IF EXISTS "clinic users can read own handoff logs" ON handoff_logs;
CREATE POLICY "clinic users can read own handoff logs"
  ON handoff_logs FOR SELECT
  USING (clinic_id = get_my_clinic_id());

-- SERVICES
DROP POLICY IF EXISTS "clinic users can read own services" ON services;
CREATE POLICY "clinic users can read own services"
  ON services FOR SELECT
  USING (clinic_id = get_my_clinic_id());

-- FAQS
DROP POLICY IF EXISTS "clinic users can read own faqs" ON faqs;
CREATE POLICY "clinic users can read own faqs"
  ON faqs FOR SELECT
  USING (clinic_id = get_my_clinic_id());

-- DAILY STATS
DROP POLICY IF EXISTS "clinic users can read own daily stats" ON daily_stats;
CREATE POLICY "clinic users can read own daily stats"
  ON daily_stats FOR SELECT
  USING (clinic_id = get_my_clinic_id());


-- ─── 5. VIEW'LARA RLS DESTEĞI ────────────────────────────────────────────────
-- Mevcut service_performance view'ı güncelle — clinic_id filtreli

CREATE OR REPLACE VIEW service_performance AS
SELECT
  conv.clinic_id,
  conv.collected_data->>'interested_service' as service,
  COUNT(*) as total_leads,
  ROUND(AVG(conv.lead_score), 1) as avg_score,
  COUNT(*) FILTER (WHERE conv.handoff_triggered = true) as handoffs,
  ROUND(
    COUNT(*) FILTER (WHERE conv.handoff_triggered = true)::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 1
  ) as conversion_rate_pct
FROM conversations conv
WHERE conv.collected_data->>'interested_service' IS NOT NULL
  AND conv.clinic_id = get_my_clinic_id()   -- ← RLS burada da devrede
GROUP BY conv.clinic_id, conv.collected_data->>'interested_service';


-- ─── 6. KULLANICI EKLEME — ÖRNEK ─────────────────────────────────────────────
-- Supabase Authentication > Users'dan kullanıcı oluşturduktan sonra
-- aşağıdaki komutu çalıştır:

-- INSERT INTO clinic_users (user_id, clinic_id, role)
-- VALUES (
--   '<auth.users tablosundaki user UUID>',
--   '<clinics tablosundaki clinic UUID>',
--   'admin'   -- veya 'viewer'
-- );

-- Örnek (gerçek UUID'leri değiştir):
-- INSERT INTO clinic_users (user_id, clinic_id, role)
-- VALUES (
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--   'f0e1d2c3-b4a5-6789-0abc-def123456789',
--   'admin'
-- );
