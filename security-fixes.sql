-- ═══════════════════════════════════════════════════════════════
-- GÜVENLİK DÜZELTMELERİ
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. FIELD_NAME WHITELIST ──────────────────────────────────
-- Klinik sadece izin verilen alanları güncelleyebilir

CREATE OR REPLACE FUNCTION approve_kb_change(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req kb_change_requests%ROWTYPE;
  parsed JSONB;

  -- İzin verilen alanlar — klinik başka bir şey gönderemez
  allowed_clinic_fields  TEXT[] := ARRAY[
    'phone','email','address','parking_info','consultation_fee',
    'cancellation_policy','pricing_policy','greeting_message'
  ];
  allowed_service_fields TEXT[] := ARRAY[
    'description_for_ai','procedure_duration','anesthesia_type',
    'recovery_time','final_result_time','pricing_response'
  ];
  allowed_faq_fields     TEXT[] := ARRAY['answer'];
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  SELECT * INTO req FROM kb_change_requests WHERE id = request_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İstek bulunamadı');
  END IF;

  -- ── YENİ HİZMET ────────────────────────────────────────────
  IF req.field_name = '__new_service__' THEN
    parsed := req.new_value::jsonb;
    INSERT INTO services (
      clinic_id, service_key, display_name, category,
      description_for_ai, procedure_duration, anesthesia_type,
      recovery_time, final_result_time, pricing_response,
      is_active, sort_order
    ) VALUES (
      req.clinic_id,
      COALESCE(parsed->>'service_key', lower(replace(parsed->>'display_name', ' ', '_'))),
      parsed->>'display_name',
      parsed->>'category',
      parsed->>'description_for_ai',
      parsed->>'procedure_duration',
      parsed->>'anesthesia_type',
      parsed->>'recovery_time',
      parsed->>'final_result_time',
      parsed->>'pricing_response',
      true,
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services WHERE clinic_id = req.clinic_id)
    );

  -- ── YENİ SSS ───────────────────────────────────────────────
  ELSIF req.field_name = '__new_faq__' THEN
    parsed := req.new_value::jsonb;
    INSERT INTO faqs (clinic_id, question_patterns, answer, category, is_active)
    VALUES (
      req.clinic_id,
      ARRAY(SELECT jsonb_array_elements_text(parsed->'question_patterns')),
      parsed->>'answer',
      COALESCE(parsed->>'category', 'genel'),
      true
    );

  -- ── KLİNİK GÜNCELLEME — whitelist kontrolü ────────────────
  ELSIF req.table_name = 'clinics' THEN
    IF NOT (req.field_name = ANY(allowed_clinic_fields)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Bu alan güncellenemez: ' || req.field_name);
    END IF;
    EXECUTE format(
      'UPDATE clinics SET %I = $1, updated_at = now() WHERE id = $2',
      req.field_name
    ) USING req.new_value, req.record_id;

  -- ── SERVİS GÜNCELLEME — whitelist kontrolü ────────────────
  ELSIF req.table_name = 'services' THEN
    IF NOT (req.field_name = ANY(allowed_service_fields)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Bu alan güncellenemez: ' || req.field_name);
    END IF;
    EXECUTE format(
      'UPDATE services SET %I = $1, updated_at = now() WHERE id = $2',
      req.field_name
    ) USING req.new_value, req.record_id;

  -- ── SSS GÜNCELLEME — whitelist kontrolü ───────────────────
  ELSIF req.table_name = 'faqs' THEN
    IF NOT (req.field_name = ANY(allowed_faq_fields)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Bu alan güncellenemez: ' || req.field_name);
    END IF;
    EXECUTE format(
      'UPDATE faqs SET %I = $1 WHERE id = $2',
      req.field_name
    ) USING req.new_value, req.record_id;
  END IF;

  UPDATE kb_change_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 2. RATE LIMITING — KB İstekleri ────────────────────────
-- Aynı klinik aynı alan için max 1 bekleyen istek gönderebilir

CREATE OR REPLACE FUNCTION check_kb_request_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Aynı record+field için zaten pending istek var mı?
  IF NEW.field_name NOT IN ('__new_service__', '__new_faq__') THEN
    IF EXISTS (
      SELECT 1 FROM kb_change_requests
      WHERE clinic_id   = NEW.clinic_id
        AND record_id   = NEW.record_id
        AND field_name  = NEW.field_name
        AND status      = 'pending'
    ) THEN
      RAISE EXCEPTION 'Bu alan için zaten bekleyen bir değişiklik isteği var';
    END IF;
  END IF;

  -- Günde max 20 istek
  IF (
    SELECT COUNT(*) FROM kb_change_requests
    WHERE clinic_id  = NEW.clinic_id
      AND created_at > now() - interval '24 hours'
  ) >= 20 THEN
    RAISE EXCEPTION 'Günlük istek limitine ulaşıldı (20)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kb_request_limit ON kb_change_requests;
CREATE TRIGGER trg_kb_request_limit
  BEFORE INSERT ON kb_change_requests
  FOR EACH ROW EXECUTE FUNCTION check_kb_request_limit();


-- ─── 3. RATE LIMITING — Support Tickets ─────────────────────
-- Günde max 5 ticket

CREATE OR REPLACE FUNCTION check_ticket_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM support_tickets
    WHERE clinic_id  = NEW.clinic_id
      AND created_at > now() - interval '24 hours'
  ) >= 5 THEN
    RAISE EXCEPTION 'Günlük destek talebi limitine ulaşıldı (5)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ticket_limit ON support_tickets;
CREATE TRIGGER trg_ticket_limit
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION check_ticket_limit();


-- ─── 4. TÜM TABLOLARDA RLS KONTROL ──────────────────────────
-- Eksik RLS olan tablo var mı?
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clinics','services','faqs','conversations','messages',
    'handoff_logs','daily_stats','kb_documents',
    'clinic_users','super_admin_users',
    'kb_change_requests','support_tickets'
  )
ORDER BY tablename;


SELECT 'Güvenlik düzeltmeleri uygulandı ✅' as durum;
