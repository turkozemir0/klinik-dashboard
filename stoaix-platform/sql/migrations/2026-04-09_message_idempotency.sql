-- ─────────────────────────────────────────────────────────────────────────────
-- Message idempotency — wamid deduplication
-- 360dialog retries for ~20 min on failed response — this prevents duplicate
-- messages and double AI replies.
-- ─────────────────────────────────────────────────────────────────────────────

-- external_id: wamid (360dialog/Meta), or provider-specific message ID
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'whatsapp';

-- Unique constraint: one (org, channel, external_id) combo only
-- Partial index: only rows where external_id IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id
  ON public.messages (organization_id, channel, external_id)
  WHERE external_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Notifications: extend type CHECK to include new human-mode events
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'handoff',
    'hot_lead',
    'new_message',
    'takeover',
    'human_echo_detected',
    'human_reply_received'
  ));
