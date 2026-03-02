-- ═══════════════════════════════════════════════════════════════
-- KNOWLEDGE BASE DEĞİŞİKLİK İSTEĞİ SİSTEMİ
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. SUPER ADMIN USERS ────────────────────────────────────────────────────
-- Sadece bu tablodaki user_id'ler /admin rotasına erişebilir

CREATE TABLE IF NOT EXISTS super_admin_users (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- İlk super admin'i ekle (kendi user UUID'ni buraya yaz)
-- Authentication > Users'dan user UUID'ni bul
-- INSERT INTO super_admin_users (user_id, name)
-- VALUES ('<SENIN_USER_UUID>', 'Super Admin');


-- ─── 2. KB CHANGE REQUESTS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kb_change_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES auth.users(id),
  
  -- Hangi tablo/kayıt/alan
  table_name      TEXT NOT NULL CHECK (table_name IN ('clinics', 'services', 'faqs')),
  record_id       UUID NOT NULL,          -- clinics.id / services.id / faqs.id
  record_label    TEXT,                   -- Okunabilir isim (ör: "Rinoplasti", "Fiyat SSS")
  field_name      TEXT NOT NULL,          -- Hangi kolon
  field_label     TEXT,                   -- Okunabilir alan adı
  
  -- Değerler
  old_value       TEXT,
  new_value       TEXT NOT NULL,
  change_note     TEXT,                   -- Klinik'in açıklaması
  
  -- Onay süreci
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  rejection_note  TEXT,
  
  -- Email bildirim
  notification_sent BOOLEAN DEFAULT false,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_requests_clinic  ON kb_change_requests(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_kb_requests_status  ON kb_change_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_requests_user    ON kb_change_requests(requested_by);


-- ─── 3. UPDATED_AT TRİGGER ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_kb_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kb_request_updated_at
  BEFORE UPDATE ON kb_change_requests
  FOR EACH ROW EXECUTE FUNCTION update_kb_request_updated_at();


-- ─── 4. YARDIMCI FONKSİYONLAR ────────────────────────────────────────────────

-- Super admin mi kontrolü
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admin_users WHERE user_id = auth.uid()
  );
$$;


-- ─── 5. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE super_admin_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_change_requests ENABLE ROW LEVEL SECURITY;

-- super_admin_users: sadece super admin görebilir
CREATE POLICY "only super admins can read super_admin_users"
  ON super_admin_users FOR SELECT
  USING (is_super_admin());

-- kb_change_requests SELECT:
--   - Klinik kullanıcısı kendi clinic_id'sini görebilir
--   - Super admin her şeyi görebilir
CREATE POLICY "clinic users can see own requests"
  ON kb_change_requests FOR SELECT
  USING (
    clinic_id = get_my_clinic_id()
    OR is_super_admin()
  );

-- kb_change_requests INSERT: sadece kendi kliniğine istek oluşturabilir
CREATE POLICY "clinic users can insert own requests"
  ON kb_change_requests FOR INSERT
  WITH CHECK (
    clinic_id = get_my_clinic_id()
    AND requested_by = auth.uid()
  );

-- kb_change_requests UPDATE: sadece super admin onaylayabilir/reddedebilir
CREATE POLICY "only super admin can update requests"
  ON kb_change_requests FOR UPDATE
  USING (is_super_admin());

-- clinics UPDATE: sadece super admin güncelleyebilir (onay sonrası)
DROP POLICY IF EXISTS "super admin can update clinics" ON clinics;
CREATE POLICY "super admin can update clinics"
  ON clinics FOR UPDATE
  USING (is_super_admin());

-- services UPDATE: sadece super admin
DROP POLICY IF EXISTS "super admin can update services" ON services;
CREATE POLICY "super admin can update services"
  ON services FOR UPDATE
  USING (is_super_admin());

-- faqs UPDATE/INSERT/DELETE: sadece super admin
DROP POLICY IF EXISTS "super admin can manage faqs" ON faqs;
CREATE POLICY "super admin can manage faqs"
  ON faqs FOR ALL
  USING (is_super_admin());


-- ─── 6. ONAY FONKSİYONU ──────────────────────────────────────────────────────
-- Super admin onayladığında gerçek tabloya yazar

CREATE OR REPLACE FUNCTION approve_kb_change(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req kb_change_requests%ROWTYPE;
  result JSONB;
BEGIN
  -- Sadece super admin çalıştırabilir
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  -- Request'i al
  SELECT * INTO req FROM kb_change_requests WHERE id = request_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İstek bulunamadı veya zaten işlendi');
  END IF;

  -- Gerçek tabloya yaz
  IF req.table_name = 'clinics' THEN
    EXECUTE format(
      'UPDATE clinics SET %I = $1, updated_at = now() WHERE id = $2',
      req.field_name
    ) USING req.new_value, req.record_id;

  ELSIF req.table_name = 'services' THEN
    EXECUTE format(
      'UPDATE services SET %I = $1, updated_at = now() WHERE id = $2',
      req.field_name
    ) USING req.new_value, req.record_id;

  ELSIF req.table_name = 'faqs' THEN
    -- FAQs için yeni kayıt ise INSERT, değilse UPDATE
    IF req.record_id = req.clinic_id THEN
      -- Yeni FAQ (record_id = clinic_id convention)
      -- new_value JSON formatında gelir: {"question_patterns": [...], "answer": "..."}
      INSERT INTO faqs (clinic_id, question_patterns, answer, category, is_active)
      SELECT
        req.clinic_id,
        ARRAY(SELECT jsonb_array_elements_text(val->'question_patterns')),
        val->>'answer',
        val->>'category',
        true
      FROM (SELECT req.new_value::jsonb as val) sub;
    ELSE
      EXECUTE format(
        'UPDATE faqs SET %I = $1 WHERE id = $2',
        req.field_name
      ) USING req.new_value, req.record_id;
    END IF;
  END IF;

  -- Request'i approved yap
  UPDATE kb_change_requests
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 7. RED FONKSİYONU ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reject_kb_change(request_id UUID, note TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  UPDATE kb_change_requests
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    rejection_note = note
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İstek bulunamadı');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 8. EMAİL BİLDİRİM ───────────────────────────────────────────────────────
-- Supabase Dashboard > Authentication > Email Templates'den özelleştirebilirsin.
-- Bildirimler için: Dashboard > Database > Webhooks > yeni webhook ekle
-- Tablo: kb_change_requests, Event: INSERT
-- URL: Supabase Edge Function veya n8n webhook'una yönlendir
-- Bu sayede her yeni istek geldiğinde sana email gider.
--
-- Hızlı kurulum için Supabase Dashboard > Authentication > SMTP Settings'den
-- kendi email adresini gir (Gmail App Password ile çalışır).


-- ─── KURULUM TAMAMLANDI ──────────────────────────────────────────────────────
SELECT 'kb_change_requests sistemi hazır ✅' as durum;
