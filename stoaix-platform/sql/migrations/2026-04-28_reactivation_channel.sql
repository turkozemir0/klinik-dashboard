-- Allow 'reactivation' as a valid conversation channel
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_channel_check;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_channel_check
  CHECK (channel IN ('voice', 'whatsapp', 'instagram', 'web', 'reactivation'));
