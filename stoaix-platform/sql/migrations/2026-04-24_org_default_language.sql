-- Add default_language column to organizations
-- Used by edge functions for system messages (image ack, errors, unsupported type)
-- AI chatbot responses are NOT affected — they follow playbook system_prompt language

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS default_language text NOT NULL DEFAULT 'tr';

-- Set German clinic
UPDATE organizations SET default_language = 'de'
  WHERE id = 'ecd032a8-f40c-4171-947a-b6417461e987';
