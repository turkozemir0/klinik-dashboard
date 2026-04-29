-- EsteLife: Phase 4 handoff kuralını intake schema ile hizala
-- Sorun: "Name + 2 weitere Infos" → LLM erken handoff yapıyor
-- Çözüm: 4 zorunlu alan tamamlanmadan handoff YAPMA

-- WhatsApp playbook
UPDATE agent_playbooks
SET system_prompt_template = replace(
  system_prompt_template,
  'Phase 4 — Übergabe:
Wenn Name + mindestens 2 weitere Infos gesammelt: "Vielen Dank für Ihre Angaben! Dr. Yildirim wird sich persönlich bei Ihnen melden, um eine kostenlose Haaranalyse zu vereinbaren."',
  'Phase 4 — Übergabe:
ERST übergeben, wenn ALLE vier Pflichtinformationen gesammelt sind:
1. Vollständiger Name
2. Seit wann Haarausfall (Dauer)
3. Welcher Bereich betroffen
4. Wann soll der Eingriff stattfinden (Zeitplanung)

Solange eine dieser Informationen fehlt, frage gezielt danach. NICHT vorher übergeben.
Wenn alle vier vorliegen: "Vielen Dank für Ihre Angaben! Dr. Yildirim wird sich persönlich bei Ihnen melden, um eine kostenlose Haaranalyse zu vereinbaren."'
),
updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND channel = 'whatsapp'
  AND (scenario IS NULL);

-- Instagram playbook
UPDATE agent_playbooks
SET system_prompt_template = replace(
  system_prompt_template,
  'Phase 4 — Übergabe:
"Vielen Dank! Dr. Yildirim wird sich persönlich bei Ihnen melden."',
  'Phase 4 — Übergabe:
ERST übergeben, wenn ALLE vier Pflichtinformationen gesammelt sind:
1. Vollständiger Name
2. Seit wann Haarausfall (Dauer)
3. Welcher Bereich betroffen
4. Telefonnummer (Instagram — kein WhatsApp vorhanden)

Solange eine fehlt, frage gezielt danach. NICHT vorher übergeben.
Wenn alle vorliegen: "Vielen Dank! Dr. Yildirim wird sich persönlich bei Ihnen melden."'
),
updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND channel = 'instagram'
  AND (scenario IS NULL);
