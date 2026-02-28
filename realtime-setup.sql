-- ═══════════════════════════════════════════════════════════════
-- REAL-TIME AKTİFLEŞTİRME
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════

-- Tablolara real-time publication ekle
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE handoff_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

SELECT 'Real-time aktifleştirildi ✅' as durum;
