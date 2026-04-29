-- German (DE) preset templates — hair sector
-- EsteLife + gelecekteki Almanca müşteriler için

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

-- Takip (Follow-up)
(NULL, 'hair_followup_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, Sie hatten sich nach einer Haartransplantation erkundigt. Unser Expertenteam steht bereit, alle Ihre Fragen zu beantworten. Wie können wir Ihnen weiterhelfen?"}]',
  'draft', true, 'hair', 'followup'),

-- Yeniden Bağlama (Re-engagement)
(NULL, 'hair_reengagement_v1_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, wir würden Sie gerne auf Ihrem Weg zur Haartransplantation begleiten. Sind Sie noch interessiert? Antworten Sie JA und unser Spezialist meldet sich bei Ihnen."}]',
  'draft', true, 'hair', 'reengagement'),

-- Listeden Çıkma (Unsubscribe)
(NULL, 'hair_unsubscribe_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, wenn Sie keine Nachrichten mehr erhalten möchten, antworten Sie bitte mit STOPP. Wir entfernen Sie umgehend von unserer Liste."}]',
  'draft', true, 'hair', 'unsubscribe'),

-- Randevu Hatırlatma (Appointment reminder)
(NULL, 'hair_appointment_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, Ihr Termin für eine kostenlose Haaranalyse und Beratung ist am {{2}} um {{3}} Uhr. Bitte bestätigen Sie mit JA."}]',
  'draft', true, 'hair', 'appointment_reminder'),

-- Memnuniyet Anketi (Satisfaction survey)
(NULL, 'hair_satisfaction_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank für Ihren Besuch bei uns! Wie zufrieden waren Sie mit Ihrer Beratung? Bitte bewerten Sie von 1 (schlecht) bis 5 (ausgezeichnet)."}]',
  'draft', true, 'hair', 'satisfaction')

ON CONFLICT DO NOTHING;
