-- Multi-playbook per org: scenario kolonu
-- Ana playbook: scenario IS NULL (inbound resepsiyonist)
-- Senaryo playbook: scenario = 'appt_confirm' | 'reactivation' | ...

-- 1) Yeni kolon
ALTER TABLE agent_playbooks ADD COLUMN IF NOT EXISTS scenario text;

-- 2) Mevcut duplike aktif playbook'ları temizle — her (org, channel) için
--    sadece en yüksek version'lu olanı aktif bırak, gerisini deaktif et
UPDATE agent_playbooks SET is_active = false
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY organization_id, channel
             ORDER BY version DESC, updated_at DESC NULLS LAST
           ) AS rn
    FROM agent_playbooks
    WHERE is_active = true AND scenario IS NULL
  ) ranked
  WHERE rn > 1
);

-- 3) Org başına tek ana (inbound) playbook: (org_id, channel) WHERE scenario IS NULL AND is_active
CREATE UNIQUE INDEX IF NOT EXISTS idx_playbook_main_unique
  ON agent_playbooks (organization_id, channel)
  WHERE scenario IS NULL AND is_active = true;

-- 4) Senaryo başına tek playbook: (org_id, channel, scenario) WHERE scenario IS NOT NULL AND is_active
CREATE UNIQUE INDEX IF NOT EXISTS idx_playbook_scenario_unique
  ON agent_playbooks (organization_id, channel, scenario)
  WHERE scenario IS NOT NULL AND is_active = true;
