-- ═══════════════════════════════════════════════════════════════
-- KAYIT RLS FİX
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════

-- Eski policy'yi kaldır
DROP POLICY IF EXISTS "user can create registration" ON clinic_registrations;

-- Yeni: hem oturumu olan hem de yeni kayıt olan kullanıcı ekleyebilir
-- (email onayı beklese bile user_id eşleşmeli)
CREATE POLICY "user can create registration"
  ON clinic_registrations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    -- Email henüz onaylanmamış ama user_id JWT'de var
    user_id = (auth.jwt() ->> 'sub')::uuid
  );

SELECT 'Kayıt RLS düzeltildi ✅' as durum;
