-- ═══════════════════════════════════════════════════════════════
-- KB ONAY FONKSİYONU GÜNCELLEME
-- Yeni hizmet ve SSS ekleme taleplerini destekler
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION approve_kb_change(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req kb_change_requests%ROWTYPE;
  parsed JSONB;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  SELECT * INTO req FROM kb_change_requests WHERE id = request_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İstek bulunamadı veya zaten işlendi');
  END IF;

  -- ── YENİ HİZMET EKLEME ───────────────────────────────────────
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

  -- ── YENİ SSS EKLEME ─────────────────────────────────────────
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

  -- ── MEVCUT KAYIT GÜNCELLEME ──────────────────────────────────
  ELSIF req.table_name = 'clinics' THEN
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
    EXECUTE format(
      'UPDATE faqs SET %I = $1 WHERE id = $2',
      req.field_name
    ) USING req.new_value, req.record_id;
  END IF;

  -- Request'i approved yap
  UPDATE kb_change_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

SELECT 'approve_kb_change güncellendi ✅' as durum;
