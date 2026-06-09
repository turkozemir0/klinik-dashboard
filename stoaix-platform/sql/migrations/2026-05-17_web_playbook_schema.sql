-- Web Chat — Kanal Özel Playbook & Intake Schema
-- 1) CHECK constraint güncelle: 'web' kanalını ekle
-- 2) Mevcut org'lar için web playbook backfill
-- 3) Mevcut org'lar için web intake schema backfill

-- ─── 1) intake_schemas CHECK constraint güncelle ────────────────────────────────

ALTER TABLE intake_schemas DROP CONSTRAINT IF EXISTS intake_schemas_channel_check;
ALTER TABLE intake_schemas ADD CONSTRAINT intake_schemas_channel_check
  CHECK (channel IN ('voice','chat','whatsapp','instagram','web','all'));

-- ─── 2) Mevcut org'lar için web playbook backfill ────────────────────────────────
-- WhatsApp playbook'u klonla → channel='web'
-- system_prompt_template'te "WhatsApp asistanısın" → "web sitesi asistanısın" REPLACE
-- calendar_booking → false

INSERT INTO agent_playbooks (
  organization_id, name, channel, system_prompt_template, opening_message,
  hard_blocks, features, few_shot_examples, fallback_responses,
  routing_rules, handoff_triggers, is_active
)
SELECT
  p.organization_id,
  REPLACE(p.name, 'WhatsApp/Chat', 'Web Chat'),
  'web',
  REPLACE(
    REPLACE(p.system_prompt_template, 'WhatsApp asistanısın', 'web sitesi asistanısın'),
    'WhatsApp mesajlarını', 'web sitesi ziyaretçilerini'
  ),
  p.opening_message,
  p.hard_blocks,
  jsonb_set(COALESCE(p.features, '{}'::jsonb), '{calendar_booking}', 'false'),
  p.few_shot_examples,
  p.fallback_responses,
  p.routing_rules,
  p.handoff_triggers,
  p.is_active
FROM agent_playbooks p
WHERE p.channel = 'whatsapp'
  AND NOT EXISTS (
    SELECT 1 FROM agent_playbooks w
    WHERE w.organization_id = p.organization_id
      AND w.channel = 'web'
  );

-- ─── 3) Mevcut org'lar için web intake schema backfill ───────────────────────────
-- Instagram schema'dan klonla (phone dahil). IG yoksa WA'dan klonla.

-- 3a) IG'den klonla
INSERT INTO intake_schemas (organization_id, channel, name, fields)
SELECT
  s.organization_id,
  'web',
  REPLACE(s.name, 'Instagram', 'Web Chat'),
  s.fields
FROM intake_schemas s
WHERE s.channel = 'instagram'
  AND NOT EXISTS (
    SELECT 1 FROM intake_schemas w
    WHERE w.organization_id = s.organization_id
      AND w.channel = 'web'
  );

-- 3b) IG yoksa WA'dan klonla
INSERT INTO intake_schemas (organization_id, channel, name, fields)
SELECT
  s.organization_id,
  'web',
  REPLACE(s.name, 'WhatsApp', 'Web Chat'),
  s.fields
FROM intake_schemas s
WHERE s.channel = 'whatsapp'
  AND NOT EXISTS (
    SELECT 1 FROM intake_schemas w
    WHERE w.organization_id = s.organization_id
      AND w.channel = 'web'
  )
  AND NOT EXISTS (
    SELECT 1 FROM intake_schemas ig
    WHERE ig.organization_id = s.organization_id
      AND ig.channel = 'instagram'
  );
