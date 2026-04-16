-- 2026-03-29_kb_promo_cleanup.sql
-- KB item'larındaki LLM promosyon dili temizlendi.
-- "Merhaba, ben Eurostar temsilcisiyim", "harika bir seçenek",
-- "mükemmel bir tercih", "memnuniyetle yanıtlarım" gibi ifadeler
-- kaldırıldı. Fiyat ve program bilgileri korundu.

UPDATE knowledge_items
SET description_for_ai = $D$ADA Üniversitesi, Azerbaycan'da uluslararası standartlarda eğitim sunan bir kurumdur. Öne çıkan bölümler: Bilgisayar Bilimleri, Bilişim Teknolojileri Mühendisliği, Elektrik ve Elektronik Mühendisliği, Matematik, İletişim ve Dijital Medya, Devlet ve Sosyal İlişkiler, Uluslararası İlişkiler, Halkla İlişkiler, Finans, İş Yönetimi ve Ekonomi. Tüm programlar İngilizce dilinde sunulmakta ve yıllık ücreti 5000 USD'dir.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'ADA (DİPLOMATİK AKADEMİ) ÜNİVERSİTESİ (Azerbaycan)';

UPDATE knowledge_items
SET description_for_ai = $D$Gence Devlet Tarım Üniversitesi, Azerbaycan'ın Gence şehrinde yer almaktadır. Öne çıkan programlar: Veterinerlik, Eczacılık, Ziraat Mühendisliği, Ekoloji. Eğitim dili Azerbaycan Türkçesidir. Veterinerlik ve Eczacılık yıllık 2500 USD, Ziraat Mühendisliği 2200 USD, diğer programlar 1500 USD'dir. Yurt imkanı mevcuttur.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'GENCE DEVLET TARIM ÜNİVERSİTESİ (Azerbaycan)';

UPDATE knowledge_items
SET description_for_ai = $D$Lodz Üniversitesi, Polonya'nın Lodz şehrinde yer almaktadır. Öne çıkan programlar (İngilizce): Ekonomi, İşletme, Yönetim ve Finans, Bilgisayar Bilimleri, Uluslararası İlişkiler ve Siyaset Bilimi, Çevre Koruma. Yıllık öğrenim ücreti 2500 EUR. Yurt ücreti 90 EUR, başvuru ücreti 120 EUR, ev kirası 200-300 EUR.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'LODZ ÜNİVERSİTESİ (Polonya)';

UPDATE knowledge_items
SET description_for_ai = $D$Azerbaycan Medeniyet ve İnce Sanat Üniversitesi, sanatsal ve kültürel alanlarda eğitim vermektedir. Programlar: Müze Bilim, Arşiv ve Anıtların Korunması, Arkeoloji, Sanat Bilimi, Güzel Sanatlar, Enstrümantal İfacılık, Solo Okuma, Tiyatroculuk, Oyunculuk, Sinemacılık. Eğitim dili Azerbaycan Türkçesidir. Genel programlar 2000 USD, özel programlar (Müze Bilim, Müziksel Eleştiri vb.) 2500-3000 USD.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'AZERBAYCAN MEDENİYET VE İNCE SANAT ÜNİVERSİTESİ (Azerbaycan)';

UPDATE knowledge_items
SET description_for_ai = $D$Varşova Ekonomi Üniversitesi (SGH), Polonya'nın başkentinde yer alan prestijli bir eğitim kurumudur. Programlar (İngilizce): Uluslararası Ekonomi ve Finans ve Yönetim yıllık 4000 EUR, Finans ve Muhasebe 5100 EUR, Ekonomi Bilişimi Yöntemleri ve İşletme Yönetimi de mevcuttur. Yurt ücreti 100-150 EUR, ev kirası 200-300 EUR.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'VARŞOVA EKONOMİ ÜNİVERSİTESİ (SGH) (Polonya)';

UPDATE knowledge_items
SET description_for_ai = $D$Cluj Teknik Üniversitesi, Romanya'nın Cluj-Napoca şehrinde yer almaktadır. İngilizce programlar (yıllık 2700 EUR): Bilgisayar Bilimi, Bilgisayar Mühendisliği, Otomasyon ve Kontrol, Şehir Planlama, Mimarlık, Robotik. Romence programlar (yıllık 2700 EUR): Makina Yapımı, Mekatronik, İnşaat, Ulaştırma, Malzeme ve Çevre, Yapı Hizmetleri Mühendisliği.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'CLUJ TEKNİK ÜNİVERSİTESİ (Romanya)';

UPDATE knowledge_items
SET description_for_ai = $D$Gence Devlet Üniversitesi, Azerbaycan'ın Gence şehrinde yer almaktadır. Eğitim dili Azerbaycan Türkçesidir. Programlar ve ücretler: Botanik, Kimya, Hayvancılık, Ekoloji, Fizik, İngilizce, Matematik, Sosyoloji öğretmenlik programları 600 USD; Biyoloji, Bilgisayar, Beden Eğitimi, Turizm Otelcilik 900 USD. Yurt imkanı mevcut: 3 kişilik oda 50-60 AZN.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'GENCE DEVLET ÜNİVERSİTESİ (Azerbaycan)';

UPDATE knowledge_items
SET description_for_ai = $D$Gürcistan Tarım Üniversitesi, çeşitli mühendislik ve tarım programları sunmaktadır. Programlar (Gürcüce, yıllık 1200 USD): Ziraat Mühendisliği, Veterinerlik, Biyoloji, Gıda Teknolojileri, Tarım Bilimleri, Bağcılık ve Şarapcılık, Elektrik ve Bilgisayar Mühendisliği, Makine Mühendisliği, İnşaat Mühendisliği, Park ve Ormancılık, Peyzaj Yönetimi, Otomasyon ve Kontrol Mühendisliği.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'GÜRCİSTAN TARIM ÜNİVERSİTESİ (Gürcistan)';

UPDATE knowledge_items
SET description_for_ai = $D$Kazan Federal Üniversitesi, Rusya'nın Kazan şehrinde yer alır. QS sıralaması 396, THE sıralaması 801-1000. Program ücretleri: Tıp (İngilizce) 8750 USD, Tıp (Rusça) 6450 USD; Diş Hekimliği (İngilizce) 8750 USD, (Rusça) 6350 USD; Eczacılık (Rusça) 4550 USD; Klinik Psikoloji 2350 USD; İşletme (İngilizce) 3750 USD, (Rusça) 3100 USD. Hukuk, Biyoloji, Psikoloji programları da mevcuttur.$D$,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND title = 'KAZAN FEDERAL ÜNİVERSİTESİ (Rusya)';
