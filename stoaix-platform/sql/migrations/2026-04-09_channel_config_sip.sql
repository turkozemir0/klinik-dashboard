-- ─────────────────────────────────────────────────────────────────────────────
-- channel_config.sip yapısı — per-org SIP trunk tanımı
-- Her organization kendi NETGSM/SIP trunk'ını ve numarasını burada tutar.
--
-- Örnek channel_config.sip:
-- {
--   "trunk_id":        "ST_xxx",          ← LiveKit SIP trunk ID
--   "outbound_number": "+902121234567",   ← Müşteri ekranında görünecek numara
--   "inbound_number":  "+902121234567",   ← Gelen aramalarda eşleşme için
--   "provider":        "netgsm"           ← ileride multi-provider için
-- }
--
-- NOT: channel_config JSONB zaten var, sadece dökümantasyon amaçlı migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- channel_config kolonunun varlığını garantile (zaten olmalı)
ALTER TABLE public.organizations
  ALTER COLUMN channel_config SET DEFAULT '{}'::jsonb;

-- Eurostar için örnek SIP config (gerçek değerler LiveKit Dashboard'dan alınacak)
-- NETGSM trunk bağlandıktan sonra güncelle:
-- UPDATE organizations SET channel_config = jsonb_set(
--   channel_config,
--   '{sip}',
--   '{"trunk_id": "ST_xxx", "outbound_number": "+90...", "inbound_number": "+90...", "provider": "netgsm"}'
-- ) WHERE id = 'ORG_UUID';
