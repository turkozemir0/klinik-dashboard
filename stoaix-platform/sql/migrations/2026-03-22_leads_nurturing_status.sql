-- leads.status CHECK constraint'ine 'nurturing' eklendi
-- Standart GHL pipeline ile uyum:
--   new → ai_qualifying(in_progress) → nurturing / handed_off → qualified → converted / lost

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    'new',
    'in_progress',
    'nurturing',
    'qualified',
    'handed_off',
    'lost',
    'converted'
  ));
