-- English (EN) preset templates — all 4 sectors × 5 purposes = 20 presets
-- + 4 missing TR satisfaction presets (dental, hair, aesthetics, general)

-- ═══════════════════════════════════════════════════════════════════════════════
-- DENTAL — EN (5)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

(NULL, 'dental_followup_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, you recently reached out about dental treatment. Our specialist team is ready to answer all your questions. How can we help you?"}]',
  'draft', true, 'dental', 'followup'),

(NULL, 'dental_reengagement_v1_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hi {{1}}, we haven''t heard from you in a while. Still interested in dental care? Reply YES and our specialist will get back to you with a personalized plan."}]',
  'draft', true, 'dental', 'reengagement'),

(NULL, 'dental_unsubscribe_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, if you no longer wish to receive messages from us, please reply STOP. We will remove you from our list immediately."}]',
  'draft', true, 'dental', 'unsubscribe'),

(NULL, 'dental_appointment_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, your dental appointment is scheduled for {{2}} at {{3}}. Please reply YES to confirm or call us to reschedule."}]',
  'draft', true, 'dental', 'appointment_reminder'),

(NULL, 'dental_satisfaction_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, thank you for visiting our clinic! How satisfied were you with your experience? Please rate from 1 (poor) to 5 (excellent)."}]',
  'draft', true, 'dental', 'satisfaction')

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- HAIR — EN (5)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

(NULL, 'hair_followup_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, you inquired about hair transplant. Our expert team is ready to guide you through the process. How can we assist you?"}]',
  'draft', true, 'hair', 'followup'),

(NULL, 'hair_reengagement_v1_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hi {{1}}, we''d love to help you on your hair transplant journey. Are you still interested? Reply YES and our specialist will reach out with exclusive options."}]',
  'draft', true, 'hair', 'reengagement'),

(NULL, 'hair_unsubscribe_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, if you no longer wish to receive messages, please reply STOP. We will remove you from our list right away."}]',
  'draft', true, 'hair', 'unsubscribe'),

(NULL, 'hair_appointment_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, your free hair analysis consultation is on {{2}} at {{3}}. Please reply YES to confirm your appointment."}]',
  'draft', true, 'hair', 'appointment_reminder'),

(NULL, 'hair_satisfaction_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, thank you for your visit! How satisfied were you with your consultation? Please rate from 1 (poor) to 5 (excellent)."}]',
  'draft', true, 'hair', 'satisfaction')

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- AESTHETICS — EN (5)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

(NULL, 'aesthetics_followup_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, thank you for your interest in our aesthetic treatments. Our specialist team is ready to help you find the perfect solution. How can we assist?"}]',
  'draft', true, 'aesthetics', 'followup'),

(NULL, 'aesthetics_reengagement_v1_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hi {{1}}, it''s been a while since we last spoke. We have exciting new treatments available. Reply YES to learn about our latest offers."}]',
  'draft', true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_unsubscribe_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, if you wish to stop receiving messages, reply STOP. We will immediately remove you from our contact list."}]',
  'draft', true, 'aesthetics', 'unsubscribe'),

(NULL, 'aesthetics_appointment_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, your aesthetic consultation is scheduled for {{2}} at {{3}}. Reply YES to confirm or contact us to reschedule."}]',
  'draft', true, 'aesthetics', 'appointment_reminder'),

(NULL, 'aesthetics_satisfaction_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, thank you for choosing our clinic! How was your experience? Please rate from 1 (poor) to 5 (excellent)."}]',
  'draft', true, 'aesthetics', 'satisfaction')

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GENERAL — EN (5)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

(NULL, 'general_followup_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, thank you for reaching out to us. Our team is ready to assist you. How can we help?"}]',
  'draft', true, 'general', 'followup'),

(NULL, 'general_reengagement_v1_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hi {{1}}, we haven''t heard from you in a while. We''d love to reconnect. Reply YES and we''ll get back to you with personalized options."}]',
  'draft', true, 'general', 'reengagement'),

(NULL, 'general_unsubscribe_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, if you no longer wish to receive messages from us, reply STOP. We will remove you from our list immediately."}]',
  'draft', true, 'general', 'unsubscribe'),

(NULL, 'general_appointment_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, your appointment is scheduled for {{2}} at {{3}}. Please reply YES to confirm or let us know if you need to reschedule."}]',
  'draft', true, 'general', 'appointment_reminder'),

(NULL, 'general_satisfaction_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hi {{1}}, thank you for your visit! We''d love your feedback. Please rate your experience from 1 (poor) to 5 (excellent)."}]',
  'draft', true, 'general', 'satisfaction')

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MISSING TR SATISFACTION PRESETS (4)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

(NULL, 'dental_satisfaction_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, kliniğimizi ziyaret ettiğiniz için teşekkür ederiz! Deneyiminizden ne kadar memnun kaldınız? Lütfen 1 (kötü) ile 5 (mükemmel) arasında puanlayın."}]',
  'draft', true, 'dental', 'satisfaction'),

(NULL, 'hair_satisfaction_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, ziyaretiniz için teşekkür ederiz! Danışmanlık deneyiminizi nasıl değerlendirirsiniz? Lütfen 1 (kötü) ile 5 (mükemmel) arasında puanlayın."}]',
  'draft', true, 'hair', 'satisfaction'),

(NULL, 'aesthetics_satisfaction_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, kliniğimizi tercih ettiğiniz için teşekkür ederiz! Deneyiminizi nasıl değerlendirirsiniz? Lütfen 1 (kötü) ile 5 (mükemmel) arasında puanlayın."}]',
  'draft', true, 'aesthetics', 'satisfaction'),

(NULL, 'general_satisfaction_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, ziyaretiniz için teşekkür ederiz! Geri bildiriminizi almak isteriz. Lütfen deneyiminizi 1 (kötü) ile 5 (mükemmel) arasında puanlayın."}]',
  'draft', true, 'general', 'satisfaction')

ON CONFLICT DO NOTHING;
