-- German (DE) preset templates — dental, aesthetics, general sectors
-- (hair sector DE presets already exist in 2026-04-24_german_template_presets.sql)

-- ═══════════════════════════════════════════════════════════════════════════════
-- DENTAL — DE (5)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

(NULL, 'dental_followup_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, Sie hatten sich nach einer Zahnbehandlung erkundigt. Unser Spezialistenteam steht bereit, alle Ihre Fragen zu beantworten. Wie können wir Ihnen weiterhelfen?"}]',
  'draft', true, 'dental', 'followup'),

(NULL, 'dental_reengagement_v1_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, wir haben schon länger nichts von Ihnen gehört. Sind Sie noch an einer Zahnbehandlung interessiert? Antworten Sie JA und unser Spezialist meldet sich bei Ihnen."}]',
  'draft', true, 'dental', 'reengagement'),

(NULL, 'dental_unsubscribe_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, wenn Sie keine Nachrichten mehr erhalten möchten, antworten Sie bitte mit STOPP. Wir entfernen Sie umgehend von unserer Liste."}]',
  'draft', true, 'dental', 'unsubscribe'),

(NULL, 'dental_appointment_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, Ihr Zahnarzttermin ist am {{2}} um {{3}} Uhr. Bitte bestätigen Sie mit JA oder kontaktieren Sie uns für eine Terminverschiebung."}]',
  'draft', true, 'dental', 'appointment_reminder'),

(NULL, 'dental_satisfaction_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank für Ihren Besuch in unserer Klinik! Wie zufrieden waren Sie mit Ihrer Behandlung? Bitte bewerten Sie von 1 (schlecht) bis 5 (ausgezeichnet)."}]',
  'draft', true, 'dental', 'satisfaction')

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- AESTHETICS — DE (5)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

(NULL, 'aesthetics_followup_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, Sie hatten sich nach unseren ästhetischen Behandlungen erkundigt. Unser Spezialistenteam steht bereit, die perfekte Lösung für Sie zu finden. Wie können wir Ihnen helfen?"}]',
  'draft', true, 'aesthetics', 'followup'),

(NULL, 'aesthetics_reengagement_v1_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, es ist eine Weile her, seit wir zuletzt gesprochen haben. Wir haben aufregende neue Behandlungen verfügbar. Antworten Sie JA, um mehr über unsere aktuellen Angebote zu erfahren."}]',
  'draft', true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_unsubscribe_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, wenn Sie keine Nachrichten mehr erhalten möchten, antworten Sie bitte mit STOPP. Wir entfernen Sie sofort von unserer Kontaktliste."}]',
  'draft', true, 'aesthetics', 'unsubscribe'),

(NULL, 'aesthetics_appointment_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, Ihr ästhetischer Beratungstermin ist am {{2}} um {{3}} Uhr. Bitte bestätigen Sie mit JA oder kontaktieren Sie uns für eine Terminverschiebung."}]',
  'draft', true, 'aesthetics', 'appointment_reminder'),

(NULL, 'aesthetics_satisfaction_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank, dass Sie sich für unsere Klinik entschieden haben! Wie war Ihre Erfahrung? Bitte bewerten Sie von 1 (schlecht) bis 5 (ausgezeichnet)."}]',
  'draft', true, 'aesthetics', 'satisfaction')

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GENERAL — DE (5)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

(NULL, 'general_followup_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank für Ihre Kontaktaufnahme. Unser Team steht bereit, Ihnen zu helfen. Wie können wir Sie unterstützen?"}]',
  'draft', true, 'general', 'followup'),

(NULL, 'general_reengagement_v1_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, wir haben schon länger nichts von Ihnen gehört. Wir würden uns freuen, wieder von Ihnen zu hören. Antworten Sie JA und wir melden uns mit personalisierten Optionen."}]',
  'draft', true, 'general', 'reengagement'),

(NULL, 'general_unsubscribe_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, wenn Sie keine Nachrichten mehr von uns erhalten möchten, antworten Sie bitte mit STOPP. Wir entfernen Sie umgehend von unserer Liste."}]',
  'draft', true, 'general', 'unsubscribe'),

(NULL, 'general_appointment_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, Ihr Termin ist am {{2}} um {{3}} Uhr. Bitte bestätigen Sie mit JA oder teilen Sie uns mit, falls Sie einen neuen Termin benötigen."}]',
  'draft', true, 'general', 'appointment_reminder'),

(NULL, 'general_satisfaction_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank für Ihren Besuch! Wir würden uns über Ihr Feedback freuen. Bitte bewerten Sie Ihre Erfahrung von 1 (schlecht) bis 5 (ausgezeichnet)."}]',
  'draft', true, 'general', 'satisfaction')

ON CONFLICT DO NOTHING;
