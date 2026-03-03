-- Migration: 2026-03-03 — Rename ghl_contact_id → contact_id
-- Tüm tablolarda CRM-agnostic alan adına geçiş

-- ── conversations ─────────────────────────────────────────────
ALTER TABLE conversations RENAME COLUMN ghl_contact_id TO contact_id;

DROP INDEX IF EXISTS idx_conversations_ghl;
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);

-- ── message_buffer ────────────────────────────────────────────
ALTER TABLE message_buffer RENAME COLUMN ghl_contact_id TO contact_id;

-- ── conversation_locks ────────────────────────────────────────
-- Primary key constraint adı değişmez, sadece kolon rename edilir
ALTER TABLE conversation_locks RENAME COLUMN ghl_contact_id TO contact_id;

-- ── voice_calls ───────────────────────────────────────────────
ALTER TABLE voice_calls RENAME COLUMN ghl_contact_id TO contact_id;

DROP INDEX IF EXISTS idx_voice_calls_ghl_contact_id;
CREATE INDEX IF NOT EXISTS idx_voice_calls_contact_id ON voice_calls(contact_id);

SELECT 'ghl_contact_id → contact_id rename tamamlandı ✅' AS durum;
