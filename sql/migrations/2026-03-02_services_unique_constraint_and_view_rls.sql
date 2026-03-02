-- ═══════════════════════════════════════════════════════════════
-- Migration: 2026-03-02_services_unique_constraint_and_view_rls
--
-- 1. services tablosuna (clinic_id, service_key) UNIQUE constraint
--    → approve_onboarding_submission'daki UPSERT için gerekli
--
-- 2. service_performance VIEW için security_invoker = true
--    → VIEW sorgulandığında çağıran kullanıcının RLS izinleri devreye girer;
--      klinik kullanıcıları sadece kendi verisini, adminler tüm veriyi görür
--
-- Supabase Dashboard → SQL Editor'dan çalıştır
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. SERVICES UNIQUE CONSTRAINT ───────────────────────────────────────────
-- Önce olası duplicate'leri temizle (aynı clinic_id + service_key çifti varsa)
-- En son güncellenen kaydı koru, eskileri sil.
DELETE FROM public.services s1
WHERE s1.ctid <> (
  SELECT s2.ctid
  FROM public.services s2
  WHERE s2.clinic_id   = s1.clinic_id
    AND s2.service_key = s1.service_key
  ORDER BY s2.updated_at DESC NULLS LAST, s2.created_at DESC
  LIMIT 1
);

-- UNIQUE constraint ekle
ALTER TABLE public.services
  ADD CONSTRAINT services_clinic_service_key_unique
  UNIQUE (clinic_id, service_key);


-- ─── 2. SERVICE_PERFORMANCE VIEW — SECURITY INVOKER ──────────────────────────
-- VIEW'ler için doğrudan RLS politikası tanımlanamaz.
-- security_invoker = true ile VIEW, çağıran kullanıcının izinlerini kullanır;
-- conversations tablosundaki RLS politikaları otomatik devreye girer.
ALTER VIEW public.service_performance SET (security_invoker = true);


-- ─── DOĞRULAMA ────────────────────────────────────────────────────────────────
SELECT
  conname AS constraint_name,
  contype AS type
FROM pg_constraint
WHERE conrelid = 'public.services'::regclass
  AND conname = 'services_clinic_service_key_unique';

SELECT 'Migration tamamlandı ✅' AS durum;
