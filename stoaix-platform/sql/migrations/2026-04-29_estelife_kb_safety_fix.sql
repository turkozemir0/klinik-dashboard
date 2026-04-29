-- ESTELiFE KB Safety Fix — Garantie + Graft-Zahlen Entfernung
-- Org: ecd032a8-f40c-4171-947a-b6417461e987
--
-- Problem: KB-Inhalte überschreiben die Sicherheitsregeln im Prompt.
-- 1. "Gibt es eine Garantie?" → "biologisch belegt", "90-95%" → Model sagt "garantieren wir"
-- 2. "Ist eine zweite Sitzung notwendig?" → "2.000-4.500 Grafts" → Model nennt konkrete Zahlen
-- Fix: description_for_ai überarbeiten — keine Garantiesprache, keine Graft-Zahlen

-------------------------------------------------------------------
-- 1. GARANTIE KB-ITEM — Garantiesprache entfernen
-------------------------------------------------------------------
UPDATE knowledge_items
SET
  description_for_ai = 'Garantie bei Haartransplantation EsteLife Hair Grevenbroich: '
    || 'Eine medizinische Garantie kann grundsätzlich nicht gegeben werden — das gilt für jeden chirurgischen Eingriff. '
    || 'Allerdings: Die Erfolgsrate bei FUE/DHI-Haartransplantationen ist sehr hoch, wenn die Nachsorge korrekt eingehalten wird. '
    || 'EsteLife Hair steht für Qualität: sorgfältige Entnahme, schonende Implantation, persönliche Nachsorge. '
    || 'Sollte es in seltenen Fällen zu Auffälligkeiten kommen, wird dies beim Kontrolltermin besprochen. '
    || 'Wichtig: Der Agent darf KEINE konkreten Prozentsätze oder Garantieversprechen nennen. '
    || 'Stattdessen: "Die Erfolgsrate ist sehr hoch. Dr. Yildirim bespricht die realistischen Erwartungen gerne persönlich mit Ihnen."',
  data = '{"question":"Gibt es eine Garantie?","answer":"Keine medizinische Garantie möglich, aber sehr hohe Erfolgsrate. Details persönlich mit Dr. Yildirim."}'::jsonb,
  updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND title = 'Gibt es eine Garantie auf die Haartransplantation?';

-------------------------------------------------------------------
-- 2. ZWEITE SITZUNG KB-ITEM — Graft-Zahlen entfernen
-------------------------------------------------------------------
UPDATE knowledge_items
SET
  description_for_ai = 'Zweite Sitzung bei Haartransplantation EsteLife Hair: '
    || 'Bei ausgedehntem Haarausfall oder begrenzter Spenderdichte kann eine zweite Sitzung sinnvoll sein. '
    || 'Die genaue Graftanzahl wird individuell bei der kostenlosen Haaranalyse bestimmt — keine pauschalen Zahlen möglich. '
    || 'Eine zweite Sitzung ist frühestens nach 12 Monaten möglich, sobald das Ergebnis der ersten Sitzung vollständig sichtbar ist. '
    || 'Ob eine zweite Sitzung nötig ist, wird in der kostenlosen Haaranalyse mit Dr. Yildirim besprochen. '
    || 'Wichtig: Der Agent darf KEINE konkreten Graft-Zahlen nennen — immer auf persönliche Analyse verweisen.',
  data = '{"question":"Ist eine zweite Sitzung notwendig?","answer":"Nur bei großem Haarverlust oder begrenzter Spenderdichte. Frühestens nach 12 Monaten. Wird in Analyse besprochen."}'::jsonb,
  updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND title = 'Ist eine zweite Sitzung notwendig?';
