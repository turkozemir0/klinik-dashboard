-- ═══════════════════════════════════════════════════════════════
-- stoaix AI Klinik System — REALTİME & SON AYARLAR
-- 03_rls.sql'den sonra çalıştır
-- ═══════════════════════════════════════════════════════════════

-- ─── REALTİME AKTİFLEŞTİR ────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.handoff_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invite_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.onboarding_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kb_change_requests;

-- ─── İLK SUPER ADMIN ──────────────────────────────────────────
-- Supabase Dashboard → Authentication → Users'dan kullanıcı UUID'sini bul
-- Aşağıdaki komutu kendi UUID'nle çalıştır:

-- INSERT INTO public.super_admin_users (user_id, name)
-- VALUES ('<SENIN_USER_UUID>', 'Super Admin');

-- Örnek (mevcut admin kullanıcısı için):
-- INSERT INTO public.super_admin_users (user_id)
-- SELECT id FROM auth.users WHERE email = 'admin@stoaix.com';

SELECT 'Realtime ve son ayarlar tamamlandı ✅' as durum;
