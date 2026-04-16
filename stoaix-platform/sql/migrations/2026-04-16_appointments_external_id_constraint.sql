-- Migration: 2026-04-16_appointments_external_id_constraint
-- Partial unique index (WHERE external_id IS NOT NULL) Supabase upsert ile çalışmaz.
-- Çözüm: Partial index'i kaldır, named unique constraint ekle.
-- NOT: appointments tablosunda external_id NULL olan satırlar da olabilir (platform/ai source'ları),
--      bu yüzden tam unique constraint değil, partial index ile named constraint yapısı kullanıyoruz.
--      Ama Supabase JS upsert partial index'i tanımadığından, kod tarafında explicit select/insert/update kullanıyoruz.
--      Bu migration sadece gereksiz partial index'i temizler ve daha açık bir filter index ekler.

-- Eski partial unique index'i kaldır (upsert için kullanamazdık zaten)
DROP INDEX IF EXISTS idx_appointments_external_id_org;

-- Yeni: source + external_id lookup için basit (non-unique) index
-- Sync route artık explicit select → insert/update kullanıyor, unique constraint gerekmiyor.
CREATE INDEX IF NOT EXISTS idx_appointments_source_external
  ON public.appointments(organization_id, source, external_id)
  WHERE external_id IS NOT NULL;
