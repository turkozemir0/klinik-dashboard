-- ═══════════════════════════════════════════════════════════════
-- stoaix AI Klinik System — FONKSİYONLAR & TRİGGERLAR
-- 01_schema.sql'den sonra çalıştır
-- ═══════════════════════════════════════════════════════════════

-- ─── UPDATED_AT TRİGGER FONKSİYONU ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları tablolara bağla
CREATE OR REPLACE TRIGGER trg_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_kb_requests_updated_at
  BEFORE UPDATE ON public.kb_change_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_onboarding_submissions_updated_at
  BEFORE UPDATE ON public.onboarding_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── KB METADATA SYNC TRİGGER ─────────────────────────────────
CREATE OR REPLACE FUNCTION sync_kb_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.clinic_id := (NEW.metadata->>'clinic_id')::uuid;
  NEW.source_type := NEW.metadata->>'source_type';
  NEW.source_id := (NEW.metadata->>'source_id')::uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_kb_metadata
  BEFORE INSERT ON public.kb_documents
  FOR EACH ROW EXECUTE FUNCTION sync_kb_metadata();

-- ─── YARDIMCI FONKSİYONLAR ────────────────────────────────────

-- Mevcut kullanıcının clinic_id'sini döndürür
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT clinic_id
  FROM public.clinic_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Super admin kontrolü
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()
  );
$$;

-- INT dizisine tekrarsız eleman ekle
CREATE OR REPLACE FUNCTION array_append_unique(arr integer[], val integer)
RETURNS integer[] AS $$
  SELECT ARRAY(SELECT DISTINCT unnest(arr || ARRAY[val]) ORDER BY 1);
$$ LANGUAGE sql IMMUTABLE;

-- ─── VEKTÖR ARAMA FONKSİYONU ──────────────────────────────────
CREATE OR REPLACE FUNCTION match_kb_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter jsonb DEFAULT '{}'
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb_documents.id,
    kb_documents.content,
    kb_documents.metadata,
    1 - (kb_documents.embedding <=> query_embedding) AS similarity
  FROM public.kb_documents
  WHERE 1 - (kb_documents.embedding <=> query_embedding) > match_threshold
    AND kb_documents.metadata @> filter
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- ─── ONBOARDING FONKSİYONLARI ─────────────────────────────────

-- Token kullan
CREATE OR REPLACE FUNCTION use_invite_token(p_token text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  tok invite_tokens%ROWTYPE;
BEGIN
  SELECT * INTO tok
  FROM public.invite_tokens
  WHERE token = p_token AND is_used = false AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geçersiz veya süresi dolmuş davetiye');
  END IF;

  UPDATE public.invite_tokens
  SET is_used = true, used_by = p_user_id, used_at = now()
  WHERE id = tok.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Token oluştur (sadece super admin)
CREATE OR REPLACE FUNCTION create_invite_token(p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  new_token text;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  INSERT INTO public.invite_tokens (created_by, note)
  VALUES (auth.uid(), p_note)
  RETURNING token INTO new_token;

  RETURN jsonb_build_object('success', true, 'token', new_token);
END;
$$;

-- Başvuru onayla
CREATE OR REPLACE FUNCTION approve_registration(reg_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  reg clinic_registrations%ROWTYPE;
  new_clinic_id uuid;
  slug_val text;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  SELECT * INTO reg FROM public.clinic_registrations
  WHERE id = reg_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Başvuru bulunamadı');
  END IF;

  -- Slug oluştur
  slug_val := lower(regexp_replace(reg.clinic_name, '[^a-zA-Z0-9]+', '-', 'g'));

  -- Benzersiz yap
  WHILE EXISTS (SELECT 1 FROM public.clinics WHERE slug = slug_val) LOOP
    slug_val := slug_val || '-' || floor(random() * 900 + 100)::text;
  END LOOP;

  -- Klinik oluştur
  INSERT INTO public.clinics (
    name, slug, clinic_type, status, email, city,
    is_approved, onboarding_status
  ) VALUES (
    reg.clinic_name, slug_val, reg.clinic_type,
    'active', reg.contact_email, reg.city,
    true, 'not_started'
  ) RETURNING id INTO new_clinic_id;

  -- Kullanıcıyı kliniğe bağla
  INSERT INTO public.clinic_users (user_id, clinic_id, role)
  VALUES (reg.user_id, new_clinic_id, 'admin');

  -- Onboarding progress başlat
  INSERT INTO public.onboarding_progress (clinic_id)
  VALUES (new_clinic_id);

  -- Registration'ı güncelle
  UPDATE public.clinic_registrations
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = reg_id;

  RETURN jsonb_build_object('success', true, 'clinic_id', new_clinic_id);
END;
$$;

-- Başvuru reddet
CREATE OR REPLACE FUNCTION reject_registration(reg_id uuid, note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  UPDATE public.clinic_registrations
  SET status = 'rejected', reviewed_by = auth.uid(),
      reviewed_at = now(), rejection_note = note
  WHERE id = reg_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Başvuru bulunamadı');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Onboarding ilerlemeyi güncelle
CREATE OR REPLACE FUNCTION update_onboarding_progress(
  p_clinic_id uuid,
  p_step integer,
  p_profile_done boolean DEFAULT NULL,
  p_services_done boolean DEFAULT NULL,
  p_faqs_done boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  prog onboarding_progress%ROWTYPE;
  pct integer;
  done boolean;
BEGIN
  SELECT * INTO prog FROM public.onboarding_progress
  WHERE clinic_id = p_clinic_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Progress bulunamadı');
  END IF;

  UPDATE public.onboarding_progress SET
    current_step = GREATEST(current_step, p_step),
    completed_steps = array_append_unique(completed_steps, p_step - 1),
    profile_done = COALESCE(p_profile_done, profile_done),
    services_done = COALESCE(p_services_done, services_done),
    faqs_done = COALESCE(p_faqs_done, faqs_done)
  WHERE clinic_id = p_clinic_id
  RETURNING * INTO prog;

  -- Yüzde hesapla: profil %40, hizmetler %35, SSS %25
  pct := 0;
  IF prog.profile_done THEN pct := pct + 40; END IF;
  IF prog.services_done THEN pct := pct + 35; END IF;
  IF prog.faqs_done THEN pct := pct + 25; END IF;

  done := prog.profile_done AND prog.services_done;

  UPDATE public.onboarding_progress SET
    completion_pct = pct,
    is_completed = done,
    completed_at = CASE WHEN done AND NOT is_completed THEN now() ELSE completed_at END
  WHERE clinic_id = p_clinic_id;

  UPDATE public.clinics SET
    onboarding_status = CASE WHEN done THEN 'completed' ELSE 'in_progress' END
  WHERE id = p_clinic_id;

  RETURN jsonb_build_object('success', true, 'completion_pct', pct, 'is_completed', done);
END;
$$;

-- Submission onayla
CREATE OR REPLACE FUNCTION approve_onboarding_submission(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  sub           onboarding_submissions%ROWTYPE;
  svc           jsonb;
  faq           jsonb;
  incoming_keys text[];
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  SELECT * INTO sub FROM public.onboarding_submissions
  WHERE id = p_submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission bulunamadı');
  END IF;

  -- Profil onayı
  IF sub.section = 'profile' THEN
    UPDATE public.clinics SET
      phone = sub.data->>'phone',
      email = COALESCE(sub.data->>'email', email),
      address = sub.data->>'address',
      parking_info = sub.data->>'parking_info',
      consultation_fee = sub.data->>'consultation_fee',
      cancellation_policy = sub.data->>'cancellation_policy',
      pricing_policy = sub.data->>'pricing_policy',
      greeting_message = sub.data->>'greeting_message',
      lead_doctor_name = sub.data->>'lead_doctor_name',
      lead_doctor_title = sub.data->>'lead_doctor_title',
      lead_doctor_experience_years = NULLIF(sub.data->>'lead_doctor_experience_years', '')::int,
      lead_doctor_credentials = sub.data->>'lead_doctor_credentials',
      clinic_types = ARRAY(SELECT jsonb_array_elements_text(COALESCE(sub.data->'clinic_types', '[]'::jsonb))),
      clinic_type_other = sub.data->>'clinic_type_other',
      updated_at = now()
    WHERE id = sub.clinic_id;

  -- Hizmetler onayı — UPSERT ile mevcut kayıtları koru, yenileri ekle
  ELSIF sub.section = 'services' THEN
    -- Gelen listedeki service_key'leri topla
    incoming_keys := ARRAY(
      SELECT COALESCE(
        elem->>'service_key',
        lower(regexp_replace(elem->>'display_name', '[^a-zA-Z0-9]+', '_', 'g'))
      )
      FROM jsonb_array_elements(sub.data->'services') AS elem
    );

    FOR svc IN SELECT * FROM jsonb_array_elements(sub.data->'services') LOOP
      INSERT INTO public.services (
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
      )
      ON CONFLICT (clinic_id, service_key) DO UPDATE SET
        display_name         = EXCLUDED.display_name,
        category             = EXCLUDED.category,
        description_for_ai   = EXCLUDED.description_for_ai,
        procedure_duration   = EXCLUDED.procedure_duration,
        anesthesia_type      = EXCLUDED.anesthesia_type,
        recovery_time        = EXCLUDED.recovery_time,
        final_result_time    = EXCLUDED.final_result_time,
        pricing_response     = EXCLUDED.pricing_response,
        is_active            = true,
        sort_order           = EXCLUDED.sort_order,
        updated_at           = now();
    END LOOP;

    -- Onboarding'de artık olmayan hizmetleri pasife al (silmez, deaktif eder)
    UPDATE public.services
    SET is_active = false, updated_at = now()
    WHERE clinic_id = sub.clinic_id
      AND service_key <> ALL(incoming_keys);

  -- SSS onayı — mevcut SSS'leri sil ve yeniden oluştur
  -- (faqs'ta unique key olmadığından sil+insert daha temiz)
  ELSIF sub.section = 'faqs' THEN
    DELETE FROM public.faqs WHERE clinic_id = sub.clinic_id;

    FOR faq IN SELECT * FROM jsonb_array_elements(sub.data->'faqs') LOOP
      INSERT INTO public.faqs (clinic_id, question_patterns, answer, category, is_active)
      VALUES (
        sub.clinic_id,
        ARRAY(SELECT jsonb_array_elements_text(faq->'question_patterns')),
        faq->>'answer',
        COALESCE(faq->>'category', 'genel'),
        true
      );
    END LOOP;
  END IF;

  -- Submission'ı güncelle
  UPDATE public.onboarding_submissions
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_submission_id;

  -- Progress güncelle
  PERFORM update_onboarding_progress(
    sub.clinic_id,
    CASE sub.section WHEN 'profile' THEN 2 WHEN 'services' THEN 3 WHEN 'faqs' THEN 4 END,
    CASE WHEN sub.section = 'profile' THEN true ELSE NULL END,
    CASE WHEN sub.section = 'services' THEN true ELSE NULL END,
    CASE WHEN sub.section = 'faqs' THEN true ELSE NULL END
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Submission reddet
CREATE OR REPLACE FUNCTION reject_onboarding_submission(p_submission_id uuid, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  UPDATE public.onboarding_submissions
  SET status = 'rejected', reviewed_by = auth.uid(),
      reviewed_at = now(), rejection_note = p_note
  WHERE id = p_submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission bulunamadı');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── KB CHANGE REQUEST FONKSİYONLARI ──────────────────────────

-- KB değişikliği onayla
CREATE OR REPLACE FUNCTION approve_kb_change(request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  req kb_change_requests%ROWTYPE;
  parsed jsonb;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  SELECT * INTO req FROM public.kb_change_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İstek bulunamadı veya zaten işlendi');
  END IF;

  -- Yeni hizmet ekleme
  IF req.field_name = '__new_service__' THEN
    parsed := req.new_value::jsonb;
    INSERT INTO public.services (
      clinic_id, service_key, display_name, category,
      description_for_ai, procedure_duration, anesthesia_type,
      recovery_time, final_result_time, pricing_response, is_active, sort_order
    ) VALUES (
      req.clinic_id,
      COALESCE(parsed->>'service_key', lower(replace(parsed->>'display_name', ' ', '_'))),
      parsed->>'display_name', parsed->>'category', parsed->>'description_for_ai',
      parsed->>'procedure_duration', parsed->>'anesthesia_type', parsed->>'recovery_time',
      parsed->>'final_result_time', parsed->>'pricing_response', true,
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.services WHERE clinic_id = req.clinic_id)
    );

  -- Yeni SSS ekleme
  ELSIF req.field_name = '__new_faq__' THEN
    parsed := req.new_value::jsonb;
    INSERT INTO public.faqs (clinic_id, question_patterns, answer, category, is_active)
    VALUES (
      req.clinic_id,
      ARRAY(SELECT jsonb_array_elements_text(parsed->'question_patterns')),
      parsed->>'answer',
      COALESCE(parsed->>'category', 'genel'),
      true
    );

  -- Mevcut kayıt güncelleme
  ELSIF req.table_name = 'clinics' THEN
    EXECUTE format('UPDATE public.clinics SET %I = $1, updated_at = now() WHERE id = $2', req.field_name)
    USING req.new_value, req.record_id;

  ELSIF req.table_name = 'services' THEN
    EXECUTE format('UPDATE public.services SET %I = $1, updated_at = now() WHERE id = $2', req.field_name)
    USING req.new_value, req.record_id;

  ELSIF req.table_name = 'faqs' THEN
    EXECUTE format('UPDATE public.faqs SET %I = $1 WHERE id = $2', req.field_name)
    USING req.new_value, req.record_id;
  END IF;

  UPDATE public.kb_change_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- KB değişikliği reddet
CREATE OR REPLACE FUNCTION reject_kb_change(request_id uuid, note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  UPDATE public.kb_change_requests
  SET status = 'rejected', reviewed_by = auth.uid(),
      reviewed_at = now(), rejection_note = note
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İstek bulunamadı');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── DESTEK FONKSİYONLARI ─────────────────────────────────────

-- Destek talebine yanıt ver
CREATE OR REPLACE FUNCTION reply_support_ticket(
  ticket_id uuid,
  reply_text text,
  new_status text DEFAULT 'in_progress'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  UPDATE public.support_tickets SET
    admin_reply = reply_text,
    replied_by = auth.uid(),
    replied_at = now(),
    status = new_status,
    resolved_at = CASE WHEN new_status = 'resolved' THEN now() ELSE NULL END
  WHERE id = ticket_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket bulunamadı');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── SERVICE_PERFORMANCE VIEW ─────────────────────────────────
-- get_my_clinic_id() filtresi kaldırıldı — RLS üzerinden izolasyon sağlanır,
-- admin tüm klinikleri, klinik kullanıcıları kendi verisini görür.
CREATE OR REPLACE VIEW service_performance AS
SELECT
  conv.clinic_id,
  conv.collected_data->>'interested_service' AS service,
  COUNT(*) AS total_leads,
  ROUND(AVG(conv.lead_score), 1) AS avg_score,
  COUNT(*) FILTER (WHERE conv.handoff_triggered = true) AS handoffs,
  ROUND(
    COUNT(*) FILTER (WHERE conv.handoff_triggered = true)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  ) AS conversion_rate_pct
FROM public.conversations conv
WHERE conv.collected_data->>'interested_service' IS NOT NULL
GROUP BY conv.clinic_id, conv.collected_data->>'interested_service';

SELECT 'Fonksiyonlar kurulumu tamamlandı ✅' as durum;
