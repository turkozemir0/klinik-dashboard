-- 2026-03-29_kb_data_fixes.sql
-- 1. Pricing item'ına İran bilgisi eklendi (şu an eksik)
-- 2. KB item içeriklerindeki LLM promosyon dili temizlendi
--    - "Merhaba!" açılışı kaldırıldı (Tahran Tıp)
--    - "harika bir seçenek/fırsat" ifadeleri kaldırıldı (Tebriz)
--    - "unutmayın" çağrısı kaldırıldı (İsfahan Tıp)

-- ── 1. Pricing özet item — İran satırı eklendi ────────────────────────────────
UPDATE knowledge_items
SET
  description_for_ai = 'Eurostar kayıt danışmanlık ücretleri, farklı ülkeler ve programlara göre değişiklik göstermektedir. Azerbaycan''da kayıt danışmanlık ücreti 1150 ile 1500 USD arasında, Polonya''nın tıp ve hukuk programları için ise 1550 EUR''dur. Bosna''da sunulan paketler için ücretler 2500 ile 3500 EUR arasında değişmektedir. Kosova''da kayıt danışmanlık ücreti 1400 EUR, Romanya''da ise 1250 EUR olarak belirlenmiştir. İran''da Tahran şehri için danışmanlık ücreti 1600 USD, Tebriz ve İsfahan için ise 1200 USD''dir.',
  updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND item_type = 'pricing'
  AND title = 'Kayıt Danışmanlık Ücretleri — Özet';

-- ── 2. Tahran Tıp — "Merhaba!" açılışı ve promosyon dili temizlendi ──────────
UPDATE knowledge_items
SET
  description_for_ai = 'Tahran Tıp Üniversitesi, sağlık alanında geniş bir eğitim yelpazesi sunmaktadır. Öne çıkan bölümler: Tıp, Diş Hekimliği, Eczacılık, Hemşirelik, Ebelik, Beslenme Bilimi, Fizyoterapi, Anestezi ve Tıbbi Laboratuvar Bilimleri. Tüm bu programlar yıllık 5000 USD ücretle sunulmaktadır ve eğitim dili Farsça''dır.',
  updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'TAHRAN TIP ÜNİVERSİTESİ (İran)';

-- ── 3. Tebriz Üniversitesi — promosyon cümlesi kaldırıldı ────────────────────
UPDATE knowledge_items
SET
  description_for_ai = 'Tebriz Üniversitesi, İran''ın önde gelen yükseköğretim kurumlarından biridir ve çeşitli alanlarda lisans programları sunmaktadır. Öne çıkan bölümler: Hayvan Bilimi, Gıda Bilimi ve Teknolojisi, Ormancılık, Bitki Üretimi Mühendisliği, Biyosistem Mühendisliği. Program ücretleri genellikle 750 ile 850 USD arasında değişmektedir ve tüm dersler Farsça olarak verilmektedir. Fen Edebiyat Fakültesi''nde İngiliz Dili ve Edebiyatı, Fransız Dili ve Edebiyatı, Felsefe gibi programlar da mevcuttur; bu bölümlerde de aynı ücretlendirme geçerlidir.',
  updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'TEBRİZ ÜNİVERSİTESİ (İran)';

-- ── 4. İsfahan Tıp — promosyon cümlesi kaldırıldı ────────────────────────────
UPDATE knowledge_items
SET
  description_for_ai = 'İsfahan Tıp Üniversitesi, uluslararası öğrencilere kaliteli bir eğitim imkanı sunmaktadır. Öne çıkan programlar: Tıp, Diş Hekimliği ve Eczacılık. Tıp ve Diş Hekimliği programları hem İngilizce hem Farsça sunulmakta olup yıllık eğitim ücreti 4300 USD''dir. Bu bölümler için 5 kişilik ve 4 kişilik yurt seçenekleri mevcuttur. Eczacılık programı yalnızca Farsça dilinde eğitim vermekte ve 3 kişilik yurt imkanı sunmaktadır.',
  updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'İSFAHAN TIP ÜNİVERSİTESİ (İran)';
