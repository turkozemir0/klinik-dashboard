-- Migration: conversation processing lock + GHL contact index
-- Adds atomic debounce lock columns to conversations table.
-- Enables safe concurrent processing: only the last message in a burst
-- gets processed, others bail after debounce check.

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS pending_process_id    UUID,
  ADD COLUMN IF NOT EXISTS is_processing         BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

COMMENT ON COLUMN conversations.pending_process_id IS
  'UUID of the last user message waiting to be processed. Latest message always overwrites. Used to determine which worker should run the chat engine after debounce.';

COMMENT ON COLUMN conversations.is_processing IS
  'True while the chat engine is actively running for this conversation. Prevents duplicate AI responses from concurrent edge function workers.';

COMMENT ON COLUMN conversations.processing_started_at IS
  'Timestamp when is_processing was set to true. Workers older than 2 minutes are treated as crashed and their lock is auto-released.';

-- Expression index for fast GHL contact lookup by ghl_contact_id stored in JSONB.
-- Used by whatsapp-inbound edge function for both WhatsApp and Instagram channels.
CREATE INDEX IF NOT EXISTS idx_contacts_ghl_contact_id
  ON contacts ((channel_identifiers->>'ghl_contact_id'));
