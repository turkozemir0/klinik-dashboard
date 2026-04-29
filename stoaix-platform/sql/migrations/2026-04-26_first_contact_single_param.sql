-- first_contact presetlerini tek parametre ({{1}} = ad) olarak güncelle
-- Her sektöre özel hizmet adı template metninde hardcode
-- {{2}} kaldırıldı

-- ═══════════════════════════════════════════════════════
-- 1) PRESET'LER (is_preset = true, sector bazlı)
-- ═══════════════════════════════════════════════════════

-- DENTAL — TR
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Merhaba {{1}}, diş tedavisi ile ilgili formumuzu doldurduğunuz için teşekkür ederiz! Bilgilerinizi inceledik ve size dönüş yapmak istiyoruz. Sorularınız için buradan yazabilirsiniz."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'tr' AND name LIKE '%dental%';

-- DENTAL — EN
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hi {{1}}, thank you for your inquiry about dental treatment! We have reviewed your information and would like to follow up with you. Feel free to message us here with any questions."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'en' AND name LIKE '%dental%';

-- DENTAL — DE
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank fuer Ihre Anfrage zur Zahnbehandlung! Wir haben Ihre Angaben geprueft und moechten uns bei Ihnen melden. Bei Fragen koennen Sie uns gerne hier schreiben."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'de' AND name LIKE '%dental%';

-- HAIR — TR
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Merhaba {{1}}, saç ekimi ile ilgili formumuzu doldurduğunuz için teşekkür ederiz! Bilgilerinizi inceledik ve size dönüş yapmak istiyoruz. Sorularınız için buradan yazabilirsiniz."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'tr' AND name LIKE '%hair%';

-- HAIR — EN
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hi {{1}}, thank you for your inquiry about hair transplant! We have reviewed your information and would like to follow up with you. Feel free to message us here with any questions."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'en' AND name LIKE '%hair%';

-- HAIR — DE
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank fuer Ihre Anfrage zur Haartransplantation! Wir haben Ihre Angaben geprueft und moechten uns bei Ihnen melden. Bei Fragen koennen Sie uns gerne hier schreiben."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'de' AND name LIKE '%hair%';

-- AESTHETICS — TR
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Merhaba {{1}}, estetik tedavi ile ilgili formumuzu doldurduğunuz için teşekkür ederiz! Bilgilerinizi inceledik ve size dönüş yapmak istiyoruz. Sorularınız için buradan yazabilirsiniz."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'tr' AND name LIKE '%aesthetics%';

-- AESTHETICS — EN
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hi {{1}}, thank you for your inquiry about aesthetic treatment! We have reviewed your information and would like to follow up with you. Feel free to message us here with any questions."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'en' AND name LIKE '%aesthetics%';

-- AESTHETICS — DE
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank fuer Ihre Anfrage zur aesthetischen Behandlung! Wir haben Ihre Angaben geprueft und moechten uns bei Ihnen melden. Bei Fragen koennen Sie uns gerne hier schreiben."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'de' AND name LIKE '%aesthetics%';

-- GENERAL — TR
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Merhaba {{1}}, hizmetlerimizle ilgili formumuzu doldurduğunuz için teşekkür ederiz! Bilgilerinizi inceledik ve size dönüş yapmak istiyoruz. Sorularınız için buradan yazabilirsiniz."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'tr' AND name LIKE '%general%';

-- GENERAL — EN
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hi {{1}}, thank you for your inquiry about our services! We have reviewed your information and would like to follow up with you. Feel free to message us here with any questions."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'en' AND name LIKE '%general%';

-- GENERAL — DE
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank fuer Ihre Anfrage zu unseren Leistungen! Wir haben Ihre Angaben geprueft und moechten uns bei Ihnen melden. Bei Fragen koennen Sie uns gerne hier schreiben."}]' WHERE is_preset = true AND purpose = 'first_contact' AND language = 'de' AND name LIKE '%general%';

-- ═══════════════════════════════════════════════════════
-- 2) ORG KOPYALARI — {{2}} içerenleri temizle (generic fallback)
-- ═══════════════════════════════════════════════════════
UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Merhaba {{1}}, formumuzu doldurduğunuz için teşekkür ederiz! Bilgilerinizi inceledik ve size dönüş yapmak istiyoruz. Sorularınız için buradan yazabilirsiniz."}]' WHERE is_preset = false AND purpose = 'first_contact' AND language = 'tr' AND components::text LIKE '%{{2}}%';

UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hi {{1}}, thank you for your inquiry! We have reviewed your information and would like to follow up with you. Feel free to message us here with any questions."}]' WHERE is_preset = false AND purpose = 'first_contact' AND language = 'en' AND components::text LIKE '%{{2}}%';

UPDATE public.message_templates SET components = '[{"type":"BODY","text":"Hallo {{1}}, vielen Dank fuer Ihre Anfrage! Wir haben Ihre Angaben geprueft und moechten uns bei Ihnen melden. Bei Fragen koennen Sie uns gerne hier schreiben."}]' WHERE is_preset = false AND purpose = 'first_contact' AND language = 'de' AND components::text LIKE '%{{2}}%';
