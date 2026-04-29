-- ============================================================================
-- 2026-04-29: Recommended Presets Enhancement
-- - Add is_recommended column to message_templates
-- - 60 reactivation drip templates (5 steps x 4 sectors x 3 languages)
-- - 12 payment_followup templates (4 sectors x 3 languages)
-- - Mark existing good presets as recommended
-- ============================================================================

-- ─── 1A. Add is_recommended column ──────────────────────────────────────────

ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS is_recommended boolean NOT NULL DEFAULT false;

-- ─── 1B. Reactivation Drip Templates (60 total) ────────────────────────────
-- 5 steps x 4 sectors x 3 languages
-- All: category=MARKETING, purpose=reengagement, is_preset=true, is_recommended=true
-- Naming: {sector}_reactivation_s{N}_v2[_en|_de]

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, is_recommended, sector, purpose)
VALUES

-- ── DENTAL ──────────────────────────────────────────────────────────────────

-- dental TR
(NULL, 'dental_reactivation_s1_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, bir süredir görüşemedik. Diş sağlığınız için hâlâ yardımcı olmamızı ister misiniz? Herhangi bir sorunuz varsa buradan yazabilirsiniz."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s2_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, düzenli diş kontrolleri ciddi sorunların erken teşhisini sağlar. Size özel ücretsiz ön değerlendirme randevumuzdan yararlanmak ister misiniz? RANDEVU yazın."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s3_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, her ay yüzlerce hastamız düzenli bakım sayesinde sağlıklı gülümsemelerine kavuşuyor. Siz de diş sağlığınız için bir adım atmak ister misiniz? EVET yazın."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s4_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, size özel bir fırsatımız var! Bu ay için sınırlı sayıda indirimli muayene randevumuz mevcut. Fırsatı kaçırmayın, RANDEVU yazın."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s5_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, son bir kez ulaşıyoruz. Diş sağlığınız önemli ve size yardımcı olmak isteriz. İlgileniyorsanız EVET yazın, sizi arayalım. Artık mesaj almak istemiyorsanız DUR yazabilirsiniz."}]',
  'draft', true, true, 'dental', 'reengagement'),

-- dental EN
(NULL, 'dental_reactivation_s1_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, it''s been a while since we last connected. Would you still like our help with your dental health? Feel free to write us here with any questions."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s2_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, regular dental check-ups help detect serious problems early. Would you like to take advantage of our free preliminary consultation? Reply APPOINTMENT."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s3_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, every month hundreds of our patients achieve healthy smiles through regular care. Would you like to take a step for your dental health too? Reply YES."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s4_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, we have a special offer for you! We have a limited number of discounted consultation slots this month. Don''t miss out — reply APPOINTMENT."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s5_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, this is our last message. Your dental health matters and we''d love to help. If you''re interested, reply YES and we''ll call you. If you''d prefer not to receive messages, reply STOP."}]',
  'draft', true, true, 'dental', 'reengagement'),

-- dental DE
(NULL, 'dental_reactivation_s1_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, es ist eine Weile her seit unserem letzten Kontakt. Möchten Sie weiterhin unsere Hilfe für Ihre Zahngesundheit? Schreiben Sie uns gerne hier bei Fragen."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s2_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, regelmäßige Zahnkontrollen helfen, ernste Probleme frühzeitig zu erkennen. Möchten Sie unsere kostenlose Erstberatung nutzen? Antworten Sie TERMIN."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s3_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, jeden Monat erreichen Hunderte unserer Patienten durch regelmäßige Pflege ein gesundes Lächeln. Möchten auch Sie einen Schritt für Ihre Zahngesundheit tun? Antworten Sie JA."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s4_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, wir haben ein besonderes Angebot für Sie! Diesen Monat sind nur begrenzt vergünstigte Beratungstermine verfügbar. Nicht verpassen — antworten Sie TERMIN."}]',
  'draft', true, true, 'dental', 'reengagement'),

(NULL, 'dental_reactivation_s5_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, dies ist unsere letzte Nachricht. Ihre Zahngesundheit ist wichtig und wir helfen Ihnen gerne. Bei Interesse antworten Sie JA, wir rufen Sie an. Falls Sie keine Nachrichten mehr wünschen, antworten Sie STOPP."}]',
  'draft', true, true, 'dental', 'reengagement'),

-- ── HAIR ────────────────────────────────────────────────────────────────────

-- hair TR
(NULL, 'hair_reactivation_s1_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, bir süredir görüşemedik. Saç ekimi yolculuğunuzla ilgili hâlâ bilgi almak ister misiniz? Sorularınız için buradan yazabilirsiniz."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s2_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, modern saç ekimi teknikleri ile doğal ve kalıcı sonuçlar artık çok daha erişilebilir. Size özel ücretsiz saç analizi randevumuzdan yararlanmak ister misiniz? ANALİZ yazın."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s3_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, her ay yüzlerce hastamız doğal görünümlü sonuçlarla güvenlerini yeniden kazanıyor. Siz de ücretsiz saç analizimizden faydalanmak ister misiniz? EVET yazın."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s4_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, size özel bir fırsatımız var! Bu ay için sınırlı sayıda özel fiyatlı saç analizi randevumuz mevcut. Fırsatı kaçırmayın, ANALİZ yazın."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s5_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, son bir kez ulaşıyoruz. Saç ekimi konusunda size yardımcı olmak isteriz. İlgileniyorsanız EVET yazın, sizi arayalım. Artık mesaj almak istemiyorsanız DUR yazabilirsiniz."}]',
  'draft', true, true, 'hair', 'reengagement'),

-- hair EN
(NULL, 'hair_reactivation_s1_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, it''s been a while since we last connected. Are you still interested in learning about your hair transplant journey? Feel free to write us here with any questions."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s2_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, modern hair transplant techniques now deliver natural, lasting results more accessibly than ever. Would you like to take advantage of our free hair analysis? Reply ANALYSIS."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s3_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, every month hundreds of our patients regain their confidence with natural-looking results. Would you like to benefit from our free hair analysis too? Reply YES."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s4_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, we have a special offer for you! We have a limited number of specially priced hair analysis appointments this month. Don''t miss out — reply ANALYSIS."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s5_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, this is our last message. We''d love to help you with your hair transplant journey. If you''re interested, reply YES and we''ll call you. If you''d prefer not to receive messages, reply STOP."}]',
  'draft', true, true, 'hair', 'reengagement'),

-- hair DE
(NULL, 'hair_reactivation_s1_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, es ist eine Weile her seit unserem letzten Kontakt. Interessieren Sie sich noch für eine Haartransplantation? Schreiben Sie uns gerne hier bei Fragen."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s2_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, moderne Haartransplantationstechniken liefern heute natürliche, dauerhafte Ergebnisse. Möchten Sie unsere kostenlose Haaranalyse nutzen? Antworten Sie ANALYSE."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s3_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, jeden Monat gewinnen Hunderte unserer Patienten mit natürlich aussehenden Ergebnissen ihr Selbstvertrauen zurück. Möchten auch Sie unsere kostenlose Haaranalyse nutzen? Antworten Sie JA."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s4_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, wir haben ein besonderes Angebot für Sie! Diesen Monat sind nur begrenzt Haaranalyse-Termine zum Sonderpreis verfügbar. Nicht verpassen — antworten Sie ANALYSE."}]',
  'draft', true, true, 'hair', 'reengagement'),

(NULL, 'hair_reactivation_s5_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, dies ist unsere letzte Nachricht. Wir helfen Ihnen gerne bei Ihrer Haartransplantation. Bei Interesse antworten Sie JA, wir rufen Sie an. Falls Sie keine Nachrichten mehr wünschen, antworten Sie STOPP."}]',
  'draft', true, true, 'hair', 'reengagement'),

-- ── AESTHETICS ──────────────────────────────────────────────────────────────

-- aesthetics TR
(NULL, 'aesthetics_reactivation_s1_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, bir süredir görüşemedik. Estetik hedefleriniz konusunda hâlâ destek almak ister misiniz? Sorularınız için buradan yazabilirsiniz."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s2_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, doğru estetik prosedürler ile kendinize olan güveninizi artırabilirsiniz. Size özel ücretsiz konsültasyon randevumuzdan yararlanmak ister misiniz? RANDEVU yazın."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s3_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, her ay yüzlerce hastamız estetik prosedürlerimizle kendilerini daha iyi hissediyor. Siz de ücretsiz konsültasyonumuzdan faydalanmak ister misiniz? EVET yazın."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s4_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, size özel bir fırsatımız var! Bu ay için sınırlı sayıda indirimli konsültasyon randevumuz mevcut. Fırsatı kaçırmayın, RANDEVU yazın."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s5_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, son bir kez ulaşıyoruz. Estetik hedeflerinize ulaşmanız için size yardımcı olmak isteriz. İlgileniyorsanız EVET yazın, sizi arayalım. Artık mesaj almak istemiyorsanız DUR yazabilirsiniz."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

-- aesthetics EN
(NULL, 'aesthetics_reactivation_s1_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, it''s been a while since we last connected. Are you still looking for support with your aesthetic goals? Feel free to write us here with any questions."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s2_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, the right aesthetic procedures can help boost your confidence. Would you like to take advantage of our free consultation? Reply APPOINTMENT."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s3_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, every month hundreds of our patients feel better about themselves through our aesthetic procedures. Would you like to benefit from our free consultation too? Reply YES."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s4_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, we have a special offer for you! We have a limited number of discounted consultation slots this month. Don''t miss out — reply APPOINTMENT."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s5_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, this is our last message. We''d love to help you achieve your aesthetic goals. If you''re interested, reply YES and we''ll call you. If you''d prefer not to receive messages, reply STOP."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

-- aesthetics DE
(NULL, 'aesthetics_reactivation_s1_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, es ist eine Weile her seit unserem letzten Kontakt. Möchten Sie weiterhin Unterstützung bei Ihren ästhetischen Zielen? Schreiben Sie uns gerne hier bei Fragen."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s2_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, die richtigen ästhetischen Behandlungen können Ihr Selbstvertrauen stärken. Möchten Sie unsere kostenlose Beratung nutzen? Antworten Sie TERMIN."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s3_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, jeden Monat fühlen sich Hunderte unserer Patienten dank unserer ästhetischen Behandlungen wohler. Möchten auch Sie unsere kostenlose Beratung nutzen? Antworten Sie JA."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s4_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, wir haben ein besonderes Angebot für Sie! Diesen Monat sind nur begrenzt vergünstigte Beratungstermine verfügbar. Nicht verpassen — antworten Sie TERMIN."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_reactivation_s5_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, dies ist unsere letzte Nachricht. Wir helfen Ihnen gerne, Ihre ästhetischen Ziele zu erreichen. Bei Interesse antworten Sie JA, wir rufen Sie an. Falls Sie keine Nachrichten mehr wünschen, antworten Sie STOPP."}]',
  'draft', true, true, 'aesthetics', 'reengagement'),

-- ── GENERAL ─────────────────────────────────────────────────────────────────

-- general TR
(NULL, 'general_reactivation_s1_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, bir süredir görüşemedik. Hizmetlerimiz hakkında hâlâ bilgi almak ister misiniz? Sorularınız için buradan yazabilirsiniz."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s2_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, uzman ekibimiz ihtiyaçlarınıza en uygun çözümü sunmak için hazır. Size özel ücretsiz danışmanlık randevumuzdan yararlanmak ister misiniz? RANDEVU yazın."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s3_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, her ay yüzlerce müşterimiz profesyonel hizmetlerimizden memnun kalıyor. Siz de ücretsiz danışmanlığımızdan faydalanmak ister misiniz? EVET yazın."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s4_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, size özel bir fırsatımız var! Bu ay için sınırlı sayıda özel fiyatlı danışmanlık randevumuz mevcut. Fırsatı kaçırmayın, RANDEVU yazın."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s5_v2', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, son bir kez ulaşıyoruz. Size yardımcı olmak isteriz. İlgileniyorsanız EVET yazın, sizi arayalım. Artık mesaj almak istemiyorsanız DUR yazabilirsiniz."}]',
  'draft', true, true, 'general', 'reengagement'),

-- general EN
(NULL, 'general_reactivation_s1_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, it''s been a while since we last connected. Are you still interested in learning about our services? Feel free to write us here with any questions."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s2_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, our expert team is ready to offer you the best solution for your needs. Would you like to take advantage of our free consultation? Reply APPOINTMENT."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s3_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, every month hundreds of our clients are satisfied with our professional services. Would you like to benefit from our free consultation too? Reply YES."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s4_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, we have a special offer for you! We have a limited number of specially priced consultation appointments this month. Don''t miss out — reply APPOINTMENT."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s5_v2_en', 'en', 'MARKETING',
  '[{"type":"BODY","text":"Hello {{1}}, this is our last message. We''d love to help you. If you''re interested, reply YES and we''ll call you. If you''d prefer not to receive messages, reply STOP."}]',
  'draft', true, true, 'general', 'reengagement'),

-- general DE
(NULL, 'general_reactivation_s1_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, es ist eine Weile her seit unserem letzten Kontakt. Interessieren Sie sich noch für unsere Dienstleistungen? Schreiben Sie uns gerne hier bei Fragen."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s2_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, unser Expertenteam steht bereit, Ihnen die beste Lösung für Ihre Bedürfnisse anzubieten. Möchten Sie unsere kostenlose Beratung nutzen? Antworten Sie TERMIN."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s3_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, jeden Monat sind Hunderte unserer Kunden mit unseren professionellen Dienstleistungen zufrieden. Möchten auch Sie unsere kostenlose Beratung nutzen? Antworten Sie JA."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s4_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, wir haben ein besonderes Angebot für Sie! Diesen Monat sind nur begrenzt Beratungstermine zum Sonderpreis verfügbar. Nicht verpassen — antworten Sie TERMIN."}]',
  'draft', true, true, 'general', 'reengagement'),

(NULL, 'general_reactivation_s5_v2_de', 'de', 'MARKETING',
  '[{"type":"BODY","text":"Hallo {{1}}, dies ist unsere letzte Nachricht. Wir helfen Ihnen gerne weiter. Bei Interesse antworten Sie JA, wir rufen Sie an. Falls Sie keine Nachrichten mehr wünschen, antworten Sie STOPP."}]',
  'draft', true, true, 'general', 'reengagement')

ON CONFLICT DO NOTHING;


-- ─── 1C. Payment Followup Templates (12 total) ─────────────────────────────
-- 4 sectors x 3 languages
-- All: category=UTILITY, purpose=payment_followup, is_preset=true, is_recommended=true

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, is_recommended, sector, purpose)
VALUES

-- dental
(NULL, 'dental_payment_followup_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, diş tedavinize ait ödeme hakkında nazik bir hatırlatma yapmak istiyoruz. Ödeme detayları ve taksit seçenekleri için bize buradan yazabilirsiniz."}]',
  'draft', true, true, 'dental', 'payment_followup'),

(NULL, 'dental_payment_followup_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hello {{1}}, this is a gentle reminder about the payment for your dental treatment. Feel free to write us here for payment details and installment options."}]',
  'draft', true, true, 'dental', 'payment_followup'),

(NULL, 'dental_payment_followup_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, wir möchten Sie freundlich an die Zahlung für Ihre Zahnbehandlung erinnern. Schreiben Sie uns gerne für Zahlungsdetails und Ratenzahlungsoptionen."}]',
  'draft', true, true, 'dental', 'payment_followup'),

-- hair
(NULL, 'hair_payment_followup_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, saç ekimi işleminize ait ödeme hakkında nazik bir hatırlatma yapmak istiyoruz. Ödeme detayları ve taksit seçenekleri için bize buradan yazabilirsiniz."}]',
  'draft', true, true, 'hair', 'payment_followup'),

(NULL, 'hair_payment_followup_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hello {{1}}, this is a gentle reminder about the payment for your hair transplant procedure. Feel free to write us here for payment details and installment options."}]',
  'draft', true, true, 'hair', 'payment_followup'),

(NULL, 'hair_payment_followup_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, wir möchten Sie freundlich an die Zahlung für Ihre Haartransplantation erinnern. Schreiben Sie uns gerne für Zahlungsdetails und Ratenzahlungsoptionen."}]',
  'draft', true, true, 'hair', 'payment_followup'),

-- aesthetics
(NULL, 'aesthetics_payment_followup_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, estetik işleminize ait ödeme hakkında nazik bir hatırlatma yapmak istiyoruz. Ödeme detayları ve taksit seçenekleri için bize buradan yazabilirsiniz."}]',
  'draft', true, true, 'aesthetics', 'payment_followup'),

(NULL, 'aesthetics_payment_followup_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hello {{1}}, this is a gentle reminder about the payment for your aesthetic procedure. Feel free to write us here for payment details and installment options."}]',
  'draft', true, true, 'aesthetics', 'payment_followup'),

(NULL, 'aesthetics_payment_followup_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, wir möchten Sie freundlich an die Zahlung für Ihre ästhetische Behandlung erinnern. Schreiben Sie uns gerne für Zahlungsdetails und Ratenzahlungsoptionen."}]',
  'draft', true, true, 'aesthetics', 'payment_followup'),

-- general
(NULL, 'general_payment_followup_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, hizmetimize ait ödeme hakkında nazik bir hatırlatma yapmak istiyoruz. Ödeme detayları ve taksit seçenekleri için bize buradan yazabilirsiniz."}]',
  'draft', true, true, 'general', 'payment_followup'),

(NULL, 'general_payment_followup_v1_en', 'en', 'UTILITY',
  '[{"type":"BODY","text":"Hello {{1}}, this is a gentle reminder about your outstanding payment. Feel free to write us here for payment details and installment options."}]',
  'draft', true, true, 'general', 'payment_followup'),

(NULL, 'general_payment_followup_v1_de', 'de', 'UTILITY',
  '[{"type":"BODY","text":"Hallo {{1}}, wir möchten Sie freundlich an Ihre ausstehende Zahlung erinnern. Schreiben Sie uns gerne für Zahlungsdetails und Ratenzahlungsoptionen."}]',
  'draft', true, true, 'general', 'payment_followup')

ON CONFLICT DO NOTHING;


-- ─── 1D. Mark existing good presets as recommended ──────────────────────────

UPDATE public.message_templates
SET is_recommended = true
WHERE is_preset = true
  AND purpose IN ('first_contact', 'followup', 'appointment_reminder', 'satisfaction');
