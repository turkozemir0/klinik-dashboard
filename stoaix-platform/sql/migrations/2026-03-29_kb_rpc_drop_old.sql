-- 2026-03-29_kb_rpc_drop_old.sql
-- Eski 3-parametreli match_knowledge_items fonksiyonu kaldırılıyor.
-- CREATE OR REPLACE yeni imzayı ekledi ama eskiyi silmedi.
-- PostgREST ikisi arasında seçim yapamıyor → PGRST203 hatası.
-- Bu migration sonrası yalnızca 4-parametreli versiyon kalır (filter_tags DEFAULT NULL).

DROP FUNCTION IF EXISTS public.match_knowledge_items(
  uuid,
  vector(1536),
  int
);
