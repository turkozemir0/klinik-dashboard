-- ═══════════════════════════════════════════════════════════════
-- ONBOARDING SİSTEMİ REFACTOR
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. DAVETİYE TOKEN TABLOSU ───────────────────────────────
CREATE TABLE IF NOT EXISTS invite_tokens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by  UUID REFERENCES auth.users(id),
  used_by     UUID REFERENCES auth.users(id),
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  is_used     BOOLEAN DEFAULT false,
  note        TEXT, -- Admin notu (hangi klinik için)
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Herkes token okuyabilir (register sayfası kontrol eder)
CREATE POLICY "anyone can read token"
  ON invite_tokens FOR SELECT
  USING (true);

-- Sadece admin oluşturabilir
CREATE POLICY "admin can create token"
  ON invite_tokens FOR INSERT
  WITH CHECK (is_super_admin());

-- Sadece admin veya token kullanan güncelleyebilir
CREATE POLICY "admin or user can update token"
  ON invite_tokens FOR UPDATE
  USING (is_super_admin() OR used_by = auth.uid());


-- ─── 2. ONBOARDING SUBMISSIONS (ONAY BEKLİYEN VERİ) ─────────
CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  section       TEXT NOT NULL CHECK (section IN ('profile', 'services', 'faqs')),

  -- Ham veri (klinik ne girdiyse)
  data          JSONB NOT NULL,

  -- Durum
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Admin
  reviewed_by   UUID REFERENCES auth.users(id),
  reviewed_at   TIMESTAMPTZ,
  rejection_note TEXT,

  submitted_at  TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE (clinic_id, section) -- Her section için 1 pending submission
);

CREATE INDEX IF NOT EXISTS idx_submissions_status  ON onboarding_submissions(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_clinic  ON onboarding_submissions(clinic_id);

ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic can see own submissions"
  ON onboarding_submissions FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

CREATE POLICY "clinic can upsert own submissions"
  ON onboarding_submissions FOR INSERT
  WITH CHECK (clinic_id = get_my_clinic_id());

CREATE POLICY "clinic can update own pending submissions"
  ON onboarding_submissions FOR UPDATE
  USING (clinic_id = get_my_clinic_id() AND status = 'pending');

CREATE POLICY "admin can update all submissions"
  ON onboarding_submissions FOR UPDATE
  USING (is_super_admin());

-- updated_at trigger
CREATE TRIGGER trg_submission_updated_at
  BEFORE UPDATE ON onboarding_submissions
  FOR EACH ROW EXECUTE FUNCTION update_kb_request_updated_at();


-- ─── 3. CLİNİCS tablosuna klinik tipi kolonu ─────────────────
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS clinic_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS clinic_type_other TEXT;


-- ─── 4. TOKEN KULLANIM FONKSİYONU ────────────────────────────
CREATE OR REPLACE FUNCTION use_invite_token(p_token TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tok invite_tokens%ROWTYPE;
BEGIN
  SELECT * INTO tok FROM invite_tokens
  WHERE token = p_token
    AND is_used = false
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geçersiz veya süresi dolmuş davetiye');
  END IF;

  UPDATE invite_tokens SET
    is_used  = true,
    used_by  = p_user_id,
    used_at  = now()
  WHERE id = tok.id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 5. ONBOARDING SUBMISSION ONAY FONKSİYONU ────────────────
CREATE OR REPLACE FUNCTION approve_onboarding_submission(p_submission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub onboarding_submissions%ROWTYPE;
  svc JSONB;
  faq JSONB;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  SELECT * INTO sub FROM onboarding_submissions WHERE id = p_submission_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission bulunamadı');
  END IF;

  -- ── PROFİL ONAYI ─────────────────────────────────────────
  IF sub.section = 'profile' THEN
    UPDATE clinics SET
      phone                        = sub.data->>'phone',
      email                        = COALESCE(sub.data->>'email', email),
      address                      = sub.data->>'address',
      parking_info                 = sub.data->>'parking_info',
      consultation_fee             = sub.data->>'consultation_fee',
      cancellation_policy          = sub.data->>'cancellation_policy',
      pricing_policy               = sub.data->>'pricing_policy',
      greeting_message             = sub.data->>'greeting_message',
      lead_doctor_name             = sub.data->>'lead_doctor_name',
      lead_doctor_title            = sub.data->>'lead_doctor_title',
      lead_doctor_experience_years = NULLIF(sub.data->>'lead_doctor_experience_years', '')::int,
      lead_doctor_credentials      = sub.data->>'lead_doctor_credentials',
      clinic_types                 = ARRAY(SELECT jsonb_array_elements_text(COALESCE(sub.data->'clinic_types', '[]'::jsonb))),
      clinic_type_other            = sub.data->>'clinic_type_other',
      updated_at                   = now()
    WHERE id = sub.clinic_id;

  -- ── HİZMETLER ONAYI ──────────────────────────────────────
  ELSIF sub.section = 'services' THEN
    -- Mevcut servisleri sil, yeniden ekle
    DELETE FROM services WHERE clinic_id = sub.clinic_id;

    FOR svc IN SELECT * FROM jsonb_array_elements(sub.data->'services')
    LOOP
      INSERT INTO services (
        clinic_id, service_key, display_name, category,
        description_for_ai, procedure_duration, anesthesia_type,
        recovery_time, final_result_time, pricing_response,
        is_active, sort_order
      ) VALUES (
        sub.clinic_id,
        COALESCE(svc->>'service_key', lower(regexp_replace(svc->>'display_name', '[^a-zA-Z0-9]+', '_', 'g'))),
        svc->>'display_name',
        svc->>'category',
        svc->>'description_for_ai',
        svc->>'procedure_duration',
        svc->>'anesthesia_type',
        svc->>'recovery_time',
        svc->>'final_result_time',
        svc->>'pricing_response',
        true,
        (svc->>'sort_order')::int
      );
    END LOOP;

  -- ── SSS ONAYI ─────────────────────────────────────────────
  ELSIF sub.section = 'faqs' THEN
    DELETE FROM faqs WHERE clinic_id = sub.clinic_id;

    FOR faq IN SELECT * FROM jsonb_array_elements(sub.data->'faqs')
    LOOP
      INSERT INTO faqs (clinic_id, question_patterns, answer, category, is_active)
      VALUES (
        sub.clinic_id,
        ARRAY(SELECT jsonb_array_elements_text(faq->'question_patterns')),
        faq->>'answer',
        COALESCE(faq->>'category', 'genel'),
        true
      );
    END LOOP;
  END IF;

  -- Submission'ı onayla
  UPDATE onboarding_submissions SET
    status      = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_submission_id;

  -- Onboarding progress güncelle
  PERFORM update_onboarding_progress(
    sub.clinic_id,
    CASE sub.section
      WHEN 'profile'   THEN 2
      WHEN 'services'  THEN 3
      WHEN 'faqs'      THEN 4
    END,
    CASE WHEN sub.section = 'profile'  THEN true ELSE NULL END,
    CASE WHEN sub.section = 'services' THEN true ELSE NULL END,
    CASE WHEN sub.section = 'faqs'     THEN true ELSE NULL END
  );

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 6. SUBMISSION RED FONKSİYONU ────────────────────────────
CREATE OR REPLACE FUNCTION reject_onboarding_submission(p_submission_id UUID, p_note TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  UPDATE onboarding_submissions SET
    status         = 'rejected',
    reviewed_by    = auth.uid(),
    reviewed_at    = now(),
    rejection_note = p_note
  WHERE id = p_submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission bulunamadı');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 7. DAVETİYE TOKEN OLUŞTURMA FONKSİYONU ─────────────────
CREATE OR REPLACE FUNCTION create_invite_token(p_note TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token TEXT;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  INSERT INTO invite_tokens (created_by, note)
  VALUES (auth.uid(), p_note)
  RETURNING token INTO new_token;

  RETURN jsonb_build_object('success', true, 'token', new_token);
END;
$$;

-- Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE invite_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_submissions;

SELECT 'Onboarding refactor tamamlandı ✅' as durum;
