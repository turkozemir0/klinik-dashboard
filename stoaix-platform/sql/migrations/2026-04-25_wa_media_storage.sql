-- WhatsApp Media → Supabase Storage (kalıcı URL)
-- Meta media URL'leri 5 dakikada expire olur → Storage'a yükle

-- 1. wa-media bucket (public read, 2MB limit, sadece image)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('wa-media', 'wa-media', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. Public READ policy (inbox <img src> auth'suz çalışsın)
CREATE POLICY "Public read wa-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'wa-media');

-- 3. pg_cron extension + 30 gün cleanup (her gece 03:00 UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-wa-media-30d',
  '0 3 * * *',
  $$ DELETE FROM storage.objects
     WHERE bucket_id = 'wa-media'
       AND created_at < now() - interval '30 days'; $$
);
