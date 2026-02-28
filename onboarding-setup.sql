-- ═══════════════════════════════════════════════════════════════
-- ONBOARDING SİSTEMİ
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. KLİNİK KAYIT BAŞVURULARI ─────────────────────────────
CREATE TABLE IF NOT EXISTS clinic_registrations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Başvuru bilgileri
  clinic_name     TEXT NOT NULL,
  contact_name    TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,
  contact_email   TEXT NOT NULL,
  city            TEXT,
  clinic_type     TEXT DEFAULT 'estetik_cerrahi',
  message         TEXT, -- "Bizi nasıl duydunuz / not"

  -- Onay süreci
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  rejection_note  TEXT,

  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registrations_status ON clinic_registrations(status, created_at DESC);

ALTER TABLE clinic_registrations ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi başvurusunu görebilir
CREATE POLICY "user can see own registration"
  ON clinic_registrations FOR SELECT
  USING (user_id = auth.uid() OR is_super_admin());

-- Kullanıcı kendi başvurusunu oluşturabilir
CREATE POLICY "user can create registration"
  ON clinic_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Sadece admin güncelleyebilir
CREATE POLICY "admin can update registrations"
  ON clinic_registrations FOR UPDATE
  USING (is_super_admin());


-- ─── 2. ONBOARDING PROGRESS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,

  -- Hangi adımdalar
  current_step    INT NOT NULL DEFAULT 1, -- 1=Profil, 2=Hizmetler, 3=SSS, 4=Tamamlandı
  completed_steps INT[] DEFAULT '{}',     -- Tamamlanan adımlar [1,2] gibi

  -- Tamamlama yüzdesi (hesaplanmış)
  completion_pct  INT NOT NULL DEFAULT 0,

  -- Zorunlu alanlar tamamlandı mı?
  profile_done    BOOLEAN DEFAULT false,
  services_done   BOOLEAN DEFAULT false, -- En az 1 hizmet eklendi mi
  faqs_done       BOOLEAN DEFAULT false, -- En az 1 SSS eklendi mi

  -- Onboarding bitti mi?
  is_completed    BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic can see own progress"
  ON onboarding_progress FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

CREATE POLICY "clinic can update own progress"
  ON onboarding_progress FOR ALL
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

-- updated_at trigger
CREATE TRIGGER trg_onboarding_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_kb_request_updated_at();


-- ─── 3. CLİNİCS tablosuna onboarding kolonları ───────────────
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started','in_progress','completed')),
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;


-- ─── 4. KAYIT ONAY FONKSİYONU ────────────────────────────────
-- Admin onayladığında:
--   1. clinics tablosuna klinik ekler
--   2. clinic_users bağlar
--   3. onboarding_progress oluşturur
--   4. Registration'ı approved yapar

CREATE OR REPLACE FUNCTION approve_registration(reg_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reg    clinic_registrations%ROWTYPE;
  new_clinic_id UUID;
  slug_val TEXT;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  SELECT * INTO reg FROM clinic_registrations WHERE id = reg_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Başvuru bulunamadı');
  END IF;

  -- Slug oluştur
  slug_val := lower(regexp_replace(reg.clinic_name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Benzersiz yap
  WHILE EXISTS (SELECT 1 FROM clinics WHERE slug = slug_val) LOOP
    slug_val := slug_val || '-' || floor(random() * 900 + 100)::text;
  END LOOP;

  -- Klinik oluştur
  INSERT INTO clinics (
    name, slug, clinic_type, status, email, city,
    is_approved, onboarding_status
  ) VALUES (
    reg.clinic_name,
    slug_val,
    reg.clinic_type,
    'active',
    reg.contact_email,
    reg.city,
    true,
    'not_started'
  ) RETURNING id INTO new_clinic_id;

  -- Kullanıcıyı kliniğe bağla
  INSERT INTO clinic_users (user_id, clinic_id, role)
  VALUES (reg.user_id, new_clinic_id, 'admin');

  -- Onboarding progress başlat
  INSERT INTO onboarding_progress (clinic_id)
  VALUES (new_clinic_id);

  -- Registration'ı güncelle
  UPDATE clinic_registrations
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = reg_id;

  RETURN jsonb_build_object('success', true, 'clinic_id', new_clinic_id);
END;
$$;


-- ─── 5. KAYIT RED FONKSİYONU ─────────────────────────────────
CREATE OR REPLACE FUNCTION reject_registration(reg_id UUID, note TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  UPDATE clinic_registrations
  SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), rejection_note = note
  WHERE id = reg_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Başvuru bulunamadı');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 6. ONBOARDING TAMAMLAMA FONKSİYONU ─────────────────────
CREATE OR REPLACE FUNCTION update_onboarding_progress(
  p_clinic_id    UUID,
  p_step         INT,
  p_profile_done BOOLEAN DEFAULT NULL,
  p_services_done BOOLEAN DEFAULT NULL,
  p_faqs_done    BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prog onboarding_progress%ROWTYPE;
  pct  INT;
  done BOOLEAN;
BEGIN
  SELECT * INTO prog FROM onboarding_progress WHERE clinic_id = p_clinic_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Progress bulunamadı');
  END IF;

  -- Alanları güncelle
  UPDATE onboarding_progress SET
    current_step    = GREATEST(current_step, p_step),
    completed_steps = array_append_unique(completed_steps, p_step - 1),
    profile_done    = COALESCE(p_profile_done,  profile_done),
    services_done   = COALESCE(p_services_done, services_done),
    faqs_done       = COALESCE(p_faqs_done,     faqs_done)
  WHERE clinic_id = p_clinic_id
  RETURNING * INTO prog;

  -- Tamamlama yüzdesi hesapla (profil %40, hizmetler %35, SSS %25)
  pct := 0;
  IF prog.profile_done   THEN pct := pct + 40; END IF;
  IF prog.services_done  THEN pct := pct + 35; END IF;
  IF prog.faqs_done      THEN pct := pct + 25; END IF;

  done := prog.profile_done AND prog.services_done;

  UPDATE onboarding_progress SET
    completion_pct = pct,
    is_completed   = done,
    completed_at   = CASE WHEN done AND NOT is_completed THEN now() ELSE completed_at END
  WHERE clinic_id = p_clinic_id;

  -- Clinics tablosunu güncelle
  UPDATE clinics SET
    onboarding_status = CASE WHEN done THEN 'completed' ELSE 'in_progress' END
  WHERE id = p_clinic_id;

  RETURN jsonb_build_object('success', true, 'completion_pct', pct, 'is_completed', done);
END;
$$;

-- array_append_unique yardımcı fonksiyonu
CREATE OR REPLACE FUNCTION array_append_unique(arr INT[], val INT)
RETURNS INT[] AS $$
  SELECT ARRAY(SELECT DISTINCT unnest(arr || ARRAY[val]) ORDER BY 1);
$$ LANGUAGE sql IMMUTABLE;

-- Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE clinic_registrations;

SELECT 'Onboarding sistemi hazır ✅' as durum;
