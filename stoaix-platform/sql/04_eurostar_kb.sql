-- ═══════════════════════════════════════════════════════════════
-- Eurostar Knowledge Base — Otomatik üretildi (parse_eurostar_kb.py)
-- Toplam: 62 knowledge item
-- ON CONFLICT DO UPDATE: yeniden çalıştırınca güncelleme yapar
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'AZERBAYCAN  AZERBAYCAN TIP ÜNİVERSİTESİ İÇİN KAYIT DANIŞMANLIK : 1500USD
DİĞER ÜNİVERSİTELER İÇİN DANIŞMANLIK 1150 USD
-Vizesiz Bir Ülkededir. Okul Başladıktan Sonra Öğrenci Oturumu Yapılır.-
-Yaş Ve Diploma Notunda Sınır Yoktur
-Adli Sicili Olan Öğrenciler Kabul Edilmez
-Öğrenci Oturumu İle Ülkede Çalışamaz  ÖNEMLİ VE EN ÇOK GİDİLEN ÜNİVERSİTELER
-Ders Saydırma Tamamlama Gibi İşlemler Yapılmaz.  AZERBAYCAN TEKNİK ÜNİVERSİTESİ
-Nerdeyse Her Üniversitenin Kendine Ait Hazırlığı Vardır.  AZERBAYCAN GENCE DEVLET TARIM ÜNİVERSİTESİ
-Birinci Sınıf Kayıtlar Hazırlıktan Daha Erken Kapanır.  AZERBAYCAN İNŞAAT VE MİMARLIK ÜNİVERSİTESİ
-Havacılık Üniversitesi Kaydı Diğer Üniversiteler Göre Daha Erken Kapanır.  AZERBAYCAN ÜNİVERSİTESİ
-Oturum Her Şey Dahil  : 150 Azn  AZERBAYCAN DEVLET DENİZ AKAMESİ
-Hat Ücreti İnt. Dahil: 35 Azn  AZERBAYCAN MİLLİ HAVACILIK ÜNİVERSİTESİ
-Çeviri Evrak Başı: 20-50 Azn
-Sigorta İlk Yıl İnşaat Ve Mimarlıkta Zorunlur: 200 Azn
-Yurtta Yemek  Ortalama: 250 Azn
-Genel Olarak Aylık Gider Barınma Hariç: 500-600 Azn
AZERBAYCAN  ÜNİVERSİTESİ  HAZIRLIK  AZN-İNG: 1.000 USD  DİL
Bilgi Güvenliği  1500-1600 $  Azerbaycan Türkçesi - İng
Bilgi Teknolojileri  1.300$  Azerbaycan Türkçesi
Bilgisayar Mühendisliği  1.300$  Azerbaycan Türkçesi - İng
Uluslararası Ticaret ve Lojistik  1.200$  Azerbaycan Türkçesi
İşletme Yönetimi  1.500$ - 2.200$  Azerbaycan Türkçesi - İng
Ekonomi  1.300$ - 1.500$  Azerbaycan Türkçesi - İng
Finans  1.000$  Azerbaycan Türkçesi
Pazarlama  1.000$  Azerbaycan Türkçesi
Truzim İşletmeciliği Organizasyonu  1.500$ - 1.600$  Azerbaycan Türkçesi - İng
Yönetim  1300 $  Azerbaycan Türkçesi
Muhasebe  1.300$- 1500$  Azerbaycan Türkçesi - İng
Sosyal Çalışma  1.600$- 1800$  Azerbaycan Türkçesi - İng
Uluslararası İlişkiler  1800$  Azerbaycan Türkçesi
Filoloji (azerbaycan dili ve edebiyatı- ingiliz dili ve edebiyatı)  1.600$  Azerbaycan Türkçesi
Siyaset Bilimi  1.800$  Azerbaycan Türkçesi
Felsefe  1500$  Azerbaycan Türkçesi
AZERBAYCAN DEVLET PEDAGOJİ ÜNİVERSİTESİ  HAZIRLIK  DİL
Dünya Edebiyatı  1180$  Azerbaycan Türkçesi
İlkokul Öğretmenliği  1180$  Azerbaycan Türkçesi
Okul Öncesi Öğretmenliği  1180$  Azerbaycan Türkçesi
İngilizce Öğretmenliği,  1180$  Azerbaycan Türkçesi
Matematik öğretmenliği  1180$  Azerbaycan Türkçesi
Fizik Öğretmenliği  1180$  Azerbaycan Türkçesi
Biyoloji Öğretmenliği  1180$  Azerbaycan Türkçesi
Dünya Edebiyatı  1180$  Azerbaycan Türkçesi
İlkokul Öğretmenliği  1180$  Azerbaycan Türkçesi
Okul Öncesi Öğretmenliği  1180$  Azerbaycan Türkçesi
İngilizce Öğretmenliği  1180$  Azerbaycan Türkçesi
Matematik öğretmenliği  1180$  Azerbaycan Türkçesi
Fizik Öğretmenliği  1180$  Azerbaycan Türkçesi
Biyoloji Öğretmenliği  1180$  Azerbaycan Türkçesi
Psikolojik Danışmanlık ve Rehberlik Öğretmenliği  1180$  Azerbaycan Türkçesi
AZERBAYCAN İNŞAAT VE MİMARLIK ÜNİVERSİTESİ  HAZIRLIK 1200$  DİL  NOT  YUKSEK LİSANS - DOKTORA  ÜCRET
İnşaat Mühendisliği  2000$  Azerice-Rusça-İngilizce  İNGİLİZCE HAZIRLIK OKUMAK İÇİN  Mühendislik Ekonomisi  2500$-3000$
Mimarlık  2500$  Azerice-Rusça-İngilizce  GİRİŞTE İNG MÜLAKAT VARDIR.  Anıt ve tarihi eserlerin inşası ve mimarisi  2500$-3500$
Çevre Ekoloji Mühendisliği  2000$  Azerbaycan Türkçesi - İng  B1 İNGİLİZCESİ OLMASI GEREKİYOR.  İşletme MBA  2500$-3000$
Soğutma ve Su Yönetimi Mühendisliği  2000$  Azerbaycan Türkçesi  Pazarlama MBA  2500$-3000$
Ürün Teknolojisi Endüstrisi  Mühendisliği  2000$  Azerbaycan Türkçesi  İnşaat yönetimi MBA  2500$-3000$
Mekanizasyon ve Otomasyonu  2000$  Azerbaycan Türkçesi  İnşaat alanında yatırım yönetimi MBA  2500$-3000$
Petrol*Gaz Mühendisliği  2000$  Azerbaycan Türkçesi  Trafik Yönetimi MBA  2500$-3000$
Jeodezi ve Haritacılık- Harita Mühendisliği  2000$  Azerbaycan Türkçesi  Lojistik ve Tedarik Zinciri Yönetimi MBA  2500$-3000$
Metroloji Mühendisliği  2000$  Azerbaycan Türkçesi  Gayrimenkul Yönetimi MBA  2500$-3000$
Dizayn*Tasarım  2500$  Azerbaycan Türkçesi  Çevre Yönetimi MBA  2500$-3000$
Teknolojik Makine Ekipman Mühendisliği  2000$  Azerbaycan Türkçesi - İng  İnşaat Mühendisliği  2500$-3000$
İnşaat Malzemeleri  ve Ürünleri Teknoloji Mühendisliği  2000$  Azerbaycan Türkçesi  Dizayn TasarımTeknik Estetik  2500$-3000$
Peyzaj Mimarlığı*Şehir Planlama  2000$  Azerbaycan Türkçesi  Görsel Tasarım ve Medya  2500$-3000$
Mühendislik Sistemleri ve Tesislerin İniaat Mühendisliği  2000$  Azerbaycan Türkçesi  Dizayn grafik interyer  2500$-3000$
Malzeme Bilimi Mühendisliği  2000$  Azerbaycan Türkçesi  Standartlaştırma sahalar üzerine Sertifikalaştırma  2500$-3000$
Elektrik  ve Makine Mühendisliği  2000$  Azerbaycan Türkçesi  Elektrik Mühendisliği  2500$-3000$
Acil Durum İş Sağlığı  Güvenliği  1800$  Azerbaycan Türkçesi - İng  Geodezi Harıtacılık  2500$-3000$
Makine Mühendisliği  1800$  Azerbaycan Türkçesi  Şehir Kadastro  2500$-3000$
Hidroloji *Su* Yönetimi*İslah Mühendisliği  1800$  Azerbaycan Türkçesi  Şehir Planlaması  2200$*3000$
Ulaştırma  İnşaat Mühendisliği  1800$  Azerbaycan Türkçesi  Sürdurulebilir Kentsel Gelişim ve Bölge Planlaması  2000$*3000$
Proses*Islah Mühendisliği  1800$  Azerbaycan Türkçesi  Makine Mühendisliği  2000$*3000$
Enerji ve Bilgisayar Mühendisliği  2000$  Azerbaycan Türkçesi - İng  Bilgi Teknolojileri ve Sistemleri Mühendisliği  2000$*3000$
Kara Araçları Mühendisliği  1800$  Azerbaycan Türkçesi - İng  Endüstri Organizasyonu Yönetimi  2000$*3000$
Endüstriyel  Organizasyonu ve Yönetimi  1800$  Azerbaycan Türkçesi  Üretim ve Hizmet Alanı Ekonomisi ve Yönetimi  2000$*3000$
Bilgi Sistemleri Mühendisliği  1800$  Azerbaycan Türkçesi - İng  Mimarlık  3000$-3500$
AZERBAYCAN TEKNİK ÜNİVERSİTESİ  HAZIRLIK  - 1.100 USD  DİL  YUKSEKLİSANS
Elektrik ve elektronik Mühendisliği  1850$  Azerbaycan Türkçesi - Rusça  Özel amaçlı ürünlerin oluşturulması ve yeni teknolojilerin geliştirilmes  1800$
Otomasyon ve Kontrol  1600$  Azerbaycan Türkçesi - Rusça  Lojistik  1800$
Enerji Verimliliği ve Yeşil Enerji Teknolojileri  1600$  Azerbaycan Türkçesi - Rusça  Sosyal Ekonomik Siyasş Kalkınma ve Toprak Bütunlüğü  1800$',
  '{"country": "Azerbaycan", "chunk": 1, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'Elektronik Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Sosyal Felsefe jeopolitik  düşünce kültürü  1800$
Ekoloji Mühendisliği. Endüstriyel Ekoloji ve Can Güvenliği  1600$  Azerbaycan Türkçesi - Rusça  Dil Kültür Düşünce Sosyal Etkimlikler  1800$
Sürdürülebilir Geri Dönüştürme  1600$  Azerbaycan Türkçesi - Rusça  Dil Teorisi  1800$
Kimyasal Teknolojiler Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Optik telekomünikasyon sistemleri ve bilgi güvenliği  1800$
Ekonomi ve İstatistik  1600$  Azerbaycan Türkçesi - Rusça  Bilgisayarlar Fizik Kuantum  1800$
Uluslararası Ticaret.Uluslararası Ticaret  1600$  Azerbaycan Türkçesi - Rusça  Yapay Zeka  1800$
Otomobil Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Veri Güvenliği  1800$
Malzeme ve Aletler Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Metalürji  1800$
RadyoElektronik Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Geri Dönüşüm Teknolojileri  1800$
Havacılık Sistemleri  ve Uzay Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Malzeme Bilimi  1800$
Özel Teknolojiler ve Cihaz Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Ulaştırma  1800$
Hidrolik ve Isı Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Trafik  1800$
Bilgisayar Mühendisliği  1850$  Azerbaycan Türkçesi - Rusça - İng  Araba Motorları  1800$
Matematik Mühendisliği Yapay Zeka  1600$  Azerbaycan Türkçesi - Rusça  Metalürji Mühendisliği  1800$
Endüstri Mühendisliği*Urün Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça  Otel ve Turizm Yönetimi  1800$
Radyo Mühendisliği ve Telekomünikasyon  1600$  Azerbaycan Türkçesi - Rusça
Mekatronik Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça
Mekanik  1600$  Azerbaycan Türkçesi - Rusça
Makine Mühendisliği  1600$  Azerbaycan Türkçesi - Rusça
Trafik ve Trafik Güvenliği  1600$  Azerbaycan Türkçesi - Rusça
Uluslararası  Taşımacılık Lojistiği ve Yönetimi  1600$  Azerbaycan Türkçesi - Rusça
Ulaştırma ekipmanları ve Yönetim Teknolojileri  1600$  Azerbaycan Türkçesi - Rusça
AZERBAYCAN DEVLET PETROL VE SANAYİ ÜNİVERSİTESİ
(NEFT AKADEMİSİ)  HAZIRLIK  1000USD  DİL
Mineraloji  2000$  Azerbaycan Türkçesi
Jeoloji Mühendisliği  2500$  Azerbaycan Türkçesi
Hidrojeoloji(Su)Mühendisliği  2000$  Azerbaycan Türkçesi
Jeofizik Mühendisliği  2000$  Azerbaycan Türkçesi - İngilizce
Maden Mühendisliği  2000$  Azerbaycan Türkçesi
Gaz Mühendisliği  2500$  Azerbaycan Türkçesi
Petrol Mühendisliğ  2500$  Azerbaycan Türkçesi
Acil Güvenlik Mühendisliği  2000$  Azerbaycan Türkçesi
Kimya ve Kimya Teknolojileri Mühendisliği  2000$  Azerbaycan Türkçesi - İngilizce
Ekoloji Mühendisliğ  2000$  Azerbaycan Türkçesi - İngilizce
Petrol Mekaniği Makine Mühendisliği  2000$  Azerbaycan Türkçesi - İngilizce
Sürdürebilir Geri Kazanım Mühendisliği  2000$  Azerbaycan Türkçesi
Gıda Mühendisliği  2000$  İngilizce
Güç Mühendisliği  2500$  Azerbaycan Türkçesi
Elektroenerjetik Mühendisliği  2500$  Azerbaycan Türkçesi
Isı Enerjisi Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
Elektrik Mühendisliği  2000$  Azerbaycan Türkçesi - İngilizce
Bilgisayar Bilimleri Mühendisliği  2500$  Azerbaycan Türkçesi
Cihaz Malzeme}Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
Bilgi Teknolojileri  2500$  Azerbaycan Türkçesi - İngilizce
Bilgisayar Yönetimi Bilimleri  2500$  Azerbaycan Türkçesi
Elektronik Mühendisliği  2000$  Azerbaycan Türkçesi - İngilizce
Telekomünikasyon Mühendisliği  2500$  Azerbaycan Türkçesi
Radyo Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
Proses Otomasyon Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
Bilgi Teknolojileri  2500$  Azerbaycan Türkçesi - İngilizce
Bilgisayar Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
Sistem Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
Robotik Mühendisliği  2500$  Azerbaycan Türkçesi
İşletme Yönetimi*İşletme*Ekonomi*Pazarlama  2500$  Azerbaycan Türkçesi - İngilizce
Mekatronik Mühendisliği  2500$  Azerbaycan Türkçesi
Lojistik  ve Taşımacılık Teknolojileri Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
Fizik Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
Endustri Mühendisliği  2500$  İngilizce
Biyomedikal Mühendisliği  2500$  Azerbaycan Türkçesi
Meteoroloji Mühendisliği  2500$  Azerbaycan Türkçesi
İnşaat Mühendisliği  2500$  Azerbaycan Türkçesi - İngilizce
AZERBAYCAN DEVLET DENİZ AKADEMİSİ  HAZIRLIK  DİL  ÖNEMLİ NOTLAR
Uzak Yol Gemi Kaptanlığı  3000$  Azerbaycan Türkçesi- İNG  ÜNİVERSİTENİN HAZIRLIĞI YOKTUR.
Gemi kaptanlığı Mühendisliği  3000$  Azerbaycan Türkçesi- İNG  UZAK YOL GEMİ KAPTANLIĞINDA YABANCI ÖĞRENCİYE EHLİYET VERMEZ
Gemi İnşa ve Onarım Mühendisliği  3000$  Azerbaycan Türkçesi - İNG  - YILLIK OKUL ÜCRETİ, ÜNİFORMA, YURT ÜCRETİ 2 KİŞİLİK TEK ÖDEME (YEMEK DAHİL DEĞİL)
Gemi Makineleri İşletme Mühendisliği  3000$  Azerbaycan Türkçesi  İNGİLİZCE BÖLÜMLERE GİRİŞTE SÖZLÜ MÜLAKATLA ALIYOR B1 YETERLİ
Elektrik ve Elektronik Mühendisliği  3000$  Azerbaycan Türkçesi
AZERBAYCAN DİLLER ÜNİVERSİTESİ  DİL
İngiliz Dili ve Edebiyatı  1800$  Azerbaycan Türkçesi
Alman Dili ve Edebiyatı  1800$  Azerbaycan Türkçesi
Fransız Dili ve Edebiyatı  1800$  Azerbaycan Türkçesi
İtalyan Dili ve Edebiyatı  1800$  Azerbaycan Türkçesi
İspanyol Dili ve Edebiyatı  1800$  Azerbaycan Türkçesi
Kore Dili ve Edebiyatı  1800$  Azerbaycan Türkçesi
Uluslararası İlişkiler  2200$  Azerbaycan Türkçesi
Tercümanlık  2200$  Azerbaycan Türkçesi
AZERBAYCAN TIP ÜNİVERSİTESİ  HAZIRLIK 5000USD  DİL  YURT  UZMANLIK 7000$  ÜCRET
Tıp   (6 yıl)  6.000$  AzerbaycanT.-İngilizce-Rusça  150$-250$ *Ev 500*600 Manat  Narkoloji  4 Yıl
Diş Hekimliği  (5 YIL)  6.000$  AzerbaycanT.-İngilizce-Rusça  Fizyoloji  2Yıl
Eczacılık (5 YIL)  6.000$  AzerbaycanT.-İngilizce-Rusça  İmmünoloji  2Yıl
Halk Sağlığı  (4 YIL)  6.000$  Mikrobiyoloji  2 Yıl
Fizik Tedavi ve Rehabilitasyon  6.000$  Laboratuvar  2 Yıl
Hemşirelik  6.000$  Genetik  2 Yıl
Epistemoloji  2 Yıl
Psikiyatri  2 Yıl
AZERBAYCAN TIP ÜNİVERSİTESİ İÇİN NOTLAR  Anesteziyoloji  3 Yıl',
  '{"country": "Azerbaycan", "chunk": 2, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'ARA DÖNEM KAYIDI AÇMAMAKTADIR. LİSE DİPLOMASI ŞARTI VE YKS ŞARTI ARTIK ARAMAMAKTADIR  Diş hekimliği*Cene Cerrahisi  3 Yıl *5 yıl
ÖĞRENCİ ÜLKEYE GİTMEDEN BİYOLOJİ- KİMYADAN SINAVA GİRER  (SKYPE ÜZERİNDEN)  Sosyal hijyen ve sağlık  3 Yıl
HAZIRLIK EĞİTİMİ OCAKTA BAŞLAR.  Römololoji  4 Yıl
Fizyoterapi ve tıbbi reh.  3 Yıl
Radyasyon tedavisi  4 Yıl
Allergoloji  3 Yıl
Patolojik anatomi  3 Yıl
Nöroloji  4 Yıl
Sua Terapisı  3 Yıl
Kardiyoloji  4 Yıl
Nefroloji  4 Yıl
Gastroentroloj  4 Yıl
Hematoloji  4 Yıl
Dermatoloji  4 Yıl
Romatoloji  4 Yıl
Bulaşıcı hastalıklar  4 Yıl
Endokrinoloji  4 Yıl
Oftalmonojik  3 Yıl
KBB  4 Yıl
Pediatri 4 Yıl  4 Yıl
Genel cerrahi  5 Yıl
Beyin cerrahisi  5 Yıl
Plastik cerrahi  5 Yıl
Kalp-damar  5 Yıl
Pediatrik cerrahi  5 Yıl
Travmatoloji-ortopedi  4 Yıl
Onkoloji  5 Yıl
Üroloji  5 Yıl
Doğum ve jinekoloji  5 Yıl
BAKÜ DEVLET ÜNİVERSİTESİ  HAZIRLIK  - 1500 USD  DİL  YUKSEK LISANS  ÜCRET MANAT ÜZERİ  PHD DOKTORA
Azerbaycan Dili ve Edebiyatı Öğretmenliği  1500$  Azerbaycan Türkçesi  MEKANİK- MATEMATİK  2550  Mekanik- Matematik  1600$
Biyoloji Öğretmenliği  1500$  Azerbaycan Türkçesi  UYGULAMALI MATEMATİK VE SİNERNETİK  2550  Uygulamalı Matematik Ve Sibernetik  1600$
Coğrafya Öğretmenliği  1500$  Azerbaycan Türkçesi  FİZİK  2550  Fizik  1600$
Rus Dili ve Edebiyat Öğretmenliği  1500$  Azerbaycan Türkçesi  KİMYA  2040  Kimya  1600$
Fizik Öğretmenliği  1500$  Azerbaycan Türkçesi  BİYOLOJİ  2550  Biyoloji  1600$
Bilgisayar Öğretmenliği  1500$  Azerbaycan Türkçesi  EKOLOJİ VE TOPRAK BİLİMİ  2550  Ekoloji ve Toprak Bilimi  1600$
Kimya Öğretmenliği  1500$  Azerbaycan Türkçesi  COĞRAFYA  2550  Coğrafya  1600$
Özel Eğitim  1500$  Azerbaycan Türkçesi  JEOLOJİ  2550  Jeoloji  1600$
Matematik Öğretmenliği  1500$  Azerbaycan Türkçesi - İNG  FİLOLOJİ  2550  Filoloji  1600$
Tarih Öğretmenliği  1500$  Azerbaycan Türkçesi  TARİH  2550  Tarih  1600$
Eğitimde Sosyo-psikoloji hizmetler  1500$  Azerbaycan Türkçesi  GAZETECİLİK  2550  Gazetecilik  1600$
Uluslararası İlişkiler  2500$  Azerbaycan Türkçesi  -  İNG  DOĞU ÇALIŞMALARI  2550  Doğu Çalışmaları  1600$
Psikoloji  2.000$  Azerbaycan Türkçesi  -  İNG  KÜTÜPHANECİLİK VE BİLGİLENDİRME FAALİYETLERİ  2550
Devlet ve Halkla İlişkiler  2500$  Azerbaycan Türkçesi  SOSYAL BİLİMLER VE PSİKOLOJİ  3400  Kütüphanecilik ve Bilgilendirme Faaliyetleri  1600$
Felsefe  1500$  Azerbaycan Türkçesi  ULUSLARARASI İLİŞKİLER VE EKONOMİ  3400  Sosyal Bilimler ve Psikoloji  2500$
Filoloji (Rus Dili ve Edebiyatı)  1500$  Azerbaycan Türkçesi  HUKUK  5950  Uluslararası İlişkiler ve Ekonomi  2500$
Filoloji (Fransız Dili ve Edebiyatı)  1500$  Azerbaycan Türkçesi  Hukuk  3500$
Filoloji (Alman Dili ve Edebiyatı)  1500$  Azerbaycan Türkçesi
Filoloji (ArapDili ve Edebiyatı)  1500$  Azerbaycan Türkçesi
Filoloji (TürkDili ve Edebiyatı)  1500$  Azerbaycan Türkçesi
Filoloji (Fars Dili ve Edebiyatı)  1500$  Azerbaycan Türkçesi
Filoloji (İngiliz Dili ve Edebiyatı)  1500$  Azerbaycan Türkçesi
Filoloji (Çin Dili ve Edebiyatı)  1500$  Azerbaycan Türkçesi
Hukuk  3500$  Azerbaycan Türkçesi - İNG
Gazetecilik  1500$  Azerbaycan Türkçesi
Kütüphanecilik ve Bilgilendirme Faaliyetleri  1500$  Azerbaycan Türkçesi
Devlet ve Halkla İlişkiler  2500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (Arap Ülkeleri)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (Türkiye Üzerine)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (İran Üzerine)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (Japonya Üzerine)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (İsrail Üzerine)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (Çin Üzerine)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (Pakistan Üzerine)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (Kore Üzerine)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (Amerika Üzerine)  1500$  Azerbaycan Türkçesi
Bölgesel Çalışmalar (Kafkasya Üzerine)  1500$  Azerbaycan Türkçesi
Sosyoloji  1500$  Azerbaycan Türkçesi
Tarih Öğretmenliği  1500$  Azerbaycan Türkçesi
Tercüme (Arap Dili)  1500$  Azerbaycan Türkçesi
Tercüme (Fars Dili)  1500$  Azerbaycan Türkçesi
Uluslararası Ticaret Ve Lojistik  2500$  Azerbaycan Türkçesi
Sürdürülebilir Kalkınma Yöntemi  1500$  Azerbaycan Türkçesi
Şirket Yönetimi  2500$  Azerbaycan Türkçesi
Ekonomi  2500$  Azerbaycan Türkçesi
Maliye  2500$  Azerbaycan Türkçesi
Yönetim  2500$  Azerbaycan Türkçesi
Biyoloji  1500$  Azerbaycan Türkçesi
Biyoteknoloji  2000$  Azerbaycan Türkçesi  - İNG
Coğrafya  1500$  Azerbaycan Türkçesi
Ekoloji  1500$  Azerbaycan Türkçesi
Fizik  1500$  Azerbaycan Türkçesi
Jeoloji  1500$  Azerbaycan Türkçesi
Hidrometeroloji  1500$  Azerbaycan Türkçesi
Kimya  1500$  Azerbaycan Türkçesi
Bilgisayar  1500$  Azerbaycan Türkçesi
Makina  1500$  Azerbaycan Türkçesi
Matematik  1500$  Azerbaycan Türkçesi
Jeoloji ve Jeofizik Mühendisliği  1500$  Azerbaycan Türkçesi
Geomatik ve Jeodezik Mühendisliği  1500$  Azerbaycan Türkçesi
Kimya Mühendisliği  1500$  Azerbaycan Türkçesi
Bilgi Güvenliği  1500$  Azerbaycan Türkçesi
Maden Mühendisliği  1500$  Azerbaycan Türkçesi
Mühendislik Fiziği  1500$  Azerbaycan Türkçesi
Gıda Mühendisliği  1500$  Azerbaycan Türkçesi
Su Biyolojik Kaynakları ve Su Ürünleri Yetiştiriciliği  1500$  Azerbaycan Türkçesi
Toprak bilimi ve Agrokimya  1500$  Azerbaycan Türkçesi
Arazi Yönetimi ve Gayrimenkul Kadastrosu  1500$  Azerbaycan Türkçesi
Sosyal Hizmet  2000$  Azerbaycan Türkçesi
Turizm Çalışmalarının Organizasyonu  1500$  Azerbaycan Türkçesi
Bitki Koruma  1500$  Azerbaycan Türkçesi
AZERBAYCAN DEVLET İKTİSAT ÜNİVERSİTESİ  DİL  YURT  YÜKSEK LİSANS  ÜCRET  DOKTORA  ÜCRET
Maliye  1550$  İngilizce*Türkçe  150$-250$ *Ev 500*600 Manat  Finans  2600$  Dijital pazarlama  3000$
Muhasebe  1500$  İngilizce*Türkçe  Muhasebe ve Denetim İngilizce  2600$  Dijital uzmanlık  3000$
İktisat  1360$  Azerbaycan Türkçesi - İNG  Ekonomi  2300$  Enerji Yönetimi BLOCKHAİN  3000$
İstatistik  1200$  Azerbaycan Türkçesi  Uluslararası Ekonomik İlişkiler  2300$  MBA Dijital İşletme Yönetimi  3000$',
  '{"country": "Azerbaycan", "chunk": 3, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 4)',
  'Ekoloji  1200$  Azerbaycan Türkçesi - RUSÇA  Gümrük İşleri  2300$  Yapay zeka  3000$
Bilgisayar Bilimleri  1200$  Azerbaycan Türkçesi - RUSÇA  Uluslararası Ticaret  2300$  Gıda Kalite Yönetimi  3000$
Uluslararası ticaret ve lojistik  1250$  Azerbaycan Türkçesi - İNG  Uluslararası Finans ve döviz kredisi  2300$  Eğitim yönetimi  5000$
Pazarlama  1250$  Azerbaycan Türkçesi - İNG - RUS  İmalat sektöründe muhasebe ve denetim  2300$
İşletme yönetimi  1500$  Azerbaycan Türkçesi - İNG  Hizmet sektöründe muhasebe ve denetim  2300$
Devlet Idaresi ve Yönetimi  1300$  Azerbaycan Türkçesi  Bankacılık vergilendirme  2300$
İşletme  1300$  Azerbaycan Türkçesi - RUSÇA  Güvenlik işlemlerinin organizasyonu  2300$
Bilişim Teknolojileri  1300$  Azerbaycan Türkçesi - RUSÇA  Mali yönetim finansal Piyasalar  2300$
Bilgi Güvenliği  1120$  Azerbaycan Türkçesi - İNG  İş İdaresi  2200$
Bilgisayar Teknolojileri Mühendisliği  1100$  Azerbaycan Türkçesi - RUSÇA  Tasarım ve Teknik estetik Dizayn, Dünya Ekonomisi  2200$
Dizayn Alana göre}  1800$  Azerbaycan Türkçesi - RUSÇA  İşletme  2200$
Gıda Muhendisliği  1100$  Azerbaycan Türkçesi  Personel yönetimi  2200$
Ekoloji Muhendisliği  1100$  Azerbaycan Türkçesi  Pazarlama Lojistik ticaret  2200$
Elektrik Elektronik Mühendisliği  1000$  Azerbaycan Türkçesi  İşletme yönetimin Yönetimi  2200$
Sanayi Mühendisliği  1000$  Azerbaycan Türkçesi  Ticaret faaliyetleri  2200$
Makine Mühendisliği  1000$  Azerbaycan Türkçesi  Reklamcılık  2200$
Malzeme Mühendisliği  1000$  Azerbaycan Türkçesi  Elektronik ticaret  2100$
Pazarlama  2100$
Endüstri Yönetimi Mühendisliği  2100$
Turizm Ekonomisi  2100$
Emek Ekonomisi  2100$
Ekonometri  2100$
Tarım ekonomisi Stratejik yönetim  2100$
İnovasyon ve proje yönetimi  2000$
Ekonomi  2000$
İktisat  2000$
Mikroekonomik politika  2000$
Çevrebilim  2000$
Bilgisayar Bilimleri  2000$
Ticaret  2000$
Kamu Yönetim  2000$
Ekoloji  2000$
Yönetim Bilgi teknolojileri  2000$
Bilgi sistemleri mühendisliği  2000$
Bilgi sistemleri  2000$
Restorasyon ve çevre Koruma  2000$
Bilişim Teknolojileri telekomünikasyon  2000$
Uygulama yazılımı  2000$
Sosyal Çalışma  2000$
Restorasyon yönetimi  2000$
Catering teknolojisi ve organizasyonu  2000$
Şarap Teknolojileri  2000$
Gıda Güvenliği ve gıda Mühendisliği  2000$
Gıda Pazarlama ve gümrük muayenesi  2000$
Tüketim malları Teknoloji Mühendisliği  2000$
Gıda tüketicilerin incelemesi ve mal pazarlanması  2000$
Metroloji ve iş güvenliği  2000$
İstatistik Yönetim  2000$
Teknolojik Makineler  2000$
Saha Ekipman Mühendisliği  2000$
Elektrik elektronik Mühendisliği  1700$
Teknolojik gıda makine ekipmanları ve ticareti  1700$
Sosyal Medya ve pazarlaması  1700$
İşletme ve Veri analitiği  1700$
Sağlık Yönetimi  1700$
Spor Yönetimi  1700$
Mühendislik ve risk yönetimi  1700$
Turizm ve Otel İşletmeciliği  1700$
Proje yönetimi  1700$
Finans Uluslararası İşletme Pazarlama  1700$
Menkul kıymetler İşletme  1700$
İnsan kaynakları yönetimi  1700$
Banka ve sigorta yönetimi  1700$
Yönetim  1700$
Muhasebe  1700$
Uluslararası lojistik ve tedarik yönetimi  1700$
Siber güvenlik  1700$
Vergi yönetimi ve vergi planlaması  1700$
AZERBAYCAN HAVACILIK ÜNİVERSİTESİ  DİL  HAZIRLIK ÜCRETİ: 4706 $ 8.000 manat
Pilotajlık  - bu sene kayıt almıyor  İNGİLİZCE  ÖĞRENCİ HAZIRLIK DA OKUSA LİSANS DA OKUMAK İSTESE SKYPE ÜZERİNDEN SINAVA GİRİYOR
Uçak Mühendisliği  - bu sene kayıt almıyor  İNGİLİZCE  SINAV İÇERİĞİ MATEMATİK (MAT2) , FİZİK , GEOMETRİ VE DİL SINAVI
Havacılık ve Uzay Mühendisliği  4706 $ 8.000 manat  İNGİLİZCE
Hava Ulaştırma ve Lojistik İşletmeciliği Mühendisliği  4706 $ 8.000 manat  Azerbaycan Türkçesi - İNG - RUS
Havacılık Bilişim Teknolojileri  4706 $ 8.000 manat  Azerbaycan Türkçesi - İNG - RUS
Hidrometeoroloji  4706 $ 8.000 manat  Azerbaycan Türkçesi - İNG - RUS
Trafik Hava Kontrol Memurlugu  4706 $ 8.000 manat  Azerbaycan Türkçesi
Havacılık Hukuku  4706 $ 8.000 manat  Azerbaycan Türkçesi - RUSÇA
Havacılık Cihaz Mühendisliği  4706 $ 8.000 manat  Azerbaycan Türkçesi - RUSÇA
Bilgisayar Mühendisliği  4706 $ 8.000 manat  Azerbaycan Türkçesi - İNG - RUS
NAHCIVAN DEVLET ÜNİVERSİTESİ  DİL  EK BİLGİLER  YUKSEKLİSANS 2500$  DOKTORA  ÜCRET
Tıp 6 Yıl  3000$  Azerbaycan Türkçesi  HAZIRLIK 3000$  Teknoloji Öğretmenliği  Anestezi ve Yoğun bakım  3500$
Diş Hekimliği 5 Yıl  3000$  Azerbaycan Türkçesi  Müzik Öğretmenliği  Genel Cerrahi  3500$
Ezcacılık 4 Yıl  3000$  Azerbaycan Türkçesi  OTURUM İZNİ ÜCRETİ  Pedagoji Tarihi  Kardivasyüler Cerrahi  3500$
Halk Sağlığı 4 Yıl  3000$  Azerbaycan Türkçesi  100$-150$  Tarih Öğretmenliği  Üroloji  3500$
Hukuk  3000$  Azerbaycan Türkçesi  İki Dönem Kayıt Var  Türk Dünyası tarihi  Ebe ve Kadın hastalıkları  3500$
Veterinerlik 4 Yıl  1800$  Azerbaycan Türkçesi  1. Yurt 40$  Arkeoloji  Patoloji  3500$
Askeri Tıp  1200$  Azerbaycan Türkçesi  2.Yurt 60$*100$  Mimari Eserler  Diş Hekimliği  3500$
Psikoloji  1800$  Azerbaycan Türkçesi  Ev 100$-300$  Ceza Hukuku  Epidemoloji  3500$
Mimarlık  1800$  Azerbaycan Türkçesi  Oyunculuk Tarihi  Anıtların Restorasyonu  3500$
Müzikoloji  1800$  Azerbaycan Türkçesi  Medeni ve Ekonomik Hukuk  Genel Pedagoji  1500$
Enstrümantal Performans(Halk Calgıları)  1800$  Azerbaycan Türkçesi  Uluslararası İlişkiler ve Diplomasi  Mikrobiyoloji  3500$
Enstrümantal Performans(Piyano)  1800$  Azerbaycan Türkçesi  Müzik Şarkıcılık vokal performansı  Müzik Sanatı  3500$
Enstrümantal Performans(Yaylı Çalgılar)  1800$  Azerbaycan Türkçesi  Müzik Enstrümanları Ferformansı Tarihi  Sosyal Felsefe  1500$
Oyunculuk Sanatı  1800$  Azerbaycan Türkçesi  Müzik Eleştirmeni  Umumi Felsefe  1500$
Müzik Öğretmenliği  1800$  Azerbaycan Türkçesi  Etnomüzikoloji*Bestecilik  Analiz ve Fonksiyonel Analiz  3500$
Vokal Sanatı )Alana Göre)  1800$  Azerbaycan Türkçesi  Ekonomik İlişkiler  Eğitim ve yetiştirme Metadolojisi  1500$
Güzel Sanatlar Öğretmenliği  1800$  Azerbaycan Türkçesi  Ekonomi  Genel Tarih  1500$
Resim  1800$  Azerbaycan Türkçesi  Stratejik Yönetim  Mimarlık Tarihi  ve Restorasyonu  3500$',
  '{"country": "Azerbaycan", "chunk": 4, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 5)',
  'Biyoloji  1200$  Azerbaycan Türkçesi  Matematik Öğretmenliği  İktisat  3500$
Biyoloji Öğretmenliği  1200$  Azerbaycan Türkçesi  Bilişim Öğretmenliği  Matematik  3500$
Kimya  1200$  Azerbaycan Türkçesi  Fizik (Yarı İletken)  Analiz  3500$
Kimya Öğretmenliği  1200$  Azerbaycan Türkçesi  Kimya Öğretmenliği  Foksiyonel analiz  3500$
Coğrafya  1200$  Azerbaycan Türkçesi  Botanik  Beden Eğitimi Öğretmenliği  1500$
Coğrafya Öğretmenliği  1200$  Azerbaycan Türkçesi  Veterinerlik Cerrahisi
Sosyal Hizmetler  1200$  Azerbaycan Türkçesi  Biyoteknoloji
Beden Eğitimi ve Spor  1200$  Azerbaycan Türkçesi  Cografya Öğretmenliği
Teknoloji Öğretmenliği  1200$  Azerbaycan Türkçesi  Toprak Bilimi
Antrenörlük  1200$  Azerbaycan Türkçesi  Bitki Genetiği
Felsefe  1200$  Azerbaycan Türkçesi  Elektrik Sistemleri
Bölgesel Calışmalar (Avrupa Üzerine)  1200$  Azerbaycan Türkçesi  Bilgi Teknolojileri
Finans  1200$  Azerbaycan Türkçesi  Yönetim Bilgi Sistemleri
Uluslararası İlişkiler  1200$  Azerbaycan Türkçesi  Telekomünikasyon Sistemleri
Devlet ve Halkla İlişkiler  1200$  Azerbaycan Türkçesi  Trafik güvenliği Organize
Turizm İşletmeleri Organizasyonu  1200$  Azerbaycan Türkçesi  Ekonomik Sosyal Caoğrafya
Kamu Yönetimi  1200$  Azerbaycan Türkçesi  Biyoloji Öğretmenliği
Muhasebe  1200$  Azerbaycan Türkçesi  Fiziksel Kimya
Ekonomi  (Azerice*İng)  1200$  Azerbaycan Türkçesi  Mimarlık Restorasyon
Pazarlama  1200$  Azerbaycan Türkçesi  Bilgi ve Güvenlik
Yönetim  1200$  Azerbaycan Türkçesi  Güzel Sanatlar Öğretmenliği
Uluslararası Ticaret ve Lojistik  1200$  Azerbaycan Türkçesi  Şehircilik
Azerbaycan Dili ve Edebiyatı Öğretmenliği  1200$  Azerbaycan Türkçesi  Beden Eğitimi ve Spor
Tarih Öğretmenliği  1200$  Azerbaycan Türkçesi  Resim
Gazetecilik Radyo TV  1200$  Azerbaycan Türkçesi  Simultane Tecumanlık (İngilizce)
Kütüphancilik ve Arşiv Faaliyetleri  1200$  Azerbaycan Türkçesi  Geometri
Müzecilik ve Anıtların Korunması  1200$  Azerbaycan Türkçesi  İş ve Yönetim Bankacılığı
Tarih  1200$  Azerbaycan Türkçesi  Genel Psikoloji
Fars Dili Edebiyatı  1200$  Azerbaycan Türkçesi  Matematiksel Analiz
İngilizce Dil Öğretmenliği  1200$  Azerbaycan Türkçesi  Halk enstrümanları Öğretmenliği
Fransızca Dil Öğretmenliği  1200$  Azerbaycan Türkçesi  Eczacılık-Farmakoloji
Almanca Dil Öğretmenliği  1200$  Azerbaycan Türkçesi  Sosyal Hizmetler
Rusça Dil Öğretmenliği  1200$  Azerbaycan Türkçesi  Turizm ve Otel Yönetimi
Tercumanlık(İngilizce)Çeviri İngilizce  1200$  Azerbaycan Türkçesi  Azerbaycan Dili ve Edebiyatı
Matematik Öğretmenliği  1200$  Azerbaycan Türkçesi  Kaynaklar
Fizik*Fizik Öğretmenliği  1200$  Azerbaycan Türkçesi  Radyo Tv Gazetecilik
Matematik  1200$  Azerbaycan Türkçesi  Kütüphane Bilimi
Bilgi Teknolojileri  1200$  Azerbaycan Türkçesi  Müze Çalışması ve Anıtların Korunması
Bilişim  1200$  Azerbaycan Türkçesi  Rus Dili Öğretmenliği
Elektrik ve Elektronik Mühendisliği  1200$  Azerbaycan Türkçesi
Islah Mühendisliği  1200$  Azerbaycan Türkçesi
Proses Otomasyon Mühendisliği  1200$  Azerbaycan Türkçesi
Güç Mühendisliği  1200$  Azerbaycan Türkçesi
Ulaştırma Mühendisliği Kara*Tren*Hava  1200$  Azerbaycan Türkçesi
Çevre Ekoloji Mühendisliği  1200$  Azerbaycan Türkçesi
Bilgisayar Mühendisliği  1200$  Azerbaycan Türkçesi
Toprak Bilimi veEkoloji Tarım Kimyası  1200$  Azerbaycan Türkçesi
Arazi Yapısı ve Gayrimenkul  1200$  Azerbaycan Türkçesi
BiyoTeknoloji  1200$  Azerbaycan Türkçesi
Pedagoji  1200$  Azerbaycan Türkçesi
Yer Trafik Mühendisliği  1200$  Azerbaycan Türkçesi
Elektrik Güç Mühendisliği  1200$  Azerbaycan Türkçesi
Elektrik Mühendisliği  1200$  Azerbaycan Türkçesi
Elektronik Bilgi Sistemleri Telekomünikasyon  1200$  Azerbaycan Türkçesi
Su Kaynakları Mühendisliği ve Ekonomisi  1200$  Azerbaycan Türkçesi
İnşaat Mühendisliği  1200$  Azerbaycan Türkçesi
Jeodezi ve Kartografi Mühendisliği  1200$  Azerbaycan Türkçesi
Geomatik ve Jeoloji Mühendisliği  1200$  Azerbaycan Türkçesi
Ziraat  Mühendisliği  1200$  Azerbaycan Türkçesi
Sivil savunma Güvenlik  1200$  Azerbaycan Türkçesi
Doğa Bilimleri  1200$  Azerbaycan Türkçesi
Enerji Mühendisliği  1200$  Azerbaycan Türkçesi
BATI  HAZAR ÜNİVERSİTESİ  DİL  EK BİLGİLER  YÜKSEK LİSANS*DOKTORA  ÜCRET
Bilgi Sistem Güvenliği  2700$  Azerbaycan Türkçesi  HAZIRLIKSIZDA OLUR  Genetik  2700$*3000$
Makine Mühendisliği  2700$  Azerbaycan Türkçesi  150$-250$ *Ev 500*600 Manat  Moleküler Biyoloji  2700$*3000$
Cihaz Mühendisliği  2700$  Azerbaycan Türkçesi  OTURUM İZNİ ÜCRETİ  Dil Bilimi  2700$*3000$
Mekatronik Ve Robotik Mühendisliği  2700$  Azerbaycan Türkçesi  100$-150$  Turizm ve Otel Yönetimi  2700$*3000$
Ziraat  2700$  Azerbaycan Türkçesi  İşletme Yönetimi MBA  2700$*3000$
Bilişim Teknolojileri  2700$  Azerbaycan Türkçesi  Elektronik Ticaret İnovasyon Ve Proje Yönetimi  2700$*3000$
Görsel Tasarım  2700$  Azerbaycan Türkçesi  Akıllı Şehir Sistemi Yönetimi  2700$*3000$
Sosyal Psikoloji  2700$  Azerbaycan Türkçesi  Kafkas Halkları  2700$*3000$
Ekoloji  2700$  Azerbaycan Türkçesi  DOKTORA  Klinik Psikoloji – Sosyal Psikoloji  2700$*3000$
Biyoloji  2700$  Azerbaycan Türkçesi  Diplomasi  Yasal Psikoloji  2700$*3000$
Psikoloji  2700$  Azerbaycan Türkçesi  Teknik Grafik dizayn  Uluslararası İlişkiler Ve Diplomasi  2700$*3000$
Uluslararası İlişkiler  2700$  Azerbaycan Türkçesi  Uluslararası İlişkiler  Bilgisayar Mühendisliği  2700$*3000$
Siyaset Bilimi  2700$  Azerbaycan Türkçesi  Saha Ekonomisi  Yazılım Uygulamaları  2700$*3000$
İngiliz Dili Ve Edebiyatı  2700$  Azerbaycan Türkçesi  Genel Ekonomi  Bilgi Sistemleri  2700$*3000$
Tercümanlık(İngilizce-Almanca-Fransızca-Çince )  2700$  Azerbaycan Türkçesi  Siyasi Kurumlar Felsefesi  Diplomasi  2700$*3000$
Turist Rehberi  2700$  Azerbaycan Türkçesi  Dünya Edebiyatı  Ticaret  2700$*3000$
Kamu Yönetimi  2700$  Azerbaycan Türkçesi  Dünya Ekonomisi  Turizm  2700$*3000$
Uluslararası Ticaret ve Lojistik  2700$  Azerbaycan Türkçesi  Maliye ve Finans Politikası  Biyoloji* Genetik Mühendisliği  2700$*3000$',
  '{"country": "Azerbaycan", "chunk": 5, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 6)',
  'Muhasebe *Pazarlama  2700$  Azerbaycan Türkçesi  Sistematik Analiz Yönetimi veBilgi işleme  Dünya Ekonomisi  2700$*3000$
Turizm İşletmelerinin İşletilmesi  2700$  Azerbaycan Türkçesi  Alman dilleri  Bilgisayar Mühendisliği*Yazılım*Yönetim Bilgi Sistemleri  2700$*3000$
Yönetim  2700$  Azerbaycan Türkçesi  Bilgi Teknolojisi ve Sistem Mühendisliği  2700$*3000$
Finans  2700$  Azerbaycan Türkçesi  Tarih*Uluslararası Turizm  2700$*3000$
Ekonomi Sürdürebilir Kalkınma  2700$  Azerbaycan Türkçesi  Sosyal Felsefe  2700$*3000$
Şirket  Yönetimi  2700$  Azerbaycan Türkçesi  Elektronik Ticaret  2700$*3000$
İşletme Yönetimi  2700$  Azerbaycan Türkçesi  Uluslararası Finans  2700$*3000$
BAKÜ AVRASYA ÜNİVERSİTESİ  DİL  YÜKSEK LİSANS  ÜCRET  DOKTORA  ÜCRET
Azerbaycan Dili ve Edebiyatı  1000$  Azerbaycan Türkçesi  Azerbaycan Dili ve Edebiyatı  1000$  Dil Teorisi  3000$
İngiliz Dili ve Edebiyatı  1000$  Azerbaycan Türkçesi  İngiliz Dili ve Edebiyatı  1000$  Almanca Dilleri  3000$
İngilizce Öğretmenliği  1000$  Azerbaycan Türkçesi  İngilizce Öğretmenliği  1000$  Azerbaycan Dili ve Edebiyatı  3000$
Matematik Öğretmenliği  1000$  Azerbaycan Türkçesi  Matematik Öğretmenliği  1000$  Folklor Çalışmaları  3000$
Filoloji  1000$  Azerbaycan Türkçesi  Filoloji  1000$  Uluslararası İlişkiler  3000$
Türk Dili Edebiyatı  1000$  Azerbaycan Türkçesi  Türk Dili Edebiyatı  1000$  Türkoloji  3000$
Tercümanlık  1000$  Azerbaycan Türkçesi  Tercümanlık  1000$
Bölgesel Çalışmalar  1000$  Azerbaycan Türkçesi  Bölgesel Çalışmalar  1000$
Turizm  1000$  Azerbaycan Türkçesi  Ekonomi  1000$
Çalışmalar  1000$  Azerbaycan Türkçesi  Matematik  1000$
Bilgisayar Teknolojileri  1000$  Azerbaycan Türkçesi
İktisat  1000$  Azerbaycan Türkçesi
Devlet ve Belediye İdaresi  1000$  Azerbaycan Türkçesi
Ekonomi  1000$  Azerbaycan Türkçesi
Matematik  1000$  Azerbaycan Türkçesi
Avrupa İlişkileri  1000$  Azerbaycan Türkçesi
Tercümanlık(İngilizce-Almanca-Fransızca- Arap Dili)  1000$  Azerbaycan Türkçesi
Türk Dili Edebiyatı  1000$  Azerbaycan Türkçesi
İngiliz Dili ve Edebiyatı  1000$  Azerbaycan Türkçesi
Sosyal İş  1000$  Azerbaycan Türkçesi
İşletme  1000$  Azerbaycan Türkçesi
Pazarlama  1000$  Azerbaycan Türkçesi
Muhasebe  1000$  Azerbaycan Türkçesi
Maliye  1000$  Azerbaycan Türkçesi
HAZAR ÜNİVERSİTESİ  DİL  EK BİLGİLER  YÜKSEK LİSANS  ÜCRET  DİL  DOKTORA  ÜCRET  DİL
Müzİk ve Güzel Sanatlar  5000$  Azerbaycan Türkçesi  HAZIRLIK FAKÜLTESİ YOK.  Fen Bilimleri Ensitütüsü  5000$  İngilizce  Fen Bilimleri Ensitütüsü,  5000$  İngilizce
İngiliz Dili ve Edebiyatı  5000$  Azerbaycan Türkçesi  Beşeri Bilimler Eğitim Sosyal Bilimler Fakültesi  5000$  İngilizce  Beşeri Bilimler Eğitim Sosyal Bilimler Fakültesi  5000$  İngilizce
Psikoloji*Hukuk  5000$  Azerbaycan Türkçesi  İktisat ve Yönetim Bilimleri Fakültesi Bölümleri  5000$  İngilizce  İktisat ve Yönetim Bilimleri Fakültesi Bölümleri  5000$  İngilizce
Siyaset Bilimi ve Felsefe  5000$  Azerbaycan Türkçesi  Petrol Gaz Mühendisliği  5000$  ingilizce  Petrol Gaz Mühendisliği  5000$  İngilizce
Tarih ve Arkeoloji  5000$  Azerbaycan Türkçesi  Siyaset Bilimi*Dünya Politikası  5000$  İngilizce  Dünya Ekonomisi  5000$  İngilizce
Mimarlık ve Tasarım  5000$  Azerbaycan Türkçesi  Klinik Psikoloji  5000$  ingilizce  Politika Teorisi  5000$  İngilizce
Ekonomi ve Yönetim  5000$  Azerbaycan Türkçesi  Finans*Ekonomi*  5000$  İngilizce  Mikrobiyoloji  5000$  İngilizce
Fizik ve Elektronik  5000$  Azerbaycan Türkçesi  Turizm ve Otel İşletmeciliği  5000$  İngilizce  Moleküler Biyoloji  5000$  İngilizce
Yaşam Bilimleri* Bilişim  5000$  Azerbaycan Türkçesi  Pazarlama*  5000$  İngilizce  İmmunoloji  5000$  İngilizce
İnşaat Mühendisliği  5000$  Azerbaycan Türkçesi  Psikoloji  5000$  ingilizce  Genetik  5000$  İngilizce
Bilgisayar Mühendisliği ve Bilimi  5000$  Azerbaycan Türkçesi  Petrol ve Gaz Mühendisliği  5000$  İngilizce  Nano Teknolojisi  5000$  İngilizce
Petrol Mühendisliği  5000$  Azerbaycan Türkçesi  Bilgisayar Bilimi ve Networks  5000$  ingilizce  Genel Pedagoji ve Tarihi  5000$  İngilizce
Kimya ve Kimya Mühendisliği  5000$  Azerbaycan Türkçesi  Bilgisayar  Bilimleri İnformatik  5000$  İngilizce  BiyoKimya  5000$  İngilizce
Matematik*RadyoTeknik Telekomünikasyon Mühendisliği  5000$  Azerbaycan Türkçesi  Bilgisayar Mühendisliği  5000$  ingilizce  Analitik Kimya  5000$  İngilizce
Cografya ve Cevre Mühendisliği  5000$  Azerbaycan Türkçesi  Bilgisayar Bilimi  5000$  İngilizce
Makine Mühendisliği  5000$  Azerbaycan Türkçesi
Turizm ve Otelcilik İşletmeciliği  5000$  Azerbaycan Türkçesi
GENCE DEVLET ÜNİVERSİTESİ  DİL  EK BİLGİLER  YUKSEK LİSANS  ÜCRET
Botanik  600$  Azerbaycan Türkçesi  yurtlar 50-60 AZN üç kişilik odalar  Biyoloji  900$
Kimya  600$  Azerbaycan Türkçesi  lisans 1000 manat  Bilgisayar  900$
Hayvancılık  600$  Azerbaycan Türkçesi  yüksek lisans 1500 manat  Beden Eğitimi  900$
Çevre  600$  Azerbaycan Türkçesi  Turizm Otelcilik  900$
Ekoloji ve Doğa Bilimleri  600$  Azerbaycan Türkçesi  Sosyal İş  900$
Matematik Enformatik  600$  Azerbaycan Türkçesi  Ekoloji  900$
Geometri ve Cebir  600$  Azerbaycan Türkçesi  Coğrafya  900$
Bilgisayar Bilimleri ve Bilişim Öğretmenliği  600$  Azerbaycan Türkçesi  Yaş Psikolojisi  900$
Fizik Öğretmenliği  600$  Azerbaycan Türkçesi  Tarih  900$
İktisat  600$  Azerbaycan Türkçesi  Psikoloji  900$
İşletme  600$  Azerbaycan Türkçesi  Çocuk Psikolojisi  900$
Makine Mühendisliği ve Teknolojileri  600$  Azerbaycan Türkçesi  İngiliz Dili Tercumanlığı  900$
Bilgisayar Bilişimi  600$  Azerbaycan Türkçesi  Azerbaycan Filolojisi  900$
Pedagoji ve Eğitim Metodolojisi  600$  Azerbaycan Türkçesi  İngiliz Filolojisi  900$
Psikoloji  600$  Azerbaycan Türkçesi  Sosyal Pedagojı  900$
Beden Eğitimi Kondisyon Savunma Sporları  600$  Azerbaycan Türkçesi  Fizik Öğretmenliği  900$
Fizik Öğretmenliği  600$  Azerbaycan Türkçesi  Teknoloji Öğretmenliği  900$
Tarih Öğretmenliği  600$  Azerbaycan Türkçesi  Müzik Öğretmenliği  900$
Almanca Öğretmenliği  600$  Azerbaycan Türkçesi  Cografya Ögretmenliği  900$',
  '{"country": "Azerbaycan", "chunk": 6, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 7)',
  'Rusça Öğretmenliği  600$  Azerbaycan Türkçesi  Kimya Ögretmenliği  900$
Fransızca Öğretmenliği  600$  Azerbaycan Türkçesi  Biyoloji Ögretmenliği  900$
İngilizce Öğretmenliği  600$  Azerbaycan Türkçesi  Tarih Ögretmenliği  900$
Matematik  600$  Azerbaycan Türkçesi  Sınıf Ögretmenliği  900$
Beden Eğitimi Öğretmenliği  600$  Azerbaycan Türkçesi  Pedagoji  900$
Kimya Öğretmenliği  600$  Azerbaycan Türkçesi  Alman Dili Metodolojisi  900$
Biyoloji Öğretmenliği  600$  Azerbaycan Türkçesi  Rus Dili Metodolojisi  900$
Müzik Öğretmenliği  600$  Azerbaycan Türkçesi  Fransız Dili Metodolojisi  900$
Siyaset Bilimi  600$  Azerbaycan Türkçesi
Sosyoloji  600$  Azerbaycan Türkçesi
Felsefe Öğretmenliği  600$  Azerbaycan Türkçesi
Coğrafya Öğretmenliği  600$  Azerbaycan Türkçesi
Pazarlama  600$  Azerbaycan Türkçesi
Stratejik Analiz  600$  Azerbaycan Türkçesi
Proje Yönetimi ve Fikri Mülkiyet  600$  Azerbaycan Türkçesi
Emlak Yönetimi  600$  Azerbaycan Türkçesi
AZERBAYCAN NAHÇIVAN ÖĞRETMENLİK ENSTİTÜSÜ  HAZIRLIK 2250$ PAKET  DİL  YÜKSEK LİSANS  ÜCRET
İlkokul Öğretmenliği  1000$  Azerbaycan Türkçesi  Okul öncesi Eğitim  1200$
Okul Öncesi Öğretmenliği  1000$  Azerbaycan Türkçesi  Eğitimde Sosyal ve Psikoloji(PDR)  1200$
Matematik ve Bilgisayar Bilimleri Öğretmenliği  1000$  Azerbaycan Türkçesi  Psikoloji  1200$
Güzel İnce sanatlar Öğretmenliği  1000$  Azerbaycan Türkçesi
Psikoloji  1000$  Azerbaycan Türkçesi
Eğitimde Sosyo-Psikolojik destek(PDR)  1000$  Azerbaycan Türkçesi
Kütüphanecilik ve Bilgi sistemleri  1000$  Azerbaycan Türkçesi
Biyoloji öğretmenliği  1000$  Azerbaycan Türkçesi
Rusça Dili Öğretmenliği  1000$  Azerbaycan Türkçesi
İngilizce Dili Öğretmenliği  1000$  Azerbaycan Türkçesi
Tarih Öğretmenliği  1000$  Azerbaycan Türkçesi
Sanat Tarihi  1000$  Azerbaycan Türkçesi
Resim  1000$  Azerbaycan Türkçesi
Ebru Sanatı  1000$  Azerbaycan Türkçesi
Halı okulu  1000$  Azerbaycan Türkçesi
Heykel  1000$  Azerbaycan Türkçesi
Plastik  1000$  Azerbaycan Türkçesi
Grafik  1000$  Azerbaycan Türkçesi
Dekoratif  1000$  Azerbaycan Türkçesi
Matematik ve Bilişim  1000$  Azerbaycan Türkçesi
Teknoloji Öğretmenliği  1000$  Azerbaycan Türkçesi
Oyunculuk  1000$  Azerbaycan Türkçesi
Vokal  1000$  Azerbaycan Türkçesi
Koro  1000$  Azerbaycan Türkçesi
Müzik Öğretmenliği  1000$  Azerbaycan Türkçesi
BAKÜ MÜZİK AKADEMİSİ  DİL  YÜKSEK LİSANS  ÜCRET  DİL
Piyano  2100$  Azerbaycan Türkçesi - Rusça  BÖLÜME GÖRE MÜLAKAT VAR.  Piyano  2100$*2500$  Azerbaycan Türkçesi
Org  2100$  Azerbaycan Türkçesi - Rusça  Org  2100$*2500$  Azerbaycan Türkçesi
Müzik Öğretmenliği  2100$  Azerbaycan Türkçesi - Rusça  Müzik Öğretmenliği  2100$*2500$  Azerbaycan Türkçesi
Keman  2100$  Azerbaycan Türkçesi - Rusça  Keman  2100$*2500$  Azerbaycan Türkçesi
Çello  2100$  Azerbaycan Türkçesi - Rusça  Çello  2100$*2500$  Azerbaycan Türkçesi
Viola  2100$  Azerbaycan Türkçesi - Rusça  Viola  2100$*2500$  Azerbaycan Türkçesi
Arp  2100$  Azerbaycan Türkçesi - Rusça  Arp  2100$*2500$  Azerbaycan Türkçesi
Kontrabas  2100$  Azerbaycan Türkçesi - Rusça  Kontrabas  2100$*2500$  Azerbaycan Türkçesi
Solo Okuma  2100$  Azerbaycan Türkçesi - Rusça  Solo Okuma  2100$*2500$  Azerbaycan Türkçesi
Pop ve Caz  2100$  Azerbaycan Türkçesi - Rusça  Pop ve Caz  2100$*2500$  Azerbaycan Türkçesi
Bestecilik  2100$  Azerbaycan Türkçesi - Rusça  Bestecilik  2100$*2500$  Azerbaycan Türkçesi
Müzik Bilimi  2100$  Azerbaycan Türkçesi - Rusça  Müzik Bilimi  2100$*2500$  Azerbaycan Türkçesi
Orkestra Şefliği  2100$  Azerbaycan Türkçesi - Rusça  Orkestra Şefliği  2100$*2500$  Azerbaycan Türkçesi
Flüt  2100$  Azerbaycan Türkçesi  Flüt  2100$*2500$  Azerbaycan Türkçesi
Obua  2100$  Azerbaycan Türkçesi  Obua  2100$*2500$  Azerbaycan Türkçesi
Klarnet  2100$  Azerbaycan Türkçesi  Klarnet  2100$*2500$  Azerbaycan Türkçesi
Trombon  2100$  Azerbaycan Türkçesi  Trombon  2100$*2500$  Azerbaycan Türkçesi
Tuba  2100$  Azerbaycan Türkçesi  Tuba  2100$*2500$  Azerbaycan Türkçesi
Saksafon  2100$  Azerbaycan Türkçesi  Saksafon  2100$*2500$  Azerbaycan Türkçesi
Büyük ve Küçük Davul  2100$  Azerbaycan Türkçesi  Büyük ve Küçük Davul  2100$*2500$  Azerbaycan Türkçesi
BAKÜ KOREOGRAFİ AKADEMİSİ  DİL
Klasik Dans  1800$  Azerbaycan Türkçesi
Milli Dans  1800$  Azerbaycan Türkçesi
Modern Dans  1800$  Azerbaycan Türkçesi
Balet Rejisörlüğü  1800$  Azerbaycan Türkçesi
Dans  1800$  Azerbaycan Türkçesi
Sanat Eleştirmenliği  1800$  Azerbaycan Türkçesi
Yapımcı  1800$  Azerbaycan Türkçesi
Müzik Öğretmenliği  1800$  Azerbaycan Türkçesi
Halk Çalgıları  1800$  Azerbaycan Türkçesi
Tasarım  1800$  Azerbaycan Türkçesi
Yönlendirme Kareografi  1800$  Azerbaycan Türkçesi
GENCE DEVLET TARIM ÜNİVERSİTESİ  DİL  EK BİLGİLER  YÜKSEK LİSANS  ÜCRET  DİL  DOKTORA
Veterinerlik  2500$  Azerbaycan Türkçesi  YURT  İktisat  1500$  Azerbaycan Türkçesi  Veterinerlik  İngilizce*Rusça
Eczacılık (4 Yıl)  2500$  Azerbaycan Türkçesi  YILLIK YURT 650$  Tasarım*Dizayn  1800$  Azerbaycan Türkçesi  Bitki  Koruma  İngilizce*Rusça
Tarla Bitkileri  2500$  Azerbaycan Türkçesi  GÜNLÜK YEMEK İÇME 2$ DENK  Peyzaj  1500$  Azerbaycan Türkçesi  Farmakoloji  İngilizce*Rusça
Tasarım  2500$  Azerbaycan Türkçesi  GELİYOR.  Uluslarası Ekonomik İlişkiler  1500$  Azerbaycan Türkçesi  Ormancılık  İngilizce*Rusça
Yönetim  2500$  Azerbaycan Türkçesi  Muhasebe ve Vergilendirme  1500$  Azerbaycan Türkçesi  Tarım  İngilizce*Rusça
Ekoloji  2000$  Azerbaycan Türkçesi  YURTLARDA ERKEK-KIZ AYRI  Muhasebe*Yönetim  1500$  Azerbaycan Türkçesi  Hayvancılık  İngilizce*Rusça
Elektrik Mühendisliği  2500$  Azerbaycan Türkçesi  DİPLOMA NOTU SINIRI YOK  İşletme Yönetimi MBA  1500$  Azerbaycan Türkçesi  Gıda Ürünleri Teknolojisi  İngilizce*Rusça
Ziraat Mühendisliği  2200$  Azerbaycan Türkçesi  Pazarlama  1500$  Azerbaycan Türkçesi  Bitki Genetik  İngilizce*Rusça
Zooteknik (Hayvan Evcilleştirme Uzmanı )  2500$  Azerbaycan Türkçesi  ECZACILIK 4 YILDIR YÖK E BAŞVURU  Biyoloji ve Tarım  1500$  Azerbaycan Türkçesi  Mikrobiyoloji  İngilizce*Rusça',
  '{"country": "Azerbaycan", "chunk": 7, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 8)',
  'Muhasebe*Pazarlama*Ekonomi*İşletmecilik  2500$  Azerbaycan Türkçesi  YAPTIKTAN SONRA BİR YIL TÜRKİYEDE  Bilgi Teknolojisi ve Sistem Mühendisliği  1500$  Azerbaycan Türkçesi  Parazitoloji  İngilizce*Rusça
Toprak Bilimi ve Zirai Kimya Maliye  2200$  Azerbaycan Türkçesi  TAMAMLAMA YAPACAKTIR.  İş Yönetimi  1500$  Azerbaycan Türkçesi  Tarım Mühendisliği  İngilizce*Rusça
Enerji Mühendisliği  2500$  Azerbaycan Türkçesi  Gıda Mühendisliği  1500$  Azerbaycan Türkçesi  Ekoloji  İngilizce*Rusça
Devlet ve Belediye Yönetimi  2500$  Azerbaycan Türkçesi  HAZIRLIK OKUMA ŞARTI YOKTUR.  Şarapçılık ve Fermantasyon Teknolojisi  1500$  Azerbaycan Türkçesi  Toprak Bilimi  İngilizce*Rusça
Elektroenerji Mühendisliği  2500$  Azerbaycan Türkçesi  HAYVAN HASTANESİ VE ÇİFLİĞİ  Bitkisel Ürünlerin Depolama ve İşleme Teknolojisi  1500$  Azerbaycan Türkçesi  Meyvecilik ve Bağcılık  İngilizce*Rusça
Makine Mühendisliği  2500$  Azerbaycan Türkçesi  VARDIR.  Tüketim Mallarının Uzmanlığı ve Pazarlaması  1500$  Azerbaycan Türkçesi  Arazi ve Kadastro  İngilizce*Rusça
Yerüstü Taşıma Mühendisliği  2500$  Azerbaycan Türkçesi  Botanik tarım  1500$  Azerbaycan Türkçesi
Otomasyon Mühendisliği  2500$  Azerbaycan Türkçesi  Ekoloji  1500$  Azerbaycan Türkçesi
Bilgi Teknolojileri  2500$  Azerbaycan Türkçesi  Toprak Bilimi ve Zirai Kimya  1500$  Azerbaycan Türkçesi
Gıda Mühendisliği  2200$  Azerbaycan Türkçesi  Elektrogenetik Mühendisliği  1500$  Azerbaycan Türkçesi
Jeodezi Mühendisliği  2500$  Azerbaycan Türkçesi  Makine Mühendisliğ  1500$  Azerbaycan Türkçesi
Metroloji Mühendisliği  2500$  Azerbaycan Türkçesi  Elektrik Mühendisliği  1500$  Azerbaycan Türkçesi
Bitki Koruma* Bahçe ve Sebzecilik  2500$  Azerbaycan Türkçesi  Metroloji Mühendisliği  1500$  Azerbaycan Türkçesi
Tarım  2500$  Azerbaycan Türkçesi  Ekoloji Mühendisliği  1500$  Azerbaycan Türkçesi
Şarap Teknolojisi  2500$  Azerbaycan Türkçesi  Veteriner Eczanesi  1500$  Azerbaycan Türkçesi
Arazi Yönetimi  2500$  Azerbaycan Türkçesi  Zootekni  1500$  Azerbaycan Türkçesi
Balıkçılık  2500$  Azerbaycan Türkçesi  Toprak Kadastrosu  1500$  Azerbaycan Türkçesi
Ormancılık  2500$  Azerbaycan Türkçesi  Ziraat Mühendisliği  1500$  Azerbaycan Türkçesi
Su Biyo Kaynakları ve Su Bitkileri  2500$  Azerbaycan Türkçesi  Balıkçılık  1500$  Azerbaycan Türkçesi
Hayvanat Bahcesi Muhendisliği  2500$  Azerbaycan Türkçesi  Ormancılık  1500$  Azerbaycan Türkçesi
Bilişim Mühendisliği  2500$  Azerbaycan Türkçesi  Farmokoloji  2000$  Azerbaycan Türkçesi
Bilgisayar Mühendisliği  2500$  Azerbaycan Türkçesi  Veterinerlik Sıhhı Uzmanlık  2000$  Azerbaycan Türkçesi
Epizooloji ve Bulaşıcı Hastalıklar  2000$  Azerbaycan Türkçesi
Su biyolojik kaynakları  1500$  Azerbaycan Türkçesi
AZERBAYCAN BEDEN EĞİTİMİ VE SPOR AKADEMİSİ  DİL  YÜKSEK LİSANS  ÜCRET  DİL
Antranörlük(Voleybol*Halter*Boks*Halter*Boks*Güreş*Hentbol*Basketbol*Jimlastik*Dövüş*Oyun Sporları Rekreasyon  1500$  Azerice  Spor Yönetimi  2650$  İng
Beden Eğitimi ve Öğretmenliği  1500$  Azerice  Kineziterapi  1800$  Azerbaycan Türkçesi
Beden Eğitimi ve Spor  1500$  Azerice  Spor Gazeteciliği  1800$  Azerbaycan Türkçesi
Spor Hekimliği  ve Rehabilitasyon Fizyoterapi  1500$  Azerice  Sporda Tıbbi ve Biyolojik Destek  1800$  Azerbaycan Türkçesi
Spor Gazeteciliği  2500$  İngilizce
Spor Yönetimi  2500$  İngilizce
BAKU GIDA SANAYİ ÜNİVERSİTESİ
Turizm ve Otel Yönetimi  1000$
Şarap Yapımı ve Fermantasyon  1000$
Konserve Üretimi  1000$
Tüketim Malları Müdürü  1000$
Gıda Teknolojisi Güvenliği  1000$
Et ve Et Teknolojisi  1000$
Gıda Kalite Kontrol  1000$
Catering İşletme Hizmetleri  1000$
Ekmek ve Unlu Mamuller Teknolojisi  1000$
AZERBAYCAN MEDENİYET VE İNCE SANAT ÜNİVERSİTESİ  HAZIRLIK  900 usd  DİL  YÜKSEK LİSANS *DOKTORA  ÜCRET*ÜCRET
Kitaplık  2000$  Azerbaycan Türkçesi  Müze Bilimi  2500$*3000$
Uluslararası İlişkiler  2000$  Azerbaycan Türkçesi  Arşiv ve Anıtların Korunması  2500$*3000$
Müze Bilim  2000$  Azerbaycan Türkçesi  Arkeolojik ve Tarihi Mimarlık Anıtlarının Korunması  2500$*3000$
Arşivcilik ve Tarihi Anıtların Korunması  2000$  Azerbaycan Türkçesi  Sanat Bilimi  2500$*3000$
Sanat Bilimi  2000$  Azerbaycan Türkçesi  Kültür Teorisi  2500$*3000$
Enstrümantal  2000$  Azerbaycan Türkçesi  Güzel Sanatlar Tarihi ve Teorisi  2500$*3000$
Solo Okuma  2000$  Azerbaycan Türkçesi  Enstrümantal İfacılık  2500$*3000$
Orkestra Şefliği  2000$  Azerbaycan Türkçesi  Solo Okuma  2500$*3000$
Bestecilik  2000$  Azerbaycan Türkçesi  Müzik Bilimi  2500$*3000$
Müzik Bilimi  2000$  Azerbaycan Türkçesi  Müziksel Eleştiri  2500$*3000$
Kareografi  2000$  Azerbaycan Türkçesi  Kareografi Sanatı  2500$*3000$
Varyete Sanatı  2000$  Azerbaycan Türkçesi  Kareografi Sanatının Tarihi ve Teorisi  2500$*3000$
Halk Çalgıları  2000$  Azerbaycan Türkçesi  Varyete Sanatı  2500$*3000$
Oyunculuk  Sanatı  2000$  Azerbaycan Türkçesi  Halk Çalgıları İfacılığı  2500$*3000$
Dekoratif Sanat  2000$  Azerbaycan Türkçesi  Oyunculuk Sanatı  2500$*3000$
Tiyatroculuk  2000$  Azerbaycan Türkçesi  Dekoratif Sanat  2500$*3000$
Sanatsal Yaratıcılık ve Ekran Dramatürjisi  2000$  Azerbaycan Türkçesi  Tiyatroculuk  2500$*3000$
Yönetmenlik  2000$  Azerbaycan Türkçesi  Sanatsal Yaratıcılık ve Ekran Dramatürjisi  2500$*3000$
Sinemacılık  2000$  Azerbaycan Türkçesi  Yönetmenlik  2500$*3000$
Operatör Sanatı  2000$  Azerbaycan Türkçesi  Sinemacılık  2500$*3000$
Resim  2000$  Azerbaycan Türkçesi  Sinema Tarihi ve Teorisi  2500$*3000$
Grafik  2000$  Azerbaycan Türkçesi  Operatör Sanatı  2500$*3000$
Tasarım  2000$  Azerbaycan Türkçesi  Renk Bilimi  2500$*3000$
ADA (DİPLOMATİK AKADEMİ) ÜNİVERSİTESİ  DİL
Bilgisayar Bilimleri BT  5000$  İngilizce
Bilişim Teknolojileri Mühendisliği  5000$  ingilizce
Matematik  5000$  ingilizce
Elektrik ve Elektronik Mühendisliği  5000$  İngilizce
İletişim ve Dijital Medya  5000$  ingilizce
Devlet ve Sosyal İlişkişer  5000$  ingilizce
Uluslararası İlişkiler  5000$  ingilizce
Halkla İlişkiler  5000$  ingilizce
Finans  5000$  ingilizce
İş Yönetimi  5000$  ingilizce
Ekonomi  5000$  ingilizce',
  '{"country": "Azerbaycan", "chunk": 8, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Azerbaycan Yurtdışı Eğitim Bilgileri (Bölüm 9)',
  'AZERBAYCAN DEVLET RESSAMLIK SANATLAR ÜNİVERSİTESİ  DİL  YÜKSEK LİSANS-DOKTORA  ÜCRET  DİL
Grafik  3550$  Azerbaycan Türkçesi - Rusça  Sanat Tarihi  4700$*10000$  Azerbaycan Türkçesi
Mimarlık ve Dizayn  3550$  Azerbaycan Türkçesi - Rusça  İnsan Bilimi  4700$*10000$  Azerbaycan Türkçesi
Heykeltıraş  3550$  Azerbaycan Türkçesi - Rusça  Sanat Tasarımı  4700$*10000$  Azerbaycan Türkçesi
Dizayn  3550$  Azerbaycan Türkçesi - Rusça
Resim Bilimi (Renkgarlık)  3550$  Azerbaycan Türkçesi - Rusça
Resim  3550$  Azerbaycan Türkçesi - Rusça
Kıyafet Tasarımı  3550$  Azerbaycan Türkçesi - Rusça
Uygulamalı Dekoratif Sanat  3550$  Azerbaycan Türkçesi - Rusça
Yönetmenlik  3550$  Azerbaycan Türkçesi - Rusça
Tiyatro  3550$  Azerbaycan Türkçesi - Rusça
Sinemacılık  3550$  Azerbaycan Türkçesi - Rusça
Mimarlık ve Dizayn  3550$  Azerbaycan Türkçesi - Rusça
Güzel sanatlar  3550$  Azerbaycan Türkçesi - Rusça
El Sanatları  3550$  Azerbaycan Türkçesi - Rusça
Sanat Tarihi  3550$  Azerbaycan Türkçesi - Rusça
AZERBAYCAN TURİZM VE YÖNETİM ÜNİVERSİTESİ  DİL  YUKSEKLİSANS*DOKTORA
Bölge Bilimi  1500$  Azerbaycan Türkçesi - Rusça  Turizm Organizasyonları ve Planlaması  1250$  İngilizce
Macera, Extrimal ve Dağ Turizmi  1500$  Azerbaycan Türkçesi - Rusça  Sürdürülebilir Turizm Yönetimi  1250$  İngilizce
Müzecilik, Arşivcilik ve Anıtların Korunması  1500$  Azerbaycan Türkçesi - Rusça  Müzecilik  1250$  İngilizce
Pazarlama  1500$  Azerbaycan Türkçesi - Rusça  Uluslararası Turizm  1250$  Azerice*İngilizce
Sosyal İş  1500$  Azerbaycan Türkçesi - Rusça  Turizm  1250$  İngilizce
Tercümanlık  1500$  Azerbaycan Türkçesi - Rusça - İng
Ulaşım Servisi  1500$  Azerbaycan Türkçesi - Rusça
Turizm  1500$  Azerbaycan Türkçesi - İngilizce
Uluslararası Turizm  1500$  Azerbaycan Türkçesi - İngilizce
Turizm ve Otel İşletmeciliği  1500$  Azerbaycan Türkçesi - İngilizce
Turizm Rehberliği  1500$  Azerbaycan Türkçesi - İngilizce
Gıda Ürünleri Mühendisliği  1500$  Azerbaycan Türkçesi - Rusça
Turizm ve Otel*Restoran İşletmeciliği  1500$  Azerbaycan Türkçesi - İngilizce  Amerikadan CİFTTE DİPLOMA
Sürdürülebilir Turizm Yönetimi  1500$  Azerbaycan Türkçesi - Rusça
Otelcilik ve Turizmde Avrupa İşletme Lisans  1500$  Azerbaycan Türkçesi - İngilizce  Amerikadan CİFTTE DİPLOMA
İşletme  1500$  Azerbaycan Türkçesi - Rusça - İng',
  '{"country": "Azerbaycan", "chunk": 9, "total_chunks": 9}'::jsonb,
  ARRAY['ulke','azerbaycan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bosna Hersek Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'BOSNA-HERSEK ÜNİVERSİTELERİ
VİZESİZ BİR ÜLKEDİR. (KAPIDA VİZE) - ADLİ SİCİL ÖNEMLİDİR. 70 ÜSTÜ DİPLOMA NOTU OLMALIDIR.
BÜTÜN ÜNİVERSİTELER İÇİN HAZIRLIK POLİGROT DİL OKULUNDA ALINIR.
ÖĞRENCİLER ÜLKEDE ÇEVİRİ İÇİN 250 EURO ÜCRET ÖDER.
DİL OKULUNDA OTURUM OLMAZ.  3AY BOSNADA 3 AY TÜRKİYE OLACAK ŞEKİLDE HAZIRLIK ALINIR. BİRİNCİ SINIFTA OTURUMU OLUR
FAKÜLTE GİRİŞDE SINAV OLABİLİR. DİL VE BÖLÜMLE ALAKALI, SINAVLAR ZOR DEĞİDİR. LİSE DÜZEYİNDE, KALAN OLMADI İKİ KERE SINAVA GİREBİLİYOR.
HAZIRLIK + DANIŞMANLIK PAKET ÜCRETTİR.
BOŞNAKÇA 2500 EURO
İNGİLİZCE 3500 EURO
SARAYBOSNA DEVLET ÜNİVERSİTESİ  DİL  EK GİDERLER  YUKSEKLİSANS 1-2 Yıl  DOKTORA-UZMANLIK 3600* 3 Yıllık
TIP  3200€-6300€  6 Yıl  Boşnakça-İngilizce  KONAKLAMA  İnsan Hakları ve Demokrasi  İngilizce  Farmakoloji  Boşnakca
Diş Hekimliği  3.600 €  6 Yıl  Boşnakça  Saraybosnada  Avrupa Çalışmaları  İngilizce  Biyotıp ve Sağlık  Boşnakca
Eczacılık  2.500 €  5 Yıl  Boşnakça  Ev 150-400€  Devlet ve Sivil Toplum Kuruluşları  Boşnakca  Diş Bilimleri  Boşnakca
Fizik Tedavi ve Rehabilitasyon  1.500 €  4 Yıl  Boşnakca  YURTLAR  Cinsiyet Çalışmaları  İngilizzce  Farmakoloji  Boşnakca
Biyotıp ve Sağlık  1.500 €  4 Yıl  Boşnakça  Tek kişilik 700KM  Eşsiz Sağlık  İngilizce  Biyomedikal  Boşnakca
Diş Entegre*Agız Diş Sağlığı Cift Dal  1.500 €  3 Yıl  İngilizce  İki kişilik 900 KM  Beslenme  Boşnakca  Tarım Bilimleri  Boşnakca
Sağlık Terapi ve Sağlık Mühendisliği  1.500 €  4 Yıl  Boşnakça  Üç kişilik 1050 KM  Uluslararası ve Bölgesel Güvenlik  Boşnakca  Gıda Teknolojisi  Boşnakca
Laboratuvar Teknolojileri  1.500 €  4 Yıl  Boşnakca  OTURUM İZNİ  Doğal Afet Koruma  Boşnakca  Genetik alanında Biyolojik Bilimler  Boşnakca
Tıbbi Görüntüleme  1.500 €  4 Yıl  Boşnakca  İlk Yıl 295€  Radyolojik Teknolojiler  Boşnakca  Ormancılık biyoteknik Bilimler  Boşnakca
(Parametri)Halk Hizmet Sağlığı  1.500 €  4 Yıl  Boşnakca  Diğer Yıllar 140€  Laboratuvar Teknolojileri ustası  Boşnakca  Matematik Bilimi  Boşnakca
RadyolojiTeknolojileri  1.250 €  4 Yıl  Boşnakca  FizikTedavi  Boşnakca  Eğitimde  Uygulamalı Matematiksel Bilimler  Boşnakca
Ebelik  1.500 €  4 Yıl  Boşnakca  Veterinerlik ve Halk Sağlığı  Boşnakca  Doğa Bilimleri ve Matematik  Boşnakca
Hemşirelik  1.500 €  4 Yıl  Boşnakca  Eczacılık  Boşnakca  Bilgisayar Bilimleri  Boşnakca
Sağlık ve Ekoloji  1.500 €  4 Yıl  Boşnakca  Sağlık Mühendisliği  Boşnakca  Kimya Bilimleri{ORTAK Program)Doğa ve Matematik Bilimleri  Boşnakca
Beslenme ve Diyetisyenlik  1.500 €  4 Yıl  Boşnakca  Ziraatte Meyve Yetiştiriciliği  Boşnakca  Eğitimde Cografya  Boşnakca
İlac Bilimi  6.150 €  6 Yıl  İngilizce  Ziraatte Bağcılık  ve Şarapcilik  Boşnakca  Turizm ve Cevre Koruma  Boşnakca
Biyomedikal  1.500 €  4 Yıl  Boşnakca  Ziraatte Çiçekçilik ve Cevre Düzenlenmesi  Boşnakca  Sosyal Bilimler  Boşnakca
Hasta Bakımı  1.500 €  4 Yıl  Boşnakca  Tarımsal Sanayi Ekonomisi  Boşnakca  Bölgesel Planlama Coğrafi Bilimler  Boşnakca
Mikrobiyoloji  1.500 €  4 Yıl  Boşnakca  Hayvan Üretimi Bilimi  Boşnakca  Ekoloji  Boşnakca
Genetik Mühendisliği  1.500 €  4 Yıl  Boşnakca  Tarım ve Gıda Endüstrisi Ekonomisi  Boşnakca  Fizik Doktrou  Boşnakca
BiyoKimya ve Fizyoloji  1.500 €  4 Yıl  Boşnakca  Hayvanların beslenmesi bilimi  Boşnakca  İdariBilimler  Boşnakca
Veterinerlik  1.800 €  5 Yıl  Boşnakca  Su Ürunleri Yetiştiriciliği  Boşnakca  İletişim ve Gazetecilik  Boşnakca
Hayvan Üretimi(ZooTeknik)  700 €  3 Yıl  Boşnakca  Gıda Teknolojisi(Yiyecek ve İçecek Kontrolü)  Boşnakca  Tıp  Boşnakca
Ziraat Mühendisliği( Meyve*Bağcılık-Bitkisel Üretim)  700 €  3 Yıl  Boşnakca  Kentsel Tarım  Boşnakca  Hukuk  Boşnakca
Ziraat Mühendisliği( Tarım*Sebzecilik-Bitkisel Üretim)  700 €  3 Yıl  Boşnakca  Bitkisel Kökenli Ürün Teknolojisi  Boşnakca  Makine Mühendisliği  Boşnakca
Su Ürunleri Yetiştiriciliği(ZooTeknik)  700 €  3 Yıl  Boşnakca  Hayvansal Kökenli Ürünlerin Teknolojisi  Boşnakca  Elektrobilim ve Teknik  Boşnakca
Gıda Teknolojileri ve Mühendisliği  700 €  3 Yıl  Boşnakca  Ziraat Bitkisel Üretimde Bitki İlacı  Boşnakca  Kamu Yönetimi  Boşnakca
Tarım ve Gıda Endüstrisi Ekonomisi  700 €  3 Yıl  Boşnakca  Arazi ve Kırsal AlanlarınSürdürebilir Yönetimi  Boşnakca  Felsefe  Boşnakca
Tarım (Bitkisel Üretim)  700 €  3 Yıl  Boşnakca  Ekoloji  Boşnakca  Siyasal Bilgiler  Boşnakca
Biyoloji-BiyoKimya ve Fizyoloji  700 €  4 Yıl  Boşnakca  Genetik Mühendisliği  Boşnakca  Pedagoji  Boşnakca
Biyoloji -Ekoloji  700 €  4 Yıl  Boşnakca  Mikrobiyoloji  Boşnakca  İnşaat Mimarlık  Boşnakca
Biyoteknoloji  700 €  4 Yıl  Boşnakca  Biyoloji Öğretmenliği  Boşnakca  Müzik  Boşnakca
Biyoloji  ve Biyoloji Öğretmenliği  700 €  4 Yıl  Boşnakca  Fizik  Boşnakca
Fizik Öğretmenliği  700 €  4 Yıl  Boşnakca  Eğitimde Fizik  Boşnakca
Fizik  700 €  4 Yıl  Boşnakca  Genel Kimya  Boşnakca
Coğrafya8 Cografya Öğretmenliği  700 €  4 Yıl  Boşnakca  Cografya Öğretmenliği  Boşnakca
Bölgesel ve Mekansal Planlama  700 €  4 Yıl  Boşnakca  Bölgesel ve Mekansal Planlama  Boşnakca
Turizm ve Cevre Koruma  700 €  4 Yıl  Boşnakca  Kimya Öğretmenliği  Boşnakca
Kimya*Kimya Öğretmenliği  700 €  4 Yıl  Boşnakca  Matematik  Boşnakca
Genel Kimya  700 €  4 Yıl  Boşnakca  Matematik Öğretmenliği  Boşnakca
Kalite Kontrol ve Cevre Koruma  700 €  4 Yıl  Boşnakca  Yazılım Mühendsiliği  Boşnakca
Matematik  1.000 €  3 Yıl  Boşnakca  Uygulamalı Matematik  Boşnakca
Matematik Öğretmenliği  1.000 €  3 Yıl  Boşnakca  Peyzaj Mimarlığı  Boşnakca
Matematik Bilişim Öğretmenliği  1.000 €  3 Yıl  Boşnakca  Ekosistem  ve Sürdürülebilir Yönetimi  Boşnakca
Yazılım Mühendisliği  1.000 €  3 Yıl  Boşnakca  Bilgi Teknolojisi  Boşnakca
Uygulamalı Matematik  1.000 €  3 Yıl  Boşnakca  Ekonomi Yönetimi (CevreEkonomisi Ljubjana İktisat Fakultesi Ortak Diploma)  İngilizce
Sanat Tarihi*Restorasyon ve Koruma  1.000 €  3 Yıl  Boşnakça  İslam Bankacılığı Yönetimi(Bolton Üniversitesi Ortak Diploma)  İngilizce
Mimarlık ve Şehir Planlama  1.900 €  3 Yıl  Boşnakca  Ekonomi Yönetimi (Zagrep Üniversitesi İktisat Fakultesi Ortak Diploma)  Boşnakça*Hırvatça*Sırpca',
  '{"country": "Bosna Hersek", "chunk": 1, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','bosna_hersek','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bosna Hersek Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'Mimarlık  1.900 €  3 Yıl  Boşnakça  Ekonomi  İngilizce
Bahcecilik (Bahcevanlık)  700 €  3 Yıl  Boşnakça  İşletme Yönetimi  İngilizce
Ormancılık Mühendisliği  700 €  3 Yıl  Boşnakça  Kamu Yönetimi  Boşnakca
Arkeoloji  600 €  4 Yıl  Boşnakça  Güvenlik Çalışmaları  Boşnakca
Tarih  600 €  4 Yıl  Boşnakça  Medeni Kanun  Boşnakca
Hukuk  600 €  4 Yıl  Boşnakça  Ceza Hukuku  Boşnakca
Kamu Yönetimi  600 €  4Yıl  Boşnakca  Hukuk Tarihi ve Karşılaştırmalı Hukuk  Boşnakca
Kriminoloji* Güvenlik Barış Calışmaları*Adli Bilimler  600 €  4Yıl  Boşnakca  Hukuk ve Ekonomik Bilimler  Boşnakca
Uluslararası İlişkiler  600 €  4Yıl  Boşnakca  Dış İşleri bakanlıgı ve Uluslararası Kamu Hukuku  Boşnakca
Sosyal Hizmetler  600 €  4 Yıl  Boşnakça  Cinsiyet ve Hukuk  Boşnakca
Siyasal Bilimler  600 €  3 Yıl  Boşnakca  Fotoğrafcılık  Boşnakca
İletişim  ve İletişim Teknolojileri  600 €  3 Yıl  Boşnakça  Cevre Koruma ve Restorasyon  Boşnakca
Gazetecilik  600 €  3 Yıl  Boşnakça  Adli Bilimler  Boşnakca  1.250 €
Yayımcılık  600 €  3 Yıl  Boşnakça  Kriminoloji  Boşnakca  1.250 €
MultiMedya  600 €  3 Yıl  Boşnakca  Guvenlik Barıs Calışmaları  Boşnakca  1.250 €
Kameramanlık  600 €  3 Yıl  Boşnakça
Fotoğrafcılık  600 €  3 Yıl  Boşnakça
Felsefe  700 €  4 Yıl  Boşnakça
Sosyoloji  700 €  4 Yıl  Boşnakça
Psikoloji  700 €  4 Yıl  Boşnakça
Pedagoji*Özel Pedagoji  700 €  4 Yıl  Boşnakça
Okul Öncesi Öğretmenliği  700 €  4 Yıl  Boşnakça
Sınıf Öğretmenliği  700 €  4 Yıl  Boşnakca
Rehberlik Eğitim ve Rehabilitasyon (PDR)  700 €  4 Yıl  Boşnakça
Yaşam Kültürü ve Teknik Eğitim  700 €  4 Yıl  Boşnakça
Arşiv ve Kütüphanecilik  700 €  4 Yıl  Boşnakça
İslami Din Eğitimi Öğretmenliği  700 €  4 Yıl  Boşnakça
İslam İlahiyatı  700 €  4 Yıl  Boşnakca
İmam ve Hatipler  700 €  3 Yıl  Boşnakça
İtalyanca*Arapca*Latince*Almanca  700 €  3 Yıl  Boşnakça
Fransizca*Rusça*İngilizce  700 €  3 Yıl  Boşnakça
Tercumanlık  700 €  4 Yıl  Boşnakça
Dil Bilimleri ve Dil Öğretmenlikleri  700 €  3 Yıl  Boşnakca
Etnoloji  700 €  3 Yıl  Boşnakça
Türk Dili ve Edebiyatı  700 €  3 Yıl  Boşnakça
İngiliz Dili ve Edebiyatı  700 €  3 Yıl  Boşnakça
Roma Dili Edebiyatı *  700 €  3 Yıl  Boşnakça
Slav Dili Edebiyatı(Boşnak*Hırvat*Sırp)  700 €  3 Yıl  Boşnakça
Karşılaştırmalı Edebiyat  700 €  3 Yıl  Boşnakca
BosnaHersek Halkları Edebiyatı  700 €  3 Yıl  Boşnakça
Alman Araştırmaları  700 €  3 Yıl  Boşnakça
Amerikan Araştırmaları  700 €  3 Yıl  Boşnakça
Güzel Sanatlar Öğretmenliği  800 €  3 Yıl  Boşnakca
Grafik *Grafik Tasarım  800 €  3 Yıl  Boşnakca
Heykel  800 €  3 Yıl  Boşnakca
Resim (Boyama)  800 €  3 Yıl  Boşnakca
Ürün Tasarım  800 €  3 Yıl  Boşnakca
Oyunculuk  800 €  3 Yıl  Boşnakca
Drama  800 €  3 Yıl  Boşnakca
Sahne Sanatları Yönetmenliği  800 €  3 Yıl  Boşnakca
Yönetmenlik*Prodüksiyon  800 €  3 Yıl  Boşnakca
Ekonomi Yönetimi**işletme (Griffith Collage Duplin Irlanda İşbirliği)  5.400 €  3 Yıl  İngilizce
Ekonomi  2.000 €  3 Yıl  İngilizce
İşletme Yönetimi  2.000 €  3 Yıl  İngilizce
Finans Pazarlama Yönetimi  2.000 €  4 Yıl  İngilizce
Beden Eğitimi ve Sğor Ögretmenliği  1.000 €  3 Yıl  Boşnakca
Antranorlük  1.000 €  3 Yıl  Boşnakca
Spor ve Rekreasyon  1.000 €  3 Yıl  Boşnakca
Spor Turizmi  1.000 €  3 Yıl  Boşnakca
Fitness Eğitmeni  1.000 €  3 Yıl  Boşnakca
Spor ve Medya Gazteteciliği  1.000 €  3 Yıl  Boşnakca
Spor Yönetimi  1.000 €  3 Yıl  Boşnakca
Özel Amaclı Beden Eğitimi(Ordu*Polis)  1.000 €  3 Yıl  Boşnakca
Sporcuların Uygulanabilir Eğitiimi  1.000 €  3 Yıl  Boşnakca
Müzik Yapım Kompozisyon  700 €  4 Yıl  Boşnakca
Müzİk Öğretmenliği  700 €  4 Yıl  Boşnakca
Ses Tasarımı Mühendisliği  700 €  4 Yıl  Boşnakca
Müzikoloji ve EtnoMüzikoloji  700 €  4 Yıl  Boşnakca
Orkestra Şefliği  700 €  4 Yıl  Boşnakca
Koro Şefliği  700 €  4 Yıl  Boşnakca
Müzik Yönetmenliği  700 €  4 Yıl  Boşnakca
Müzik Aletleri Yapımı  700 €  4 Yıl  Boşnakca
Arp*Piyano*Şan*Solo*Gitar*Akordeon*Cello*Trompet*Boynuz*  700 €  4 Yıl  Boşnakca
Yaylı*Nefesli*Vurmalı Calgılar*Perkusyon*Keman*Flut*Klarnet*Saksafon*  700 €  4 Yıl  Boşnakca
Vokal(Şarkıcılık)  700 €  4 Yıl  Boşnakca
Makine Mühendisliği  1.000 €  3 Yıl  Boşnakca
Endüstri Mühendisliği  1.000 €  3 Yıl  Boşnakca
Proses  Mühendisliği  1.000 €  3 Yıl  Boşnakca
Çevre Mühendisliği  1.000 €  3 Yıl  Boşnakca
Enerji  Yönetimi Mühendisliği  1.000 €  3 Yıl  Boşnakca
Isıtma ve Soğutma Klima Makineleri  1.000 €  3 Yıl  Boşnakca
Robotik Mühendisliği  1.000 €  3 Yıl  Boşnakca
Mekatronik Mühendisliği  1.000 €  3 Yıl  Boşnakca
Makine Motor Bölümü  1.000 €  3 Yıl  Boşnakca
Savunma Teknolojileri  1.000 €  3 Yıl  Boşnakca
Elektrik Mühendsiliği  1.000 €  3 Yıl  Boşnakca
Güç Mühendisliği  1.000 €  3 Yıl  Boşnakca
Otomasyon ve Elektronik Mühendisliği  1.000 €  3 Yıl  Boşnakca
Bilgisayar Mühendisliği  1.000 €  3 Yıl  Boşnakca
Bilişim  1.000 €  3 Yıl  Boşnakca
Haberleşme ve Lojistik  1.000 €  3 Yıl  Boşnakca
Ulaştırma  Mühendisliği(Havacılık*Karayolu*Demiryolu)  1.000 €  3 Yıl  Boşnakca
Telekomünikasyon  1.000 €  3 Yıl  Boşnakca
İnşaat Mühendisliği  1.000 €  3 Yıl  Boşnakca
Karayolu Trafiği Yönetimi Mühendisliği  1.000 €  3 Yıl  Boşnakca
Elektrik ve Elektronik Mühendisliği  1.000 €  3 Yıl  Boşnakca
Hidrolik (Su) Mühendisliği  1.000 €  3 Yıl  Boşnakca
Su Ürünleri Mühendisliği  1.000 €  3 Yıl  Boşnakca
Jeoloji ve Jeoinformatik  1.000 €  3 Yıl  Boşnakca
Jeoloji Mühendisliği  1.000 €  3 Yıl  Boşnakca
Ağaç Teknolojisi  1.000 €  3 Yıl  Boşnakca
Motorlar ve Taşıtlar  1.000 €  3 Yıl  Boşnakca
Mekanik Yapılar  1.000 €  3 Yıl  Boşnakca
Savunma Teknolojileri  1.000 €  3 Yıl  Boşnakca
Yol yapımı  1.000 €  3 Yıl  Boşnakca
Yapı Mühendisliği  1.000 €  3 Yıl  Boşnakca
Üretim Teknolojileri  1.000 €  3 Yıl  Boşnakca
Süreç Mühendsiliği  1.000 €  3 Yıl  Boşnakca
Mekansal İç Mimarlık  1.000 €  3 Yıl  Boşnakca
MOSTAR CEMAL BİHEDİÇ DEVLET ÜNİVERSİTESİ  EK GİDERLER  YUKSEKLİSANS  DOKTORA 7700€
Eczacılık 5 yıl  1.800 €  5 Yıl  KONAKLAMA  Tarım sebze Çicek Bilimi  3.750 €  Küresel İşletme ve Finans
Biyo*Kimya  1.375 €  4 Yıl  Saraybosnada  tarım Meyve ve Bağcılık Bilimi  3.750 €  Avrupa Hukuku',
  '{"country": "Bosna Hersek", "chunk": 2, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','bosna_hersek','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bosna Hersek Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'Spor ve Sağlık  1.375 €  4 Yıl  Ev 150*400€  Cevre Koruma Biyolojisi  3.750 €  Kinizeterapi
Yazılım Geliştirme  1.375 €  3 Yıl  Yurt 90 €  Ekoloji  3.750 €  Sosyoloji
Medya ve İletişim 4 Yıl\Boşnak Dili Edebıyatı4 Yıl  1375€*600€  4 Yıl  Özel Yurt 150€  Tarih  3.750 €  Genel Pedagoji
Siyasal Bilimler 4 Yıl  1.375 €  3 Yıl  OTURUM İZNİ  İş Ekonomisi  3.750 €  Psikoloji
Tarih  600 €  4 Yıl  İlk Yıl 295€  İşletme Ekonomisi  3.750 €  Klinik Psikoloji
Hukuk  600 €  4 Yıl  Diğer Yıllar 140€  Bilişim Teknolojileri  3.750 €  Disiplinler Arası Sosyal Bilimler
İngiliz Dili Edebiyatı \Alam dili Edebiyatı  600€*600€  4 Yıl  Çevre Alt Yapısı Yönetimi  3.750 €  Rehabilitasyon
Alman Dili Edebiyatı  600 €  4 Yıl  Yenilenebilir Enerji kaynakları  3.750 €  Öğretim Yöntemleri
Türk Dili Edebiyatı  600 €  4 Yıl  Bilgisayar Mühendisliği  3.750 €  Özel Eğitim Disiplinleri
Amerikan Dili ve Edebiyatı  600 €  4 Yıl  Ürün Tasarımı  3.750 €  Sosyal Pedagoji
Yazılım Mühendisliği  1.000 €  3 Yıl  Beden Eğitimi ve Spor  3.750 €  İş Psikolojisi
Bilgisayar Mühendisliği  1.000 €  3 Yıl  Spor ve Sağlık  3.750 €  Biyolojik Psikoloji
Enerji Mühendisliği  1.375 €  3 Yıl  Kimya  3.750 €  Özel Sosyolojiler
Ürün Tasarımı  1.375 €  3 Yıl  Sınıf Öğretmenliği  3.750 €  Andragojik Didaktik Pedagoji
Jeodezi ve Jeoinformatik  1.375 €  3 Yıl  Sosyoloji  3.750 €  Spor ve Rekreasyon Kinesiyoloji
İnşaat Mühendiliği  1.375 €  3 Yıl  Psikoloji  3.750 €  Sporda dönüşüm Sürecleri
Bilişim Teknolojileri  1.375 €  3 Yıl  Pedagoji  3.750 €  Fiziksel Aktivite
Makine Mühendisliği  1.375 €  3 Yıl  Çevre Koruma ve Ekoloji  3.750 €  Spor Organizasyonu ve Yönetim
Turizm İşletmeciliği  1.000 €  3 Yıl  Antrönörlük  3.750 €  Uluslararası Ekonomi
Ziraat Mühendisliği(Sebze*Çicek Yetiştirme)  1.375 €  3 Yıl  Spor Yönetimi  3.750 €  İş Yönetimi ve Organizasyon
Ziraat Mühendisliği(Meyvecilik*Bağcılık)  1.375 €  3 Yıl  Özel Amaclı Spor(Ordu*Polis)  3.750 €  Bilgi Teknolojileri
Ziraat Mühendisliği(Tarımda Ekoloji*Cevre Yönetimi)  1.375 €  3 Yıl  3.750 €
İç Dizayn (Tasarım)  1.375 €  4 Yıl  Medeni Hukuk  3.750 €
FizyoTerapi  1.375 €  4 Yıl
Anestezi*Asistan  1.375 €  4 Yıl
Hemşirelik  1.375 €  4 Yıl
Sanat Ögretmenliği* Resim* Heykel  1.375 €  4 Yıl
Tasarım*Dizayn  1.375 €  3 Yıl
Müzik  1.375 €  4 Yıl
Mühendislik Teknolojisi  1.375 €  3 Yıl
İşletme Bilişimi  1.375 €  3 Yıl
Finans  1.375 €  3 Yıl
1.375 €  3 Yıl
Coğrafya  1.375 €  4 Yıl
Beden Eğitimi ve Spor  1.375 €  4 Yıl
Psıkoloji ve Sosyoloji  Cift Diploma  600 €  4 Yıl
Sınıf Öğretmenliği  600 €  4 Yıl
Kimya  1.375 €  4 Yıl
Pedagoji  600 €  4 Yıl
Çevre Koruma ve Ekoloji  1.375 €  3 Yıl
Biyoloji  1.375 €  4 Yıl
Sosyoloji  600 €  4 Yıl
Psikoloji  600 €  4 Yıl
İş Güvenliği  1.375 €  4 Yıl
İşletme Bilişim Lisansı  1.375 €  3 Yıl
İşletme Ekonomisi  3.750 €  3 Yıl
BiyoTeknoloji  1.375 €  3 Yıl
Bilgisayar Bilişim Teknolojileri  1.000 €  3 Yıl
Yazılım Geliştirme  1.000 €  3 Yıl
Beslenme  1.375 €  3 Yıl
Krimiloji ve Güvenlik  1.375 €  3 Yıl
Müzik Öğretmenliği  1.375 €  4 Yıl
Profösyonel Antronörlük  1.375 €  3 Yıl
Spor Yönetimi  1.375 €  4 Yıl
Arşiv ve Kütüpanecilik*Müzecilik  600 €  3 Yıl
İnşaat Mühendisliği  1.375 €  3 Yıl
Yenilenebilir Enerji Kaynakları  3.750 €  3 Yıl
Web Programlama  1.375 €  3 Yıl
İç Mimarlık  1.375 €  3 Yıl
TUZLA DEVLET ÜNİVERSİTESİ  YIL  EK GİDERLER  YUKSEKLİSANS 1 Yıl  DOKTORA 3 Yıl
Tıp  2.000 €  6 Yıl  Boşnakça  KONAKLAMA  Logopedi  1.250 €  Medeni Hukuk  5.200 €
Eczacılık  2.000 €  5 Yıl  Boşnakça  Saraybosnada  Eczacılık  1.250 €  Ceza Hukuku  5.200 €
BiyoTıp  2.000 €  3 Yıl  Boşnakça  Ev 150*400€  Hemşirelik  1.250 €  Uluslararası Kamu Hukuku  5.200 €
İlaç  2.000 €  6 Yıl  Boşnakça  Yurt 90 €  Fizyoterapi  1.250 €  Tarım Bilimi  5.200 €
Logopedi  500 €  3 Yıl  Boşnakça  Özel Yurt 150€  Radyoloji  1.250 €  Bitkisel  7.200 €
Konuşma Terapisti ve Odyoloji  500 €  3 Yıl  Boşnakça  OTURUM İZNİ  Laboratuvar  1.250 €  Hayvansal Uretim  7.200 €
Davranış Bozuklukları  500 €  3 Yıl  Boşnakça  İlk Yıl 295€  Görüntüleme  1.250 €  İş Güvenliği  7.200 €
Özel Eğitim ve Rehabilitasyon  500 €  3 Yıl  Boşnakça  Diğer Yıllar 140€  Biyotıp ve Sağlık  1.250 €  Çevre Koruma Mühendisliği  7.200 €
Ekonomi  800 €  3 Yıl  Boşnakça  Sağlık Mühendisliği  1.250 €  İş Güvenliği  7.200 €
İşletme Ekonomisi  800 €  3 Yıl  Boşnakça  Bireysel Seyahat Giderleri  Konuşma Terapisi Odyoloji  1.250 €  Gıda Teknolojisi  7.200 €
Uluslararası Ticaret* Pazarlama  800 €  3 Yıl  Boşnakça  Konaklama Giderleri  Özel Eğitim ve Rehabilitasyon  1.250 €  Gıda Güvenliği  7.200 €
Muhasebe*Denetim-Finans  800 €  3 Yıl  Boşnakça  Seyahat Sigortası  Uluslararası  Hukuk  1.250 €  Kimya Mühendisliği  7.200 €
E*Ticaret* Kamu Sektörü İşetmeciliği  800 €  3 Yıl  Boşnakça  Yeme ve İçme (Market)  Medeni Hukuk  1.250 €  Malzeme Mühendisliği  7.200 €
MakroEkonomi*Sigortacılık*Bankacılık  800 €  3 Yıl  Boşnakça  MUAFİYET  Ceza Hukuku  1.250 €  Biyotıp ve Sağlık  7.200 €
Uluslararası İlişkiler ve Diplomasi  800 €  3 Yıl  Boşnakça  Dil Muafiyeti Ücretli ve Sınavlı Oluyor  Uluslararası Kamu Hukuku  1.250 €  Gazetecilik  5.200 €
Turizm  800 €  3 Yıl  Boşnakça  Üniversiteye Başlama  Tarih Karşılastırması  1.250 €  Amerikan  Edebiyatı  5.200 €
Turizm İşletmeciliği  800 €  3 Yıl  Boşnakça  Sağlıkta Biyoloji Kimya  İdare Hukuku  1.250 €  Dil Ceviri  5.200 €
Beden Eğitimi ve Spor  800 €  3 Yıl  Boşnakça  Mühendislikte Matematik Fizik  Felsefe  1.250 €  İngiliz Dili Dilbilimi  5.200 €
Antranorlük  800 €  3 Yıl  Boşnakça  Giriş sınavları bulunur  Sosyal Pedagoji  1.250 €  İngilizce Öğremenliği  5.200 €
Özel Amaclı Koç Eğitimi  800 €  3 Yıl  Boşnakça  Sınav 2 kere girilir geçemeyenler 3. kayıt referans ile  Beden Eğitimi ve Spor  1.250 €  Beden Eğitimi  4.600 €
Doga Bilimleri  1.000 €  4 Yıl  Boşnakça  Yada Sınavsız Özel Okullara Kaydedilir  Ekonomi  1.250 €  Felsefe  5.200 €
Felsefe  1.000 €  4 Yıl  Boşnakça  Ders basarısı 1*2 yıl Sonra Yuksek ise  Eğitim  6.200 €
Hukuk  1.000 €  4 Yıl  Boşnakça  Bosna''da Devlet Okullarına  Yataygecişi yapılabilir.  Logopedi  7.200 €',
  '{"country": "Bosna Hersek", "chunk": 3, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','bosna_hersek','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bosna Hersek Yurtdışı Eğitim Bilgileri (Bölüm 4)',
  'Siyasal Bilimler  1.000 €  4 Yıl  Boşnakça  Ekonomi  7.200 €
Gazetecilik  1.000 €  4 Yıl  Boşnakça  Eczacılık  7.200 €
Türk Dili ve Edebiyatı  1.000 €  4 Yıl  Boşnakça  Kineziterapi  7.200 €
İngiliz Dili ve Edebiyatı  500 €  4 Yıl  Boşnakça
Alman Dili ve Edebiyatı  500 €  4 Yıl  Boşnakça
Felsefe*Sosyoloji  500 €  4 Yıl  Boşnakça
Psikoloji  500 €  4 Yıl  Boşnakça
Pedagoji  500 €  4 Yıl  Boşnakça
Sınıf Öğretmenliği  500 €  4 Yıl  Boşnakça
Okul Öncesi Öğretmenliği  500 €  4 Yıl  Boşnakça
Sosyal Hizmetler  500 €  4 Yıl  Boşnakça
Biyoloji  1.000 €  4 Yıl  Boşnakça
Fizik  1.000 €  4 Yıl  Boşnakça
Matematik  1.000 €  4 Yıl  Boşnakça
Coğrafya  1.000 €  4 Yıl  Boşnakça
Oyunculuk  1.000 €  4 Yıl  Boşnakça
Prodüksiyon  4.800 €  4 Yıl  Boşnakça
Dramatik Sanatlar  4.800 €  4 Yıl  Boşnakça
Film*Radyo*TV  4.800 €  4 Yıl  Boşnakça
Bilgi ve Bilişim  500 €  3 Yıl  Boşnakça
Telekomünikasyon  500 €  3 Yıl  Boşnakça
Elektrik Mühendisliği ve Enerji Dönüştürme  500 €  3 Yıl  Boşnakça
Elektrik Güç ve Sistemleri  500 €  3 Yıl  Boşnakça
Mekatronik Mühendisliği  500 €  3 Yıl  Boşnakça
Otomasyon Mühendisliği  500 €  3 Yıl  Boşnakça
Kimya Mühendisliği ve Teknolojisi  500 €  3 Yıl  Boşnakça
Mineral Ham Maddeler  500 €  3 Yıl  Boşnakça
Çevre Mühendisliği  500 €  3 Yıl  Boşnakça
Çevre Koruma Mühendisliği  500 €  3 Yıl  Boşnakça
Gıda Kalitesi ve Güvenliği  500 €  3 Yıl  Boşnakça
Gıda Teknolojisi Mühendisliği  500 €  3 Yıl  Boşnakça
İş Güvenliği ve Sağlığı  500 €  3 Yıl  Boşnakça
Ekoloji Mühendisliği  500 €  3 Yıl  Boşnakça
Ziraat Mühendisliği Bitkisel Üretim  500 €  3 Yıl  Boşnakça
Ziraat Mühendisliği Tarim Bilimi  500 €  3 Yıl  Boşnakça
Ziraat Mühendisliği Hayvansal Üretim  500 €  3 Yıl  Boşnakça
Maden Mühendisliği  500 €  3 Yıl  Boşnakça
Üretim Makine Mühendisliği  500 €  3 Yıl  Boşnakça
Jeoloji Mühendisliği  500 €  3 Yıl  Boşnakça
İnşaat Mühendisliği  500 €  3 Yıl  Boşnakça
Güvenlik  ve Yardım Çalışmaları  500 €  3 Yıl  Boşnakça
Maden Kaynakları Sondaj Kuyusu İşletmesi  500 €  3 Yıl  Boşnakça
Elektrik Güç Mühendisliği  500 €  3 Yıl  Boşnakça
EnerjiTermo Mühendisliği  500 €  3 Yıl  Boşnakça
Bilgisayar Mühendsiliği  1.000 €  3 Yıl  Boşnakça
Robotik Mühendisliği  1.000 €  3 Yıl  Boşnakça
Endüstri Mühendisliği  1.000 €  3 Yıl  Boşnakça
Tarih  500 €  4 Yıl  Boşnakça
SARAYBOSNA BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ  YIL  HAZIRLIK 7500€  EK GİDERLER  YAN DALLAR  YUKSEKLİSANS 1*2Yıl  DOKTORA
Tıp  13.200 €  6 Yıl  İngilizce  KONAKLAMA  Eğitimin 3 ve 4.Yıllarında Yan dal alınabilir  Bilgisayar Bilimi BT  5.200 €  Siyaset Bilimi ve Uluslararası İlişkiler  15.200 €  4 Yıl
Diş Hekimliği  13.200 €  6 Yıl  İngilizce  Saraybosnada  İngiliz Dili  Bilişim Sistemleri*VERİ  5.200 €  Bilgisayar Bilimleri  15.200 €  4 Yıl
Eczacılık  13.200 €  5 Yıl  İngilizce  Ev 150*400€  Alman Dili  Ekonomi  1 Yıl 9400 €
İlaç Bilimi  13.200 €  5 Yıl  İngilizce  Yurt 90 €  Uluslararası Hukuk  İşletme  1 Yıl 9400 €
Sağlık Calışmaları  13.200 €  3 Yıl  İngilizce  Özel Yurt 150€  Elektrik ve Elektronik Mühendisliği  Ekonomi  2 Yıl 10000 €
Siyaset Bilimler ve Uluslararsı İlişkiler  8.000 €  4 Yıl  İngilizce  OTURUM İZNİ  İşletme  2 Yıl 10000 €
Bilgisayar Bilimleri  8.000 €  3 Yıl  İngilizce  İlk Yıl 295€  İşletme Yönetimi MBA  2 Yıl 10000 €
Bilgi Sistemleri Yan dal Mühendislik  8.000 €  3 Yıl  İngilizce  Diğer Yıllar 140€  Araştirma ile MSc  2 Yıl 10000 €
Mühendislik Bilimi  8.000 €  2 Yıl  İngilizce  Uluslararası Hukuk  5.200 €
Oyun Tasarımı ve Geliştirme  7.800 €  4 Yıl  İngilizce  Diplomasi  5.200 €
Ekonomi  8.000 €  4 Yıl  İngilizce  Çatışma Analizi ve Uzlaşma(CAR)  5.500 €
İngiliz Dili Tecumanlık  8.000 €  4 Yıl  İngilizce  Farmakoekonomi  5.500 €
Alman Dili Tercumanlık  8.000 €  4 Yıl  İngilizce
Film Akademisi Oyunculuk Tasarımı ve Geliştirme  12.000 €  3 Yıl  İngilizce
Film Akademisi Yönetmenlik BFA(KısaFilm)  6.500 €  3 Yıl  İngilizce
Film Akademisi Yönetmenlik MFA  12.000 €  3 Yıl  İngilizce
ZENİCA DEVLET ÜNİVERSİTESİ  YIL  DİL  KONAKLAMA  YUKSEKLİSANS 1550 € 1 Yıl  ÜCRET  DOKTORA
Tıp  3.200 €  6 Yıl  Boşnakça  Yurt 70€  Sağlık Yönetimi  5.000 €  Hukuk Bilimleri
Hemşirelik  1.350 €  4 Yıl  Boşnakça  Ev 100€*350€  Cerrahi  5.000 €  Ekonomi Bilimleri
Hukuk  800 €  4 Yıl  Boşnakça  Saraybosnada  Dahiliye  5.000 €  Beşeri Bilimler
Sınıf Öğretmenliği  800 €  4 Yıl  Boşnakça  Ev 200*500€  Aile Hekimliği  5.000 €  Sosyal Bilimler
İngiliz Dili ve Edebiyatı  800 €  4 Yıl  Boşnakça  Yurt 90*100*110€  Sosyal Pedagoji  1.550 €  Metalürji Metalik üzerine
Türk Dili ve Edebiyatı  800 €  4 Yıl  Boşnakça  Özel Yurt 150€  İslam Pedagojisi (Din Öğretmenliği)  1.550 €  Makine Mühendisliği
Alman Dili ve Edebiyatı  800 €  4 Yıl  Boşnakça  OTURUM İZNİ  Çocuk Pedagojisi  1.550 €
Beden Eğitimi ve Spor  800 €  4 Yıl  Boşnakça  İlk Yıl 295€  Sınıf Öğretmenliği  1.550 €
Turizm  800 €  4 Yıl  Boşnakça  Diğer Yıllar 140€  Türk Dili Edebiyatı  1.550 €
Kültürel Miras Tarihi  800 €  4 Yıl  Boşnakça  İngilizce Dili ve Edebiyatı  1.550 €
İlahiyat  800 €  4 Yıl  Boşnakça  Eğitim 3+2 *4+1  Alman Dili ve Edebiyatı  1.550 €
Arap Dili ve Edebiyatı  800 €  4 Yıl  Boşnakça  Matematik ve Bilişim  1.550 €
Sosyal Pedagoji  800 €  4 Yıl  Boşnakça  Sırp*Hırvat*Boşnakça Dil ve Edebiyatı  1.550 €
Okul Öncesi Eğitim Öğretmenliği  800 €  4 Yıl  Boşnakça  Kültüroloji  1.550 €
İnşaat Yapı Mühendisliği  1.550 €  3 Yıl  Boşnakça  Makine Mühendisliği  1.550 €
Üretim Mühendisliği  1.550 €  3 Yıl  Boşnakça  Metalik Malzemeler  1.550 €
Yazılım Mühendisliği  1.550 €  3 Yıl  Boşnakça  Kimya Teknolojisi Müh  1.550 €
Metalürji Mühendisliği  1.550 €  3 Yıl  Boşnakça  Kalite Yönetimi  1.550 €
Malzeme Mühendisliği  1.550 €  3 Yıl  Boşnakça  Makine Bakım  1.550 €
Çevre Koruma Mühendisliği  1.550 €  3 Yıl  Boşnakça  KOBİ Üretim Teknolojileri Mühendisliği  1.550 €
Yangın Koruma  ve İş Güvenliği  1.550 €  3 Yıl  Boşnakça  Metroloji  1.550 €
Kimya Mühendisliği  1.550 €  3 Yıl  Boşnakça  İnşaat  1.550 €
Mekatronik  1.550 €  3 Yıl  Boşnakça  Tasarım  1.550 €
Yenilenebilir Enerji Kaynakları  1.550 €  3 Yıl  Boşnakça',
  '{"country": "Bosna Hersek", "chunk": 4, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','bosna_hersek','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bosna Hersek Yurtdışı Eğitim Bilgileri (Bölüm 5)',
  'Metroloji Mühendiliği  1.550 €  3 Yıl  Boşnakça
Ekonomik Kalkınma  ve Siyaset  1.550 €  3 Yıl  Boşnakça
İşletme ve Maliye  1.550 €  3 Yıl  Boşnakça
Ekonomi Yönetimi  1.550 €  3 Yıl  Boşnakça
Finans ve Mühasebe Denetim  1.550 €  3 Yıl  Boşnakça
Matematik ve Bilgisayar Bilimi  1.550 €  3 Yıl  Boşnakça
Kültürel  Medya  Çalışmaları  1.550 €  3 Yıl  Boşnakça
Ağaç İşleme tasarımı ve Teknolojileri  1.550 €  3 Yıl  Boşnakça
Mühendislik Ekolojisi  1.550 €  3 Yıl  Boşnakça
İşletme Bilişimi ve Mühendisliği  1.550 €  3 Yıl  Boşnakça
Üretim Teknolojilerinin Yönetimi  1.550 €  3 Yıl  Boşnakça
Ürün Mühendisliği Tasarımı  1.550 €  3 Yıl  Boşnakça
Makine Bakım  1.550 €  3 Yıl  Boşnakça
Makine Mühendisliği  1.550 €  3 Yıl  Boşnakça
Elektrik Mühendisliği ve Otomasyon  1.550 €  3 Yıl  Boşnakça
Cevher ve Demir  Mineroloji  1.550 €  3 Yıl  Boşnakça
Plastik Metal İşleme  1.550 €  3 Yıl  Boşnakça
Metal Eritme ve Döküm  1.550 €  3 Yıl  Boşnakça
Isı Mühendisliği Ölçme  1.550 €  3 Yıl  Boşnakça
BİHAÇ ÜNİVERSİTESİ  DİL  KONAKLAMA  YUKSEKLİSANS
Hemşirelik  1.100 €  Boşnakça  Ceza Hukuku
Beslenme Diyetisyenlik  1.100 €  Boşnakça  İlahiyat
Sağlık Mühendisliği  1.100 €  Boşnakça  Avrupa Hukuku
Fizik Tedavi  1.100 €  Boşnakça  Eyalet Hukuku
Gıda Teknolojileri Mühendisliği  1.100 €  Boşnakça  Finans*Muhasebe*Denetim
Beden Eğitimi ve Spor  1.100 €  Boşnakça  Yönetim ve Girişimcilik
Okul Öncesi Eğitim Öğretmenliği  1.100 €  Boşnakça  Okul öncesi Eğitim
Sınıf Ögretmenliği  1.100 €  Boşnakça  Sınıf Öğretmenliği
Hasta Bakımı  1.100 €  Boşnakça  Sosyal Pedagoji
İlahiyat  1.100 €  Boşnakça  Beden Eğitimi ve Spor
Hukuk  1.100 €  Boşnakça  Matematik ve Bilişim
Ormancılık Mühendisliği  1.100 €  Boşnakça  Ormanların Yönetim ve İşletilmesi
İnşaat Mühendisliği  1.100 €  Boşnakça  İngilizce Dili ve Edebiyatı
Tekstil Tasarımı  1.100 €  Boşnakça
Giyim Teknolojileri  1.100 €  Boşnakça
Bilgisayar Mühendisliği  1.100 €  Boşnakça
BT Mühendisliği  1.100 €  Boşnakça
Makine Mühendisliği  1.100 €  Boşnakça
Matematik ve Fizik  1.100 €  Boşnakça
Tarım Mühendisliği(Tarım*Meyve*Sebze*Organık*Hayvancılık*Bağcılık  1.100 €  Boşnakça
Otomasyon ve Elektronik Mühendisliği  1.100 €  Boşnakça
Ahşap Endüstüri  Mühendisliği  1.100 €  Boşnakça
Hukuk  1.100 €  Boşnakça
Turizmde Yönetim ve Pazarlama  1.100 €  Boşnakça
İşletme  1.100 €  Boşnakça
Finans ve Mühasebe Denetim  1.100 €  Boşnakça
Cevre  Koruma ve Mühendisliği  1.100 €  Boşnakça
Alman Dili ve Edebiyatı  1.100 €  Boşnakça
Boşnak  Dili ve Edebiyatı  1.100 €  Boşnakça
İngilizce Dili ve Edebiyatı  1.100 €  Boşnakça
Tarih  1.100 €  Boşnakça
BiyoTeknoloji  1.100 €  Boşnakça
ULUSLARARASI GORAJDE ÜNİVERSİTESİ  DİL  KONAKLAMA  YUKSEKLİSANS  UZMANLIK
Tıp  3.000 €  6 Yıl  Boşnakça*İngiilizce  Saraybosnada  2.500 €
Diş Hekimliği  2.000 €  5 Yıl  Boşnakça*İngiilizce  Ev 150*400€  2.500 €
Eczacılık*Yarı zamanlı Eczacılık  2000€*2200€  5 Yıl  Boşnakça*İngiilizce  Yurt 90 €  2.500 €
FizyoTerapi* Yarı zamanlı  1300€*1500€  4 Yıl  Boşnakça*İngiilizce  Özel Yurt 150€  1300€*1500€  2.500 €
Hemşirelik *Yarı zamanlı Eczacılık  1300€*1500€  4 Yıl  Boşnakça*İngiilizce  OTURUM İZNİ  1300€*1500€  2.500 €
Psikoloji* Yarı Zamanlı  1200€*1350€  4 Yıl  Boşnakça*İngiilizce  İlk Yıl 295€  1300€*1350€  2.000 €
Türk Dili ve Edebiyatı*Yarı zamanlı  1200€*1350€  4 Yıl  Boşnakça*İngiilizce  Diğer Yıllar 140€  1300€*1350€  2.000 €
İnşaat Mühendisliği*Yarı zamanlı  1500€*1700€  4 Yıl  Boşnakça*İngiilizce  1300€*1500€  2.000 €
Elektrik Mühendisliği*Yarı zamanlı  1500€*1700€  4 Yıl  Boşnakça*İngiilizce  1300€*1500€  2.000 €
Jeodezi*Harita Mühendisliği  1500€*1700€  4 Yıl  Boşnakça*İngiilizce  1300€*1500€  2.000 €
Mimarlık*Yarı zamanlı Mimarlık  1500€*1700€  4 Yıl  Boşnakça*İngiilizce  1300€*1500€  2.000 €
Hukuk  1000€*1250€  3 Yıl  Boşnakça*İngiilizce  2300€*2300€  2.000 €
İşletme  1000€*1250€  3 Yıl  Boşnakça*İngiilizce  2300€*2300€  2.000 €
Ekonomi  ve Yönetimi  1000€*1250€  3 Yıl  Boşnakça*İngiilizce  2300€*2300€  2.000 €
Bankacılık ve Ticaret  1000€*1250€  3 Yıl  Boşnakça*İngiilizce  2300€*2300€  2.000 €
TRAVNİK ÜNİVERSİTESİ  HAZIRLIK FİYATI: 2000€
Diş Hekimliği  5.000€  Boşnakça
Eczacılık  4.000€  Boşnakça
Fizik Tedavi  4.000€  Boşnakça',
  '{"country": "Bosna Hersek", "chunk": 5, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','bosna_hersek','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bulgaristan Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'BULGARİSTAN
-KAYIT DANIŞMANLIK: 1950 EURODUR  -BULGARİSTANDAN AĞIRLIK OLARAK SOFYA VE VARNA''YA ÖĞRENCİ GÖNDERİYORUZ. (ÖNCELİK SOFYA)
*DANIŞMANLIĞA VİZE DAHİL DEĞİLDİR*  -ÖĞRENCİ VİZE ÜCRETİ 350€
-IELTS 6 ÜSTÜ OLMALIDIR. (AKADEMİK)  -İŞLEMLER YAKLAŞIK 4 AY SÜRMEKTEDİR. (VİZE HARİÇ)
-OTURUMLAR ÖĞRENCİNİN, BELGESİ ÇIKTIKTAN SONRA YAPILIR.  -ÜLKEDE  SENELİK SİGORTA YAPILIYOR 165-170€
-ÇİFTE VATANDAŞLAR İÇİN LİSAN EĞİTİMİNDE %50 İNDİRİM VARDIR.  (BULGAR VE TÜRK)  -BANKA HESABI AÇILIYOR. İÇERİDE PARA GÖSTERİLMESİ GEREKİYOR.  (45-100 €)
-EVRAKLARIN ÇEVİRİSİ BULGARİSTAN''DA YAPILMAKTADIR.  -OTURUM KARTININ ÇIKMASI SÜRELİDİR. (3 GÜNDEN 30 GÜNE  KADAR DEĞİŞİR, ÜCRETİDE DEĞİŞKENLİK GÖSTERİR 100-250€)
-BANKA TEMİNATI EN AZ 4.000€  -GEREKLİ DURUMLARDA, ÖĞRENCİ ADLİ SİCİLİN ÇEVİRİSİ YAPILABİLİR(40-45€)
-BÜTÜN HAZIRLIKLAR  SOFYA KLIMENT ÜNİVERSİTESİNDE ALINIYOR.  -ÖĞRENCİLERGENELLİKLE ÖZEL YURTTA KALMAKTADIR. (250-400€)
-BÜTÜN HAZIRLIKLARDA İLK DÖNEM DİL AĞIRLIKLI İKİNCİ DÖNEM BÖLÜM HAZIRLIĞIDIR.
SOFYA TEKNİK ÜNİVERSİTESİ  HAZIRLIK 2500€  ÜCRET  YÜKSEK LİSANS*DOKTORA 3500€  DİL
Yazılım Mühendisliği  İngilizce  4.720€  Bilgisayar Mühendisliği  İngilizce
Telekomünikasyon  İngilizce  4.720€  Makine Mühendisliği  İngilizce
Akıllı Sistemler ve Yapay Zeka  İngilizce  4.720€  Elektrik Mühendisliği  İngilizce
Endüstri Mühendisliği  İngilizce  4.720€  Elektrik Güç Mühendisliği ve Ekipmanları  İngilizce
Havacılık ve Ucak Mühendisliği  İngilizce  4.720€  Bilgisayar  Bilimi Mühendisliği  İngilizce
Otomotiv Mühendisliği  İngilizce  4.720€  Endüstri Mühendisliği  İngilizce
Lojistik Mühendisliği Ulaştırma  İngilizce  4.720€  Tekstil Tasarım Giyim Teknolojileri  İngilizce
Elektronik Mühendisliği  İngilizce  4.720€  Mekatronik  İngilizce
Tekstil Mühendisliği  İngilizce  4.720€  Mühendisliğin Tıp Mühendisliği  İngilizce
Elektrik Mühendisliği  İngilizce  4.720€  E*Yönetim  İngilizce
Bilgisayar Mühendisliği  İngilizce  4.720€  İşletme Yönetimi için Bilgi Teknolojisi  İngilizce
Makine Mühendisliği  İngilizce  4.720€  Bilgisayar Bilimi ve İletişim  Fransızca
Mekatronik Sistemler Mühendisliği  İngilizce  4.720€  Elektronik ve Kontrol Mühendisliği  Fransızca
Endüstrüyel Yönetim  İngilizce  4.720€  Telekomünikasyon  Fransızca
Bilgisayar Sistemleri ve Teknolojileri  İngilizce  4.720€  Bilgisayar Bilimi  Fransızca
Elektronik ve Kontrol  Mühendisliği  İngilizce  4.720€  Bilgisayar Sistemleri ve Teknolojileri  Almanca
İşletme Yonetimi  İngilizce  4.720€  Endüstriyel Yönetim  Almanca
Bilgisayar Bilimleri IT  İngilizce  4.620€  İşletme  Almanca
Tekstil Tasarım Teknoloji Mühendisliği  İngilizce  4.720€
İşletme Bilişimi  İngilizce  4.720€
Uygulamalı Matematik  Bulgarca
Bilişim ve Yazılı Bilimi  Bulgarca
Endüstriyel Yönetim  Bulgarca
Uygulamalı Fizik ve Bilgisayar Müdellenmesi  Bulgarca
Veri Analizi  Bulgarca
Yönetim ve İş Bilgi Sistemleri  Bulgarca
Termik ve Nükleer Güç Lojistik Mühendisliği  Bulgarca
Taşıma Makineleri ve Teknolojileri  Bulgarca
Ulaşım Teknolojileri ve Yönetimi  Bulgarca
Havacilik Mühendisliği  Bulgarca
Siber Güvenlik  Bulgarca
Endüstride Bilgi Teknolojisi  Bulgarca
Bilgisayar ve Yazılım Mühendisliği  Bulgarca
Otomotiv Elektroniği  Bulgarca
Elektronik  Bulgarca
Metroloji ve Ölcüm Ekipmanları  Bulgarca
Bilgisayar Destekli Tasarım ve İmalat  Bulgarca
Dijital Endüstriyel Teknolojiler  Bulgarca
Otomatik Bilgi ve Kontrol Teknolojisi  Bulgarca
Elektrik Güç Mühendisliği ve Elektrik Ekipmanları  Bulgarca
İsıtma ve Soğutma Teknolojileri ve Sistemleri  Bulgarca
Yenilenebilir Enerji  ve Akışkan Teknolojileri  Bulgarca
Termik ve Nükleer Güç Mühendisliği  Bulgarca  ,
SOFYA TIP ÜNİVERSİTESİ  ÜCRET  DİL  EK BİLGİLER
Tıp (6 yıl)  9.950 €  Bulgarca-İngilizce
Diş Hekimliği  10.000 €  Bulgarca-İngilizce  İngilizce Hazırlık 4800€
Eczacılık (5 yıl)  10.340 €  Bulgarca-İngilizce
Hemşirelik  3000€- 4000€  Bulgarca-İngilizce
SOFYA KLİMENT OHRİDSKİ ÜNİVERSİTESİ  ÜCRET  DİL  EK BİLGİLER  YÜKSEK LİSANS  ÜCRET  DİL  DOKTORA
Tıp  8.000€  Bulgarca-İngilizce  İngilizce Hazırlık 3500€  Optometri  3.300 €  Bulgarca  Ekonomi  1.900 €  İngilizce
Eczacılık  7.700€  Bulgarca-İngilizce  Bulgarca Hazırlık 3500€  Eğitim Yönetimi  3.300 €  İngilizce  İşletme  1.900 €  İngilizce
Avrupa Birliği ve Entegtasyonu Çalışmaları  3.100 €  İngilizce  HAZIRLIK SONRASI GİRİŞ SINAVI YAPILMAKTADIR  Sosyal Pedagoji  3.000 €  İngilizce  Dijital Uygulamalar  1.900 €  İngilizce
Psikoloji  2.900 €  Bulgarca  BİYOLOJİ KİMYA FİZYOLOJİ SINAVI  İngilizce ve Fransızca Tercume  2900€*yarı zamanlı 1600€  İngilizce  Birleşik Avrupa Edebiyatları(Frz)  2.750 €  İngilizce
Dijital Uygulamalar  2.200 €  İngilizce  Yüksek lisanslar 1.5 Yıldır  Göstergebilim, Dil ve Reklamcılık  2900€*yarı zamanlı 1600€  İngilizce  Agro Biyoteknoloji  2.750 €  İngilizce
Muhasebe  2.200 €  İngilizce  İngilizce için:  Dil ve Kültür  2900€*yarı zamanlı 1600€  İngilizce  Moleküler Biyoloji ve Biyo Teknolojileri  2.750 €  İngilizce
Finans  2.200 €  İngilizce  CPE (Certificate of Proficiency in English).  İletişim Dil ve Kitle Medya  2900€*yarı zamanlı 1600€  İngilizce  Ekoloji ve Çevre Koruma  2.750 €  İngilizce
Felsefe  3.850 €  İngilizce  IELTS (bands 6, 7, 8, 9). 4. PITMAN – Higher Intermediate – Advanced.  Felsefe  3.850 €  İngilizce  Biyolojik Yönetim Ve Sürdürülebilir Kalkınma  2.750 €  İngilizce
İşletme  3.850 €  İngilizce-Alm-Fransızca  TOEFEL (en az 550, 213 veya 100 puan).  Örgüt Psikolojisi  3.850 €  İngilizce  Hukuk  6.500 €  İngilizce
Tıbbi Rehabilitasyon ve Ergoterapi  3.100 €  Bulgarca  CAE (Cambridge Certificate in Advanced English).  Kültürlerarası Yönettim  3.850 €  İngilizce  Tıp Uzmanlığı  10.000 €  İngilizce
Afrika çalışmaları  2.900 €  İngilizce  Genel Psikoloji  3.850 €  İngilizce  Özel Pedagoji  2.750 €  İngilizce
Tarıh  2.900 €  İngilizce  Kültürel İrtibatlar ve Dünyanın Jeopolitiği  2500€ yarı zamanlı 1600€  İngilizce  Müzik Pedagoji  2.750 €  İngilizce',
  '{"country": "Bulgaristan", "chunk": 1, "total_chunks": 6}'::jsonb,
  ARRAY['ulke','bulgaristan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bulgaristan Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'İklim değişikliği ve Yönetimi  3.850 €  İngilizce  Avrupa Birliği  2500€ yarı zamanlı 1600€  İngilizce  Medya Pedagojisi  2.750 €  İngilizce
Hukuk  3.300 €  Bulgarca  Avrupa Birliği Politikaları  3.300 €  İngilizce  Okul Öncesi Pedagojisi  2.750 €  İngilizce
Uluslararası İlişkiler  3.300 €  Bulgarca  Avrupa ve Dünya Küreselleşmesi  3.300 €  İngilizce  Avrupa Birliği Politikaları  3.850 €  İngilizce
Gazetecilik ve Kitle İletişimi  3.300 €  Bulgarca  Kamu Yönetimi  3.850 €  İngilizce
halkla ilişkiler  3.300 €  Bulgarca  İşletme  2.200 €  İngilizce
Kitap Yayıncılığı  3.300 €  Bulgarca  İnsan Kaynakları Gelişimi  2.200 €  İngilizce
İletişim yönetimi  3.300 €  Bulgarca  İşletme Stratejil Yönetim  2.200 €  İngilizce
Okul Öncesi Öğretmenliği  3.300 €  Bulgarca  İşletme Bilgi Güvenliği  2.200 €  İngilizce
İlkokul Öğretmenliği  3.300 €  Bulgarca  Finansal Yönetim  2.200 €  İngilizce
Sosyal Pedagoji  3.300 €  Bulgarca  Uygulamalı Ekonometri  2.200 €  İngilizce
Özel Pedagoji  3.300 €  Bulgarca  Ekonomi Modelleme  2.200 €  İngilizce
Konuşma Terapisi  3.300 €  Bulgarca  Savunma Sanayi  2.200 €  İngilizce
Güzel Sanatlar  3.300 €  Bulgarca  Füzyon Bilimi ve Teknolojisi  3.850 €  İngilizce
Müzik  3.300 €  Bulgarca  Nükleer ve Parcacık Fiziği  3.850 €  İngilizce
Medya ve Sanatsal İletişim  3.300 €  Bulgarca  Hesaplamalı Kimya  3.850 €  İngilizce
Fiziksel Etkinlikler ve Spor  3.300 €  Bulgarca  Polimer Bilimi Kimyası  3.850 €  İngilizce
Grafik Tasarım  3.300 €  Bulgarca  Kimya Mühendisliğinde Cağdaş Malzemeler  3.850 €  İngilizce
Müzik ve Medya Teknolojileri  3.300 €  Bulgarca  Kimya MühendisliğindeFonksüyonel Malzemeler  3.850 €  İngilizce
Ses Mühendisliği  3.300 €  Bulgarca  Kimyada Modern Spektral  3.850 €  İngilizce
Coğrafya  3.300 €  Bulgarca  Kimyada Kromatoğrafik Teknolojiler  3.850 €  İngilizce
Jeoloji  3.300 €  Bulgarca  Kimyasal Teknolojilerde Disperse Sistemleri  3.850 €  İngilizce
Turizm  3.300 €  Bulgarca  RadyoKimya ve RadyoEkoloji  3.850 €  İngilizce
Bölgesel Kalkınma ve Politika  3.300 €  Bulgarca  Kimyada Çağdaş Sentez Yöntemleri  3.850 €  İngilizce
Jeo*Uzaysal Sistemler ve Teknolojiler  3.300 €  Bulgarca  Kimyada Organik Bileşiklerin Analizi  3.850 €  İngilizce
Kimya  3.300 €  Bulgarca  Moleküler Agrobiyoteknoloji  2.700 €  İngilizce
Kimya ve Fizik  3.300 €  Bulgarca  Gıda Kalitesi Güvenliği  2.700 €  İngilizce
Kimya Mühendisliği  3.300 €  Bulgarca  Organik Tarım ve Biyokontrol  2.700 €  İngilizce
Nukleer Kimya  3.300 €  Bulgarca  Moleküler Biyoloji İle Genetik ve Genomik  2.700 €  İngilizce
Bilgisayar Kimyası  3.300 €  Bulgarca  BiyoFizik  2.700 €  İngilizce
EKO Kimya  3.300 €  Bulgarca  BiyoKimya  2.700 €  İngilizce
Kimya ve Bilişim  3.300 €  Bulgarca  Uygulamalı Ekonomik Jeoloji  3.850 €  İngilizce
Matematik  3.300 €  Bulgarca  Mekatronik ve Robotik  3.850 €  İngilizce
İstatistik  3.300 €  Bulgarca  Matematikte Mantik ve Algoritmalar  3.850 €  İngilizce
Bilişim  3.300 €  Bulgarca  Müzik Medya Teknolojileri  3.300 €  İngilizce
Bilgisayar Bilimleri  3.300 €  Bulgarca  Ses Mühendisliği  3.300 €  İngilizce
yazılım Mühendisliği  3.300 €  Bulgarca  Görsel İşitsel Tasarım  3.300 €  İngilizce
Bilişim Sistemleri  3.300 €  Bulgarca
Matematik ve Bilişim  3.300 €  Bulgarca
Uygulamalı Matematik  3.300 €  Bulgarca
Moleküler Biyoloji  2.700 €  Bulgarca
BiyoTeknoloji  2.700 €  Bulgarca
AgroBiyoTeknoloji  2.700 €  Bulgarca
BiyoYönetim ve Sürdürülebilir Kalkınma  2.700 €  Bulgarca
Biyoloji  2.700 €  Bulgarca
Ekoloji Ve Çevre Koruma Mühendisliği  2.700 €  Bulgarca
Biyoloji ve İngiliz Dili  2.700 €  Bulgarca
Biyoloji ve Kimya  2.700 €  Bulgarca
Sosyal Hizmetler  3.300 €  Bulgarca
Kamu Yönetiimi  3.300 €  Bulgarca
Sosyoloji  3.300 €  Bulgarca
Siyasal Bilimler  3.300 €  Bulgarca
Arkeoloji  3.300 €  Bulgarca
Etnoloji ve Antropoloji  3.300 €  Bulgarca
Kuantum ve Uzay Fiziği  3.300 €  Bulgarca
Nukleer  Teknoloji ve Nükleer Güç Mühendisliği  3.300 €  Bulgarca
Bilgisayar Mühendisliği  3.300 €  Bulgarca
Metroloji ve JeoFizik  3.300 €  Bulgarca
Astroloji Fiziği  3.300 €  Bulgarca
Haberleşme ve Fiziksel Elektronik  3.300 €  Bulgarca
Doğa Bilimleri Öğretmenliği  3.300 €  Bulgarca
Fizik Mühendisliği  3.300 €  Bulgarca
AMERİKAN ÜNİVERSİTESİ  ÜCRET  YURT
İşletme  11.900 €  50€-70€
Bilgisayar Bilimleri  11.900 €
Tarih ve Medeniyetler  11.900 €
Gazetecilik ve Kitle İletişimi  11.900 €
Tiyatro ve Film Oyunculuğu ve Yönetmenliği  11.900 €
Matematik ve Bilimi(Yandal Fizik)  11.900 €
Fizik(Yandal Matematik)  11.900 €
Güzel Sanatlar(Yandallar Modern Diller-YandallarKültür)  11.900 €
Siyaset Bilimleri(Yandal  Kamu Politikaları)  11.900 €
Uluslararası İlişkiler (Yandal Kamu Politikaları)  11.900 €
Avrupa Çalışmaları(Yandal Kamu Politikaları)  11.900 €
Psikoloji (Yandal Felsefe-Yandal Din Psikolojisi)  11.900 €
İşletme  11.900 €
Ekonomi  11.900 €
SOFYA YÜKSEK İNŞAAT VE MİMARLIK ÜNİVERSİTESİ  ÜCRET  DİL  EK BİLGİLER  YUKSEKLİSANS*DOKTORA
Mimarlık  4.400€  Bulgarca  Hazırlık İngilizce 4200€*Bulgarca 3400€  Mimarlık
İnşaat Mühendisliği  4.400 €  İngilizce  YURT  İnşaat Mühendisliği
Şehir Planlama  4.400 €  Bulgarca  50€-70€  Jeoloji
Alt Yapı Mühendisliği  4.400 €  Bulgarca  İngilizce Yuksek lisans 5200 EURO Bulgarca 4400
Su Temini Ve Kanalizasyon (Hidroteknik)  4.400 €  Bulgarca  İngilizce Doktora 5400 euro
Ulaştırma İnşaat Mühendisliği  4.400 €  Bulgarca
Jeodezi Mühendisliği (Harita Mühendisliği)  4.400 €  Bulgarca
Hidrolik Mühendisliği  4.400 €  Bulgarca
Ulaşım Proje Yönetimi Ve Teknolojisi  4.400 €  Bulgarca
Su Temini Teknolojisi  4.400 €  Bulgarca
İnşaatta Enerji Verimliliği  4.400 €  Bulgarca
İnşaatta Yalıtım Teknolojisi  4.400 €  Bulgarca
Gaz Teknolojisi Temini  4.400 €  Bulgarca
Çevre  4.400 €  Bulgarca
İnşaat Teknolojisi Yönetimi  4.400 €  Bulgarca
Yapı Mühendisliği  4.400 €  Bulgarca
Avrupa Alt Yapı Projeleri Yönetimi  4.400 €  Bulgarca
Çevre Mühendisliği  4.400 €  Bulgarca
Su Mühendisliği  4.400 €  Bulgarca
Jeodezi  4.400 €  Bulgarca
Ulaştırma Mühendisliği  4.400 €  Bulgarca
Kentsel Planlama  4.400 €  Bulgarca',
  '{"country": "Bulgaristan", "chunk": 2, "total_chunks": 6}'::jsonb,
  ARRAY['ulke','bulgaristan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bulgaristan Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'Peyzaj Mimarlığı  4.400 €  Bulgarca
SOFYA LÜBEN KARAVELOV İNŞAAT VE MİMARLIK ÜNİVERSİTESİ  ÜCRET  DİL  EK BİLGİLER  YUKSEK LİSANS 3000€
Mimarlık 5.5 Yıl  4.500 €  Bulgarca  HAZIRLIK 3000€  Mimarlık
İnşaat Mühendisliği  4500€* 3500€  İngilizce*Bulgarca  Bina İnşaatları Yatırım Projeleri Yönetimi
Diş Cephe Isı Yalıtımı ve Tasarımı  4.500 €  Bulgarca  Yukseklisanslı mezun olunacak ise 5.5 yılda mezun olunuyor  İnşaat Teknolojileri Yönetimi
Bina ve Tesis İnşaatı ve Yönetimi 5.5 Yıl  4.500 €  Bulgarca
İnşaat Yangın ve Acil Durum Güvenliği  4.500 €  Bulgarca
BULGARİSTAN YENİ ÜNİVERSİTESİ  ÜCRET  DİL  EK BİLGİLER  YUKSEKLİSANS  ÜCRET  DİL
Psikoloji  4.500 €  İngilizce  İngilizce Bulgarca*Fransızca Hazırlık 2700€  Marka Yönetimi  2.700 €  İngilizce
Felsefe  2.700 €  İngilizce  Kamu Yönetimi  2.700 €  İngilizce
Siyaset ve Toplum  2.700 €  İngilizce  Uluslararası İktisadi İlişkiler  2.700 €  İngilizce
Uluslararası Siyaset  2.700 €  İngilizce  İnsan Kaynakları Yönetimi ve Gelişimi  2.700 €  İngilizce
Network Teknolojileri  2.700 €  İngilizce  Stratejik Liderlik  2.700 €  İngilizce
İdare ve Yönetimde Uygulamalı Yabancı Diller  2.700 €  İngilizce  Bilişsel/Cognitive Bilimler  2.700 €  İngilizce
Bilgisayar Ağ Sistemleri  2.700 €  İngilizce  Turizm Yönetimi  2.700 €  İngilizce
Siyaset Bilimi  2.700 €  Fransızca  Sürdürülebilir Kalkınma Ekonomisi ve Yönetimi  2.700 €  İngilizce
Otel ve Restoran Yönetimi  2.700 €  Fransızca  Desktop ve Mobil Bilgisayarlar  2.700 €  İngilizce
Müzik*Güzel Sanatlar*Sinema Televizyon*Arkeoloji  2.700 €  Bulgarca  Doğu Avrupa Çalışmaları  2.700 €  İngilizce
Tercumanlık* Mimarlık*Tiyatro*Fotografcılık*Antropoloji  2.700 €  Bulgarca  Amerikan ve İngiliz Edebiyatı Çalışmaları, Karşılaştırmalı Yaklaşım  2.700 €  İngilizce
SOFYA ORMANCILIK ÜNİVERSİTESİ  ÜCRET  DİL  YURT  YÜKSEK LİSANS  ÜCRET  DİL
Veterinerlik  4500€-3500€  İngilizce-Bulgarca  50€-70€  Bahçeçilik  3.500 €  Bulgarca
Peyzaj Mimarlığı  3.500 €  Bulgarca  HAZIRLIK 3500€  Bitkisel Üretim*Bitki Koruma  3.500 €  Bulgarca
Agronomi  3.500 €  Bulgarca  Arılar * Böçekler* Genetik* Hayvancılık  3.500 €  Bulgarca
Alternatif Turizm  3.500 €  Bulgarca  Ormancılık  3.500 €  Bulgarca
Ahşap Mobilya Teknolojisi  3.500 €  Bulgarca  Ormancılık Yönetimi  3.500 €  Bulgarca
İç Mobilya Tasarımı  3.500 €  Bulgarca  Bilgisayarlı İşletme Yönetimi  3.500 €  Bulgarca
Mobilya Endüstrisinde Bilgisayar Teknolojileri  3.500 €  Bulgarca  Tarım İşletmeciliği  3.500 €  Bulgarca
Orman  Mühendisliği ve İşletmesi  3.500 €  Bulgarca  Alternatif Turizm Kültür Bitkileri  3.500 €  Bulgarca
Ekoloji  3.500 €  Bulgarca  Tohum Üretimi  3.500 €  Bulgarca
Bitki Koruma  3.500 €  Bulgarca  İç Mobilya Tasarımı  3.500 €  Bulgarca
Ekoloji Ve Çevre Koruma Mühendisliği  3.500 €  Bulgarca  Ahşap Ve Mobilya  3.500 €  Bulgarca
Tarım  3.500 €  Bulgarca
SOFYA ULUSLARARASİ EKONOMİ ÜNİVERSİTESİ  ÜCRET  DİL  EK BİLGİLER  YUKSEKLİSANS  ÜCRET  DİL
İşletme Ekonomisi ve Yönetiimi  3.800 €  İngilizce  Hazırlık  Bulgarca 3000€ İngilizce 3300€  Ekonomi  4.000 €  Bulgarca
İş Bilişimi ve Pazarlama İletişimi  3.800 €  İngilizce  İdare ve Yönetim  4.000 €  Bulgarca
Ekonomi  3.800 €  İngilizce  YURT  Sosyoloji  4.000 €  Bulgarca
Finans ve Muhasebe  3.800 €  İngilizce  50€-70€  Antropoloji  4.000 €  Bulgarca
Uluslararası Ekonomik İlişkiler  3.800 €  İngilizce  Kültürel Bilimler  4.000 €  Bulgarca
Fikri Mülkiyet Ekonomisi  3.800 €  İngilizce  Siyaset Bilimi  4.000 €  Bulgarca
Uluslararası Turizm  3.800 €  İngilizce  Halkla İlişkiler  4.000 €  Bulgarca
Avrupa Siyaseti ve Ekonomisi  3.800 €  İngilizce  Bilgi İletişim*Bilişim Bilimleri  4.000 €  Bulgarca
Uluslararası İlişkiler  3.800 €  İngilizce  Savunma ve Güvenlik Ekonomisi  5.000 €  İngilizce
Siyaset Bilimi  3.800 €  İngilizce  Nükleer Güvenlik  5.000 €  İngilizce
Makroekonomi  3.000 €  Bulgarca  Hukuk  4.000 €  Bulgarca
Girişimcilik  3.000 €  Bulgarca
İş Ekonomisi  3.000 €  Bulgarca
İnsan Kaynakları Ekonomiisi  3.000 €  Bulgarca
Sigorta ve Sosyal İşler  3.000 €  Bulgarca
Kamu Yönetimi  3.000 €  Bulgarca
Hukuk  4.000 €  Bulgarca
Gazetecilik  4.000 €  Bulgarca
Medya ve İletişim  4.000 €  Bulgarca
Lojistik Ekonomisi  3.000 €  Bulgarca
Sanayi Ekonomisi  3.000 €  Bulgarca
Ticaret Ekonomisi  3.000 €  Bulgarca
Yapı ve İnşaat Ekonomisi  3.000 €  Bulgarca
Endüstri Ekonomisi  3.000 €  Bulgarca
İstatistik ve Ekonometri  3.000 €  Bulgarca
Bankacılık ve Sigortacılık  3.000 €  Bulgarca
Veri Bilimi ve Sibernetik  E*Devlet Güvenlik  3.000 €  Bulgarca
Halkla İlişkiler  3.000 €  Bulgarca
Sosyoloji  3.000 €  Bulgarca
Tarım Ekonomisi  3.000 €  Bulgarca
Savunma Ekonomisi  3.000 €  Bulgarca
Turizm  3.000 €  Bulgarca
SOFYA GUZEL SANATLAR AKADEMİSİ  ÜCRET  DİL  YURT
Restorasyon Sanatı  2.700 €  İngilizce  50€-70€
Kitap ve Matbaa Grafiği  2.700 €  İngilizce  Hazırlık 2700€
Sanat Grafiker Ressam  2.700 €  İngilizce
Renkli Duvar Resmi Sanatı  2.700 €  İngilizce
Heykeltıraş Ressamlık  2.700 €  İngilizce
Poster Transparan  2.700 €  İngilizce
Göz Komünikasyonu Sanatı  2.700 €  İngilizce
Metal Sanatı  2.700 €  İngilizce
Seramik Sanatı  2.700 €  İngilizce
Stenografi Sanatı  2.700 €  İngilizce
Oymacılık Sanatı  2.700 €  İngilizce
Tekstil Sanatı  2.700 €  İngilizce
Çocuk ve Çevre Dizaynı  2.700 €  İngilizce
Moda ve Tasarım  2.700 €  İngilizce
Reklam Dizaynı  2.700 €  İngilizce
Porselen ve Cam Sanatı  2.700 €  İngilizce
SOFYA FİNANS VE SİGORTACİLİK ÜNİVERSİTESİ  ÜCRET  DİL  YURT  YÜKSEK LİSANS  ÜCRET  DİL
Finans  3.000 €  ingilizce  50€-70€  Finans  3.200 €  İngilizce
İşletme  3.000 €  ingilizce  Hazırlık 3000€  Emeklilik ve Sağlık Sigortası  3.200 €  İngilizce
Pazarlama  3.000 €  ingilizce  Muhasebe ve Denetim  3.200 €  İngilizce
Bankacılık  3.000 €  Bulgarca  Finans İşletme ve İŞ Hukuku  3.200 €  İngilizce
Sigortacılık  3.000 €  Bulgarca  Finans İşletme ve Pazarlama  3.200 €  İngilizce
Sigorta Ve Finans  3.000 €  Bulgarca  Elektronik İş Pazarlama ve Satışlar  3.200 €  İngilizce
Muhasebe Ve Finans  3.000 €  Bulgarca  Aktüerya  3.200 €  İngilizce',
  '{"country": "Bulgaristan", "chunk": 3, "total_chunks": 6}'::jsonb,
  ARRAY['ulke','bulgaristan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bulgaristan Yurtdışı Eğitim Bilgileri (Bölüm 4)',
  'Muhasebe Ve Denetim  3.000 €  Bulgarca  Bankacılık  3.200 €  İngilizce
Finans İşletme ve Pazarlama  3.200 €  Bulgarca
Muhasebe ve Denetim  3.200 €  Bulgarca
Kurumsal Kontrol ve İktisadi Analizler  3.200 €  Bulgarca
Muhasebe ve Yönetim Analizleri  3.200 €  Bulgarca
İnsan Kaynakları Yönetimi ve Liderlik Davranışı  3.200 €  Bulgarca
Uluslararası iş ve Finans  3.200 €  Bulgarca
SOFYA KİMYA TEKNOLOJİLERİ VE METALURJİ ÜNİVERSİTESİ  ÜCRET  DİL  YURT
Metalurji  2400€ Bulgarca  İngilizce, Fransızca, Almanca  50€-70€
Kimya Mühendisliği  2.400 €  İngilizce, Fransızca, Almanca  Hazırlık 2400€
Organik Kimya Mühendisliği  2.400 €  Bulgarca
Malzemeler Bilgisi  2.400 €  Bulgarca
İnorganik Kimya Mühendisliği  2.400 €  Bulgarca
Endüstri Mühendisliği  2.400 €  Bulgarca
Endüstriyel Kimya Mühendisliği  2.400 €  Bulgarca
Bioteknojiler  2.400 €  Bulgarca
Ekoloji Ve Çevre Koruma Mühendisliği  2.400 €  Bulgarca
Otomasyon Ve İletişim Teknolojileri  2.400 €  Bulgarca
İnşaat Mühendisliği  2.400 €  Bulgarca
SOFYA MÜZİK AKADEMİSİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL
Kompozisyon  4.000 €  Bulgarca  YURT  Kompozisyon  6.600 €  Bulgarca
Piyano  4.000 €  Bulgarca  50€-70€  Piyano  6.600 €  Bulgarca
Müzikal Teori ve Müzik Unsurları  4.000 €  Bulgarca  Hazırlık 4000€  Müzikal Teori ve Müzik Unsurları  6.600 €  Bulgarca
Özel Parçalar Teorisi  4.000 €  Bulgarca  Özel Parçalar Teorisi  6.600 €  Bulgarca
Keman  4.000 €  Bulgarca  1 Müzik Alet çalmak  Keman  6.600 €  Bulgarca
Klasik Gitar  4.000 €  Bulgarca  Nota Bilgisi Olmak  Klasik Gitar  6.600 €  Bulgarca
Viyola  4.000 €  Bulgarca  Yetenek Sınavı İle  Viyola  6.600 €  Bulgarca
Çello  4.000 €  Bulgarca  Konservatuar Mezunu Direkt Alınır  Çello  6.600 €  Bulgarca
Kontrabas  4.000 €  Bulgarca  Viyola  6.600 €  Bulgarca
Flüt  4.000 €  Bulgarca  Çello  6.600 €  Bulgarca
Obua  4.000 €  Bulgarca  Kontrabas  6.600 €  Bulgarca
Klarnet  4.000 €  Bulgarca  Flüt  6.600 €  Bulgarca
Trompet  4.000 €  Bulgarca  Obua  6.600 €  Bulgarca
Trombon  4.000 €  Bulgarca  Klarnet  6.600 €  Bulgarca
Perküsyon Aletleri  4.000 €  Bulgarca  Trompet  6.600 €  Bulgarca
Klasik Şarkı  4.000 €  Bulgarca  Trombon  6.600 €  Bulgarca
Pop ve Caz  4.000 €  Bulgarca  Perküsyon Aletleri  6.600 €  Bulgarca
SOFYA SPOR AKADEMİSİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL  DOKTORA  DİL
Antrenörlük(İlgili Dallarda)  3.200 €  Bulgarca  YURT  Spor Sağlığı  3.200 €  Bulgarca  Beden Eğitimi ve spor  Bulgarca  4.000 €
Spor Animatörlüğü  3.200 €  Bulgarca  50€-70€  Spor Psikolojisi  3.200 €  Bulgarca  Fizik tedavi Sporu  Bulgarca  4.000 €
Uyumlaştırılmış Fiziksel Aktivite Ve Spor  4.000 €  Bulgarca  HAZIRLIK 3200€  Turizmde Spor Animasyonu  4.000 €  Bulgarca  Spor Antrenörlük  Bulgarca  4.000 €
Spor Antrenörlüğü  3.200 €  Bulgarca  Hazırlık sonrası  Giriş  Sınavı Yapılır  Spor Gazeteciliği  3.200 €  Bulgarca
Spor Yorumculuğu  3.200 €  Bulgarca  Koçu*Atlatizm*Fitnees Aktivite  Beden Eğitimi  4.000 €  Bulgarca
Beden Eğitimi ve Spor  3.200 €  Bulgarca  Spor Fizik Tedavi  4.000 €  Bulgarca
Beden Eğitimi Öğretmenliği  3.200 €  Bulgarca  Spor Yönetimi  4.000 €  Bulgarca
SOFYA ST.IVAN RİLSKİ MADENCİLİK VE JEOLOJİ ÜNİVERSİTESİ  ÜCRET  DİL  EK BİLGİLER
Maden Mühendisliği  2.800 €  İngilizce  Hazırlık 2500€
Otomasyon ve Bilgi Kontrol Teknolojileri Mühendisliği  2.800 €  Bulgarca  Yukseklisans 3300€
BiyoTeknoloji*Elektrik Mühendisliği  2.800 €  Bulgarca
Gaz*Yakıt ve Arıtma Ekipmanları Teknolojisii Mühendisliği  2.800 €  Bulgarca
Hidrojeoloji Mühendisliği  2.800 €  Bulgarca
Geoİnformatik Mühendisliği  2.800 €  Bulgarca
HamMadde ve Geri Dönüşüm Mühendisliği  2.800 €  Bulgarca
Ekoloji ve Çevre Koruma Mühendisliği  2.800 €  Bulgarca
Makine Mühendisliği  2.800 €  Bulgarca
Kaynak Üretim Yönetimi ve Mühendisliği  2.800 €  Bulgarca
YerAltı İnsaat Mühendisliği  2.800 €  Bulgarca
Jeodezi Mühendisliği*Harita Kadastro Mühendisliği  2.800 €  Bulgarca
JeoFizik  mühendisliği* Jeoloji Mühendisliği  2.800 €  Bulgarca
Petrol Gaz Sondaj* Üretİm ve Ulaştırma Mühendisliği  2.800 €  Bulgarca
PLEVEN TIP ÜNİVERSİTESİ  ÜCRET  DİL  YURT  YÜKSEK LİSANS 3 ile 5 Yıl arası  ÜCRET  DİL  DOKTORA  ÜCRET
Tıp  8000€ 2.4.Sınıflar 7500€  İngilizce  70€-80€  Sağlık Yönetimi  6.000 €  Bulgarca  Tıp Uzmanlığı  4000€-6000€
Eczacılık  8.500 €  Bulgarca  HAZIRLIK 4000€  Ergoterapi  6.000 €  Bulgarca
Hemşirelik  3.200 €  Bulgarca  Dil Muafiyet 200€  Tıbbi Rehabilitasyon  6.000 €  Bulgarca
Ebelik  3.200 €  Bulgarca  Sağlık Yönetimi  6.000 €  Bulgarca
Eczacı yardımcılığı  3.200 €  Bulgarca  İlk Yıl Eğitim Şubat Ayında Başlar  Halk Sağlığı  6.000 €  Bulgarca
Rontgen*Radyoloji Teknikeri  3.200 €  Bulgarca  18 Kasım  Mülakat  4.800 €
Tıbbi Kozmetik  3.200 €  Bulgarca
Halk Sağlığı ve Yönetimi  3.000 €  Bulgarca
Fizik Tedavi  3.200 €  Bulgarca
Sağlık Yönetimi  3.200 €  Bulgarca
Sağlık Hizmeti  3.000 €  Bulgarca
Tıbbi Rehabilitasyon Ve Ergoterapi  3.000 €  Bulgarca
Kineziterapi  3.200 €  Bulgarca
VARNA TIP ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL
Tıp  8000€-9000€  Bulgarca-İngilizce  Hazırlık 3000€  Kamu Sağlığı Yönetimi  4.000 €  Bulgarca
Diş Hekimliği  8000€-9000€  Bulgarca-İngilizce  Dil Muafiyet 250€
Eczacılık  6.000 €  Bulgarca  YURT  50€-70€
Hemşirelik  3.000 €  Bulgarca
Ebelik  3.000 €  Bulgarca
Sağlık Yönetimi  3.000 €  Bulgarca
İlaç Endüstrisi ve Bakım  3.000 €  Bulgarca
Halk Sağlığı Koruma ve Kontrol  3.000 €  Bulgarca
Laborant  3.000 €  Bulgarca
Eczacı Asistanlığı  3.000 €  Bulgarca
Sağlık Asistanı  3.000 €  Bulgarca
Diş Teknisyeni  3.000 €  Bulgarca
Optisyenlik  3.000 €  Bulgarca
Tıbbi Kozmetik  3.000 €  Bulgarca
Askeri Tıp  3.000 €  Bulgarca
Halk Sağlığı Müfettişliği  3.000 €  Bulgarca
Radyoloji  3.000 €  Bulgarca
VARNA YÖNETİM ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET
Yazılım sistemleri ve Teknolojileri Mühendisliği  3.900 €  İngilizce  Hazırlık 3000€  Uluslararası konaklama  5.850 €
Bilişim Sistemleri Mühendisliği  3.900 €  İngilizce  Dil Muafiyet 250€  Turizm İşletmeciliği  4.950 €',
  '{"country": "Bulgaristan", "chunk": 4, "total_chunks": 6}'::jsonb,
  ARRAY['ulke','bulgaristan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bulgaristan Yurtdışı Eğitim Bilgileri (Bölüm 5)',
  'Turizm işletmeciliği ve Pazarlaması  3.900 €  İngilizce  YURT OTELİ  İşletme MBA  4.950 €
Uluslararası Otelcilik ve İşletmeciliği  3.900 €  İngilizce  200 €
Turizm ve Otel Yönetimi  3.900 €  İngilizce
Uluslararası Bankacılık ve Finans  3.900 €  İngilizce
Uluslararası Ticaret ve Yönetim  3.900 €  İngilizce
İşletme  3.900 €  İngilizce
Uluslararası Finans  3.900 €  İngilizce
Pazarlama ve Yönetim  3.900 €  İngilizce
Mutfak Yemek Sanatı 3+2 Yıl Gastronomi  3.900 €  İngilizce
VARNA TEKNİK ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL
Bilgisayar Sistemleri ve Teknolojileri  2.400 €  İngilizce  Hazırlık 2500€  Yenilenebilir Enerji Kaynakları  3.500 €  İngilizce
Yazılım ve İnternet Teknolojileri  2.400 €  İngilizce  Dil Muafiyet 250€  Sosyal pedagojik yönetimi  3.500 €  İngilizce
Yapay Zeka  2.400 €  İngilizce  YURT  Gemi Kaptanlığı  3.500 €  İngilizce
Siber Güvenlik  2.400 €  İngilizce  50€-70€  Gemi İnşaat ve Deniz Mühendisliği  3.500 €  İngilizce
Bilgi ve İletişim Teknolojileri  2.400 €  İngilizce  Telekomünikasyon ve Mobil Teknolojileri  3.500 €  İngilizce
Elektronik Mühendisliği  2.400 €  İngilizce  Elektronik  3.500 €  İngilizce
Biyomedikal Elektronik Mühendisliği  2.400 €  İngilizce  Bilgisayar Ağları ve İletişim  3.500 €  İngilizce
Gemİ Kaptanlığı  2.400 €  İngilizce  Yazılım Mühendisliği  3.500 €  İngilizce
Gemi Makineleri ve Mekanizmaları  2.400 €  İngilizce  Tohum  Üretimi ve Bitki Koruması  3.500 €  İngilizce
Gemi İnşaatı  ve Deniz Mühendisliği  2.400 €  İngilizce  Tohum  Üretimi ve Bitki Malzeme Üretimi  3.500 €  İngilizce
Su Taşımacılığı ve Lojistik  Yönetimi  2.400 €  İngilizce  Endüstriyel Yönetim  3.500 €  İngilizce
Isı Mühendisliği ve Yatırım Tasarımı Yönetimi  2.400 €  İngilizce  Kurumsal Yönetim  3.500 €  İngilizce
Yenilenebilir Enerji Kaynakları  2.400 €  İngilizce  Teknolojik Girişimcilik ve Yenilikler  3.500 €  İngilizce
Sosyal Yönetim  2.400 €  İngilizce
Teknolojik Girişimcilik ve İnovasyon  2.400 €  İngilizce
Endüstriyel Yönetim Argonomi  2.400 €  İngilizce
Otomotiv Elektroniği  2.400 €  İngilizce
Elektronik Mühendisliği  2.400 €  İngilizce
Agronomi  2.400 €  İngilizce
Endüstriyel Yönetim  2.400 €  İngilizce
Teknolojik Girişimcilik ve İnovasyon  2.400 €  İngilizce
İmalat Mühendisliği  2.400 €  Bulgarca
Otomasyon Bilgi ve Bilgisayar Kontrol Sistemleri  2.400 €  Bulgarca
Çevre Mühendisliği  2.400 €  Bulgarca
Afet ve Kazalardan Korunma  2.400 €  Bulgarca
Endüstriyel Tasarım  2.400 €  Bulgarca
Gemi Elektrik Ekipmanları  2.400 €  Bulgarca
Elektrik Gücü ve Elektrik Ekipmanları  2.400 €  Bulgarca
Elektrik Gücü ve Elektrik Döşemeciliği  2.400 €  Bulgarca
Elektrik Enerjisi  2.400 €  Bulgarca
Elektrik Mühendisliği ve Elektrik Teknolojisi  2.400 €  Bulgarca
Otomotiv Mühendisliği  2.400 €  Bulgarca
Robotik ve Mekatronik Mühendisliği  2.400 €  Bulgarca
Mekanik Bilgisayar Teknolojileri  2.400 €  Bulgarca
Ulaştırma Mühendisliği ve Teknolojileri  2.400 €  Bulgarca
Makine İnşaat Mühendisliği ve Teknolojileri  2.400 €  Bulgarca
Otomasyon  Mühendisliği  2.400 €  Bulgarca
İnşaat Yönetimi  2.400 €  Bulgarca
VARNA SERBEST(FREE)ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL
Psikoloji  1.450 €  Ingilizce*Rusça*Bulgarca  YURT  İşletme ve Yönetim  1.650 €  İngilizce
Hukuk  1.450 €  Ingilizce*Rusça*Bulgarca  50€-70€  Kamu Yönetmi  1.650 €  İngilizce
İşletme Yönetimi ve İşletmeciliği  1.450 €  Ingilizce*Rusça*Bulgarca  Hazırlık 2500€*Bulgarca 2300€  Uluslararası Ekonomik İlişkiler  1.650 €  İngilizce
Kamu Yönetimi ve Yönetimi  1.450 €  Ingilizce*Rusça*Bulgarca  Finans ve Muhasebe  1.650 €  İngilizce
Uluslararası Ekonomik İlişkiler  1.450 €  Ingilizce*Rusça*Bulgarca  Uluslararası Ticaret  1.650 €  İngilizce
Uluslararası Ticaret  1.450 €  Ingilizce*Rusça*Bulgarca  Bilişim ve Bilgisayar Bilimi  tr  1.650 €  İngilizce
Bilişim ve Bilgisayar Bilimi  1.450 €  Ingilizce*Rusça*Bulgarca  Hukuk  1.650 €  İngilizce
Mimarlık  1.450 €  Ingilizce*Rusça*Bulgarca  Suçla Mücadele ve Kamu Düzenin Korunması  1.650 €  İngilizce
İç Tasarım  1.450 €  Ingilizce*Rusça*Bulgarca  Ulusal Güvenlik  1.650 €  İngilizce
Grafik Tasarım  1.450 €  Ingilizce*Rusça*Bulgarca  Moda Sitil ve Yönetimi  1.650 €  İngilizce
Su ve Sanitasyon  1.450 €  Ingilizce*Rusça*Bulgarca  Grafik Tasarım  1.650 €  İngilizce
yangın ve Acil Durum Güvenliği  1.450 €  Ingilizce*Rusça*Bulgarca  Kareografi  1.650 €  İngilizce
Koreografi  1.450 €  Ingilizce*Rusça*Bulgarca  Mimarlık  1.800 €  İngilizce
Moda Tasarımı  1.450 €  Ingilizce*Rusça*Bulgarca  İç Tasarım  1.650 €  İngilizce
Koreografi Sahneleme ve Sanat Yönetimi  1.450 €  Ingilizce*Rusça*Bulgarca  Bina ve Tesis İnşaatı  1.650 €  İngilizce
Moda ve Tekstil Tasarımı  1.450 €  Ingilizce*Rusça*Bulgarca  Yangın ve Acil Durum Güvenliği  1.650 €  İngilizce
Grafik ve Dizayn Sahne Sanatı  1.450 €  Ingilizce*Rusça*Bulgarca
Yaratıcı Üretim Oyunculuk  1.450 €  Ingilizce*Rusça*Bulgarca
Ulusal Güvenlik Koruması  1.450 €  Ingilizce*Rusça*Bulgarca
Bina yapı ve İnşaatı  1.800 €  Ingilizce*Rusça*Bulgarca
İnşaat Mühendisliği  1.800 €  Ingilizce*Rusça*Bulgarca
Mimarlık ve Şehircilik  1.800 €  Ingilizce*Rusça*Bulgarca
Nakliye ve İnşaat  1.800 €  Ingilizce*Rusça*Bulgarca
VARNA EKONOMİ ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL  DOKTORA  ÜCRET
Uluslararası İşletme  3.000 €  İngilizce  YURT  Uluslararası İşletme ve Yönetimi  3.000 €  İngilizce  Ekonomi  3.000 €
İşletme ve Yönetimi  3.000 €  İngilizce  50€-70€  Kamu Maliyesi  3.000 €  Bulgarca  Politik Ekonomi  3.000 €
Muhasebe  3.000 €  İngilizce  Hazırlık 3000€  Banka Yönetimi  3.000 €  Bulgarca  Finans  3.000 €
Turizm Otel ve Restoran Yönetimi  3.000 €  Bulgarca  Kurumsal Finansman  3.000 €  Bulgarca  Ticaret Hukuku  3.000 €
Muhasebe ve Denetim  3.000 €  Bulgarca  Kurumsal İşletme Yönetimi  3.000 €  Bulgarca  İş Hukuku Ve Güvenlik  3.000 €
Maliye  3.000 €  Bulgarca  Global Ticaret Yönetimi  3.000 €  Bulgarca
Sosyal Güvenlik ve Sigortacılık  3.000 €  Bulgarca  Girişimcilik  3.000 €  Bulgarca',
  '{"country": "Bulgaristan", "chunk": 5, "total_chunks": 6}'::jsonb,
  ARRAY['ulke','bulgaristan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Bulgaristan Yurtdışı Eğitim Bilgileri (Bölüm 6)',
  'Muhasebe ve Finans  3.000 €  Bulgarca  Lojistik Yönetimi  3.000 €  Bulgarca
Ekonomi ve Ticaret  3.000 €  Bulgarca  Gayrimenkul ve Yatırım  3.000 €  Bulgarca
İşletme Ekonomisi  3.000 €  Bulgarca  İşletme Ekonomisi  3.000 €  Bulgarca
Girişimcilik ve Yatırım Yönetimi  3.000 €  Bulgarca  Tarımsal İşletme  3.000 €  Bulgarca
Gayrimenkul ve Yatırımı  3.000 €  Bulgarca  Proje Yönetimi  3.000 €  Bulgarca
Pazarlama  3.000 €  Bulgarca  Malların Kalitesi ve Uzmanlığı  3.000 €  Bulgarca
Dijital Medya Animasyon ve Halkla İlişkiler  3.000 €  Bulgarca  Satış Yönetimi ve Mağazacılık  3.000 €  Bulgarca
Uluslararası Ekonomi İlişkiler  3.000 €  Bulgarca  Reklam ve Medya İletişimi  3.000 €  Bulgarca
Uluslararası İşletme  3.000 €  Bulgarca
Organizasyonların Yönetimi  3.000 €  Bulgarca
insan Kaynakları Yönetimi  3.000 €  Bulgarca
Kamu Yönetimi ve İdaresi  3.000 €  Bulgarca
Uluslararası Turizm İşletmesi  3.000 €  Bulgarca
Pazarlama  3.000 €  Bulgarca
Mobil ve Web Teknolojileri  3.000 €  Bulgarca
VARNA DENİZCİLİK (NAVAL) AKADEMİSİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL  DOKTORA  ÜCRET
Gemi Kaptanlığı  3.000 €  İngilizce  YURT  Deniz İşletmeleri Mühendisliği  3.500 €  Bulgarca  Gemi İnşaatı Teknolojisi ve Organizasyonu,  4.600 €  Bulgarca
Gemi Elektroniği  3.000 €  İngilizce  50€-70€  Gemi Onarım Teknolojisi  3.500 €  Bulgarca  Gemi Makineleri ve Mekanizmaları  4.600 €  Bulgarca
Okyanus Ve Nehir Taşımacılığı  3.000 €  İngilizce  Hazırlık 3000€  Filo ve Liman Yönetimi  3.500 €  Bulgarca  Radar ve Radyo Navigasyonu  4.600 €  Bulgarca
Gemi Elektroniği  3.000 €  İngilizce  Bilgi ve İletişim Teknolojileri  3.500 €  Bulgarca  Geminin Elektrik Temini ve Donanımı  4.600 €  Bulgarca
Radar Sistemleri Mühendisliği  3.000 €  İngilizce  Okyanus ve Nehir Mühendisliği ve Yönetimi  3.500 €  Bulgarca  Gemi Yönetimi ve Navigasyon  4.600 €  Bulgarca
Gemi Tamir Teknolojileri  3.000 €  İngilizce  Siber Güvenlik  3.500 €  Bulgarca  Su Taşıma  4.600 €  Bulgarca
Gemi Liman Ve Filo Teknolojileri Ve İşletmeciliği  3.000 €  İngilizce  Gemi Makineleri Ve Mekanizmaları  3.500 €  Bulgarca  Deniz ve Liman İşletilmesi  4.600 €  Bulgarca
Gemi Makine Ve Mekanizmaları  3.000 €  İngilizce  Filo ve Liman Yönetimi  3.500 €  Bulgarca  Uygulamalı Mekanik  4.600 €  Bulgarca
Gemi Liman Ve Filo Taşımacılığı  3.000 €  İngilizce  Su Taşıma Yönetimi  3.500 €  Bulgarca  Otomatik Bilgi İşleme ve Kontrol Sistemleri  4.600 €  Bulgarca
Navigasyon  3.000 €  Bulgarca  Bilgi İletişim Teknolojileri  3.500 €  Bulgarca  Malzeme Organizasyon ve Yönetimi  4.600 €  Bulgarca
Gemi Elektroniği  3.000 €  Bulgarca  Askeri Psikoloji  4.600 €  Bulgarca
Siber Güvenlik  3.000 €  Bulgarca
Denizcilik İletişim Teknolojileri  3.000 €  Bulgarca
Su Taşıma Yönetimi  3.000 €  Bulgarca
Filo Ve Liman Yönetimi  3.000 €  Bulgarca
Deniz Lojistik  3.000 €  Bulgarca
Nehir Taşımacılığı  3.000 €  Bulgarca
Yolcu Gemilerinin Yönetimi  3.000 €  Bulgarca
Gemi Makineleri Ve Makanizmaları  3.000 €  Bulgarca
Bilgi İletişim Teknolojileri  3.000 €  Bulgarca
Geminin Elektrik Donanımı  3.000 €  Bulgarca
Okyanus Mühendisliği  3.000 €  Bulgarca
Akıllı Ulaşım Sistemleri (Mekatronik)  3.000 €  Bulgarca
STARO ZAGORA (TRAKYA)ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER
Tıp  6500€-7500€  Bulgarca-İngilizce  YURT
Veterinerlik  3500€-4500€  Bulgarca-İngilizce  50€-70€
Ziraat Mühendisliği  3000€-4165€  Bulgarca-İngilizce  Hazırlık 2200€*3500€
Ekoloji Ve Çevre Koruma  2640€-3600€  Bulgarca-İngilizce
Tarım Mühendisliği  2640€-3600€  Bulgarca-İngilizce
Balıkçılık Ve Su Ürünleri Yetiştirme  3000€-4026€  Bulgarca-İngilizce
Hayvanat Bahçesi Mühendisliği  3000€-4026€  Bulgarca-İngilizce
Tıbbi Rehabilitasyon Ergoterapi  2.463 €  Bulgarca
Rehabilitasyon Laboratuvar  4.165 €  Bulgarca
Hemşirelik  4.265 €  Bulgarca
Ebelik  4.265 €  Bulgarca
Motorlu Taşıtlar Ve Tarım Makinaları  2.250 €  Bulgarca
Tarım Ekonomisi  1153€-3000€  Bulgarca-İngilizce
Tasarım Teknolojisi Moda Endeksi  2.500 €  Bulgarca
Otomasyon Ve Bilgi Sistemi  2.500 €  Bulgarca
Elektrik Mühendisliği  2.500 €  Bulgarca
Isı Ve Gaz Temini  2.500 €  Bulgarca
Gıda Teknoloji  2.500 €  Bulgarca
Özel Pedagoji  1.366 €  Bulgarca
Okul Öncesi  1.366 €  Bulgarca
İlkokul Öğretmenliği  1.366 €  Bulgarca
Sosyal Pedagoji  1.366 €  Bulgarca
Bilgi Teknolojisi  1.366 €  Bulgarca
İktisat  2.000 €  Bulgarca
İşletme  2.000 €  Bulgarca
Tarım  2.000 €  Bulgarca',
  '{"country": "Bulgaristan", "chunk": 6, "total_chunks": 6}'::jsonb,
  ARRAY['ulke','bulgaristan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Gürcistan Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'GÜRCİSTAN
-Kayıt Masrafları ve Rehberlik 1250$
-ÇEVİRİ İŞLEMLERİNİ ÖĞRENCİ ÜLKEYE GİTTİĞİNDE ÜCRETİ TEMSİLCİYE TESLİM EDER.
- Belge Çeviri Bakanlık 400$
-VİZESİZ BİR ÜLKEDEDİR. OKUL BAŞLADIKTAN SONRA ÖĞRENCİ OTURUMU YAPILIR.
-BÜTÜN HAZIRLIKLAR ULUSLARARASI KAFKASTA ALINIR. DÖNEMLİK 300USD
-GÜRCÜCE HAZIRIK HER SENE AÇILMAZ KAYIT ALMADAN ÖNCE TEMSİLCİYE SORULMASI GEREKİYOR.
İLİA ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL  DOKTORA*UZMANLIK
Tıp  6200$  İngilizce  Yurtdışı Çıkış Pulu 150 TL  İş Ticaret Hukuku  3700$  Gürcüce  Siyaset Bilimi
Hemşirelik  3000$  Gürcüce  Konaklama Giderleri  Ceza Hukuku  3200$  İngilizce  Kültür Çalışmaları
Hukuk  1000$  Gürcüce  Seyahat Sigortası  Kamu Hukuku ve Politikası  3200$  İngilizce  Sosyoloji
Tarih  1000$  Gürcüce  Teminat 2000$  Ekoloji  3200$  Gürcüce  Psikoloji
Arkeoloji  1000$  Gürcüce  Vize 60$*Oturum İzni 120$  Biyoloji  3200$  Gürcüce  Arkeoloji
Sosyoloji  1000$  Gürcüce  Fizik ve Uzay Bilimleri Atmosfer  3200$  Gürcüce  Dijital Beşeri Bilimler
Uluslararası İlişkiler  1000$  Gürcüce  KONAKLAMA  İletişim  3200$  İngilizce  Felsefe
Siyasal Bilimler  1000$  Gürcüce  Gunlük Otel 40$  Konuşma Dil Terapisi  3200$  İngilizce  Dil Bilimleri ve Edebiyat Çalıimaları
Psikoloji  1000$  Gürcüce  Ev Kirası 300$*600$  Kamu Politikası Yönetimi  3200$  Gürcüce  Müzik Sanatları
Güzel Sanatlar(Resim, Seramik, Cam Tasarımı)  1000$  Gürcüce  Sanat Teorisi ve Kültürel Yönetim  3200$  Gürcüce  Sosyal ve Kültürel Antropoloji
Moda  1000$  Gürcüce  Sanat Teorisi ve Uygulaması  3200$  Gürcüce  Kalite Güvence Uzmanlığı
Tekstil  1000$  Gürcüce  Sosyal Çalışmalar  3200$  Gürcüce  Dermotoloji
Ayakkabı  1000$  Gürcüce  Avrupa Çalışmaları  3200$  Gürcüce  Sağlık Politikası
grafik (Bilgisayar tasarımı)  1000$  Gürcüce  Kafkasya Çalışmaları  3200$  Gürcüce  Sosyal Hizmetler
Felsefe  1000$  Gürcüce  Modern Tarih  3200$  Gürcüce
Film çalışmaları  3500$  Gürcüce  Siyaset Bilimi  3200$  İngilizce
Matematik  3700$*1000$  İngilizce*Gürcüce  Arkeoloji  3200$  Gürcüce
Ekoloji  3700$  Gürcüce  Dil Bilimi  3200$  Gürcüce
Fizik  3700$  Gürcüce  Din Bilimi  3200$  Gürcüce
Müzik  3700$  Gürcüce  Felsefe  3200$  Gürcüce
Biyoloji  1000$  Gürcüce  Sovyet ve Komünizm Çalışmaları  3200$  Gürcüce
Okul Öncesi Öğretmenliği  1000$  Gürcüce  Siyasal Bilimler ve Uluslararası İlişkiler  3200$  Gürcüce
Elektrik ve Elektronik Mühendisliği  4000$  İngilizce  Sosyoloji  3200$  Gürcüce
İnşaat Mühendisliği  4000$  İngilizce  Psikoloji  3200$  Gürcüce
Bilgisayar Mühendisliği  5000$  İngilizce  Teminoloji (Sözlük Bilim)  3200$  İngilizce
Mimarlık  3700$*1000$  İngilizce*Gürcüce  Uygulamalı Genetik  3200$  İngilizce
Bilgisayar ve Elektrik Mühendisliği  3700$*1000$  İngilizce*Gürcüce  Moleküler Biyoloji  3200$  İngilizce
Bilgisayar Bilimleri  4500$  İngilizce  Ekoloji  3200$  İngilizce
Yazılım Mühendisliği  3700$  İngilizce  Yemek Bilimi  3200$  İngilizce
Enerji ve Maden Kaynakları yönetimi  1000$  Gürcüce  Ormancılık ve Doğal Kaynaklar  3200$  İngilizce
Nano Elektronik Mühendisliği ve Yeni Malzemeler  3700$  İngilizce  Yer Bilimleri  3200$  İngilizce
İşletme  3500$  İngilizce  Çevre Koruma ve Sürdürebilir Kalkınma  3200$  Gürcüce
Turizm  3200$  Gürcüce  Halk Sağlığı  3200$  İngilizce
Tiyatro  1000$  Gürcüce  Turizm İşletilmesi  3700$  Gürcüce
Oyunculuk  1000$  Gürcüce  Yönetimde İşletme  3700$  Gürcüce
Yönetmenlik  1000$  Gürcüce  ÖzeL Eğitim *Bağımlılık  3200$  Gürcüce
Kültür Yönetimi  1000$  Gürcüce  Eğitim Yönetimi  3200$  Gürcüce
Liberal Sanatlar  1000$  Gürcüce  İşletme MBA  4000$  İngilizce
Öğretmenlikler Matematik*Tarih*Coğragfa*Biyoloji* Tarih* İngilizce*Rusça  1000$  Gürcüce  NanoTeknoloji  3200$  Gürcüce
Sağlık Politikası ve Yönetimi  1000$  Gürcüce  Maden Kaynakları  3200$  Gürcüce
Terminoloji (Sözlük Bilimi)  3200$  İngilizce  Modern Mimari ve Kalkınma  3200$  Gürcüce
Dil Konuşma Terapisi  1000$  Gürcüce  Matematik  3200$  Gürcüce
Tiyatro Oyunculugu  3200$  Gürcüce
Yönetmenlik  3200$  Gürcüce
Sosyal Psikiyatri  3200$  Gürcüce
Uluslararası İlişkiler  3700$  İngilizce
Klinik Psikoloji  3200$  Gürcüce
Eğitim ve Sosyal Psikoloji  3200$  Gürcüce
İVANA JAVAKHİSHVİLİ TİFLİS ÜNİVERSİTESİ  ÜCRET  DİL HAZIRLIK 2000$  EK GİDERLER  YÜKSEK LİSANS  ÜCRET  DİL  DOKTORA  ÜCRET  DİL
Tıp  8000$  İngilizce  Kayıt Masrafları ve Rehberlik 1000€  İktisat  4500$  İngilizce  Hukuk  2500$  Almanca
Diş Hekimliği  8000$  İngilizce  Evrak İşlemleri Onaya Hazırlanması  işletme  4500$  İngilizce  Turizm ve Otelcilik  2500$  İngilizce
Eczacılık  4500$  Gürcüce  Bakanlık ve Okul Kayıt Harcı  Avrasya ve Kafkasya çalışmaları  4500$  İngilizce  Çevresel Akışkanlıklar Mekaniği  2500$  İngilizce
Ergoterapi  3000$  Gürcüce  Onayın ve İkamet bildirimi  Kamu yönetimi  4500$  İngilizce  Ekonomi  2500$  İngilizce
Hemşirelik  3000$  Gürcüce  Bireysel Seyahat Giderleri  Turizm ve Otelcilik  4500$  İngilizce  Bilgisayar Bilimleri  2500$  İngilizce
İnşaat Mühendisliğ  1000$  Gürcüce  Yurtdışı Çıkış Pulu 150 TL  Avrupa Çalışmacıları  4500$  İngilizce
Elektrik Mühendisliği  1000$  Gürcüce  Konaklama Giderleri  Cinsiyet çalışmaları  4500$  İngilizce
Elektrik ve elektronik mühendisliği  1000$  Gürcüce  Seyahat Sigortası  Ekonomi  4500$  İngilizce
Jeoloji Makine Mühendisliği  1000$  Gürcüce  Teminat 2000$  Halk sağlığı  4500$  İngilizce
Bilişim  4000$  Fransızca  Yeme ve İçme (Market)  Tıbbi Moleküler Biyoloji  4500$  İngilizce
Bilgi Teknolojileri BT  4000$  İngilizce  YarıTatilde*(YılSonu Vize Alınacak)  Bilgisayar Bilimi  Gürcüce
Bilgisayar Mühendisliği  4000$  İngilizce  Vize 60$*Oturum İzni 120$  Bilgi Teknolojileri  Gürcüce
Ekonomi  3000$  İngilizce  Taahütname vize oturum izni içindir İlkyıl İstenmez  Bilgi Sistemi  Gürcüce
Kimya  3000$  İngilizce  Konsolosluklar  Slav calışmaları  2250 Gel  Gürcüce
Bilgisayar Bilimleri  4000$  İngilizce  İstanbul*Ankara*İzmir*Trabzon  Kafkasya çalışmaları  2250 Gel  Gürcüce
Uluslararası Hukuk  4000$  İngilizce  KONAKLAMA
Güzel Sanatlar  1000$  Gürcüce  Gunlük Otel 40$',
  '{"country": "Gürcistan", "chunk": 1, "total_chunks": 4}'::jsonb,
  ARRAY['ulke','gurcistan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Gürcistan Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'Televizyon  1000$  Gürcüce  Ev Kirası 300$*600$
Sinema sanatları  1000$  Gürcüce  İsim Soyad Değişikliği Belgesi
Biyoloji  1000$  Gürcüce
Biyolojik bilimler  1000$  Gürcüce
Biyoteknoloji  1000$  Gürcüce
Ekoloji  1000$  Gürcüce
Coğrafya  1000$  Gürcüce
Fizik  1000$  Gürcüce
Tarih  1000$  Gürcüce
Arkeoloji  1000$  Gürcüce
Felsefe  1000$  Gürcüce
Etnoloji  1000$  Gürcüce
Kültürel çalışmalar(Amerikan çalışmalar)  1000$  Gürcüce
Kimya  3000$  İngilizce
İspanyol  1000$  Gürcüce
Fransız  1000$  Gürcüce
Alman  1000$  Gürcüce
İngiliz  1000$  Gürcüce
İbranice  1000$  Gürcüce
Türkiye  1000$  Gürcüce
İtalyan  1000$  Gürcüce
Bizans  1000$  Gürcüce
Yunan  1000$  Gürcüce
Rusça  1000$  Gürcüce
Kafkas Dili  1000$  Gürcüce
İskandinav dilleri ve edebiyatları)  1000$  Gürcüce
Uluslararası İlişkiler  1000$  Gürcüce
Turizm İşletmeciliği  1000$  Gürcüce
Psikoloji  1000$  Gürcüce
Sosyal Hizmetler  1000$  Gürcüce
Sosyoloji  1000$  Gürcüce
Gazetecilik ve İletişim  1000$  Rusça
TİFLİS DEVLET TIP ÜNİVERSİTESİ  ÜCRET  DİL 2000$  EK GİDERLER  YUKSEK LİSANS  DOKTORA- UZMANLIK  ÜCRET
Tıp(6 yıl)  8000$*4000$  İngilizce*Rusça*Gürcüce  Kayıt Masrafları ve Rehberlik 1000  Farmaasötik  Epidemiyoloji ve çevre Tıbbi  5000$
Diş Hekimliği(5 yıl)  7000$*4000$  İngilizce*Rusça*Gürcüce  Evrak İşlemleri Onaya Hazırlanması 275$  İlaç ve Kozmatik Teknolojileri  Sağlık Yönetimi  5000$
Halk Sağlığı ve Yönetimi  4000$  İngilizce*Fransızca*Gürcüce  Bakanlık ve Okul Kayıt Harcı  Eczane İşletmeciliği  Sağlığın Teşviki ve geliştirilmesi Sağlık Eğitimi  5000$
Eczacılık(5 yıl)  3500$  Gürcüce  Onayın ve İkamet bildirimi  Klinik Eczacılık  Halk Sağlığı yönetimi ve Sağlık Politikası  5000$
Fiziksel Tıp ve Rehabilatasyon  3000$  İngilizce  Bireysel Seyahat Giderleri  Halk Sağlığı Yönetimi(İng)  7000$  Klinik Eczacılık  5000$
Yurtdışı Çıkış Pulu 150 TL  Cevre Tıbbı  Farmasötik kozmetik ve parfümeri  5000$
Konaklama Giderleri  Epidemiyoloji  Farmasötik Analiz  5000$
Seyahat Sigortası  Pediatrik Rehabilitasyon  Eczane yönetimi  5000$
Teminat 2000$  Spor Rehabilitasyonu  GÜRCİSTAN  5000$
Yeme ve İçme (Market)  Rehabilitasyon Danışmanı  Biyomedikal Mühendisliği  5000$
YarıTatilde*(YılSonu Vize Alınacak)  Pediatrik rehabilitasyon danışmanı  5000$
Vize 60$*Oturum İzni 120$  Psikoloji  5000$
Taahütname vize oturum izni içindir İlkyıl İstenmez  Psikiyatri  5000$
Konsolosluklar  Kulak Burun Boğaz  5000$
İstanbul*Ankara*İzmir*Trabzon  Dahiliye  5000$
KONAKLAMA  İç Hastalıkları  5000$
Gunlük Otel 40$  İç Hastalıkları Propaeseutigi  5000$
Ev Kirası 300$*600$  Travmatoloji ve Ortopedi  5000$
İsim Soyad Değişikliği Belgesi  Tıbta Doktora  5000$
Diş Hekimliğinde Doktora  5000$
Eczacılık  5000$
Halk Sağlığı  5000$
TİFLİS TEKNİK ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS
Dizayn  5500$  İngilizce  Kayıt Masrafları ve Rehberlik 1000€  Eğitim Yönetimi  3500$
İnşaat Mühendisliği  4000$  İngilizce  Evrak İşlemleri Onaya Hazırlanması 275$  Mimari ve Tasarım  5500$  Rusça
Biyomedikal  5500$  İngilizce  Bakanlık ve Okul Kayıt Harcı  Pazarlama  4000$
İngiliz Dili ve Edebiyatı  3000$  İngilizce  Onayın ve İkamet bildirimi  Bankacılık  4000$
Bilgisayar Mühendisliği  4000$  İngilizce  Bireysel Seyahat Giderleri  Muhasebe ve Denetim  4000$
Bilgisayar Bilimleri  4000$  İngilizce  Yurtdışı Çıkış Pulu 150 TL  İşletme Yönetimi MBA  5000$  İngilizce
Elektrik Mühendisliği  4000$  İngilizce  Konaklama Giderleri  Bilgisayar Bilimi  5500$  İngilizce
Mimarlık ve tasarım  5500$  İngilizce  Seyahat Sigortası  Elektrik Bölümünde Bilim  5500$  İngilizce
Makine Mühendisliği  4000$  İngilizce  Teminat 2000$  Petrol ve Gaz Teknolojisi  5500$  Rusça
Ziraat Mühendisliği  5500$  İngilizce  Enerji ve Elektrik Mühendisliği  5500$  Rusça
İnşaat ve Endüstri Mühendisliği  2500$  Gürcüce  Yeme ve İçme (Market)  Makine Mühendisliği  5500$  İngilizce
Hydro-Mühendislik  5500$  İngilizce  YarıTatilde*(YılSonu Vize Alınacak)  İnşaat Mühendisliği  5500$  İngilizce
Güç ve Telekominükasyon Mühendisliği  2500$  Gürcüce  Vize 60$*Oturum İzni 120$  Bilişim  5500$  Rusça
Telekominükasyon  2500$  Gürcüce  Taahütname vize oturum izni içindir İlkyıl İstenmez  Uluslararası İlişkiler  5500$  Rusça
Termal ve Hydro Enerji Mühendisliği  2500$  Gürcüce  Konsolosluklar  Gazetecilik  5500$  Rusça
Elektromekanik  2500$  Gürcüce  İstanbul*Ankara*İzmir*Trabzon  Kimya-Biyokimya Bilimi  5500$  İngilizce
Madencilik ve Jeoloji  2500$  Gürcüce  KONAKLAMA
Jeodezi Mühendisliği  2500$  Gürcüce  Gunlük Otel 40$
Maden Teknolojisi  2500$  Gürcüce  Ev Kirası 300$*600$
Jeoloji Bölümü  2500$  Gürcüce  İsim Soyad Değişikliği Belgesi
Petrol ve Gaz Teknolojisi  5500$  Rusça
Kimyasal Teknoloji ve Metalurji  2500$  Gürcüce
Kent Planlama ve Tasarım  2500$  Gürcüce
Bilişim ve Kontrol Sistemleri  2500$  Gürcüce
Sibernetik Mühendisliği ve Çalgı Aletleri  2500$  Gürcüce
Kontrol Mühendisliği  2500$  Gürcüce
Fizik  2500$  Gürcüce
Matematik  2500$  Gürcüce
Ulaşım ve Makine  2500$  Gürcüce
Makine-Bina  2500$  Gürcüce
Ulaştırma  2500$  Gürcüce
Mekanik Mühendisliği Grafik ve Teknik  2500$  Gürcüce
Kamu Bilimleri, Yabancı diller ve İletişim  2500$  Gürcüce
İktisat ve İşletme İdaresi  2500$  Gürcüce
Hukuk  2500$  Gürcüce
Bağcılık ve Şarapçılık  5500$  İngilizce
Alman dili ve Edebiyatı  2500$  Gürcüce
ULUSLARARASI KAFKAS ÜNİVERSİTESİ  ÜCRET  EK GİDERLER  YÜKSEK LİSANS 2 yıl  ÜCRET  DİL  DOKTORA  ÜCRET  DİL
Tıp(6 yıl)  6000$  İngilizce  Bakanlık ve Okul Kayıt Harcı  Uluslararası ilişkiler  1000$  Gürcüce  Kitle iletişimi,  2250$  İngilizce
Tıp  1650$  Gürcüce  Onayın ve İkamet bildirimi  Uluslararası Güvenlik  1000$  Gürcüce  Siyaset Bilimi  2250$  İngilizce
Diş Hekimliği(5 yıl)  5000$  İngilizce  Bireysel Seyahat Giderleri  Küresel Politika ve Güvenlik Çalışmaları  3000$ *  İngilizce  Diş Hekimliği Terapötik  2250$  İngilizce
Diş hekimliği  1500$  Gürcüce  Yurtdışı Çıkış Pulu 150 TL  Medya Çalışmaları ve Multimedya Üretimi  1000$  Gürcüce  İşletme  2250$  İngilizce',
  '{"country": "Gürcistan", "chunk": 2, "total_chunks": 4}'::jsonb,
  ARRAY['ulke','gurcistan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Gürcistan Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'Eczacılık  1000$  Gürcüce  Konaklama Giderleri  Uluslararası İşletme Yönetimi MBA  1000$  İngilizce
İşletme Yönetimi Fransa Cift Diploma Rennes işletme Okulu  8350$.  İngilizce  Seyahat Sigortası  Uluslararası Pazarlama  3500$  İngilizce
Hukuk  2300$  Gürcüce  Teminat 2000$
Tarım Bilimleri  2300$  Gürcüce  Yeme ve İçme (Market)
Başcılık Şarapçılık  2300$  Gürcüce  YarıTatilde*(YılSonu Vize Alınacak)  HAZIRLIK 600$
Gazetecilik  2300$  Gürcüce  Vize 60$*Oturum İzni 120$
Uluslararası İlişkiler  2300$  Gürcüce  Taahütname vize oturum izni içindir İlkyıl İstenmez
İşletme Yönetimi  3500$.  3 yıl  İngilizce  Konsolosluklar
Turizm  2300$  Gürcüce  İstanbul*Ankara*İzmir*Trabzon
Psikoloji  5000$  İngilizce  KONAKLAMA
Sosyoloji  2300$  Gürcüce  Gunlük Otel 40$
Turizm ve Otel  İşletmeciliği (Çift Diploma ABD Fairleigh Dickinson Üniversitesi  5900$  İngilizce  Ev Kirası 300$*600$
Mimarlık  5000$  İngilizce  İsim Soyad Değişikliği Belgesi
Bilgi Teknolojisi  3500$.     3 yıl  İngilizce
Siber Güvenlik ÇİFT Diploma New jersey Üniversitesi  8350$  İngilizce
İngiliz Dili ve Edebiyatı  3000$  İngilizce
Ekonomi  5000$  İngilizce
Diplomasi ve Uluslararası İlişkiler  5000$  İngilizce
TİFLİS İNSANİ BİLİMLER ÜNİVERSİTESİ  ÜCRET  DİL  YIL  YUKSEK LİSANS
Diş Hekimliği  3500$ *2500$  İngilizce*Rusça*Gürcüce  5 Yıl  İşletme organizasyonu ve Yönetimi  2500$  Gürcüce  1 Yıl
Eczacılık  2500$  Gürcüce  4 Yıl
Psikoloji  2500$  gürcüce  4 Yıl
Hukuk  2500$  Gürcüce  4 Yıl
İşletme  2500$  Rusça*Gürcüce  4 Yıl
Eğlence Turizm  2500$  Gürcüce  4 Yıl
Tarım Turizmi  2500$  Gürcüce  4 Yıl
ƒ  2500$  Gürcüce*Rusça  4 Yıl
Psikoloji  gürcüce  4 Yıl
GÜRCİSTAN AMERİKAN ÜNİVERSİTESİ  ÜCRET  DİL  YIL
Tıp  4980$  İngilizce  6 Yıl
Bilgisayarlı Bilişim  3800$  Gürcüce  4 Yıl
Bilgi Teknolojisi (multimedia Tasarım)  3800$  Gürcüce  4 Yıl
İşletme  3800$  ingilizce  4 Yıl
Tarih  3800$  Gürcüce  4 Yıl
Hukuk  3800$  İngilizce  4 Yıl
Uluslararası İlişkiler ve Diplomasi  3800$  Gürcüce  4 Yıl
Avrupa Entegrasyonuve çalışma ilişkileri  3800$  Gürcüce  4 Yıl
İngiliz Filolojisi  1500$  Gürcüce  4 Yıl
Gürcü Filolojisi  1500$  Gürcüce  4 Yıl
GÜRCİSTAN HAVACILIK ÜNİVERSİTESİ  ÜCRET  DİL  YIL  EK GİDERLER  YUKSEK LİSANS
Uçak Mühendisliği B1  3000$  İngilizce  4 Yıl  Pilotajlık*Ticari Pilot Lisansı  10500$  İngilizce  2 Yıl
Hava Taşımacılığı ve Lojistik Yönetimi  3000$  İngilizce  4 Yıl  Pilotajlık*Ticari Pilot Lisansı  12500$  İngilizce  2 Yıl
Uçak Tasarımı Ve İmalatı  3000$  İngilizce  4 Yıl  Uçak Mühendisliği  İngilizce  2 Yıl
Uçak Elektrik Mühendisliği  3000$  İngilizce  4 Yıl  Aviyonik Elektrik Teknik Kullanımı  İngilizce  2 Yıl
Uçuş Makinelerinin Tasarımı Üretimi  3000$  İngilizce  4 Yıl  SAĞLIK  RAPORU  UCUŞ SERTİFİKALARI
Hava Trafik Kontrol Bilgi sistemleri  3000$  İngilizce  4 Yıl  LABORATUVAR SONUCLARI  Plotajlık  Özel Pilot Sertifikası  26000$  İngilizce  III.Seviye
Kabin Hizmetleri(B2 ingilizce belgesi)  3000$  İngilizce  4 Yıl  BOY*KİLO  Ticari Pilot Sertifikası  26000$  İngilizce  VI Seviye
Pilotajlık* Ticari Pilotluk  13000$  İngilizce  Uçak Bakım Kursu Sertifikası  3000$  İngilizce  2Yıl
Hava Hostes Eğitimi Sertifikası  3000$  İngilizce  5 Ay
TİFLİS DEVLET KONSERVATUVARI  DİL  YIL
Piyano Majör  3500$  Gürcüce  4 Yıl
Genel Piyano  3500$  Gürcüce  4 Yıl
Eşlik Etme Becerileri  3500$  Gürcüce  4 Yıl
Oda Topluluğu  3500$  Gürcüce  4 Yıl
Tek kişilik Şarkı Performansı  3500$  Gürcüce  4 Yıl
Üflemeli ve Vurmalı Orkestra  3500$  Gürcüce  4 Yıl
Opera Tiyatrosu  3500$  Gürcüce  4 Yıl
Koro İdare Etme  3500$  Gürcüce  4 Yıl
DAVİD TVİLDİANİ TIP ÜNİVERSİTESİ  ÜCRET  EK GİDERLER  YÜKSEK LİSANS  ÜCRET
Tıp  8000$  İngilizce  Kayıt Masrafları ve Rehberlik 1000€  Eğitim Yönetimi  3500$
Diş Hekimliği (5 yıl)  5500$  İngilizce  Evrak İşlemleri Onaya Hazırlanması 275$  İşletme  4000$
Eczacılık (4 yıl)  4500$  İngilizce  Bakanlık ve Okul Kayıt Harcı  Ekonomi  4000$
Hemşirelik  3500$  İngilizce  Onayın ve İkamet bildirimi  Bilgi Teknolojileri  4000$
İş idaresi  4000$  İngilizce  Bireysel Seyahat Giderleri
Pazarlama  4000$  İngilizce  Yurtdışı Çıkış Pulu 150 TL
Bankacılık  4000$  İngilizce  Konaklama Giderleri
Muhasebe  4000$  İngilizce  Seyahat Sigortası
Denetim Yönetim  4000$  İngilizce  Teminat 2000$
Bilgisayar Bilimleri  4000$  İngilizce  Yeme ve İçme (Market)
Bilgi Teknoloji BT  4000$  İngilizce  YarıTatilde*(YılSonu Vize Alınacak)
Bilgisayar Mühendisliği  4000$  İngilizce  Vize 60$*Oturum İzni 120$
Elektrik Mühendisliği  4000$  İngilizce  Taahütname vize oturum izni içindir İlkyıl İstenmez
Makine Mühendisliğİ  4000$  İngilizce  Konsolosluklar
İnşaat Mühendisliği  4000$  İngilizce  İstanbul*Ankara*İzmir*Trabzon
İngilizce Dili ve Edebiyatı  4000$  İngilizce  Gunlük Otel 40$
Mimarlık ve Tasarım  4000$  İngilizce  Ev Kirası 300$*600$
GÜRCİSTAN ULUSAL ÜNİVERSİTESİ(SEU)  ÜCRET  DİL  YUKSEK LİSANS  DİL  UCRET
Tıp  6500$  İngilizce  Özel Hukuk  İngilizce  1100$
Hemşirelik  4000$  İngilizce  Ceza Hukuku  İngilizce  1100$
Diş hekimliği  6000$  İngilizce  Kamu Hukuku  İngilizce  1100$
Eczacılık  4500$  İngilizce  İşletme Yönetmi MBA  İngilizce  4000$
Bilgi Teknolojileri BT  4000$  İngilizce  Uluslararası İşletme Hukuku  İngilizce  3000$
Elektrik Mühendisliği  4500$  İngilizce  İnsan Kaynakları Yönetimi  Gürcüce  1000$
Bilgisayar Mühendisliği  4500$  İngilizce  İş İdaresi  Gürcüce  1000$
İngiliz Dili Edebiyatı  4000$  İngilizce  Finans  Gürcüce  1000$
Bilgisayar Bilimleri  4000$  İngilizce  Veri Bilimi  Gürcüce  1300$
İşletme Yönetimi (3 yıllık)  4500$  İngilizce  Ticaret Hukuku  İngilizce  4000$
İşletme Yönetimi  4000$  İngilizce  Bankacılık  Gürcüce  1000$
Psikoloji  3000$  İngilizce  Klinik Psikoloji  Gürcüce  1200$
Uluslararası İlişkiler  1200$  Gürcüce  Sosyal Psikoloji  Gürcüce  1000$
Veri Bilimi ve Data Yapay Zeka  2150$  Gürcüce  Bilgi Teknolojiler  İngilizce  4000$
Gazetecilik ve İletişim  1200$  Gürcüce  Eğitim Yönetimi  İngilizce  4000$
Turizm  1200$  Gürcüce  İngiliz Filolojisi  İngilizce  4000$
Hukuk  1200$  Gürcüce  Güvenlik Çalışmaları  İngilizce  4000$',
  '{"country": "Gürcistan", "chunk": 3, "total_chunks": 4}'::jsonb,
  ARRAY['ulke','gurcistan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Gürcistan Yurtdışı Eğitim Bilgileri (Bölüm 4)',
  'AVRUPA ÜNİVERSİTESİ  ÜCRET  DİL
Tıp  5500$  İngilizce
Diş Hekimliği  4500$  İngilizce
Hemşirelik  3500$  Gürcüce
Eczacılık  4500$  Gürcüce
İşletme  3000$  Gürcüce
Pazarlama  3000$  Gürcüce
Muhasebe  3000$  Gürcüce
Denetim  3000$  Gürcüce
Yönetim  3000$  Gürcüce
İngiliz Dili ve edebiyatı  3000$  Gürcüce
Mimarlık ve tasarım  4000$  Gürcüce
GÜRCİSTAN TARIM ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  DİL  UCRET
Ziraat Mühendisliği  1200$  Gürcüce  Doğa Bilimleri  Gürcüce
Veterinerlik  1200$  Gürcüce  İnşaat Mühendisliği  Gürcüce
Aşcılık SERTIFİKASI (İNG)  Programın maliyeti 5.500 GEL''dir. Çalışmaların başlamasından önce - 2. aşamada 2.000 GEL - 3. aşamada 2.000 GEL - 1.500 GEL.  Veterinerlikte Entegre  Çalışmaları  Gürcüce
Pastacılık SERTIFİKASI(İNG)  Programın maliyeti 4.800 GEL''dir. Çalışmaların başlamasından önce - 2. aşamada 2.000 GEL - 3. aşamada 2.000 GEL - 800 GEL  Gıda Teknolojisi  Gürcüce
Restoran Yönetimi SERTIFİKASI(İNG)  Programın maliyeti 5.200 GEL''dir. Çalışmaların başlamasından önce - 2.200 GEL, Aralık - 2.000 GEL, Mart - 1.000 GEL.  Ormancılık İşi  Gürcüce
Biyoloji  1200$  Gürcüce  Tarım Bilimleri  Gürcüce
Gıda Teknolojileri  1200$  Gürcüce
Tarım Bilimleri  1200$  Gürcüce
Bağcılık ve Şarapcılık  1200$  Gürcüce
Elektrik ve Bilgisayar Mühendisliği  1200$  Gürcüce
Makine Mühendisliği  1200$  Gürcüce
İnşaat Mühendisliği  1200$  Gürcüce
Park ve Ormancılık  1200$  Gürcüce
Peyzaj  Yönetimi  1200$  Gürcüce
Otomasyon ve Kontrol Mühendisliği  1200$  Gürcüce
Liberal Sanatlar 3 Boyutlu  1200$  Gürcüce
BATUM DEVLET DENİZCİLİK AKADEMİSİ (Özel)  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS
Kaptanlık(Deniz Seyrüsefer)  5000$  İngilizce  Kayıt Masrafları ve Rehberlik 1000€  Deniz Ulaştırma Lojistiği ve Nakliye
Deniz Elektrik Mühendisliği  5000$  İngilizce  Evrak İşlemleri Onaya Hazırlanması 275$  Deniz Turizm İşletmeciliği
Deniz Mühendisliği  5000$  İngilizce  Bakanlık ve Okul Kayıt Harcı  Uluslararası Sularda İş Yönetimi
Limanlar ve Taşıma Terminalleri İşletmesi  5000$  İngilizce  Onayın ve İkamet bildirimi  Gemi Güç Elektrik Sistem Mühendisliği ve Tesisleri
Deniz İşletme Yönetimi  5000$  İngilizce  Bireysel Seyahat Giderleri  Liman Yönetimi
Deniz Ekonomi ve Ulaştırma Ekonomisi  5000$  İngilizce  Yurtdışı Çıkış Pulu 150 TL
Deniz Kurvaziyer Turizm İşletmeciliği  5000$  İngilizce  Konaklama Giderleri
Limanlar ve Taşıma Terminalleri İşletmesi  5000$  İngilizce  Seyahat Sigortası
Teminat 2000$
Yeme ve İçme (Market)
YarıTatilde*(YılSonu Vize Alınacak)
Vize 60$*Oturum İzni 120$
Taahütname vize oturum izni içindir İlkyıl İstenmez
Konsolosluklar
İstanbul*Ankara*İzmir*Trabzon
KONAKLAMA
Gunlük Otel 40$
Ev Kirası 300$*600$
İsim Soyad Değişikliği Belgesi
BATUM ÜNİVERSİTESİ  ÜCRET  DİL  HAZIRLIK EĞİTİMİ YOKTUR  EK GİDERLER  YÜKSEKLİSANS  DOKTORA
Tıp  5500$  İngilizce  6 Yıl  YAN DAL LİSANS  Klinik Psikoloji  Eğitim Bilimleri
Diş Hekimliği  5000$  Gürcüce  4 Yıl  Bilgisayar Bilimi  Hukuk  Fizik
Eczacılık  4500$  Gürcüce  4 Yıl  Matematik  Turizm İşletmeciliği
Fizik Tedavi  4500$  İngilizce  4 Yıl  Fizik  ilköğretim Öğretmenliği
Hukuk  1000$  Gürcüce  4 Yıl  Kayıt Masrafları ve Rehberlik 1000€
Kamu Yönetimi  1000$  Gürcüce  4 Yıl  Evrak İşlemleri Onaya Hazırlanması 275$
Uluslararası İlişkiler  1000$  Gürcüce  4 Yıl  Bakanlık ve Okul Kayıt Harcı
Avrupa Çalışmaları  1000$  Gürcüce  4 Yıl  Onayın ve İkamet bildirimi
Psikoloji  1000$  Gürcüce  4 Yıl  Bireysel Seyahat Giderleri
Turizm ve Otel  İşletmeciliği  1000$  Gürcüce  4 Yıl  Yurtdışı Çıkış Pulu 150 TL
Turizm  1000$  Gürcüce  4 Yıl  Konaklama Giderleri
Şarkiyat Doğu Araştırmaları  1000$  Gürcüce  4 Yıl  Seyahat Sigortası
Felsefe  1000$  Gürcüce  4 Yıl  Teminat 2000$
Tarih  1000$  Gürcüce  4 Yıl  Yeme ve İçme (Market)
Arkeoloji  1000$  Gürcüce  4 Yıl  YarıTatilde*(YılSonu Vize Alınacak)
Etnoloji  1000$  Gürcüce  4 Yıl  Vize 60$*Oturum İzni 120$
Kimya  1000$  Gürcüce  4 Yıl  Taahütname vize oturum izni içindir İlkyıl İstenmez
Biyoloji  1000$  Gürcüce  4 Yıl  Konsolosluklar
Coğrafya  1000$  Gürcüce  4 Yıl  İstanbul*Ankara*İzmir*Trabzon
Fizik  1000$  Gürcüce  4 Yıl  KONAKLAMA
Bilgisayar Bilimi  1000$  Gürcüce  4 Yıl  Gunlük Otel 40$
Matematik  1000$  Gürcüce  4 Yıl  Ev Kirası 300$*600$
Pedagoji  1000$  Gürcüce  4 Yıl  İsim Soyad Değişikliği Belgesi
Almanca*İngilizce*Fransızca*Rusça Dilleri  1000$  Gürcüce  4 Yıl
PETRE SHOTADZE TIFLİS TIP AKADEMİSİ
Tıp  6000$  İngilizce  6 Yıl',
  '{"country": "Gürcistan", "chunk": 4, "total_chunks": 4}'::jsonb,
  ARRAY['ulke','gurcistan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'İran Yurtdışı Eğitim Bilgileri',
  'İRAN ÜNİVERSİTELERİ  TAHRAN DANIŞMANLIK  1600 USD
TEBRİZ - ISFAHAN DANIŞMANLIK  1200 USD
ŞAVAŞTAN DOLAYI EYLÜL AYINA KADAR DERSLER ONLİNEDIR
DİPLOMA NOTU 80 VE ÜZERİ OLMALIDIR. YAŞ SINIRI 25TİR.
ÖĞRENCİYE VİZELİDİR. EVRAK VE VİZE İŞLEMLERİ İÇİN ÖĞRENCİ KONSOLOSLUĞA GİDER. (İSTANBUL, ANKARA, ERZURUM)
OKUL VE YURT ÖDEMESİNİ İKİ TAKSİTLE YAPABİLİR
YURT YILLIK 3550 $
TEBRİZ TIP ÜNİVERSİTESİ
BÖLÜMLERİ  EĞİTİM ÜCRETİ  EĞİTİM DİLİ  SIRALAMA KURULUŞLARI
TIP  3800 USD  İNGİLİZCE- FARSÇA  THE  501-600
DİŞ HEKİMLİĞİ  4200 USD  İNGİLİZCE- FARSÇA  CWTS 513
ECZACILIK  4200 USD  FARSÇA
HEMŞİRELİK  2500 USD  FARSÇA
DİŞ HEKİMLİĞİ  TEBRİZ KONTENJANI DOLMUŞTUR.
ISFAHANA YÖNLENDİREBİLİRSİNİZ
TEBRİZ ÜNİVERSİTESİ
BÖLÜMLERİ  EĞİTİM ÜCRETİ  EĞİTİM DİLİ  ŞU AN KAYIT ALMIYOR
HAYVAN BİLİMİ  750$  FARSÇA  GÖRÜŞÜRKEN MERKEZ OFİSE SORUN
GIDA BİLİMİ VE TEKNOLOJİSİ  750$  FARSÇA
ORMANCILIK  750$  FARSÇA
BİTKİ ÜRETİMİ MÜHENDİSLİĞİ  850$  FARSÇA
BEDEN EĞİTİMİ SPOR BİLİMİ  750$  FARSÇA
EKONOMİK KALKINMA VE PLANLAMA  750$  FARSÇA
EKONOMİ  750$  FARSÇA
YÖNETİM  750$  FARSÇA
ESKİ İRAN DİLLERİ VE KÜLTÜRÜ  750$  FARSÇA
İNGİLİZ DİLİ VE EDEBİYATI  750$  FARSÇA
FRANSIZ DİLİ VE EDEBİYATI  750$  FARSÇA
FELSEFE  750$  FARSÇA
FARS DİLİ VE EDEBİYATI  750$  FARSÇA
JEOMORFOLOJİ  750$  FARSÇA
COĞRAFYA VE ŞEHİR PLANLAMA  750$  FARSÇA
KLİMATOLOJİ  750$  FARSÇA
KIRSAL PLANLAMA  750$  FARSÇA
ALGILAMA VE COĞRAFİ BİLGİ SİSTEMLERİ (CBS)  750$  FARSÇA
MATEMATİK  750$  FARSÇA
UYGULAMALI MATEMATİK  750$  FARSÇA
İSTATİSTİK  750$  FARSÇA
BİLGİSAYAR BİLİMLERİ  750$  FARSÇA
ANALİTİK KİMYA  750$  FARSÇA
İNORGANİK KİMYA  750$  FARSÇA
UYGULAMALI KİMYA  750$  FARSÇA
ORGANİK VE BİYOKİMYA  750$  FARSÇA
FİZİKSEL KİMYA  750$  FARSÇA
TARIM EKONOMİSİ  750$  FARSÇA
HAYVAN BİLİMİ  750$  FARSÇA
BİYOSİSTEM MÜHENDİSLİĞİ  850$  FARSÇA
YAYILIM VE KIRSAL KALKINMA  750$  FARSÇA
GIDA BİLİMİ VE TEKNOLOJİSİ  750$  FARSÇA
BAHÇE BİLİMİ  750$  FARSÇA
PEYZAJ MİMARLIĞI  750$  FARSÇA
BİTKİ BİYOTEKNOLOJİSİ VE ISLAHI  750$  FARSÇA
BİTKİ EKOFİZYOLOJİSİ  750$  FARSÇA
BİTKİ KORUMA  750$  FARSÇA
TOPRAK BİLİMİ  750$  FARSÇA
SU MÜHENDİSLİĞİ  850$  FARSÇA
YER BİLİMLERİ  750$  FARSÇA
HAYVAN BİYOLOJİSİ  750$  FARSÇA
BİTKİ BİYOLOJİSİ  750$  FARSÇA
OPTİK VE LAZER FİZİĞİ  750$  FARSÇA
TEORİK VE ASTRONOMİK FİZİK  750$  FARSÇA
PLAZMA FİZİĞİ VE TEKNOLOJİSİ  750$  FARSÇA
YOĞUN MADDE FİZİĞİ  750$  FARSÇA
NÜKLEER FİZİK  750$  FARSÇA
İLETİŞİM MÜHENDİSLİĞİ  850$  FARSÇA
KONTROL MÜHENDİSLİĞİ  850$  FARSÇA
ELEKTRONİK MÜHENDİSLİĞİ  850$  FARSÇA
GÜÇ MÜHENDİSLİĞİ  850$  FARSÇA
BT MÜHENDİSLİĞİ  850$  FARSÇA
BİLGİSAYAR MÜHENDİSLİĞİ  850$  FARSÇA
BİYOMEDİKAL MÜHENDİSLİĞİ  850$  FARSÇA
İNŞAAT MÜHENDİSLİĞİ  850$  FARSÇA
YAPISAL MÜHENDİSLİK  850$  FARSÇA
ZEMİN VE TEMEL MÜHENDİSLİK  850$  FARSÇA
SU VE ÇEVRE MÜHENDİSLİĞİ  850$  FARSÇA
HARİTA VE GEOMATİK MÜHENDİSLİĞİ  850$  FARSÇA
MİMARİ  750$  FARSÇA
MAKİNE MÜHENDİSLİĞİ  850$  FARSÇA
ÜRETİM MÜHENDİSLİĞİ  850$  FARSÇA
MALZEME MÜHENDİSLİĞİ  850$  FARSÇA
ENDÜSTRİ MÜHENDİSLİĞİ  850$  FARSÇA
VETERİNER KLİNİK BİLİMLERİ  1625$  FARSÇA
TEMEL BİLİMLER  750$  FARSÇA
PATOLOJİ  750$  FARSÇA
GIDA HİJYENİ VE SU ÜRÜNLERİ  750$  FARSÇA
İNŞAAT MÜHENDİSLİĞİ  850$  FARSÇA
JEOMATİK MÜHENDİSLİĞİ  850$  FARSÇA
TEMEL BİLİMLER  750$  FARSÇA
PROSES MÜHENDİSLİĞİ  850$  FARSÇA
POLİMER MÜHENDİSLİĞİ  850$  FARSÇA
ÇEVRE MÜHENDİSLİĞİ  850$  FARSÇA
SOSYAL BİLİMLER  750$  FARSÇA
HUKUK  750$  FARSÇA
TARİH  750$  FARSÇA
SİYASET BİLİMLERİ  750$  FARSÇA
İLAHİYAT  750$  FARSÇA
ŞEHİT MEDENİZ ÜNİVERSİTESİ  Tebriz''dedir.
ÜCRETİ
Elektrik Mühendisliği  5000$  FARSÇA
İnşaat Mühendisliği  5000$  FARSÇA
Makine Mühendisliği  5000$  FARSÇA
Bilgisayar Mühendisliği  5000$  FARSÇA
Kimya Mühendisliği  5000$  FARSÇA
Endüstri Mühendisliği  5000$  FARSÇA
Malzeme Mühendisliği  5000$  FARSÇA
Petrol Mühendisliği  5000$  FARSÇA
Maden Mühendisliği  5000$  FARSÇA
Çevre Mühendisliği  5000$  FARSÇA
Fizik  5000$  FARSÇA
Kimya  5000$  FARSÇA
Matematik  5000$  FARSÇA
Biyoloji  5000$  FARSÇA
İstatistik  5000$  FARSÇA
Jeoloji  5000$  FARSÇA
Coğrafya  5000$  FARSÇA
Fars Dili ve Edebiyatı  5000$  FARSÇA
İngiliz Dili ve Edebiyatı  5000$  FARSÇA
Tarih  5000$  FARSÇA
Sosyoloji  5000$  FARSÇA
Psikoloji  5000$  FARSÇA
Eğitim Bilimleri  5000$  FARSÇA
İşletme  5000$  FARSÇA
Ekonomi  5000$  FARSÇA
Kamu Yönetimi  5000$  FARSÇA
Muhasebe  5000$  FARSÇA
Mimarlık  5000$  FARSÇA
Şehir ve Bölge Planlama  5000$  FARSÇA
Görsel Sanatlar  5000$  FARSÇA
TAHRAN TIP ÜNİVERSİTESİ
ÜCRETİ
Tıp (7 Yıl)  5000$  FARSÇA
Diş Hekimliği (6 Yıl)  5000$  FARSÇA
Eczacılık (5 Yıl)  5000$  FARSÇA
Hemşirelik  5000$  FARSÇA
Ebelik  5000$  FARSÇA
Beslenme Bilimi  5000$  FARSÇA
Sağlık Bilgi Teknolojisi  5000$  FARSÇA
Fizyoterapi  5000$  FARSÇA
Anestezi  5000$  FARSÇA
Tıbbi Laboratuvar Bilimleri  5000$  FARSÇA
İSFAHAN TIP ÜNİVERSİTESİ
ÜCRETİ  EĞİTİM DİLİ  BARINMA  YILLIK
Tıp  4300$  İNGİLİZCE- FARSÇA  5 kişilik yurtler  700 usd
Diş Hekimliği  4300$  İNGİLİZCE- FARSÇA  4 kişilik yurtlar  900 usd  CWTS 805  DİPLOMA NOTU 80 ÜSTÜ OLAN
Eczacılık  4300$  FARSÇA  3 kişilik yurtlar  1200 usd  TIMES 8001-1000  ÖĞRENCİLERE İLK YIL OKUL ÜCRETİNE BURS SİSTEMİ VARDIR.
2 kişilik yurtlar  1750 usd
tek kişilik yurtlar  3500 usd',
  '{"country": "İran", "chunk": 1, "total_chunks": 1}'::jsonb,
  ARRAY['ulke','iran','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Kuzey Makedonya Yurtdışı Eğitim Bilgileri',
  'MAKEDONYA ÜNİVERSİTELERİ
FAKÜLTE GİRİŞİNDE SINAV VARDIR DİL+BÖLÜM
KAYIT DANIŞMANLIK: 1500€  İKAMETGAH İZNİ 150-200€  VİZESİZ BİR ÜLKEDİR. EĞİTİM BAŞLADIKTAN SONRA ÖĞRENCİ OTURUMU ALIR.
DİPLOMA NOTU 75 VE ÜSTÜ  EVDE YA DA ÖZEL YURTTA KALINIYOR.  HAZIRLIK EĞİTİMİNE ARADÖNEMDE KAYIT ALINIR.
GOCE DELCEV ÜNİVERSİTESİ  ÜCRET  DİL
TIP  1500 \ 6000 €  MAKEDONCA\ İNGİLİZCE  İNGİLİZCE HAZIRLIK: 600€ (YILLIK)
DİŞ HEKİMLİĞİ  1500 \ 6000 €  MAKEDONCA\ İNGİLİZCE  MAKEDONCA HAZIRLIK: 800-1000€
ECZACILIK  1500 \ 6000 €  MAKEDONCA\ İNGİLİZCE  MAKEDONCA A1-A2:500€  B1-B2:400€  (DÖNEMLİK)
HEMŞİRELİK  1.500€  MAKEDONCA  4 AY: 2 AY A2 SEVİYESİ - 2 AY B1 SEVİYESİ
TIBBİ LABORATUVAR ASİSTANLIĞI  1.500€  MAKEDONCA
FİZYOTERAPİST  1.500€  MAKEDONCA
EBELİK  1.500€  MAKEDONCA
YÖNETİM VE PAZARLAMA  1.000€  MAKEDONCA
MUHASEBE VE DENETİM  1.000€  MAKEDONCA
FİNANS  1.000€  MAKEDONCA
İŞ EKONOMİSİ  1.000€  MAKEDONCA
İŞ İDARESİ  1.000€  MAKEDONCA
İŞ LOJİSTİĞİ  1.000€  MAKEDONCA
TRUZİM VE KONAKLAMAM  1.000€  MAKEDONCA
OTEL VE RESTORANT İŞLETMECİLİĞİ  1.000€  MAKEDONCA
TEKSTİL VE GİYİM TASARIM TEKNOLOJİSİ  1.000€  MAKEDONCA
GIDA MÜHENDİSLİĞİ  1.000€  MAKEDONCA
MALZEME TEKNOLOJİSİ  1.000€  MAKEDONCA
OTOMASYON VE SİSTEM MÜHENDİSLİĞİ  1.000€  MAKEDONCA
MEKATRONİK VE ROBOTİK  1.000€  MAKEDONCA
MEKATRONİK  1.000€  MAKEDONCA
MAKİNE  MÜHENDİSLİĞİNDE BİLGİ TEKNOLOJİSİ  1.000€  MAKEDONCA
MAKİNE MÜHENDİSLİĞİ  1.000€  MAKEDONCA
BİLGİSAYAR MÜHENDİSLİĞİ VE TEKNOLOJİSİ  2.000€  MAKEDONCA
BİLGİSAYAR BİLİMİ  1.000€  MAKEDONCA
MATEMATİK ÖĞRETMENLİĞİ  1.000€  MAKEDONCA
UYGULAMALI MATEMATİK  1.000€  MAKEDONCA
MÜZİK TEORİSİ ve PEDAGOJİ  1.000€  MAKEDONCA
PİYANO  1.000€  MAKEDONCA
CAZ BAS  1.000€  MAKEDONCA
CAZ GİTAR  1.000€  MAKEDONCA
CAZ SAKSAFON  1.000€  MAKEDONCA
ETNOKOROLOJİ  1.000€  MAKEDONCA
PERFORMANS MÜZİSYENİ-KEMAN  1.000€  MAKEDONCA
KLARNET  1.000€  MAKEDONCA
TROMPET  1.000€  MAKEDONCA
VURMANLI ÇALGILAR  1.000€  MAKEDONCA
GİTAR  1.000€  MAKEDONCA
JEOLOJİ  1.000€  MAKEDONCA
MADENCİLİK  1.000€  MAKEDONCA
ÇEVRE MÜHENDİSLİĞİ  1.000€  MAKEDONCA
ENDÜSTRİYEL LOJİSTİK  1.000€  MAKEDONCA
İÇ MEKAN VE MOBİLYA TASARIMI  1.000€  MAKEDONCA
BALE PEDAGOJİSİ  1.000€  MAKEDONCA
HEYKEL  1.000€  MAKEDONCA
KLASİK BOYAMAM  1.000€  MAKEDONCA
OKUL ÖNCESİ ÖĞRETMENLİĞİ  1.000€  MAKEDONCA
İLKOKUL ÖĞRETMENLİĞİ  1.000€  MAKEDONCA
PEDAGOJİ  1.000€  MAKEDONCA
ARKEOLOJİ VE TARİH  1.000€  MAKEDONCA
MAKEDON DİLİ VE EDEBİYATI  1.000€  MAKEDONCA
İNGİLİZ DİLİ VE EDEBİYATI  1.000€  MAKEDONCA
İTALYAN DİLİ VE EDEBİYATI  1.000€  MAKEDONCA
ALMAN DİLİ VE EDEBİYATI  1.000€  MAKEDONCA
TÜRK DİLİ VE EDEBİYATI  1.000€  MAKEDONCA
HUKUK  1.000€  MAKEDONCA
KRİL METHODİ ÜNİVERSİTESİ  HAZILIK 600 DÖNEMLİK
TIP  3000 \ 5000 €  MAKEDONCA\ İNGİLİZCE
DİŞ HEKİMLİĞİ  5.000€  MAKEDONCA\ İNGİLİZCE
ECZACILIK  3.000€  MAKEDONCA
HUKUK  2.000€  MAKEDONCA
PSİKOLOJİ  1500€-2000€  MAKEDONCA
ÖZEL EĞİTİM VE REHABİLİTASYON  2.000€  MAKEDONCA
İNŞAAT MÜHENDİSLİĞİ  2.000€  MAKEDONCA
JEODEZİ VE JEOİNFORMATİK MÜHENDİSLİĞİ  2.000€  MAKEDONCA
JEOTEKNİK MÜHENDİSLİĞİ  2.000€  MAKEDONCA
ELEKTRİK MÜHENDİSLİĞİ  2.000€  MAKEDONCA
ELEKTRİK GÜÇ SİSTEMLERİ  2.000€  MAKEDONCA
ELEKTRİK MÜHENDİSLİĞİ VE PROJE YÖNETİMİ  2.000€  MAKEDONCA
BİLGİSAYAR SİSTEMLERİ MÜHENDİSLİĞİ  2.000€  MAKEDONCA
BİLGİSAYAR TEKNOLOJİLERİ VE MÜHENDİSLİĞİ  2.000€  MAKEDONCA
BİLGİSAYAR DONANIM MÜHENDİSLİĞİ  2.000€  MAKEDONCA
TELEKOMÜNİKASYON VE BİLGİ MÜHENDİSLİĞİ  2.000€  MAKEDONCA
SİYASET BİLİMİ  2.000€  İNGİLİZCE
YAZILIM MÜHENDİSLİĞİ VE BİLGİ SİSTEMLERİ  2.000€  MAKEDONCA\ İNGİLİZCE
İNTERNET, AĞLAR VE GÜVENLİK  2.000€  MAKEDONCA
BİLGİ TEKNOLOJİLERİ UYGULAMASI  2.000€  MAKEDONCA
BİLGİ EĞİTİMİ  2.000€  MAKEDONCA
BİLGİSAYAR MÜHENDİSLİĞİ  2.000€  MAKEDONCA
BİLGİSAYAR BİLİMLERİ  2.000€  MAKEDONCA
PROFESYONEL PROGRAMLAMA ÇALIŞMALARI  2.000€  MAKEDONCA
ÜRETİM MÜHENDİSLİĞİ  2.000€  MAKEDONCA
TERMAL ENERJİ MÜHENDİSLİĞİ  2.000€  MAKEDONCA
HİDROLİK ENERJİ MÜHENDİSLİĞİ  2.000€  MAKEDONCA
ENDÜSTRİ MÜHENDİSLİĞİ VE YÖNETİMİ  2.000€  MAKEDONCA
ENDÜSTRİYEL TASARIM MÜHENDİSLİĞİ  2.000€  MAKEDONCA
METALURJİ DİJİTAL MÜHENDİSLİĞİ  2.500€  İNGİLİZCE
İNORGANİK MÜHENDİSLİK VE ÇEVRE KORUMA  2.000€  MAKEDONCA
GİYİM TASARIMI VE MÜHENDİSLİĞİ  2.500€  İNGİLİZCE
BİYOTEKNOLOJİ  2.000€  MAKEDONCA
MALZEME VE NANO TEKNOLOJİ MÜHENDİSLİĞİ  2.000€  MAKEDONCA
COĞRAFYA ÖĞRETMENLİĞİ  2.000€  MAKEDONCA
TURİZM  2.000€  MAKEDONCA
MATEMATİK ÖĞRETMENLİĞİ  1.500€  MAKEDONCA
FİZİK ÖĞRETMENLİĞİ  1.500€  MAKEDONCA
KİMYA ÖĞRETMENLİĞİ  1.500€  MAKEDONCA
EKONOMİ  1.500€  MAKEDONCA
ULUSLARARASI TİCARET  1.500€  MAKEDONCA
GAZETECİLİK  2.000€  MAKEDONCA
FELSEFE  1.000€  MAKEDONCA
SOSYOLOJİ  1.000€  MAKEDONCA
TARİH  1.000€  MAKEDONCA
SANAT TARİHİ  1.000€  MAKEDONCA
ARKEOLOJİ  1.000€  MAKEDONCA
KLASİK FİLOLOJİ  1.000€  MAKEDONCA
ÖZEL EĞİTİM VE REHABİLİTASYON  1.000€  MAKEDONCA
MAKEDON DİLİ VE EDEBİYATI  400€  MAKEDONCA
TÜRK DİLİ VE EDEBİYATI  400€  MAKEDONCA
FRANSIZCA TERCÜMANLIK  400€  MAKEDONCA
ROMEN DİLİ VE EDEBİYATI  400€  MAKEDONCA
RUSÇA (BAŞLANGIÇ SEVİYESİ)  400€  MAKEDONCA
LEHÇE (BAŞLANGIÇ SEVİYESİ)  400€  MAKEDONCA
SLOVENCE (BAŞLANGIÇ SEVİYESİ)  400€  MAKEDONCA
ALMAN DİLİ VE EDEBİYATI  400€  MAKEDONCA
İNGİLİZ DİLİ VE EDEBİYATI  400€  MAKEDONCA
ÇEVİRİ VE SÖZLÜ ÇEVİRİ (İNG/ALM/FRA)  400€  MAKEDONCA
İTALYAN DİLİ VE EDEBİYATI  400€  MAKEDONCA
iLKÖĞRETİM SINIF ÖĞRETMENLİĞİ  800€  MAKEDONCA
MAKEDONYA SINIF ÖĞRETMENLİĞİ  800€  MAKEDONCA
ARNAVUT SINIF ÖĞRETMENLİĞİ  800€  MAKEDONCA
TÜRKÇE SINIF ÖĞRETMENLİĞİ  800€  MAKEDONCA
OKUL ÖNCESİ EĞİTİM  800€  MAKEDONCA
KÜTÜPHANECİLİK  800€  MAKEDONCA
BEDEN VE SAĞLIK EĞİTİMİ  1.200€  MAKEDONCA
SPOR ANTRENÖRLÜĞÜ  1.200€  MAKEDONCA
HEMŞİRELİK  1.000€  MAKEDONCA
RADJOLOJİ TEKNİKER  1.000€  MAKEDONCA
KONUŞMA TERAPİSTİ  1.000€  MAKEDONCA
FİZYOTERAPİ  1.000€  MAKEDONCA
EBELİK  1.000€  MAKEDONCA
DİYET TERAPİSTİ VE DİYETETİK  2.000€  MAKEDONCA
PEYZAJ MİMARLIĞI  500€  MAKEDONCA
VETERİNERLİK  3000€/4000€  MAKEDONCA\ İNGİLİZCE
FİLM VE TV YÖNETMENLİĞİ  1.500€  MAKEDONCA
GÜZEL SANATLAR (HEYKEL/RESİM/GRAFİK)  1.500€  MAKEDONCA
MÜZİK SANATLARI FAKÜLTESİ  1.300€  MAKEDONCA',
  '{"country": "Kuzey Makedonya", "chunk": 1, "total_chunks": 1}'::jsonb,
  ARRAY['ulke','kuzey_makedonya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Moldova Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'MOLDOVA ÜNİVERSİTELERİ  ÜNİVERSİTE ÜCRETLERİ YILLIK HESAPLANMIŞTIR LEİ OLARAK OKULLARA ÖDEME YAPILIR
MOLDOVA USEM  HUKUK AKADEMİSİ  Hukuk  1.300 €  Romence*Rusça  4 Yıl*ULİM ÜNİVERSİTESİNE BAĞLIDIR  Kayıt Masrafları ve Rehberlik 1000€
KOMRAD DEVLET ÜNİVERSİTESİ  LİSANS YILLIK  DİL HAZIRLIK 800$  YIL  EK GİDERLER  YUKSEKLİSANS
İngilizce Öğretmenliği  ÖSYM ile Kazanan  850$  Romence  3 Yıl  Kayıt Masrafları ve Rehberlik 1000€  Ceza Hukuku  1550$
Rus Dili ve Edebiyatı ÖSYM ile Kazanan  850$  Romence  3 Yıl  Evrak İşlemleri Onaya Hazırlanması  Sivil Hukuk  1550$
İşletme Yönetimi  1250$  Romence  3 Yıl  Bakanlık ve Okul Kayıt Harcı  İş Birliği Hukuku  1550$
Turizm ve Konaklama ve Eğlence Yönetimi  1250$  Romence  3 Yıl  Onayın ve İkamet bildirimi  Yerel Kamu Yönetimi  2000$
Finans ve Bankacılık  1250$  Romence  3 Yıl  Bireysel Seyahat Giderleri  Eğitimde Yönetim  1550$
Muhasebe  1250$  Romence  3 Yıl  Konaklam Giderleri  Müzik Eğitimi  1550$
Bilişim  1250$  Romence  3 Yıl  Seyahat Sigortası  İlkokul Öğretmenliği  1550$
Bilgisayar Bilimi ve Matematik  1250$  Romence  3 Yıl  Yeme ve İçme (Market)  Endüstrilerde Muhasebe ve Denetim  2000$
Okul Öncesi Öğretmenliği  1250$  Romence  3 Yıl  Vize 90€*Oturum İzni 100€  Kurumsal Finansman  2000$
İlkokul  Sınıf Öğretmenliği  1250$  Romence  3 Yıl  2500€ Bankada Gösterilir  İş İdaresi  2000$
Türk Dili ve Edebiyatı  1250$  Romence  3 Yıl  Konsolosluklar  Tarım Üretim Yönetimi  1550$
Tarih  1250$  Romence  4 Yıl  İstanbul Bursa Antalya*Ankara  Avrupa Komşuluk Siyaseti Hukuki Yönleri  2000$
Coğrafya  1250$  Romence  3 Yıl  EĞİTİMLER  Rus Dili ve Edebiyatı  1550$
Yabancı Diller (İngilizce*Almanca)  1250$  Romence  3 Yıl  3+2* 4+1  Şeklindendir
Gazetecilik ve Medya  1250$  Romence  3 Yıl  1 ve 2 Yükseklisanslardır.
Müzik  1250$  Romence  3 Yıl  KONAKLAMA
Bahçe Bitkileri  1250$  Romence  4 Yıl  YURT
Gıda Teknolojisi  1250$  Romence  4 Yıl  10$*20$
Tarım Ürünlerinin Üretimi ve İşlenmesi Mühendisliği ve Yönetimi  1250$  Romence  4 Yıl  Ev 100*200$
Hukuk  1250$  Romence  3 Yıl  İsim Soyad Değişikliği Belgesi
Kamu Yönetimi  1250$  Romence  3 Yıl
MOLDOVA DEVLET ÜNİVERSİTESİ  LİSANS YILLIK  DİL  YIL  EK GİDERLER  YUKSEKLİSANS 2 Yıl  ÜCRET  DOKTORA 3 Yıl  ÜCRET
Arkeoloji  1.000 €  Romence  Kayıt Masrafları ve Rehberlik 1000€  Kültürel Miras  1.200 €  Psikoloji  ve Eğitim Bilimleri  1.600 €
Antropoloji  1.000 €  Romence  Evrak İşlemleri Onaya Hazırlanması  Dinler Tarihi ve Kültürü  1.200 €  Genel Psikoloji  1.600 €
Felsefe  1.000 €  Romence  Bakanlık ve Okul Kayıt Harcı  Çağdaş Filozoflar  1.200 €  Sosyal Bilimler  1.600 €
Tarih  1.000 €  Romence  Onayın ve İkamet bildirimi  Bilgi Teknolojileri  1.200 €  Matematik Bilişim Bilimleri  1.600 €
Fizik *Fizik Öğretmenliği  1.000 €  Romence  Bireysel Seyahat Giderleri  Çevre Mühendisliği Ölçüm Prosedürleri  1.200 €  Edebiyat  1.600 €
Mühendislik ve Kalite Yönetimi  1.000 €  Romence  Konaklam Giderleri  Fizik  1.200 €  Dil Bilimi  1.600 €
Bilgi Teknolojisi  1.000 €  Romence  Seyahat Sigortası  Medya Tanıtım ve Video prodüksiyon  1.200 €
Gazetecilik  1.000 €  Romence  Yeme ve İçme (Market)  Ceza Hukuku  1.200 €
İletişim ve Halkla İlişkiler  1.000 €  Romence  Vize 90€*Oturum İzni 100€  Sivil Yargı Hukuku  1.200 €
Multi Medya  1.000 €  Romence  2500€ Bankada Gösterilir  Cezai ve Kriminalist İşlemler  1.200 €
Hukuk  1.000 €  Romence  Konsolosluklar  Uluslararası Hukuk  1.200 €
Kimya* Kimya Öğretmenliği  1.000 €  Romence  İstanbul Bursa Antalya*Ankara  Kozmetik ilaç ve Çevre Endüstriyel Modern Teknolojiler  1.200 €
Biyofarmasötik Kimya  1.000 €  Romence  EĞİTİMLER  Biyofarmasötik Kimya Malzemeleri  1.200 €
Endüstriyel Kimyasal Teknoloji  1.000 €  Romence  3+2* 4+1  Şeklindendir  Biyolojik Bilimler  1.200 €
Kozmetik ve Tıbbi Ürün Teknolojileri  1.000 €  Romence  1 ve 2 Yükseklisanslardır.  Çevre Yönetimi  1.200 €
Biyoloji Öğretmenliği  1.000 €  Romence  KONAKLAMA  Peyzaj Tasarımı ve Yeşil Alanlar  1.200 €
Biyoloji ve Coğrafya Eğitim Bilimleri  1.000 €  Romence  YURT  Moleküler Biyoloji  1.200 €
Ormancılık  ve Halk Bahceliği  1.000 €  Romence  70€*85*90*100€  Diplomatik Çalışmalar  1.200 €
Peyzaj Miarlığı  ve Çevre Düzenlenmesi  1.000 €  Romence  Ev 100*300€  Avrupa Çalışmaları  1.200 €
Ekoloji  1.000 €  Romence  İsim Soyad Değişikliği Belgesi  Kamu Politikaları ve Hizmetleri  1.200 €
Coğrafya  1.000 €  Romence  Kamu Yönetimi  1.200 €
Moleküler Biyoloji  1.000 €  Romence  Uluslararası İlişkiler  1.200 €
Biyoloji  1.000 €  Romence  Ulusal Güvenlik Çalışmaları  1.200 €
Uluslararası İlişkiler  1.000 €  Romence  Siyasi ve Secim Yönetimi  1.200 €
Siyasal Bilimler  1.000 €  Romence  Adli Psikoloji  1.200 €
Kamu Yönetimi  1.000 €  Romence  Eğiitim Yönetimi  1.200 €
Psikoloji  1.000 €  Romence  Sosyal Hizmetlerin Yönetimi  1.200 €
Eğitim Bilimleri  1.000 €  Romence  Aile Sorunları Danışmalığı  1.200 €
Sosyoloji  1.000 €  Romence  Klinik Psikoloji  1.200 €
Sosyal Hizmetler  1.000 €  Romence  Oyun Tasarımı  1.200 €
İlkögretim İngilizce Öğretmenliği  1.000 €  Romence  Bilgisayar Bilimleri Öğretmenliği  1.200 €
İlköğretim Psikopedagojisi  1.000 €  Romence  Uygulamalı Bilişim  1.200 €
Psikopedagoji  1.000 €  Romence  Bilişim  1.200 €
Tercumanlık (Fransızca*İngilizce)  1.000 €  Fransızca  Kültürlerarası Yönetim  1.200 €
Çeviri ve Yorumlama(İngilizceden Francızca*Alamnaca*İtalyanca)  1.000 €  İngilizce  Kültürlerarası Örgütsel İletişim  1.200 €
Fransızca*İngilizce*Almanca*İspanyolca*Rusça*Romence)  1.000 €  İngilizce  Konferans Tercumanı (Fransızca*İngilizce)  1.200 €
Nicolae Testemiţanu Devlet Tıp ve Eczacılık Üniversitesi  LİSANS YILLIK  DİL 2000€* 2300€  YIL  EK GİDERLER  UZMANLIK*DOKTORA  ÜCRET  DİL
Tıp  5.600 €  İngilizce*Fransızca*Rusça*Romence  6 Yıl  Kayıt Masrafları ve Rehberlik 1000€  Tıp  6.700 €  Romence
Diş Hekimliği  6.500 €  İngilizce*Rusça*Romence  5 Yıl  Evrak İşlemleri Onaya Hazırlanması  Diş Hekimliği  7.400 €  Romence',
  '{"country": "Moldova", "chunk": 1, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','moldova','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Moldova Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'Eczacılık  4.000 €  İngilizce*Fransızca*Rusça*Romence  5 Yıl  Bakanlık ve Okul Kayıt Harcı  YARI ZAMANLI UZMANLIKLAR  7.000 €  Romence
Optometri  5.000 €  İngilizce*Romence  3Yıl  Onay mülakat ile  Vize 90€*(Vizeci 160€)Oturum İzni 170€
Hemşirelik  3.000 €  Romence
Halk Sağlığı  3.000 €  İngilizce*Romence  4 Yıl  Bireysel Seyahat Giderleri  Türkiye''de1500*2500€ Bankada Gösterilir
Tıbbı Yardım*ATT  5.000 €  İngilizce*Romence  4 Yıl  Konaklama Giderleri* İkamet bildirimi  Konsolosluklar İst*Ank*Bursa*Ant
Fizik Tedavi ve Rehabilitasyon  4.000 €  Romence  4 Yıl  Seyahat Sigortası  YURT 80€*90€*100€
Radyoloji Teknolojileri  3.000 €  Romence  4 Yıl  Moldovada Teminat 1500€  Ev 100*300€
ION CREANGA  PEDAGOJİ ÜNİVERSİTESİ  LİSANS YILLIK  DİL HAZIRLIK 1200€  YIL  EK GİDERLER  YUKSEKLİSANS 1500€* 2 Yıl  DOKTORA  3100€
Animasyon  1300€*700€  Romence  4 Yıl  Kayıt Masrafları ve Rehberlik 1000€  Plastik Sanatları ve Tasarım  Eğitim Bilimleri
Dekoratif Sanatlar  1300€*700€  Romence  4 Yıl  Evrak İşlemleri Onaya Hazırlanması  Psikoloji  Tarih Bilimleri
Web Tasarımında İleri Çalışmalar  1300€*700€  Romence  4 Yıl  Bakanlık ve Okul Kayıt Harcı  Özel Psikopedagoji  Küresel Miras
İç Tasarım (İç Dizayn)  1300€*700€  Romence  4 Yıl  Onayın ve İkamet bildirimi  Eğitim Bilimleri  Psikoloji
Teknolojik Eğitim  1300€*700€  Romence  4 Yıl  Bireysel Seyahat Giderleri  Bilgi Teknolojileri  Uzman Psikolog
Oyun Tasarımı  1300€*700€  Romence  4 Yıl  Konaklam Giderleri  Fizik
Grafik  1300€*700€  Romence  4 Yıl  Seyahat Sigortası  Matematik
Moda *Giyim Tasarımı  1300€*700€  Romence  4 Yıl  Yeme ve İçme (Market)  Biyolojik Bilimler
Resim8Boyama  1300€*700€  Romence  4 Yıl  Vize 90€*Oturum İzni 100€  Kimya
Mütercim Tercumanlık(İngilizce)  1300€*700€  Romence  4 Yıl  2500€ Bankada Gösterilir  Coğrafya
Psikoloji  1300€*700€  Romence  4 Yıl  Konsolosluklar  Edebiyat
Özel Psikopedagoji  1300€*700€  Romence  4 Yıl  İstanbul Bursa Antalya*Ankara  Diller
Psikopedagoji  1300€*700€  Romence  4 Yıl  YARI ZAMANLI 700€ Belirtilmiştir.  Dil Konuşma Terapisti Odyoloji
Sosyal Hizmetler  1300€*700€  Romence  4 Yıl  EĞİTİMLER  PDR
Bilgisayar Öğretmenliği  1300€*700€  Romence  4 Yıl  3+2* 4+1  Şeklindendir  Bütünleşik Özel Eğitim
Klasik Halk Dansları  1300€*700€  Romence  4 Yıl  1 ve 2 Yükseklisanslardır.  Nüfüs Sağlığı  Hizmetleri
Spor ve Modern Dans  1300€*700€  Romence  4 Yıl  KONAKLAMA  Aile ve Çoçuk Sosyal Politikalar
Bilişim Öğretmenliği  1300€*700€  Romence  4 Yıl  YURT  Turizm İstatistik Yönetimi
Bilgisayar Bilimleri  1300€*700€  Romence  4 Yıl  70€*85*90*100€  Coğrafya Cevre Teknoloji
Matematik  1300€*700€  Romence  4 Yıl  Ev 100*300€  İngilizce*Fansızca
İlköğretim Pedagojisi ve İngilizce Dili  1300€*700€  Romence  4 Yıl  İsim Soyad Değişikliği Belgesi  Tercumanlık İngilizce
Fransızca Bilgisayar Bilimi  1300€*700€  Romence  4 Yıl  Alman İşletişim Statejileri
İlköğretim Pedagojisi  1300€*700€  Romence  4 Yıl  Grafik Tasarım
Okul Öncesi Pedagojisi  1300€*700€  Romence  4 Yıl  Güzel Sanatlar Yönetimi
Tarih  1300€*700€  Romence  4 Yıl  Resim Boyama
Coğrafya  1300€*700€  Romence  4 Yıl  Güzel Sanatlarda İç Tasarm
Yurttaşlık  1300€*700€  Romence  4 Yıl  Malzemelerin Sanatsal İşlenmesi
İngiliz Dili ve Edebiyatı  1300€*700€  Yabancı Dil Secilir  4 Yıl  Güzel Sanatlar Öğretmenliği
Rusça Dili ve Edebiyatı  1300€*700€  Yabancı Dil Secilir  4 Yıl  Etnoloji
Fransızca Dili ve Edebiyatı  1300€*700€  Yabancı Dil Secilir  4 Yıl  El Sanatları
İtalyan Dili ve Edebiyatı  1300€*700€  Yabancı Dil Secilir  4 Yıl
İngiliz Dili  1300€*700€  Yabancı Dil Secilir  4 Yıl
İngilizce ve Fransızca  1300€*700€  Yabancı Dil Secilir  4 Yıl
İngilizce ve İtalyanca  1300€*700€  Yabancı Dil Secilir  4 Yıl
İngilizce ve İspanyolca  1300€*700€  Yabancı Dil Secilir  4 Yıl
Fransızca ve İngilizce  1300€*700€  Yabancı Dil Secilir  4 Yıl
Fransızca ve İtalyanca  1300€*700€  Yabancı Dil Secilir  4 Yıl
Almanca ve İngilizce  1300€*700€  Yabancı Dil Secilir  4 Yıl
MOLDOVA TEKNİK ÜNİVERSİTESİ  LİSANS YILLIK  DİL HAZIRLIK  2300€  EK GİDERLER  YUKSEK LİSANS 1800€ 1*2 YIL
Yazılım Mühendisliği  2.100 €  İngilizce  4 YIL  Kayıt Masrafları ve Rehberlik 1000€  Tasarım(Ürün Tasarımı Geliştirme * )
Veterinerlik  1920€*1720€*1500€  İngilizce*Romence*Yarı zamanlı Romence  5 YIL  Evrak İşlemleri Onaya Hazırlanması  Tekstil Mühendisliği
Telekomünikasyon Teknolojileri ve Sistemleri  2.100 €  Romence  4 Yıl  Bakanlık ve Okul Kayıt Harcı  Moda ve Tekstil Tasarımı
Telekomünikasyon Ağları ve Yazılımları  2.100 €  Romence  4 Yıl  Onayın ve İkamet bildirimi  Basım Tasarımı Teknolojileri
Elektronik Telekomünikasyon Sistemleri Güvenliği  2.100 €  Romence  4 Yıl  Bireysel Seyahat Giderleri  Binalar
Telekomünikasyon Mühendislik ve Yönetimi  2.100 €  Romence  4 Yıl  Konaklam Giderleri  İç Mimarlık Dizayn
Radyo ve Televizyon İşletişimi  2.100 €  Romence  4 Yıl  Seyahat Sigortası  Biyoteknoloji
Elektrik Mühendisliği ve Yönetimi  2.100 €  Romence  4 Yıl  Yeme ve İçme (Market)  Tarım Üretim Yönetimi
TermoEnerji  2.100 €  Romence  4 Yıl  Vize 90€*Oturum İzni 100€  Hayvancılık
Elektrik Güç Mühendisliği  2.100 €  Romence  4 Yıl  2500€ Bankada Gösterilir  Arıcılık
ElektroMekanik Sistem Mühendisliği  2.100 €  Romence  4 Yıl  Konsolosluklar  Ormancılık ve Cevre Koruma
Mühendislik ve Kalite Yönetimi  2.100 €  Romence  4 Yıl  İstanbul Bursa Antalya*Ankara  Bahçe Bilimleri
Yenilenebilir Enerji Sistemleri Mühendisliği  2.100 €  Romence  4 Yıl  EĞİTİMLER  İnşaat Yönetimi
Tarım Elektrifikasyonu  2.100 €  Romence  4 Yıl  3+2* 4+1  Şeklindendir  Mülk degerlendirme ve Yönetimi
Otomasyon ve BT Bilişim Mühendisliği  2.100 €  Romence  4 Yıl  1 ve 2 Yükseklisanslardır.  Gayrimenkulve Kadastro hukuku
MikroElektronik ve NanoTeknolojiler  2.100 €  Romence  4 Yıl  KONAKLAMA  Yapı Mühendisliği
Uygulamalı Elektronik  2.100 €  Romence  4 Yıl  YURT  Yangın Mühendisliği
Bilgisayarlar ve Ağlar  2.100 €  Romence  4 Yıl  70€*85*90*100€  Tarım Mühendisliği
Bilgi Teknolojisi  2.100 €  Romence  4 Yıl  Ev 100*300€  Ulaştırma  Lojistik',
  '{"country": "Moldova", "chunk": 2, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','moldova','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Moldova Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'Uygulamalı Bilişim  2.100 €  Romence  4 Yıl  İsim Soyad Değişikliği Belgesi  Makine Mühendisliği Ürün ve süreç
BiyoMedikal Mühendisliği  2.100 €  Romence  4 Yıl  Havaalanı Yönetimi
Bilgi Yönetimi  2.100 €  Romence  4 Yıl  Yenilenebilir enerji
Bilgi Güvenliği* Bilgisayar ve Ağlar  2.100 €  Romence  4 Yıl  Yazılım Mühendisliği
Mekatronik ve Robotik Mühendisliği  2.100 €  Romence  4 Yıl  Biyomedikal Mühendisliği
Mimarlık  2.100 €  Romence  4 Yıl  Mikroelektronik Nanoteknoloji
MikroElektronik  2.100 €  Romence  4 Yıl  Bilgi Güvenliği
Matematik  2.100 €  Romence  4 Yıl  Bilgisayar* Yeni Teknoloji
Bilişim  2.100 €  Romence  4 Yıl  Elektrik Mühendisliği
İç Mimarlık Tasarımı  2.100 €  Romence  4 Yıl  Elektro Enerji
Kamu ve Gıda Teknolojisi Yönetimi  2.100 €  Romence  4 Yıl  Elektrik Mühendisliği Kallite Yönetimi
Gıda Teknolojisi  2.100 €  Romence  4 Yıl  ElektroTeknolojiler
Et ve Et Ürünleri Teknolojisi  2.100 €  Romence  4 Yıl  Telekomünikasyon
Fırın Teknolojisi  2.100 €  Romence  4 Yıl  İşletişim Sistemleri ve Ağlarında Bilgi Güvenliği
Süt ve Süt Ürünleri Teknolojisi  2.100 €  Romence  4 Yıl  Restoran İşletmeciliği
Meyve ve Sebzeleri Koroma ve İşleme Teknolojisi  2.100 €  Romence  4 Yıl  Gıda Ürünleri kalite ve Güvenliği
Şarap Teknolojisi ve Fermantasyon Ürünleri  2.100 €  Romence  4 Yıl  Şarapcılık Şarap Turizmi ve Pazarlaması
BiyoTeknoloji  2.100 €  Romence  4 Yıl  Gayrimenkul Ticaretinin Ekonomisi
Gıda Endüstrisinde Mühendislik ve Yönetimi  2.100 €  Romence  4 Yıl  Endüstriyel Pazarlama
Kamu Beslenme Hizmetleri  2.100 €  Romence  4 Yıl
Otel Hizmetleri Turizm ve Eğlence Sektörü Yönetimi  2.100 €  Romence  4 Yıl
Heykel  2.100 €  Romence  4 Yıl
Şehir ve Bölge Planlama  2.100 €  Romence  4 Yıl
Dekoratif Sanatlar  2.100 €  Romence  4 Yıl
İnşaat Malzemeleri ve Ürünleri Mühendisliği  2.100 €  Romence  4 Yıl
Demir Yolları ve Köprüler ve Yol Yapımı  2.100 €  Romence  4 Yıl
Peyzaj Mimarlığı  2.100 €  Romence  4 Yıl
Çevre Mühendisliği  2.100 €  Romence  4 Yıl
Binalar İçin Termik Gaz ve İklimlendirme Sistemlerinin Mühendisliği  2.100 €  Romence  4 Yıl
Su Temini Kanalizasyon  2.100 €  Romence  4 Yıl
İnşaat Mühendisliği ve Yönetimi  2.100 €  Romence  4 Yıl
Maden Mühendisliği  2.100 €  Romence  4 Yıl
Yangın Mühendisliği ve Sivil Koruma Mühendisliği  2.100 €  Romence  4 Yıl
Emlak Hukuku  2.100 €  Romence  4 Yıl
Jeodezi ve Kadastro Mühendisliği  2.100 €  Romence  4 Yıl
Kadastro ve Bölgesel Organizasyon Planlaması  2.100 €  Romence  4 Yıl
Sanayi ve Sivil İnşaatlar  2.100 €  Romence  4 Yıl
Tekstil Teknolojisi ve Tasarımı  2.100 €  Romence  4 Yıl
Ayakkabı ve Eşya Teknolojisi ve Deri Tasarımı  2.100 €  Romence  4 Yıl
Endüstriyel Giyim Tasarımı  2.100 €  Romence  4 Yıl
Tasarım ve Baskı Teknolojileri  2.100 €  Romence  4 Yıl
Tekstil Mihendisliği ve Yönetimi  2.100 €  Romence  4 Yıl
Endüstriyel Tasarım  2.100 €  Romence  4 Yıl
Ürün Tasarım Mühendisliği  2.100 €  Romence  4 Yıl
Oyun Tasarımı  2.100 €  Romence  4 Yıl
Gıda Ürünlerinin Güvenliği  2.100 €  Romence  4 Yıl
Tarımsal BiyoTeknolojiler  2.100 €  Romence  4 Yıl
Hayvancılık  2.100 €  Romence  4 Yıl
Tarımsal Ürünlerin Secimi ve Genetiği  2.100 €  Romence  4 Yıl
Tarla Bitkileri (Agronomi)  2.100 €  Romence  4 Yıl
Ekoloji  2.100 €  Romence  4 Yıl
Bitki Koruma  2.100 €  Romence  4 Yıl
Ormancılık  ve Halk Bahceliği  2.100 €  Romence  4 Yıl
Bağcılık ve Şarapcılık  2.100 €  Romence  4 Yıl
Bahce Bitkileri  2.100 €  Romence  4 Yıl
Makine Yapım Teknolojisi  2.100 €  Romence  4 Yıl
Kaynak Mühendisliği  2.100 €  Romence  4 Yıl
Makine ve Üretim Sistemleri  2.100 €  Romence  4 Yıl
Tarım ve Alet Makinelerinin İnşaası  2.100 €  Romence  4 Yıl
Enerji Dönüşüm Sistemleri Yenileyici Mühendisliği  2.100 €  Romence  4 Yıl
Secenekli Makine Mühendisliği  Gıda* Hafif Sanayi*Ürün Paketleme  2.100 €  Romence  4 Yıl
Ulaştırma Mühendisliği ve Yönetimi  2.100 €  Romence  4 Yıl
Karayolu Mühendisliği  2.100 €  Romence  4 Yıl
Ziraat Mühendisliği  2.100 €  Romence  4 Yıl
MOLDOVA EKONOMİ ÜNİVERSİTESİ  LİSANS YILLIK  DİL HAZIRLIK 2000€  YIL  EK GİDERLER  YUKSEK LİSANS
İşletme ve Yönetimi ve Uygulamalı Bilişim Cift Diploma  1820€*1720€  Romence  4 Yıl  Kayıt Masrafları ve Rehberlik 1000€  Muhasebe ve Denetim  2320€*1820€  Rusça*Romence
İşletme ve Yönetimi  2000€*1720€  Romence  3 Yıl  Evrak İşlemleri Onaya Hazırlanması  Kamu Yönetimi Yönetimi  2320€*1820€  Romence
Pazarlama  ve Lojistik  2000€*1720€  Romence  3 Yıl  Bakanlık ve Okul Kayıt Harcı  İşletme  2320€*1820€  Rusça*Romence
Satın Alma Müdürü  1820€*1720€  Romence  3 Yıl  Onayın ve İkamet bildirimi  Reklamcılık ve Halkla İlişkiler  2320€*  Rusça*Romence
Otel Hizmleri  1820€*1720€  Romence  3 Yıl  Bireysel Seyahat Giderleri  Mali Bankacılık Yönetimi  2320€*  İngilizce
Turizm ve Eğlence  1820€*1720€  Romence  3 Yıl  Konaklam Giderleri  Uluslararası İşlemler ve Ekonomik Diplomasi  2320€*  İngilizce*Romence
Merkeoloji ve Ticaret  1820€*1720€  Romence  3 Yıl  Seyahat Sigortası  Pazarlama Yönetimi  2320€*  Rusça*Romence
Gıda Teknolojisi ve Yönetimi  1820€*1720€  Romence  4 Yıl  Yeme ve İçme (Market)  Gıda ve Tarım Turizmi Yönetimi  2320€*  Romence
Ekonomi  1820€*1720€  Romence  3 Yıl  Vize 90€*Oturum İzni 100€  Hukuk ve Gümrük İşleri  2320€*  Romence
Hukuk  1820€*1720€  Romence  4 Yıl  2500€ Bankada Gösterilir  Bilgi Yönetimi  2320€*  Romence
Kamu Yönetimi  1820€*1720€  Romence  3 Yıl  Konsolosluklar  Bilgi Sistemleri Güvenliği  2320€*  Romence
Sosyal Hizmetler  1820€*1720€  Romence  3 Yıl  İstanbul Bursa Antalya*Ankara  Ekonomide Bilgi Teknolojileri  2320€*  Romence
İnsan Kaynakları Yönetimi  1820€*1720€  Romence  3 Yıl  YARI ZAMANLI 700€ Belirtilmiştir.  Ekonomi Hukuku  2320€*  Romence
Muhasebe  2000€*1720€  Romence  3 Yıl  EĞİTİMLER  Gümrük Hukuku Usulleri  2320€*  Romence
Finans ve Bankacılık  2000€*1720€  Romence  3 Yıl  3+2* 4+1  Şeklindendir  Mali ve Mali Hukuk  2320€*  Romence
Dünya Ekonomisi ve Uluslararası Ekonomik İlişkiler  2000€*1720€  Romence  4 Yıl  1 ve 2 Yükseklisanslardır.  İş Kanunu  2320€*  Romence',
  '{"country": "Moldova", "chunk": 3, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','moldova','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Moldova Yurtdışı Eğitim Bilgileri (Bölüm 4)',
  'Bilgi Teknolojisi  1820€*1720€  Romence  4 Yıl  KONAKLAMA  Gümruk Faaliyetlerinde Ticaret ve Eşya Uzmanlığı  2320€*  Romence
Bilgi Güvenliği  1820€*1720€  Romence  4 Yıl  YURT  İnsan Kaynaklarının Yönetimi ve Geliştirme  2320€*  Romence
Sibernetik ve Ekonomi  1820€*1720€  Romence  3 Yıl  70€*85*90*100€  Dijital İşletme Yönetimi  2320€*  Romence
Uygulamalı Bilişim  1820€*1720€  Romence  3 Yıl  Ev 100*300€  Proje Yönetimi  2320€*  Romence
Ekonometri ve Ekonomik İstatistikler  1820€*1720€  Romence  3 Yıl  Engelliler Ucretsiz Okuyor  Finans ve Bilgi Teknolojileri  2320€*  Romence
Engelliler Yurt Vergisi Ödemiyor  Aktüerya ve iş Riski  2320€*  Romence
İsim Soyad Değişikliği Belgesi  Bankacılık Yönetimi  2320€*  Romence
Kurumsal Finansman  ve Sigorta  2320€*  Romence
Kamu maliyesi ve Vergilendirme  2320€*  Romence
Dış Ticaret Gümrük Faaliyetleri  2320€*  Romence
Muhasebe ve Elekronik İşlemleri  2320€*  Romence
MOLDOVA SPOR AKADEMİSİ  LİSANS YILLIK  DİLPEDAGOJİ ÜNİVERSİTESİ  YIL  EK GİDERLER  EK GİDERLERİN DEVAMI  YUKSEKLİSANS 2 Yıl 2400€  DOKTORA 3 Yıl 2400€
Beden Eğitimi  2.300 €  Rusça*Romence  3 Yıl  Kayıt Masrafları ve Rehberlik 1000€  Konsolosluklar  Fiziksel  Kültür  Kineziterapi
Otel Hizmetleri  2.300 €  Rusça*Romence  3 Yıl  Evrak İşlemleri Onaya Hazırlanması  İstanbul Bursa Antalya*Ankara  Beden Eğitimi ve Öğretmenliği  Spor Bilimleri
Turizm ve Eğlence  2.300 €  Rusça*Romence  3 Yıl  Bakanlık ve Okul Kayıt Harcı  EĞİTİMLER  Turizmde Teknolojileri ve Spor Tesisleri Yönetimi  Fiziksel Eğitim
Fitness  2.300 €  Rusça*Romence  3 Yıl  Onayın ve İkamet bildirimi  3+2* 4+1  Şeklindendir  Spor Eğitimi Teknolojisi  Spor Travmatolojisinde Fizyoterapi
Rekreasyon Proğramları  2.300 €  Rusça*Romence  3 Yıl  Bireysel Seyahat Giderleri  1 ve 2 Yükseklisanslardır.  Spor Eğitimi Yönetimi ve Pazarlanması
Spor Eğitimi  2.300 €  Rusça*Romence  4 Yıl  Konaklam Giderleri  KONAKLAMA  Motor ve Somato*Fonksiyonel İyileşmede Fizyoterapi
Fizyoterapi ve Mesleki Terapi  2.300 €  Rusça*Romence  4 Yıl  Seyahat Sigortası  YURT  Kişisel ve Mülkiyet Güvenliği Yönetimi
Sivil ve Kamu Güvenliği  2.300 €  Rusça*Romence  3 Yıl  Yeme ve İçme (Market)  70€*85*90*100€
Antrenorlük  2.300 €  Rusça*Romence  4 Yıl  Vize 90€*Oturum İzni 100€  Ev 100*300€
Sivil Güvenlik  2.300 €  Rusça*Romence  4 Yıl  2500€ Bankada Gösterilir
MOLDOVA GÜZEL SANATLAR AKADEMİSİ  LİSANS YILLIK  DİL PEDAGOJİ ÜNİVERSİTESİ  YIL  EK GİDERLER  YÜKSEKLİSANS  ÜCRET  DİL  YIL
Klavye Enstrümanları (Piyona, Org)  3.000 €  Romence  4 Yıl  Kayıt Masrafları ve Rehberlik 1000€  Animasyon*Oyun Tasarımı  3.000 €  Romence  4 Yıl
Orkestra Enstrümanları  4.000 €  Romence  4 Yıl  Evrak İşlemleri Onaya Hazırlanması
Halk Aletleri  3.000 €  Romence  4 Yıl  Bakanlık ve Okul Kayıt Harcı
Jazz Çeşit Aletleri Vokal (Akademik halk, pop, caz)  3.000 €  Romence  4 Yıl  Onayın ve İkamet bildirimi
Popüler Şan Eğitimi  3.600 €  Romence  4 Yıl  Bireysel Seyahat Giderleri
Koro Şefliği  5.000 €  Romence  4 Yıl  Konaklama Giderleri
Vokal Şarkıcılık* Beste yorumculuğu  5.000 €  Romence  4 Yıl  Seyahat Sigortası
Kompozisyon(Klasik Estrano- jazz)  3.000 €  Romence  4 Yıl  Yeme ve İçme (Market)
Müzik Bilimi  3.000 €  Romence  4 Yıl  Vize 90€*Oturum İzni 100€
Müzikal Pedagoji  3.000 €  Romence  4 Yıl  2500€ Bankada Gösterilir
Dans  3.000 €  Romence  4 Yıl  Konsolosluklar
Tiyatro  1.800 €  Romence  4 Yıl  İstanbul Bursa Antalya*Ankara
Sahne Tasarımı  1.800 €  Romence  4 Yıl  EĞİTİMLER
Drama  1.800 €  Romence  4 Yıl  3+2* 4+1  Şeklindendir
Film Yönetmenliği  3.000 €  Romence  4 Yıl  1 ve 2 Yükseklisanslardır.
Tiyatro çalışmaları ve Tiyatro Yönetimi  1.800 €  Romence  4 Yıl  KONAKLAMA
Koreografi  1.800 €  Romence  4 Yıl  YURT
Aktörlük  3.000 €  Romence  4 Yıl  70€*85*90*100€
Film ve Televizyon Yönetmenliği  3.000 €  Romence  4 Yıl  Ev 100*300€
Sinema ve Televizyon montaj  3.000 €  Romence  4 Yıl  İsim Soyad Değişikliği Belgesi
Film ve Televizyon  yapımı  3.000 €  Romence  4 Yıl
Multimedya  3.000 €  Romence  4 Yıl
Kültürel çalışmalar  1.800 €  Romence  4 Yıl
Moda  3.000 €  Romence  4 Yıl
Moda Tasarımı  3.000 €  Romence  4 Yıl
SahneTasarımı  1.800 €  Romence  4 Yıl
Sanat Yönetmenliği ve Kültüroloji  3.000 €  Romence  4 Yıl
Resim  1.800 €  Romence  4 Yıl
Grafik  1.800 €  Romence  4 Yıl
Heykel  1.800 €  Romence  4 Yıl
Güzel Sanatlar Tarihi ve teorisi  1.800 €  Romence  4 Yıl
Dekoratif Sanat ve El sanatları  1.800 €  Romence  4 Yıl
Sanat eserlerinin Restarasyonu ve Depolanması  3.000 €  Romence  4 Yıl
Plastik Sanatlar  3.000 €  Romence  4 Yıl
Vucut Geliştirme  3.000 €  Romence  4 Yıl
Animasyon*Oyun Tasarımı  3.000 €  Romence  4 Yıl
ULİM ÜNİVERSİTESİ  LİSANS YILLIK  DİL 650 EURO  YIl  EK GİDERLER  YUKSEK LİSANS 1300€ 1.5*2 Yıl  DOKTORA  3 YIL
Hukuk  1.300 €  Romence*Rusça  4 Yıl  Kayıt Masrafları ve Rehberlik 1000€  Klinik Psikoloji  1.800 €  Elektrik ve Bilgi Mühendisliği  1.300 €
İktisat  1.300 €  4 Yıl  Evrak İşlemleri Onaya Hazırlanması  Psikolojik danışmanlık  1.800 €  Psikoloji ve Sosyal Psikoloji  1.300 €
BiyoMedikal Mühendisliği  1.300 €  Romence*Rusça  4 Yıl  Bakanlık ve Okul Kayıt Harcı  Eğitim Danışmanliği okul entegrasyonu  1.800 €  Ekonomi Finans Pazarlama Lojistik  1.300 €
Ekoloji  1.300 €  Romence*Rusça  4 Yıl  Onayın ve İkamet bildirimi  Sosyal*Ekonomik Pedagoji  1.800 €  Kamu Hukuku  1.650 €
Bilgi Teknolojileri  1.650 €  4 Yıl  Bireysel Seyahat Giderleri  Sosyal Hizmetler Yönetimi  1.800 €  İdari Hukuk  1.650 €
Bilgi Güvenliği  1.150 €  Romence*Rusça  4 Yıl  Konaklama Giderleri  Sosyal Yardım Sosyal Uzmanlık Çalışmaları  1.800 €  Bnkacılık Maliye Gümrük  1.650 €
Bilgisayar Bilimi  1.150 €  Romence*Rusça  4 Yıl  Seyahat Sigortası  Kozmetik Tıp  ve SPA  1.800 €  Uluslararası Hukuk ve Avrupa Hukuku  1.650 €
Bilgisayar Tasarımı  1.150 €  Romence*Rusça  4 Yıl  Yeme ve İçme (Market)  Edebiyat  1.400 €  Hukuk Kriminolojisi  1.650 €
Uluslararası İlişkiler  1.600 €  Romence*Rusça  4 Yıl  Vize 90€*Oturum İzni 100€  Bilişim ve Tasarım  1.800 €  Ceza Hukuku ve İnfazı  1.650 €',
  '{"country": "Moldova", "chunk": 4, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','moldova','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Moldova Yurtdışı Eğitim Bilgileri (Bölüm 5)',
  'Siyaset Bilimleri  1.300 €  Romence*Rusça  4 Yıl  2500€ Bankada Gösterilir  Adli Psikoloji  1.400 €  Siyasal Bilimler  1.300 €
Gazetecilik ve Medya  1.500 €  Romence*Rusça  4 Yıl  Konsolosluklar  Askeri Psikoloji  1.400 €  Avrupa Politikaları ve Süreçleri  1.300 €
Muhasebe  1.850 €  Romence*Rusça  4 Yıl  İstanbul Bursa Antalya*Ankara  Örgutsel ve İnsan Kaymakları Psikolojisi  1.400 €  Tarih  1.300 €
Finans ve Bankacılık  1.850 €  Romence*Rusça  4 Yıl  EĞİTİMLER  Sosyal Bilimler  1.400 €  Felsefe  1.300 €
Otel Hizmetleri*Turizm ve Eğlence  1.720 €  Romence*Rusça  4 Yıl  3+2* 4+1  Şeklindendir  Siyaset Bilimi  Diplomasi  ve Güvenlik  1.400 €  Dil Bilimleri  1.300 €
Dünya Ekonomisi ve Uluslararası Ekonomik İlişkiler  1.850 €  Romence*Rusça  4 Yıl  1 ve 2 Yükseklisanslardır.  Gazetecilik İş ve İletişim  1.400 €  Arkeoloji  1.300 €
Pazarlama  ve Lojistik  1.850 €  Romence*Rusça  4 Yıl  KONAKLAMA  Medya Yönetimi  1.400 €  Plastık sanatlar  1.300 €
İşletme ve Yönetimi  1.850 €  Romence*Rusça  4 Yıl  YURT  Pazarlama ve İş İletişimi  1.400 €  Beşeri Bilimler  1.300 €
Psikopedagoji  1.300 €  Romence*Rusça  4 Yıl  70€*85*90*100€  Hukuk ve İdare hukuku  1.400 €  Karşılaştırmalı Edebiyat  1.300 €
Sosyal Hizmetler  1.300 €  Romence*Rusça  4 Yıl  Ev 100*300€  Hukuksal Yolsuzlukla Mücadele  1.400 €
Psikoloji  1.500 €  Romence*Rusça  4 Yıl  İsim Soyad Değişikliği Belgesi  Uluslararası Hukuk  1.400 €
İç Dizayn  1.500 €  Romence*Rusça  4 Yıl
Cevirmenlik  1.600 €  Romence*Rusça  4 Yıl
İletişim  Bilimleri  1.500 €  Romence*Rusça  4 Yıl
Sosyoloji  1.500 €  Romence*Rusça  4 Yıl
BiyoTıp (Estetik Kozmetik)  1.500 €  Romence*Rusça  4 Yıl
MOLDOVA DEVLET TARIM ÜNİVERSİTESİ  LİSANS YILLIK  DİL PEDAGOJI ÜNİVERSİTESİ  YIL  EK GİDERLER  EK GİDERLER
Veterinerlik  1500€ * 2200€  Romence*İngilizce  5.5 Yıl  Kayıt Masrafları ve Rehberlik 1000€  Vize 90€*Oturum İzni 100€
Tarım Ekonomisi  1.500 €  Romence  3-4 Yıl  Evrak İşlemleri Onaya Hazırlanması  2500€ Bankada Gösterilir
Agronomi  1.500 €  Romence  3-4 Yıl  Bakanlık ve Okul Kayıt Harcı  Konsolosluklar
Tarım Bilimi  1.500 €  Romence  3-4 Yıl  Onayın ve İkamet bildirimi  İstanbul Bursa Antalya*Ankara
Bahçecilik  1.500 €  Romence  3-4 Yıl  Bireysel Seyahat Giderleri  EĞİTİMLER
Hayvancılık ve Biyo- Teknoloji  1.500 €  Romence  3-4 Yıl  Konaklama Giderleri  3+2* 4+1  Şeklindendir
Ziraat Mühendisliği, Kadastro  1.500 €  Romence  3-4 Yıl  Seyahat Sigortası  1 ve 2 Yükseklisanslardır.
Ulaştırma ve Otomobil Taşımacılığı  1.500 €  Romence  4 Yıl  Yeme ve İçme (Market)  KONAKLAMA
İsim Soyad Değişikliği Belgesi  YURT
70€*85*90*100€
Ev 100*300€
MOLDOVA BİLİMLER AKADEMİSİ  LİSANS YILLIK  DİL PEDAGOJI ÜNİVERSİTESİ  YIL  EK GİDERLER  YUKSEK LİSANS 3000€
Kimya  2.850 €  Romence  Kayıt Masrafları ve Rehberlik 1000€  PsikoPedagoji
Biyofarmarmosötik Kimya  2.850 €  Romence  Evrak İşlemleri Onaya Hazırlanması  Moleküler Biyoloji
Ekoloji ve Cevre Kimyası  2.850 €  Romence  Bakanlık ve Okul Kayıt Harcı  Cevre Bilimleri
Moleküler Biyoloji  2.850 €  Romence  Onayın ve İkamet bildirimi  Biyoekonomi ve Ekoloji
Biyoloji  2.850 €  Romence  Bireysel Seyahat Giderleri  Kültürlerarası İletişim
Siyaset Bilimleri  2.850 €  Romence  Konaklama Giderleri  Avrupa Kültürleri
Edebiyat  2.850 €  Romence  Seyahat Sigortası  Ulusal Güvenik
Felsefe  2.850 €  Romence  Yeme ve İçme (Market)  Uygulamalı Bilişim
Bilişim  2.850 €  Romence  Vize 90€*Oturum İzni 100€  Matematik ve Bilişim
Coğrafya  2.850 €  Romence  2500€ Bankada Gösterilir  Fizik
Yer Bilimleri  2.850 €  Romence  Konsolosluklar  Kimya
Fizik*Fizik Bilimleri ve Mühendisliği  2.850 €  Romence  İstanbul Bursa Antalya*Ankara  Biyoloji
Halk Sağlığı  2.850 €  Romence  EĞİTİMLER
NanoTeknoloji  2.850 €  Romence  3+2* 4+1  Şeklindendir
Endüstri Mühendisliği  2.850 €  Romence  1 ve 2 Yükseklisanslardır.
Tarımsal BiyoTeknolojiler  2.850 €  Romence  KONAKLAMA
Enerji Dönüşüm Sistemleri Yenileyici Mühendisliği  2.850 €  Romence  YURT
İlaç Bilimi  2.850 €  Romence  70€*85*90*100€
Hukuk  2.850 €  Romence  Ev 100€*300€
İletişim ve Halkla İlişkiler  2.850 €  Romence  İsim Soyad Değişikliği Belgesi
Gazetecilik  2.850 €  Romence
Sosyoloji  2.850 €  Romence
Matematik  2.850 €  Romence
Bilgi Bilimleri  2.850 €  Romence
Tarih  2.850 €  Romence
Bilgisayar Bilimleri  2.850 €  Romence
Tarım  2.850 €  Romence
Biyolojik ve Yaşam Bilimleri  2.850 €  Romence
GİRNE AMERİKAN ÜNİVERSİTESİ
Mimarlık  2.700 €
Psikoloji  2.700 €
Uluslararası İlişkiler  2.700 €
Siyasal Bilimler  2.700 €
Turizm ve Konaklama işletmeciliği  2.700 €
Lojistik ve Pazarlama  2.700 €  3yıl Moldova Sonyıl Kıbrıs
İşletme  *Muhasebe  2.700 €
Ekonomi  2.700 €
Finans ve Bankacılık  2.700 €',
  '{"country": "Moldova", "chunk": 5, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','moldova','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Polonya Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'POLONYA ÜNİVERSİTELERİ  VİZE İŞLEMLERİ ÖĞRENCİYE AİTTİR. 500 EURO
DİPLOMA PUANI 70 VE ÜZERİ OLMALIDIR.
VİZE İÇİN BANKADA 3000 EURO TEMİNAT BULUNMASI GEREKİYOR.
TIP- DİŞ HEKİMLİĞİ -ECZACILIK- HUKUK BÖLÜMLERİ İÇİN KAYIT DANIŞMANLIK 1550€
VİZESİNDEN PROBLEM OLDUĞU İÇİN SADECE YEŞİL PASAPORTLU ÖĞRENCİLER ALINIYOR.
ÖĞRENCİ ORAYA GİTTİKTEN SONRA AVUKAT YARDIMI İLE OTURUM ALINIYOR  (ÜCRETİ MASRAFLAR DAHİL 1500€)
QS  THE  CWTS  ARWU (SHANGHAİ)
JAGİELLON ÜNİVERSİTESİ  304  601-800  -  İLK BİNDE
VARŞOVA ÜNİVERSİTESİ  262  -  -  İLK BİNDE
GDANSK TEKNOLOJİSİ ÜNİVERSİTESİ  851-900  -  688  İLK BİNDE
LODZ MEDİCAL UNIVERSTY  -  801-1000  830  -
VARŞOVA TEKNOLOJİ ÜNİVERSİTESİ  -  571  567  İLK BİNDE
WROCLAW TIP ÜNİVERSİTESİ  -  601-800  763  İLK BİNDE
VARŞOVA SOSYAL BİLİMLER VE PSİKOLOJİ ÜNİVERSİTESİ )SWPS)  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
İşletme ve Yönetimi  4.500 €  İngilizce  Akademik Yıl  Klinik Psikoloji  7.000 €  İngilizce
Psikoloji  5.100 €  İngilizce  Hazırlık 3200€  Uygulamalı Sosyal Psikoloji  7.000 €  İngilizce
Kültürlerarası İletişim ve Seyahat  2.700 €  İngilizce  Hazırlık  Lehce ve İngilizce 3200€  Kamu Politikası  5.300 €  İngilizce
İş İngilizcesi ve Medya Çalışmaları  2.700 €  İngilizce  Yurt 100€*150€  Yönetim ve Liderlik  5.300 €  İngilizce
Dil Çalışmaları(Çift Diploma)İspanyolca*Almanca* Çince* Korece* İngilizce  2.700 €  İngilizce  Ev Kirası  200€*300€  Psikopatoloji  7.000 €  İngilizce
İngiliz Dil Çalışması  2.500 €  İngilizce
VARŞOVA ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET
Uluslararası İlişkiler  3.400 €  İngilizce  Akademik Yıl  Psikoloji  4.600 €  İngilizce
Finans  Muhasebe ve Uluslararası Yatırım  2.100 €  İngilizce  Hazırlık 3300€  Fizik*Felsefe  3.400 €  İngilizce
Amerikan Araştımaları Başlantılı Avrupa Kültürü ve Ekonomisi  3.400 €  İngilizce  Yurt 100€*150€  Arkeoloji  3.400 €  İngilizce
Siyasal Bilimler  3.400 €  İngilizce  İngiliz Dili Bilimi  3.400 €  İngilizce
Psikoloji  4.600 €  İngilizce  Siyaset Bilimi  3.400 €  İngilizce
Arkeoloji  2.000 €  İngilizce  Uluslararası İlişkiler  3.400 €  İngilizce
İngiliz Dil Bilimi  2.500 €  İngilizce  Uluslararası İşletme  4.200 €  İngilizce
Felsefe  1.500 €  İngilizce  Kimya  800 €  İngilizce
Amerikan Çalışmaları  4.000 €  İngilizce  Gıda Sistemleri  18.000 €  İngilizce
Gazetecilik  3.000 €  İngilizce  Data Bilimi ve Sistemleri  2.200 €  İngilizce
Uluslararası İlişkiler  3.000 €  İngilizce  Sürdürülebilir Gelişme* İç Güvenlik  2.000 €  İngilizce
Felsefe  2.000 €  İngilizce  İnsani Yardım Faaliyetleri  6.000 €  İngilizce
Kimya Mühendisliği  3.000 €  İngilizce  İngilizce Öğretmenliği  2.500 €  İngilizce
Biyoloji  3.000 €  İngilizce  Veri Bilimleri iş Analitiği  2.600 €  İngilizce
Coğrafya ve Bölgesel Çalışmalar  3.000 €  İngilizce  Uluslararası Ekonomi Yönetim  4.200 €  İngilizce
Evrak Listesi tam Ulaşmalı  3.000 €  İngilizce  Kültürlerarası İletişim  4.200 €  İngilizce
Bilişim ve Mekanik  3.000 €  İngilizce  Uluslararası İşletme MBA  4.200 €  İngilizce
Matematik  3.000 €  İngilizce  Çevre Yönetimi  4.200 €  İngilizce
VARŞOVA TEKNOLOJİ ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET
İnşaat Mühendisliği  7.400 €  İngilizce  Akademik Yıl  Özel Mimari  8.300 €  İngilizce
Mimarlık  7.700 €  İngilizce  Hazırlık 3750€ İngilizce  Şehir Mimarisi Planlama  9.300 €  İngilizce
Mekatronik*Fotonik Mühendisliği  5.200 €  İngilizce  Ev Kirası  200€*300€  İnşaat Yapı Mühendisliği  8.000 €  İngilizce
Elektrik Mühendisliği  4.600 €  İngilizce  Yurt 100€*150€  Elektrik Mühendisliği  5.600 €  İngilizce
Çevre Mühendisliği  4.200 €  İngilizce  Biyoteknoloji  5.400 €  İngilizce
Elektrikli Hirbit Araçlar Mühendisliği  5.200 €  İngilizce  Kimya Mühendisliği  4.500 €  İngilizce
Bilgisayar Bistemleri ve Ağları  7.800 €  İngilizce  Çevre Mühendisliği ve Koruma  4.200 €  İngilizce
Telekomünikasyon  7.800 €  İngilizce  Mekatronik Sistemler  4.600 €  İngilizce
Bilişim Bilimi ve Sistemleri  7.200 €  İngilizce  Fotonik Robotik  10.000 €  İngilizce
Havacılık ve Uzay Mühendisliği  4.000 €  İngilizce  Üretim Mühendisliği ve Yönetimi  3.700 €  İngilizce
Elektrik Mühendisliği (Güç Müh.Havacılık)  4.000 €  İngilizce  Telekomünikasyon ve Bilgisayar Bilimi  8.200 €  İngilizce
Ulaştırma Mühendisliği ve Yönetimi  4.000 €  İngilizce  Bilgisayar Bilimi Sistemleri ve Yapay Zeka  8.600 €  İngilizce
Nükleer Enerji Mühendisliği  İngilizce  Bilgisayar Veri Data Bilimi  8.000 €  İngilizce
Mekatronik Sistemler  5.000 €  İngilizce  Bilgisayar Sistemleri ve Ağları  8.200 €  İngilizce
Jeoloji ve Haritacılık  3.000 €  İngilizce  Jeoloji ve Haritacılık  3.000 €  İngilizce
Üretim Mühendisliği  3.700 €  İngilizce  Malzeme Mühendisliği  3.700 €  İngilizce
Biyoteknoloji*Uygulamalı Biyoteknoloji  5.400 €  İngilizce  Elektrik Mühendisliği  3.700 €  İngilizce
Kimya Mühendisliği  4.500 €  İngilizce  Mobil Navigasyon Sistemleri  3.700 €  İngilizce
Yapay Zeka  5.400 €  İngilizce
Yazılım Mühendisliği  4.500 €  İngilizce
Robotık  Mekatronik Mühendisliği  4.000 €  İngilizce
VARŞOVA EKONOMİ VE İNSANİ BİLİMLER  ÜNİVERSİTESİ (VİZJA)  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Moda Tasarımı  4.000 €  İngilizce  Akademik Yıl  Klinik Psikoloji ve Psikoloji  2.700 €  İngilizce
Sürdürülebilir Moda Yönetimi  4.000 €  İngilizce  Hazırlık İngilizce 2950€  İşletme ve Psikoloji  2.700 €  İngilizce
Mobil Uygulama Tasarımı  2.600 €  İngilizce  Hazırlık Lehçe 2500€  Yönetim Finansmanı  2.600 €  İngilizce
Yapay Zeka  2.600 €  İngilizce  Yurt 100€*150€  Pazarlama Yönetimi  2.800 €  İngilizce
Proje Yönetimi  2.600 €  İngilizce  Ev Kirası  200€*300€  Muhasebe Denetimi  2.700 €  İngilizce
Web Uygulamaları  2.600 €  İngilizce  Yerel Yönetimler Maliyesi  2.600 €  İngilizce
Siber Güvenlik  3.100 €  İngilizce  Uluslararası Finans  2.600 €  İngilizce
Uluslararası İlişkiler  2.400 €  İngilizce  Uluslararası İlişkiler ve Güvenlik  2.600 €  İngilizce
Uluslararası Güvenlik  2.400 €  İngilizce  Yönetim Psikolojisi  2.800 €  İngilizce',
  '{"country": "Polonya", "chunk": 1, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','polonya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Polonya Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'Diyetisyenlik  2.600 €  İngilizce  Sosyal İletişim ve Halkla İlişkiler  2.800 €  İngilizce
Kozmetik Teknolojisi ve Güzellik Bilimi  2.400 €  İngilizce  Diijital Ekonomi  2.800 €  İngilizce
İngiliz Dil Bilimi  2.400 €  İngilizce  Uluslararası Lojistik  2.800 €  İngilizce
Kamu Alanda Bilgi Mühendisliği  2.500 €  İngilizce  Bilgisayar Bilimi  2.800 €  İngilizce
Finansal Yönetim  2.500 €  İngilizce  Vergi ve Mali Danışmanlık  2.800 €  İngilizce
Uluslararası Finans ve Ticaret  2.500 €  İngilizce
Bankacılık ve Sigortacılık  2.500 €  İngilizce
Muhasebe ve Kontrol Denetimi  2.500 €  İngilizce
Akıllı Şehirler ve Toplum  2.400 €  İngilizce
Uluslararası Lojistik  2.600 €  İngilizce
İnsan Kaynakları Yönetimi  2.600 €  İngilizce
Girişimcilik ve Pazarlama  2.600 €  İngilizce
Reklamcılık  2.600 €  İngilizce
Gazetecilik  2.400 €  İngilizce
Kamu Bilgi Mühendsiliği  2.400 €  İngilizce
Psikoloji  2.600 €  İngilizce
Avrupa Çalışmaları  2.400 €  İngilizce
Nöro*Pazarlama  2.600 €  İngilizce
Sosyal İletişim ve Halkla İlişkiler  2.400 €  İngilizce
VARŞOVA  YAŞAM BİLİMLERİ ÜNİVERSİTESİ (SGGW)  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Biyoteknoloji  2.300 €  İngilizce  Akademik Yıl  Bilişim ve Data Ekonometri  2.000 €  İngilizce
Gıda Teknolojileri Bilimi ve Beslenme Diyetisyenlik  2.000 €  İngilizce  Hazırlık 3200€  Finans ve Muhasebe  2.000 €  İngilizce
Organik Tarım ve Gıda Üretimi Ziraat  2.300 €  İngilizce  Ev Kirası  200€*300€  Çevre Koruma ve Restorasyonu Yönetimi  2.000 €  İngilizce
İşletme ve Yönetimi  3.200 €  İngilizce  Yurt 100€*150€  Çevre Mühendisliği  2.000 €  İngilizce
Veterinerlik  8.500 €  İngilizce  Bahçe Bitkileri Tarımı  2.000 €  İngilizce
Peyzaj Mimarlığı*Su Mühendislği İşletmeciliği  1.800 €  İngilizce  İnşaat Alt Yapı Mühendisliği  2.000 €  İngilizce
VARŞOVA EKONOMİ ÜNİVERSİTESİ (SGH)  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Uluslararası Ekonomi  4.000 €  İngilizce  Finans ve Muhasebe  5.100 €  İngilizce
Ekonomi Bilişimi Yöntemleri  4.000 €  İngilizce  Yurt 100€*150€  Uluslararası İlişkiler  4.000 €  İngilizce
Finans ve Yönetim  4.000 €  İngilizce  Ev Kirası  200€*300€  Finans ve Yönetim  4.000 €  İngilizce
İşletme Yönetimi  4.000 €  İngilizce  Uluslararası İşletme  4.000 €  İngilizce
Bilgisayar Data Veri Analizi  4.000 €  İngilizce
İşletme MBA  5.100 €  İngilizce
Uluslararası Turizm Otelcilik Yönetimi ve Eğlence Hizmetleri  4.000 €  İngilizce
VARŞOVA POLONYA JAPON BİLGİ TEKNOLOJİLERİ AKADEMİSİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET
Yeni Medya Sanatları  4.100 €  İngilizce  Yurt 100€*150€  Yeni Medya Sanatları  3.700 €  İngilizce
Bilgisayar Bilimi  4.100 €  İngilizce  Ev Kirası  200€*300€  Bilgisayar Bilimi  3.700 €  İngilizce
İşletme Yönetimi  4.100 €  İngilizce  Okul Ücretlerinde Taksit Bulunmuyor
İç Mimarlık  3.100 €  İngilizce  Okulu Hazırlıgı Bulunmuyor
Japon Kültürü  1.900 €  İngilizce  B2 yaz kursu 2 aylık 60 saatlik düzenleniyor
WARŞOVA KOZMİNSKİ  ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Hukuk  6.500 €  İngilizce  IELTS 6.5 TOEFL 87  Bilgisayar Bilimi ve Data  6.500 €  İngilizce
Yapay Zeka ve Yönetim  6.500 €  İngilizce  İngilizce Mezun İse Diplomada belirtilmiş ise Skor aranmaz  İşletme Yönetimi  6.500 €  İngilizce
İşletme ve Yönetimi  6.500 €  İngilizce  3 Yıl Lisans*2 Yıl Yükselisans  Finans ve Muhasebe  6.500 €  İngilizce
Finansal Yönetim  6.500 €  İngilizce  başvuru ücreti 350€  Yönetim İngilizcesi  6.500 €  İngilizce
Ev Kirası  200€*300€  İşletme MBA  6.500 €  İngilizce
Yurt 100€*150€
WARŞOVA ŞEHİR KOLEJİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Dijital Pazarlama  2.800 €  İngilizce  Hazırlık Eğitimi Verilmiyor  Uluslararası Güvenlik Çalışmaları  3.000 €  İngilizce
İşletme  2.800 €  İngilizce  Uluslararası İşletme  3.000 €  İngilizce
Uluslararası İşletme Yönetimi  2.800 €  İngilizce  185€ Başvuru ve Kabul ücreti  Uluslararası  Müzakere Yönetimi  3.000 €  İngilizce
Gazetecilik  2.800 €  İngilizce  Ev Kirası  200€*300€  Uluslararası İlişkiler  3.000 €  İngilizce
Yeni Medya Sanatları  2.800 €  İngilizce  Yurt 100€*150€  Sosyal Medya Yönetimi  3.000 €  İngilizce
Uluslararası Pazarlama  2.800 €  İngilizce  Dijital Pazarlama  3.000 €  İngilizce
Uluslararası İlişkiler  2.800 €  İngilizce  Uluslararası Barış Çalışmaları  4.500 €  İngilizce
Multimedya ve İşletişim  2.800 €  İngilizce  Sosyoloji  3.000 €  İngilizce
Halkla İlişkiler  2.800 €  İngilizce  Cezai Adalet  3.000 €  İngilizce
Sosyoloji  2.800 €  İngilizce
Uluslararası Diplomasi ve Müzakereler  2.800 €  İngilizce
WARŞOVA KOZMİNSKİ  ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
İngiliz Dili Öğretmenliği  3.950 €  İngilizce  İngiliz Dili Öğretmenliği  3.950 €  İngilizce
Ceviri  3.950 €  İngilizce  Hazırlık 3000€  İngilizce Çeviri  3.950 €  İngilizce
Uluslararası İşletme  3.950 €  İngilizce  B1 ile Eğitime 1. sınıfa başlanabilir  Uluslararası İşletme  3.950 €  İngilizce
Yönetimde İletişim  3.950 €  İngilizce  Başvuru Ücreti kayıt 185€  Yönetimde İletişim  3.950 €  İngilizce
Yönetim ve Yapay Zeka  5.500 €  İngilizce  Ev Kirası  200€*300€  Büyük Veri Bilimleri  3.950 €  İngilizce
Finansal İşletme İşletme Yönetimi Çift Diploma  5.500 €  İngilizce  Yurt 100€*150€  Finans ve Muhasebe  3.950 €  İngilizce
WARŞOVA TIP ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
tıp  13.700 €  İngilizce  Sağlık Hazırlık 6000€  Klinik Psikoloji  4.400 €  İngilizce
diş hekimliği  16.000 €  İngilizce  Genel Hazırlık 4500€
Eczacılık  5.700 €  İngilizce  Ev Kirası  200€*300€
Hemşirelik  5.000 €  İngilizce  Yurt 100€*150€
Halk Sağlığı  8.950 €  İngilizce
Ebelik  5.000 €  İngilizce
Diyetisyenlik  5.000 €  İngilizce
Acil Tıbbi Yardım  5.000 €  İngilizce
Diş Teknik  5.000 €  İngilizce
Diş Hijyen  5.000 €  İngilizce
Klinik Genel Konuşma Terapisi (Odyoloji)  5.000 €  İngilizce
WARŞOVA FİLM AKADEMİSİ  ÜCRET  DİL
Sinematografi  5.500 €  İngilizce
Prodüksiyon  5.500 €  İngilizce  Yurt 100€*150€',
  '{"country": "Polonya", "chunk": 2, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','polonya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Polonya Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'Film Yönetmenliği  5.500 €  İngilizce  Ev Kirası  200€*300€
VARŞOVA BİLGİ TEKNOLOJİLERİ VE YÖNETİM ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Diyetistenlik  4.500 €  İngilizce  Siber Güvenlik  5.000 €  İngilizce
Hemşirelik  4.500 €  İngilizce  Lojistik Yonetimi  5.000 €  İngilizce
Grafik Tasarım  4.500 €  İngilizce  Yurt 100€*150€
Oyun Tasarımı ve Geliştirme  4.500 €  İngilizce  Ev Kirası  200€*300€
Multimedya ve İşletişim  4.500 €  İngilizce
Bilgisayar Ağları ve  Programlama  4.000 €  İngilizce
Havacılım Yönetimi  4.000 €  İngilizce
Lojistik Mühendisliği  4.000 €  İngilizce
Uluslararası Taşımacılık Mühendisliği  4.000 €  İngilizce
Uluslararası Finans ve Muhasebe  4.000 €  İngilizce
VARŞOVA FİLM AKADEMİSİ
Film Yönetmenliği ve Video Oyunları  4.500 €  İngilizce
Sanat ve Medya Çalışmaları  4.500 €  İngilizce
VARŞOVA  LAZARSKİ ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Havacılık Hukuku ve Pilotluk  1.Yıl 28800€  İngilizce  HAZIRLIK İNGİLİZCE 3000€
2. Yıl 30800€  HAZIRLIK LEHÇE 1800 €  14 HAFTA
3. Yıl 32800€  günlük 4 saat  veriliyor
Başvuru ücreti120€
Tıp 3650* 1900 hazırlık  35000PLN*36000PLN *37000PLN*39000PLN*41000PLN*43000PLN  Yurt 90€* 120€
Hemşirelik  3 Yıl  3720PLN*3920PLN*4200PLN  Ev Kirası  200€*300€
KRAKOV TEKNOLOJİ (pk)ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
İnşaat Mühendisliği  3.000 €  İngilizce  Hazırlık 4000€  Mimarlık  5.000 €  İngilizce
Mekanik ve Makine Tasarımı  3.500 €  İngilizce  Peyzaj Mimarlığı  5.000 €  İngilizce
Mimarlık  5.000 €  İngilizce  Yurt 120€*160€  Enerji Mühendisliği  3.300 €  İngilizce
Cevre Mühendisliği  3.300 €  İngilizce
Ev Kirası  200€*300€  Arazi  Ölçüm Mühendisliği  3.300 €  İngilizce
Uygulamalı Fizik  3.000 €  İngilizce
İnşaat Mühendisliği  3.000 €  İngilizce
Kimya Teknolojileri  3.000 €  İngilizce
Bilgisayar Bilimleri  3.000 €  İngilizce
Mekanik ve Makine Mühendisliği  3.500 €  İngilizce
KRAKOV EKONOMİ ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Kurumsal Finasman  3.000 €  İngilizce  Hazılık 4250€  Uluslararası Finans ve Muhasebe  3.000 €  İngilizce
Uluslararası İşletme  3.000 €  İngilizce  Kurumsal Finansman  3.000 €  İngilizce
Modern İşletme Yönetimi  3.000 €  İngilizce  Ev Kirası  200€*300€  Uluslararası İşletme  3.000 €  İngilizce
Uygulamalı İnformatik  3.000 €  İngilizce  Yurt 120€*160€  Kamu Yönetimi  ve Ekonomi  4.350 €  İngilizce
Modern Yönetimde Sayısal Metotlar  3.000 €  İngilizce
KRAKOV ÜNİVERSİTESİ(AGH)  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Mekatronik Mühendisliği  3.450 €  İngilizce  Hazırlık 4500€  Yapay Zeka ve Data Analizi  4.200 €  İngilizce
Telekomünikasyon  3.500 €  İngilizce  Mekatronik Mühendisliği  4.200 €  İngilizce
Bilgisayar Bilimleri  4.000 €  İngilizce  Yurt 120€*160€  Kimya Mühendisliği  4.400 €  İngilizce
Elektrik Mühendisliği  3.500 €  İngilizce  Uygulamalı Jeoloji  3.500 €  İngilizce
Uygulamalı Jeofizik  3.500 €  İngilizce
Enerji Mühendisliği  4.400 €  İngilizce
Çevre Mühendisliği  4.400 €  İngilizce
Sürdürülebilir Enerji Sistemleri  4.400 €  İngilizce
Modern Yakıt Teknolojileri  4.400 €  İngilizce
Teknoloji ve Sosyal Toplum  3.000 €  İngilizce
Uygulamalı Modern Malzeme Tasarımı  4.000 €  İngilizce
Proses Mühendislği  4.000 €  İngilizce
Malzeme Mühendisliği  4.400 €  İngilizce
Robotik Siber Sistemler  4.200 €  İngilizce
Maden Mühendisliği  3.000 €  İngilizce
Akıllı Şebeke Teknolojileri  4.200 €  İngilizce
KRAKOV JAGİELLONİAN ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
4.250 €
Hukuk  14.500 €  İngilizce  Hazırlık 3750€  Moleküler Biyoloji  4.000 €  İngilizce
Diş Hekimliği  12.000 €  İngilizce  Ev Kirası  200€*300€  Ekoloji ve Evrim  2.200 €  İngilizce
Fizik Tedavi  5.000 €  İngilizce  Yurt 120€*160€  Çevre Koruma ve Yönetimi  3.350 €  İngilizce
Acil Tıbbi Yardım  5.000 €  İngilizce  İlaç Yapımı ve Keşifler  5.600 €  İngilizce
Biyoteknoloji  1.100 €  İngilizce  Avrupa Çalışmaları  4.250 €  İngilizce
Matematik  1.500 €  İngilizce  Fikri Mülkiyet Çalışmaları  5.000 €  İngilizce
İş İdaresi  1.600 €  İngilizce  Karşılaştırmalı Miras Çalışmaları  3.500 €  İngilizce
Uluslararası İlişkiler ve Alan Çalışmaları  4.000 €  İngilizce  Uluslararası ilişkiler ve Kamu Diplomasisi  4.000 €  İngilizce
Avrupa Çalışmaları  4.000 €  İngilizce  Transatlantik Çalışmaları  3.000 €  İngilizce
Küresel Çalışmalar  3.800 €  İngilizce  Uluslararası Güvenlik Çalışmaları ve Kalkınma  4.000 €  İngilizce
Gazetecilik  1.500 €  İngilizce  Nano Teknoloji ve İleri Malzeme Mühendisliği  3.800 €  İngilizce
Ekonomi  2.200 €  İngilizce  Avrupa Hukuku  4.250 €  İngilizce
Sosyoloji  1.500 €  İngilizce  Siyaset Bilimi*Ciftte Diploma  4.250 €  İngilizce
BitoTeknoloji* Moleküler Biyoloji  4.000 €  İngilizce
Bilgisayar Bilimleri  1.500 €  İngilizce
Psikoloji  4.500 €  İngilizce
Pedagoji  1.500 €  İngilizce
Astroloji  1.600 €  İngilizce
Cografya  1.500 €  İngilizce
Sanat Tarihi  2.000 €  İngilizce
Siyaset Bilimi  1.600 €  İngilizce
Biyoloji  1.500 €  İngilizce
Kimya Teknolojileri  2.000 €  İngilizce
Özel Eğitim  1.000 €  İngilizce
Felsefe  2.000 €  İngilizce
Amerikan Kültürü ve Edebiyatı  1.600 €  İngilizce
Jeoloji  1.500 €  İngilizce
Biyofizik  1.500 €  İngilizce
Etnoloji  1.500 €  İngilizce
Nero Psikoloji  1.500 €  İngilizce
KRAKOV  ANDRZEJ FRYCZ MODRZEWSKİ ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Film Yönetmenliği  1.650 €  İngilizce
TV Yapımcılığı  1.650 €  İngilizce
Set ve Kat Yoneticiliği  1.650 €  İngilizce
Senarist Senaryo Süpervizoru  1.650 €  İngilizce
Etkünlik Şov Yapımcılığı  1.650 €  İngilizce
WROCLAV TIP ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Tıp  11.700 €  İngilizce  Hazırlık 4000€
Diş Hekimliği  12.700 €  İngilizce  Ev Kirası  200€*300€
WROCLAV  BİLİM VE POLİTEKNOLOJİ ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL',
  '{"country": "Polonya", "chunk": 3, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','polonya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Polonya Yurtdışı Eğitim Bilgileri (Bölüm 4)',
  'Yazilim Mühendisliği  3.000 €  İngilizce  Hazırlık 3300€  Enerji Mühendisliği  4.000 €  İngilizce
Makine Mühendisliği  3.000 €  İngilizce  1Dönem Yogun Hazırlık 1650€  İnşaat Mühendisliği  4.000 €  İngilizce
Bilgisayar Makine Mühendisliğ  3.000 €  İngilizce  Lehçe 2000€  Elektronik Mühendisliği  4.000 €  İngilizce
Organisazyon Yönetimi(Bilgisayarlı ve Yönetimi)  3.000 €  İngilizce  Ev Kirası  200€*300€  Maden  Mühendisliği  4.000 €  İngilizce
Uygulamalı Bilgisayar Bilimleri  3.000 €  İngilizce  Yurt 120€*160€  Jeoloji Mühendisliği  4.000 €  İngilizce
Bilgisayar Mühendisliği  4.000 €  İngilizce  Makine Mühendisliği  4.000 €  İngilizce
Kimya Mühendisliği  3.000 €  İngilizce  İşletme Yönetimi  4.000 €  İngilizce
İşletme Yönetimi  3.000 €  İngilizce  Elektrik Mühendisliği  4.000 €  İngilizce
İngiliz Dili ve Edebiyatı  3.000 €  İngilizce  Bilgisayar Bilimi  4.000 €  İngilizce
Arkeoloji  3.000 €  İngilizce  Kimya ve Proses Mühendisliği  4.000 €  İngilizce
Biyoteknoloji  4.000 €  İngilizce
Mekansal Mimarlık  4.000 €  İngilizce
Mimarlık  4.000 €  İngilizce
Tıbbi Kimya  4.000 €  İngilizce
Yenilenebilir Enerji Mühendisliği  4.000 €  İngilizce
Modern İletişim  4.000 €  İngilizce
İnternet Mühendisliği  4.000 €  İngilizce
Çevre Mühendisliği  4.000 €  İngilizce
WROCLAW ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Biyoteknoloji  3.000 €  Hazırlık 4000€  Kimya  3.000 €  İngilizce
Kimya  3.000 €  Uluslararası İlişkiler  3.000 €  İngilizce
Uluslararası İlişkiler  3.000 €  Ev Kirası  200€*300€  Siyasal Bilimler  3.000 €  İngilizce
Siyasal Bilimler(Karşılaştırmalı Siyaset )  3.000 €  Yurt 120€*160€  Avrupa Çalışmaları  3.000 €  İngilizce
Avruoa Kültürü  3.000 €  Gazetecilik ve Sosyal İletişim  3.000 €  İngilizce
İngiliz Dili ve Edebiyatı  3.000 €  Turizm  3.000 €  İngilizce
Arkeoloji  3.000 €  Uluslararası Örgütlerde Yönetim  3.000 €  İngilizce
İşletme Yönetimi  3.000 €  Kültürel İletişim  3.000 €  İngilizce
İngiliz Filolojisi  3.000 €  İngilizce
Reklamcılık  3.000 €  İngilizce
Halkla İlişkiler  3.000 €  İngilizce
Marka Çalışmaları  3.000 €  İngilizce
Gürüntülü İletişim  3.000 €  İngilizce
Deneysel ve Kurumsal Dil Bilimi  3.000 €  İngilizce
Uluslararası ve Avrupa Hukuku  3.000 €  İngilizce
WROCLAW EKONOMİ  ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Finans  2.500 €  İngilizce  Hazırlık 4000€  Finans  2.500 €  İngilizce
İşletme  2.500 €  İngilizce  Ev Kirası  200€*300€  Uluslararası İşletme  2.500 €  İngilizce
Uluslararası İşletme  2.500 €  İngilizce  Yurt 120€*160€  İşletme  2.500 €  İngilizce
İşletme Enformatiği  2.500 €  İngilizce
WROCLAW MÜZİK AKADEMİSİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Ensturüman  3.500 €  İngilizce
Şan  3.500 €  İngilizce
POZNAN GÜZEL SANATLAR AKADEMİSİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Resim  ve Çizim  5.000 €  İngilizce  Hazırlık 3800€  Heykel  6.000 €  İngilizce
Yeni Medya Sanatları  5.000 €  İngilizce  Ev Kirası  200€*300€  İç Tasarım  6.000 €  İngilizce
Grafik  5.000 €  İngilizce  Yurt 90€* 120€  İnter Medya  6.000 €  İngilizce
İç Tasarım  5.000 €  İngilizce  Endüstriyel Tasarım  6.000 €  İngilizce
Endüstriyel Tasarımı  5.000 €  İngilizce  Sahne Tasarımı  6.000 €  İngilizce
Ürün Tasarımı  5.000 €  İngilizce  Ürün Tasarımı  6.000 €  İngilizce
Sahne Tasarımı  5.000 €  İngilizce  Grafik Tasarımı  6.000 €  İngilizce
Grafik Tasarım  5.000 €  İngilizce  Atölye Grafik  6.000 €  İngilizce
Fotoğrafcılık  5.000 €  İngilizce  Resim ve Cizim  6.000 €  İngilizce
Heykel  5.000 €  İngilizce  Fotoğrafcılık  6.000 €  İngilizce
POZNAN EKONOMİ ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Uluslararası İşletme  2.400 €  İngilizce  E*İşletme  2.400 €  İngilizce
E*İşletme  2.400 €  İngilizce  Finansal Mühendisiliği  2.400 €  İngilizce
Pazarlama  2.400 €  İngilizce  Başvuru ücreti 200€  Uluslararası İşletme  2.400 €  İngilizce
Uluslararası Pazarlama ve İşletme  2.400 €  İngilizce  Ev Kirası  200€*300€  İnovatif İşletme  2.400 €  İngilizce
Finans  2.400 €  İngilizce  Yurt 90€* 120€  Finans  2.400 €  İngilizce
İşletmede Çevre ve Teknoloji  2.400 €  İngilizce  İktisat  2.400 €  İngilizce
Üretim ve Süreç Yönetimi  2.400 €  İngilizce
POZNAN TIP ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Tıp  12.700 €  İngilizce  Başvuru ücreti120€
Diş Hekimliği  13.500 €  İngilizce  Ev Kirası  200€*300€
Eczacılık  12.500 €  İngilizce  Yurt 90€* 120€
Hemşirelik  5.700 €  İngilizce  Hazırlık:6500€
Fizyoterapi  9.900 €  İngilizce
SZCZECİN  (LODZ)DENİZCİLİK ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Deniz Makineleri Mühendisliği  2.800 €  İngilizce  Hazırlık 2700€  Deniz Ulaştırma Mühendisliği  2.700 €  İngilizce
Gemi Kaptanlığı* Harita ve Navigasyon  2.600 €  İngilizce  Ev Kirası  200€*300€
Ulaştırma Yönetimi Mühendisliği  2.600 €  İngilizce  Yurt 90€* 120€
LODZ ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Ekonomi  2.500 €  İngilizce*Le  Başvuru ücreti120€  Ekonomi  2.500 €  İngilizce
İşletme  2.500 €  İngilizce  İşletme  2.500 €  İngilizce
Yönetim ve Finans  2.500 €  İngilizce  Yurt 90€* 120€  Bilgisayar Bilimleri  2.500 €  İngilizce
Bilgisayar Bilimleri  2.500 €  İngilizce  Ev Kirası  200€*300€  Uluslararası İlişkiler  2.500 €  İngilizce
Uluslararası İlişkiler ve Siyaset Bilimi  2.500 €  İngilizce  Çevre Koruma ve Restorasyonu Yönetimi  2.500 €  İngilizce
İngiliz Dili ve Edebiyatı  2.500 €  İngilizce
LODZ TIP ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Tıp  11.800 €  İngilizce  Tıbbi BiyoTeknoloji  6.000 €  ingilizce
Diş Hekimliği  15.400 €  İngilizce  Başvuru ücreti120€
Eczacılık  10.500 €  İngilizce  Yurt 90€* 120€
FizikTedavi  10.500 €  İngilizce  Ev Kirası  200€*300€
Hemşirelik  5.700 €  İngilizce
LODZ TEKNOLOJİ  ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL',
  '{"country": "Polonya", "chunk": 4, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','polonya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Polonya Yurtdışı Eğitim Bilgileri (Bölüm 5)',
  'Mimarlık  ve Şehir Planlama  4.000 €  İngilizce  Başvuru ücreti120€  Üretim Mühendisliği  4.000 €  İngilizce
Biyomedikal Mühendsliği  4.000 €  İngilizce  Elektronik Mühendisliği  4.000 €  İngilizce
Biyoteknoloji  4.000 €  İngilizce  Yurt 90€* 120€  Telekomünikasyon  4.000 €  İngilizce
Bilgisayar Bilimleri  4.000 €  İngilizce  Ev Kirası  200€*300€  Biyoteknoloji  4.000 €  İngilizce
Elektronik  Mühendisliği  4.000 €  İngilizce  Bilgisayar Bilimleri  4.000 €  İngilizce
Telekomünikasyon  4.000 €  İngilizce  Makine Mühendisliği  4.000 €  İngilizce
Fizik Teknik  4.000 €  İngilizce  İşletme Yönetimi  4.000 €  İngilizce
Makine Mühendisliği  4.000 €  İngilizce  Biyoteknoloji  4.000 €  İngilizce
Üretim ve Süreç Yönetimi Mühendisliği  4.000 €  İngilizce  Bilgisayar Bilimleri  4.000 €  İngilizce
Endüstri Mühendisliği  4.000 €  İngilizce  Elektronik  Mühendisliği  4.000 €  İngilizce
Yönetim Mühendisliği  4.000 €  İngilizce  Telekomünikasyon  4.000 €  İngilizce
Bilgi Teknolojileri  4.000 €  İngilizce  Fizik Teknik  4.000 €  İngilizce
Mekatronik Mühendisliği  4.000 €  İngilizce  Makine Mühendisliği  4.000 €  İngilizce
Telekomünikasyon  4.000 €  İngilizce  Üretim ve Süreç Yönetimi Mühendisliği  4.000 €  İngilizce
Enerji Mühendisliği  4.000 €  İngilizce  Endüstri Mühendisliği  4.000 €  İngilizce
İşletme  4.000 €  İngilizce  Yönetim Mühendisliği  4.000 €  İngilizce
Bilgi Teknolojileri  4.000 €  İngilizce
Mekatronik Mühendisliği  4.000 €  İngilizce
Telekomünikasyon  4.000 €  İngilizce
Enerji Mühendisliği  4.000 €  İngilizce
İşletme  4.000 €  İngilizce
LODZ MÜZİK AKADEMİSİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Ensturüman  4.000 €  İngilizce
Şan  4.000 €  İngilizce
Moda Dizayn  3.500 €  İngilizce
GDANSK TEKNOLOJİ (POLİTEKNİK) ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Mimarlık  ve Şehir Planlama  3.900 €  İngilizce  Mimarlık  3.000 €  İngilizce
Bilgisayar Bilimi Data Mühendisliği  3.900 €  İngilizce  Toefl Ielts  Otomatik Kontrol Mühendisliği ve Robotik  3.900 €  İngilizce
Makine Mühendisliği  3.900 €  İngilizce  Başvuru ücreti120€  İnşaat Mühendisliği  4.100 €  İngilizce
Enerji Mühendisliği  3.900 €  İngilizce  Elektronik Haberleşme Sistemleri ve Ağları  3.900 €  İngilizce
Yönetim  3.900 €  İngilizce  Yurt 90€* 120€  Enerji ve Yeşil Teknolojiler  3.900 €  İngilizce
Gemi İnşatı ve Gemi Makineleri Mühendisliği  3.900 €  İngilizce  Ev Kirası  200€*300€  Nano Teknoloji ve İleri Malzeme Mühendisliği  3.900 €  İngilizce
Elektrik Kontrol Mühendisliği  3.900 €  İngilizce  Tasarım Mühendisliği  3.900 €  İngilizce
Çevre Mühendisliği  4.100 €  İngilizce
Makine Mühendisliği  4.100 €  İngilizce
Okyanus Mühendisliği  4.100 €  İngilizce
GDANSK ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Tıbbi Fizik  3.250 €  İngilizce  Başvuru ücreti120€
Kuantum Fizik  3.250 €  İngilizce
Matematik  3.250 €  İngilizce  Yurt 90€* 120€
Uluslararası Ticaret  3.250 €  İngilizce  Ev Kirası  200€*300€
Avrupa İş İdaresi  3.250 €  İngilizce
Finans ve Muhasebe  3.250 €  İngilizce
Psikoloji  3.250 €  İngilizce
Mimarlık  3.250 €  İngilizce
Jeoloji  3.000 €  İngilizce
Uluslararası Ekonomik İlişkiler ve İşletme  1.550 €  İngilizce
Kriminoloji ve Ceza Hukuku  1.750 €  İngilizce
Kültürlerarası İletişim  1.500 €  İngilizce
Amerikan Kültürü ve Edebiyatı  2.000 €  İngilizce
İngiliz Dili ve Edebiyatı  2.000 €  İngilizce
Su Bilimleri ve Coğrafya  2.000 €  İngilizce
Biyoloji  2.000 €  İngilizce
Biyoteknoloji  2.000 €  İngilizce
Kimya  2.000 €  İngilizce
Hukuk  2.000 €  İngilizce
Ekonomi Bilimleri  2.000 €  İngilizce
GDANSK TIP ÜNİVERSİTESİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Tıp  10.400 €  İngilizce  Başvuru ücreti120€
Eczacılık  8.000 €  İngilizce
Biyoteknoloji  5.000 €  İngilizce  Yurt 90€* 120€
Hemşirelik  5.000 €  İngilizce  Ev Kirası  200€*300€
Beslenme ve Diyetisyenlik  5.000 €  İngilizce
GDANSK STANİSLAW MONİUSZKO  MÜZİK AKADEMİSİ  ÜCRET  DİL  EK GIDERLER BİLGİLER  YUKSEK LİSANS  ÜCRET  DİL
Popüler*Caz  4.000 €  Lehçe İngilizce
Orkestra  4.000 €  Lehçe İngilizce
Bestecilik  4.000 €  Lehçe İngilizce
Müzikal  4.000 €  Lehçe İngilizce
Vokal  4.000 €  Lehçe İngilizce
Endüstrüman  4.000 €  Lehçe İngilizce',
  '{"country": "Polonya", "chunk": 5, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','polonya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Romanya Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'ROMANYA
EK BİLGİLER
-BAKANLIK İŞLEMLERİ 4 AY SÜRMEKTEDİR.  -KAYIT DANIŞMANLIK: 1250€
-VİZE İŞLEMLERİ KONSOLOSLUK GÖRÜŞÜNDEN SONRA BİR AY SÜRÜYOR  -BÜTÜN BÖLÜMLERİN DANIŞMANLIĞI AYNIDIR.
-BANKA TEMİNATI EN AZ 4.000€  -KAYIT TAMAMLANDIKTAN SONRA EK MASRAFLAR ÇIKMAKTADIR. AÇIKÖĞRETİM VE
-İNGİLİZCE HAZIRLIK YOKTUR.  İMAMHATİP MEZUNLARININ EK MASRAFLARI DAHA FAZLADIR.
-HAZIRLIKLAR İNGİLİZCEDEN ROMENCEDİR  .
YÜKSEK LİSANS İÇİN LİSANS EVRAKLARININ TALEP EDİLİP OKULA SORULMASI GEREKİYOR
Oturum Kartı 150€
SAĞLIK RAPORU 40 €
Oturum İzni 450€
-HAZIRLIK ATLAMA İÇİN B2 DİL BELGESİ GEREKİR. HAZIRLIK ATLAMA İÇİN KAYIT İŞLEMLERİNE ERKEN BAŞVURULMALIDIR.
HAZIRLIK
BÜKREŞ DEVLET ÜNİVERSİTESİ  2.780€
ROMENCE  2.300€
BİYOLOJİ  ROMENCE  2.670€
KİMYA  ROMENCE  2.670€
HUKUK  ROMENCE  2.180€
FELSEFE  ROMENCE  2.670€
FİZİK  ROMENCE  2.300€
JEOLOJİ VE JEOFİZİK  ROMENCE  2.300€
COĞRAFYA  ROMENCE  2.300€
TARİH  ROMENCE  2.300€
GAZETECİLİK VE İLETİŞİM BİLİMLERİ  ROMENCE  2.300€
YABANCI DİLLER VE EDEBİYATI  ROMENCE  2.300€
MATEMATİK VE BİLGİSAYAR BİLİMLERİ  ROMENCE  2.300€
PSİKOLOJİ VE EĞİTİM BİLİMLERİ  ROMENCE  2.300€
SOSYOLOJİ  ROMENCE  2.180€
SOSYAL HİZMET  ROMENCE  2.180€
SİYASET BİLİMİ  ROMENCE  2.750€
ORTODOKS TEOLOJİSİ  ROMENCE  2.180€
BÜKREŞ CAROL DAVILA TIP VE ECZACILIK ÜNİVERSİTESİ
TIP FAKÜLTESİ  ROMENCE İNGİLİZCE  10.000€  HAZIRLIK FAKÜLTESİ YOKTUR.
DİŞ HEKİMLİĞİ  ROMENCE İNGİLİZCE  10.000€  HAZIRLIĞI GENELLİKLE BÜKREŞ DEVLETTE ALINIYOR.
ECZACILIK  ROMENCE İNGİLİZCE  8.500€
HAZIRLIK
BÜKREŞ İNŞAAT MÜHENDİSLİĞİ TEKNİK ÜNİVERSİTESİ (UTCB)  4.500€
İNŞAAT MÜHENDİSLİĞİ  FRANSIZCA İNGİLİZCE  2.430€
İNŞAAT, ENDÜSTİREYEL VE TASARIM  ROMENCE  2.430€  EVRAKLARIN ÇEVİRİSİNİ ROMANYA''DAN İSTİYOR.
KENTSEL MÜHENDİSLİK VE BÖLGESEL KALKINMA  ROMENCE  2.430€  TÜRKİYE''DEN HERHANGİ BİR ÇEVRİLİ EVRAK KULLANILMIYOR.
İNŞAAT MÜHENDİSLİĞİ VE YÖNETİMİ  ROMENCE  2.430€
İNŞAAT TESİSLERİ  ROMENCE  2.430€
OTOMASYON VE UYGULAMALI BİLGİSAYAR BİLİMİ  ROMENCE  2.430€
MEKATRONİK  ROMENCE  2.430€
HİDROTEKNİK GELİŞMELER VE İNŞAATLAR  ROMENCE  2.430€
SU TEMİNİ VE KANALİZASYON SİSTEMLERİ  ROMENCE  2.430€
ARAZİ ÖLÇÜMLERİ VE KADASTRO  ROMENCE  2.430€
İNŞAAT İÇİN TEKNOLOJİK EKİPMANLAR  ROMENCE  2.430€
HAZIRLIK
BÜKREŞ IONMINCU MİMARLIK ÜNİVERSİTESİ  2.780€
MİMARLIK  İNGİLİZCE  3.500€  MİMARLIK BÖLÜMÜNÜN GİRİŞİNDE ÇİZİM SINAVI VARDIR.
İÇ MİMARLIK  ROMENCE  3.500€  BİR SENE BAŞKA OKULDA HAZIRLIK EĞİTİMİ ALIRKEN ÇİZİM DERSLERİ
MİMARİ KORUMA VE RESTORASYON  ROMENCE  3.500€  ALABİLİR. BU ÜNİVERSİTEDEN BİRİNCİ SINIFTAN BAŞLAR.
KENTSEL TASARIM VE PLANLAMA  ROMENCE  3.500€
PEYZAJ VE PLANLAMA  ROMENCE  3.500€
ÜRÜN TASARIMI  ROMENCE  3.500€
MOBİLYA VE İÇ TASARIM  ROMENCE  3.500€
HAZIRLIK
BÜKREŞ ASE EKONOMİ ÜNİVERSİTESİ  2.700€
YÖNETİM VE KAMU YÖNETİMİ  ROMENCE  2.700€
İŞ VE TURİZM  İNGİLİZCE ROMENCE  2.700€
SİBERNETİK, İSTATİSTİK VE EKONOMİK BİLİŞİM  İNGİLİZCE ROMENCE  2.700€
MUHASEBE VE YÖNETİM BİLİŞİMİ  İNGİLİZCE ROMENCE  2.700€
HUKUK  ROMENCE  2.700€
TEORİK VE UYGULAMALI İKTİSAT  ROMENCE  2.700€
TARIM VE ÇEVRE EKONOMİSİ  ROMENCE  2.700€
İŞLETME  FRANSIZCA ALMANCA İNGİLİZCE  2.700€
FİNANS, SİGORTA, BANKALAR VE BORSALAR  İNGİLİZCE ROMENCE  2.700€
PAZARLAMA  İNGİLİZCE ROMENCE  2.700€
ULUSLARASI EKONOMİK İLİŞKİLER  İNGİLİZCE ROMENCE FRANSIZCA  2.700€
HAZIRLIK
BÜKREŞ ULUSAL SPOR VE KINEZITERAPI ÜNİVERSİTESİ  2.780€
BEDEN VE SPOR EĞİTİMİ  FRANSIZCA ROMENCE  2.400€
FİZİK SPOR VE KİNEZİTERAPİÖZEL MOTRİS ÇALIŞMALARI  ROMENCE  2.400€
SPOR VE MOTOR PERFORMANSI  İNGİLİZCE  2.400€
SPOR YÖNETİMİ VE PAZARLAMA  ROMENCE  2.400€
GÜVENLİK KORUMA  ROMENCE  2.400€
KRİMİNOLOJİ  ROMENCE  2.400€
FİTNESS VE REKREASYON  ROMENCE  2.400€
BEDEN EĞİTİMİ VE SPOR ÖĞRETMENLİĞİ  ROMENCE  2.400€
OTEL, TURİZM VE EĞLENCE HİZMETLERİ  ROMENCE  2.400€
ANTRANÖRLÜK (ATLETİZM, ASKERİ, JİMNASTİK, YÜZME OYUN TEORİSİ)  ROMENCE  2.400€
HAZIRLIK
BÜKREŞ POLİTEKNİK ÜNİVERSİTESİ  2.430€
ÖLÇÜMLER, ELEKTRİKLİ CİHAZLAR VE STATİK DÖNÜŞTÜRÜCÜLER  ROMENCE İNGİLİZCE  2.430€
ELEKTRİK MÜHENDİSLİĞİ  ROMENCE İNGİLİZCE  2.430€
MAKİNE, MALZEME VE ELEKTRİKLİ SİSTEMLERİ  ROMENCE  2.430€
ENERJİ ÜRETİMİ VE KULLANIMI  ROMENCE  2.430€
ELEKTRİK GÜÇ SİSTEMLERİ  ROMENCE  2.430€
HİDROLİK, HİDROLİK MAKİNALARVE ÇEVRE MÜHENDİSLİĞİ  ROMENCE  2.430€
OTOMASYON VE SİSTEM MÜHENDİSLİĞİ  ROMENCE  2.430€
OTOMASYON VE ENDÜSTRİYEL BİLİŞİM  ROMENCE  2.430€
BİLGİSAYAR  ROMENCE  2.430€
KİMYA MÜHENDİSLİĞİ  ROMENCE  2.430€
TELEKOMÜNİKASYON  ROMENCE  2.430€
ELEKTRONİK CİHAZLAR, DEVRELER VE MİMARİLER  ROMENCE  2.430€
UYGULAMALI ELEKTRONİK VE ENFORMASYON MÜHENDİSLİĞİ  ROMENCE  2.430€
MAKİNA MÜHENDİSLİĞİ  ROMENCE İNGİLİZCE  2.430€
ENDÜSTRİ MÜHENDİSLİĞİ VE İŞLETME  ROMENCE  2.430€
ENDÜSTRİ MÜHENDİSLİĞİ  İNGİLİZCE  2.430€
ELEKTRİK MÜHENDİSLİĞİ  ROMENCE İNGİLİZCE  2.430€
ROBOTİK  ROMENCE  2.430€
KALİTE MÜHENDİSLİĞİ  ROMENCE  2.430€
GIDA MÜHENDİSLİĞİ  ROMENCE  2.430€
OTOMOTİV MÜHENDİSLİĞİ  ROMENCE  2.430€
MALZEME BİLİMİ  ROMENCE  2.430€
TIBBİ MÜHENDİSLİĞİ  ROMENCE  2.430€
BİYOMÜHENDİSLİK  ROMENCE  2.430€
KİMYA MÜHENDİSLİĞİ  ROMENCE  2.430€
FİZİK MÜHENDİSLİĞİ  ROMENCE  2.430€
UYGULAMALI MATEMATİK BÖLÜMÜ  ROMENCE  2.430€
FİZİK MÜHENDİSLİĞİ  ROMENCE  2.430€
TIBBİ EKİPMANLAR VE SİSTEMLER  ROMENCE İNGİLİZCE  2.430€
HAZIRLIK
BÜKREŞ TARIM VE VETERİNERLİK ÜNİVERSİTESİ  2.780€
VETERİNERLİK  ROMENCE FRANSIZCA İNGİLİZCE  6.030€
ZİRAAT MÜHENDİSLİĞİ  ROMENCE  3.000€
BAHÇE BİTKİLERİ  ROMENCE  3.000€
HAYVANSAL ÜRETİM MÜHENDİSLİĞİ VE YÖNETİMİ  ROMENCE  3.000€
HAYVANSAL VE BİTKİSEL GIDA TEKNOLOJİLERİ MÜHENDİSLİĞİ  ROMENCE  3.000€
ÇEVRE VE YER ÖLÇÜMLERİ MÜHENDİSLİĞİ  ROMENCE  3.000€
BİYOTEKNOLOJİ  ROMENCE  3.000€
ENDÜSTRİYEL BİYOTEKNOLOJİ  ROMENCE  3.000€
KIRSAL İKTİSADİKALKINMA VE TURİZM  ROMENCE  3.000€
KIRSAL KALKINMA VE YÖNETİM  ROMENCE  3.000€
HAZIRLIK
ROMEN AMERİKAN ÜNİVERSİTESİ  3.400€
ULUSLARARASI İLİŞKİLER  İNGİLİZCE  3.400€
HUKUK  ROMENCE  3.400€
MUHASEBE VE YÖNETİM BİLİŞİMİ  ROMENCE  3.400€
FİNANS VE BANKALAR  ROMENCE  3.400€
BEDEN VE SPOR EĞİTİMİ  ROMENCE  3.400€
FİZYOTERAPİ VE ÖZEL MOTRİSİTE  ROMENCE  3.400€
EKONOMİK BİLİŞİM  İNGİLİZCE  3.400€',
  '{"country": "Romanya", "chunk": 1, "total_chunks": 3}'::jsonb,
  ARRAY['ulke','romanya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Romanya Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'İŞLETME  ROMENCE  3.400€
PAZARLAMA  İNGİLİZCE  3.400€
RTİCARET, TURİZM VE HİZMET EKONOMİSİ  ROMENCE  3.400€
HAZIRLIK
CLUJ BABES BOLYAI ÜNİVERSİTESİ  3.015€
MATEMATİK  ROMENCE  3.000€
BİLGİSAYAR BİLİMİ  ROMENCE İNGİLİZCE  4.000€ - 5.000€
YAPAY ZEKA  İNGİLİZCE  5.000€
BİLGİSAYAR MÜHENDİSLİĞİ  ROMENCE  5.000€
FİZİK  ROMENCE  3.600€
TIBBİ FİZİK  ROMENCE  3.600€
FİZİK MÜHENDİSLİĞİ  ROMENCE  3.600€
BİLGİSAYAR BİLİMİYLE FİZİK  ROMENCE  3.600€
KİMYA  ROMENCE  4.500€
KİMYA MÜHENDİSLİĞİ  ROMENCE  4.500€
BİYOKİMYA MÜHENDİSLİĞİ  ROMENCE  4.500€
BİYOLOJİ  ROMENCE  3.500€
JEOLOJİ  ROMENCE  3.500€
JEODEZİ MÜHENDİSLİĞİ  ROMENCE  3.500€
EKOLOJİ MÜHENDİSLİĞİ  ROMENCE  3.500€
EKOLOJİ VE ÇEVRE KORUMA  ROMENCE  3.500€
BÖLGESEL PLANLAMA  ROMENCE  3.500€
COĞRAFYA  ROMENCE  3.500€
HİDROLOJİ VE METEROLOJİ  ROMENCE  3.500€
ÇEVRE MÜHENDİSLİĞİ  ROMENCE  4.000€
ÇEVRE BİLİMİ  ROMENCE  4.000€
ÇEVRE YÖNETİMİ VE DENETİMİ  ROMENCE  4.000€
HUKUK  ROMENCE  5.000€
KLASİK FİLOLOJİ  ROMENCE  3.600€
İNGİLİZ, PORTEKİZ, ROMEN, KORE, JAPON,NORVEÇ DİLİ VE EDEBİYATI  ROMENCE  3.600€
UYGULAMALI MODERN DİLLER  ROMENCE  3.600€
KÜLTÜREL ÇALIŞMALAR  ROMENCE  3.600€
FELSEFE  ROMENCE  3.000€
ARKEOLOJİ  ROMENCE  3.000€
ARŞİV ÇALIŞMALARI  ROMENCE  3.000€
SANAT TARİHİ  ROMENCE  3.000€
ULUSLARARASI İLİŞKİLER VE AVRUPA ÇALIŞMALARI  ROMENCE  3.000€
KÜLTÜR TURİZMİ  ROMENCE  3.000€
SOSYOLOJİ  ROMENCE  3.500€
SOSYAL HİZMET  ROMENCE  3.500€
PSİKOLOJİ  ROMENCE  4.500€
PEDAGOJİ  ROMENCE  3.800€
İLKÖĞRETİM VE OKUL ÖNCESİ EĞİTİM PEDAGOJİSİ  ROMENCE  6.400€
İŞLETME VE BİLGİ SİSTEMLERİ  İNGİLİZCE  4.900€
PAZARLAMA  ROMENCE  4.900€
İŞLETME VE BİLGİ SİSTEMLERİ  İNGİLİZCE  4.900€
FİNANS  ROMENCE  4.900€
EKONOMİ VE ULUSLARARASI İLİŞKİLER  ROMENCE  4.900€
EKONOMİ VE ULUSLARARASI İLİŞKİLER  ROMENCE  4.900€
MUHASEBE  ROMENCE  4.900€
TİCARET, TURİZM VE HİZMET EKONOMİSİ  ROMENCE  4.900€
KAMU YÖNETİMİ  ROMENCE  4.900€
İLETİŞİM VE HALKLA İLİŞKİLER  ROMENCE  4.900€
GAZETECİLİK  ROMENCE  4.900€
REKLAMCILIK  ROMENCE  4.900€
DİJİTAL MEDYA  ROMENCE  4.900€
SİYASET BİLİMİ  ROMENCE  4.900€
BEDEN EĞİTİMİ VE SPOR  ROMENCE  4.500€
MÜZİK  ROMENCE  3.200€
TİYATRO  ROMENCE  5.000€
SİNE, FOTOĞRAF VE MEDYA  ROMENCE  8.000€
FİLM ÇALIŞMALARI  ROMENCE  5.000€
OYUNCULUK  ROMENCE  6.500€
YÖNETMENLİK  ROMENCE  6.500€
MAKİNA MÜHENDİSLİĞİ  ROMENCE  3.000€
ELEKTRİK MÜHENDİSLİĞİ  ROMENCE  3.000€
HAZIRLIK
CLUJ TEKNİK ÜNİVERSİTESİ
BİLGİSAYAR BİLİMİ  İNGİLİZCE  2.700€
BİLGİSAYAR MÜHENDİSLİĞİ  İNGİLİZCE  2.700€
OTOMASYON VE KONTROL MÜHENDİSLİĞİ  İNGİLİZCE  2.700€
ŞEHİR PLANLAMA  İNGİLİZCE  2.700€
MİMARLIK  İNGİLİZCE  2.700€
ROBOTİK  İNGİLİZCE  2.700€
MAKİNA YAPIMI  ROMENCE  2.700€
MEKATRONİK MÜHENDİSLİĞİ  ROMENCE  2.700€
İNŞAAT MÜHENDİSLİĞİ  ROMENCE  2.700€
MEKATRONİK MÜHENDİSLİĞİ  ROMENCE  2.700€
İNŞAAT MÜHENDİSLİĞİ  ROMENCE  2.700€
ULAŞTIRMA MÜHENDİSLİĞİ  ROMENCE  2.700€
MALZEME VE ÇEVRE MÜHENDİSLİĞİ  ROMENCE  2.700€
YAPI HİZMETLERİ MÜHENDİSLİĞİ  ROMENCE  2.700€
HAZIRLIK  CLUJ Üniversitesi''nde Kayıt İçin Gerekli Evraklar
CLUJ NAPOCA TIP ÜNİVERSİTESİ  2.700€
TIP  İNGİLİZCE  10.000€  İmam-hatıp, meslek lisesi, temel lise kabul edilmiyor.  1.⁠ ⁠Tüm belgelerin orijinallerine apostil yapılması gerekmektedir.
DİŞ HEKİMLİĞİ  İNGİLİZCE  10.000€  2.⁠ ⁠Apostil işleminden sonra belgelerin noter tasdikli tercümeleri yapılmalıdır.
ECZACILIK  İNGİLİZCE  10.000€  3.⁠ ⁠Tercüme edilen belgelere tekrar apostil yapılmasına gerek yoktur.
HEMŞİRELİK  ROMENCE  3.500€  4.⁠ ⁠Öğrencinin hayatı boyunca almış olduğu tüm sertifikalar gereklidir.
RADYOLOJİ VE GÖRÜNTÜLEME  ROMENCE  3.500€  Örneğin: takdir belgesi, yüzme sertifikası, ilk yardım sertifikası vb.
BESLENME DİYETİSYENLİK  ROMENCE  3.500€  Bu sertifikalara da noterli tercüme yapılması gerekmektedir.
5.⁠ ⁠Öğrencinin CV hazirlamali ve  hazırladığı CV’de yer alan sertifikalar da eklenmelidir.
6.⁠ ⁠Öğrenci tıp fakültesi başvurusu için İngilizce veya Türkçe bir mektup yazmalıdır. ing
HAZIRLIK  7.⁠ ⁠Öğrenci, çeşitli doktorlardan tıp okumaya uygun olduğunu belirten referans mektupları almalıdır.
IAŞI G.ASACHI TEKNİK ÜNİVERSİTESİ  8.⁠ ⁠Öğrencinin geçmişte girmiş olduğu ÖSS sınav sonuçları sunulmalıdır.
İNŞAAT MÜHENDİSLİĞİ  ROMENCE  3.000€  9.⁠ ⁠İngilizce eğitim almak isteyen öğrenciler için B2 seviyesinde TOEFL, IELTS veya Cambridge sertifikası zorunludur.
TELEKOMÜNİKASYON TEKNOLOJİLERİ VE SİSTEMLERİ  ROMENCE  3.500€
ENDÜTRİYEL TASRIM  ROMENCE  2.430€
HAZIRLIK
GRIGORE T. POPA IAŞI TIP VE ECZACILIK ÜNİVERSİTESİ  4.000€
TIP  İNGİLİZCE  8.500€
DİŞ HEKİMLİĞİ  İNGİLİZCE  8.500€
ECZACILIK  İNGİLİZCE  7.500€
TIBBİ BİYOMÜHENDİSLİK  ROMENCE  4.500€
FİZYOTERAPİ VE REHABİLİTASYON  ROMENCE  3.500€
HAZIRLIK
KÖSTENCE OVİDİUS ÜNİVERSİTESİ  2.300€
TIP  ROMENCE İNGİLİZCE  7.500€
DİŞ HEKİMLİĞİ  ROMENCE İNGİLİZCE  7.500€
ECZACILIK  ROMENCE İNGİLİZCE  6.000€
HİDROTEKNİK YAPILAR VE İNŞAATLAR  ROMENCE  3.000€
HUKUK  ROMENCE  2.500€
KAMU YÖNETİMİ  ROMENCE  2.500€
BEDEN EĞİTİMİ VE SPOR ÖĞRETMENLİĞİ  ROMENCE  3.000€
DENİZ EKİPMANLARI VE KURULUMU  ROMENCE  2.700€
OTOMOTİV MÜHENDİSLİĞİ  ROMENCE  2.700€
ENDÜSTRİYEL GÜÇ MÜHENDİSLİĞİ  ROMENCE  2.700€
ENDÜSTRİYEL GÜÇ MÜHENDİSLİĞİNDE UYGULAMALI BİLİŞİM  ROMENCE  2.700€
MAKİNA MÜHENDİSLİĞİ  ROMENCE  2.700€
TARİH  ROMENCE  3.500€
ULUSLARARASI İLİŞKİLER VE AVRUPA ÇALIŞMALARI  ROMENCE  3.500€
SİYASET BİLİMİ  ROMENCE  3.500€
FRANSIZ DİLİ VE EDEBİYATI  ROMENCE  2.700€
İNGİLİZ DİLİ VE EDEBİYATI  ROMENCE  2.700€
AMERİKAN ÇALIŞMALARI  İNGİLİZCE  2.700€
GAZETECİLİK  ROMENCE  2.200€
BİLİŞİM  ROMENCE  3.700€
BİLGİSAYAR BİLİMİ  ROMENCE  3.700€
PSİKOLOJİ  ROMENCE  3.200€
İLKÖĞRETİM VE OKUL ÖNCESİ PEDAGOJİSİ  ROMENCE  3.200€
ÖZEL PEDAGOJİ  ROMENCE  3.200€
BİYOLOJİ  ROMENCE  2.700€
TURİZM COĞRAFYASI  ROMENCE  2.700€
COĞRAFYA  ROMENCE  2.700€
EKOLOJİ VE ÇEVRE KORUMA  ROMENCE  2.700€
İŞLETME YÖNETİMİ  İNGİLİZCE  2.200€
TİCARET, TURİZM VE HİZMETLER EKONOMİSİ  ROMENCE  2.200€
MUHASEBE VE FİNANSAL YÖNETİM  İNGİLİZCE  2.200€
ULUSLARARASI İŞLETME FİNANS VE BANKACILIK  İNGİLİZCE  2.200€
PAZARLAMA  İNGİLİZCE  2.200€
İŞLETME  İNGİLİZCE  2.200€
HAZIRLIK',
  '{"country": "Romanya", "chunk": 2, "total_chunks": 3}'::jsonb,
  ARRAY['ulke','romanya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Romanya Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'KÖSTENCE DENİZCİLİK ÜNİVERSİTESİ
NAVİGASYON VE DENİZYOLU TAŞIMACILIĞI  İNGİLİZCE  3.000€
DENİZ MÜHENDİSLİĞİ  İNGİLİZCE  3.000€
ELEKTRİK MÜHENDİSLİĞİ  ROMENCE  3.000€',
  '{"country": "Romanya", "chunk": 3, "total_chunks": 3}'::jsonb,
  ARRAY['ulke','romanya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Rusya Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'RUSYA ÜNİVERSİTELERİ
-KAYIT DANIŞMANLIK 1550 USD
-YAŞ SINIRI VE LİSE DİPLOMA PUANI ÖNEMLİDİR. 25 YAŞ ÜSTÜ HER OKULA ALINMAZ SADECE RUDİN ALIR.
-VİZELİ BİR ÜLKEDİR. VİZE BİR HAFTADA ÇIKAR. ORTALAMA 180 USD
-BÜTÜN ÖĞRENCİLER YURTTA KALIYOR ORTALAMA 200 USD
QS  THE  CWTS  ARWU(SHANGHAİ)
RUSYA
MOSKOVA FİZİK VE TEKNOLOJİ ENSTİTÜSÜ  418  201-250  -  İLK BİNDE
SAİNT PETERSBURG DEVLET ÜNİVERSİTESİ  315  -  495  İLK BİNDE
NOVOSİBİRSK DEVLET ÜNİVERSİTESİ  421  601-800  421  İLK BİNDE
URAL FEDERAL ÜNİVERSİTESİ RUSYA  473  801-1000  898  İLK BİNDE
EYO ÜNİVERSİTESİ  399  401-500  823  701-800
SEÇENOV ÜNİVERSİTESİ  771-780  801  -  İLK BİN
KAZAN FEDERAL ÜNİVERSİTESİ  396  801-1000
ULUSAL ARAŞTIRMA NÜKLEER ÜNİVERSİTESİ  461  401-500  İLK BİN
RUDN ÜNİVERSİTESİ  342  601-801
LOMONOSOV MOSKOVA DEVLET ÜNİVERSİTESİ  95 (!)  219  101-150
KAZAN FEDERAL ÜNİVERSİTESİ  DİL  ÜCRET  EK GİDERLER  YUKSEKLİSANS  DİL  ÜCRET  DOKTORA 2450$ Yıllık
Tıp  İngilizce*Rusça  8750$*6450$  Hazırlık İngilizce Paketi 5250$  Biyoloji  İngilizce  4730$  Matematik
Diş hekimliği  İngilizce*Rusça  8750$*6350$  Hazırlık Rusça Paketi  4350$  Fizik  İngilizce  4730$  Bilişim ve Bilgisayar
Eczacılık  Rusça  4550$  Radyofizik  İngilizce  4730$  Elektronik
Klinik Psikoloji (5 Yıl)  Rusça  2350$  Yurt 120$ Yıllık  Jeoloji  İngilizce  4730$  Radyo Teknolojisi ve İletişim
Hukuk  Rusça  3000$  YURT 100$ yıllık  İlahiyat  İngilizce  4400$  Bilgisayar Bilimi BT
İşletme  İngilizce*Rusca  3750$*3100$  Sağlık Sigortası 160$  Genel ve Stratejik İşletme  İngilizce  4400$  Mekanik  ve Matematik
Turizm  İngilizce  2350$  Matematik  İngilizce  4400$  Fizik ve Astronomi
Biyoloji  İngilizce*Rusca  4550$*2350$  1 Ekim Son Basvuru  Yazılım Mühendisliği  İngilizce  4650$  Yer Bilimleri
Patoloji  Rusça  2850$  8*19 ay Dil eğitimi  Kimya
Hotel İşletmeciliği  Rusça  2350$  6*14 Kişilik Sınıflarda  Hazırlık  Teknolojik Sistemlerin Yönetimi
Sosyoloji  Rusça  2350$  4. Ayda Kayıtlar Baslar  Malzeme Mühendsiliği
Kamu Yönetimi  Rusça  2850$  Davetiyeler 21 İş gününde Cıkar genelde  Makine yapımı ve İnsaası
Tarih  Rusça  2500$  Kara Taşımacılığı Teknolojisi
Hukuk  Rusça  2500$  Tarih ve Arkeoloji
İnsan Kaynakları Yönetimi  Rusça  2350$  Felsefe ve Din Çalışmaları
Matematik  Rusça  2350$  Kitle İletişimi
Kimya  Rusça  2350$  Ekonomi
Fizik  Rusça  2350$  Siyaset Bilimi
Cografya  Rusça  2350$  Hukuk
Biyomedikal Mühendisliği  Rusça  2600$  Sosyoloji
Bilgisayar Mühendisliği  Rusça  2600$  Psikoloji
Nano Teknoloji  Rusça  3620$  Eğitim Yönetimi
Mikrosistem Mühendisliği  Rusça  3620$  Dil Bilimleri
Makine Mühendisliği  Rusça  2600$
Bilgi sistemleri ve Teknolojileri  Rusça  2600$
Jeoloji  Rusça  2350$
Cevre Mühendisliği  Rusça  2850$
Hidrometroloji (Su Muhendisliği)  Rusça  2850$
Ekoloji ve Doğal Araştırmalar Yöntemi  Rusça  2850$
Harita Kadastro  Rusça  2850$
Toprak Bilimi ve Bitki Yetiştirme  Rusça  2850$
Teoloji  Rusça  2350$
Sanat Tarihi  Rusça  2350$
Felsefe  Rusça  2350$
Siyasal Bilimler  Rusça  2600$
Uluslararası İlişkiler  Rusça  2850$
Psikoloji  Rusça  2350$
Reklamcılık ve Halkla İlişkiler  Rusça  2350$
Radyo ve Televizyon  Rusça  2350$
Gazetecilik  Rusça  2350$
Medya ve İletişim  Rusça  2350$
Uygulamalı Kimya  Rusça  2850$
Uygulamalı Mekanik  Rusça  2850$
Uygulamalı Bilgisayar  Rusça  2850$
Uygulamalı Matematik Enformatik  Rusça  2350$
Matematik ve Uygulamalı Bilgisayar  Rusça  2350$
Kalite Yonetimi  Rusça  2350$
Mekanik ve Matematiksel Modelleme  Rusça  2350$
Grafik Dizayn  Rusça  2850$
Müzik ve Uygulamalı Müzik  Rusça  2850$
Beden Eğitimi ve Spor  Rusça  2400$
Mutercim Tercumanlık (Rusça*Çince)  Rusça  2400$
Mutercim Tercumanlık (Rusça*Korece)  Rusça  2400$
Dil Bilimi  Rusça  2400$
Rus Dili ve Edebiyatı  Rusça  2350$
İspanyol Dili ve Edebiyatı  Rusça  2850$
Alman Dili ve Edebiyatı  Rusça  2850$
Yazılım Mühendisliği  Rusça  2600$
URAL FEDERAL ÜNİVERSİTESİ  DİL  ÜCRET  EK GİDERLER  YUKSEKLİSANS  DİL  ÜCRET
Tarih  Rusça  270.000 Ruble  Rusça Hazırlık 190.000 RUB  Tarih  Rusça  245.000 Ruble
Felsefe  Rusça  245.000 Ruble  Felsefe  Rusça  245.000 Ruble
Beden Eğitimi  Rusça  310.000 Ruble  Yurt 30$-60$  Beden eğitimi  Rusça  314.000 Ruble
Sanat tarihi  Rusça  428.000 Ruble  2*3-4 kişilik odalar  Sanat Tarih  Rusça  245.000 Ruble
Mimarlık  Rusça  310.000 Ruble  Sigorta 160$  Tasarım  Rusça  456.000 Ruble
İnşaat Mühendisliği  Rusça  310.000 Ruble  Mühendislik ve Teknoloji Bölümeri  Rusça  279.000 Ruble
Bilgisayar Bilimleri ve Bilgisayar Mühendisliği  Rusça  329.000 Ruble  Yazılım Mühendisliği  Rusça  456.000 Ruble
Yazılım Mühendisliği  Rusça  329.000 Ruble  Bilgisayar Bilimi/Pratik Yapay Zeka  İngilizce  312.000 Ruble
Elektrik Mühendisliği  Rusça  301.000 Ruble  Elektrik ve Elektrik Mühendisliği  İngilizce  312.000 Ruble
Makine Mühendisliği  Rusça  270.000 Ruble  Biyoteknoloji  İngilizce  312.000 Ruble
Kimya Mühendisliği  Rusça  301.000 Ruble  Tıbbi Biyokimya  Rusça  310.000 Ruble
Psikoloji  Rusça  301.000 Ruble  Tıbbi Biyofizik  Rusça  310.000 Ruble
Matematik  Rusça  245.000 Ruble  Eczane  Rusça  270.000 Ruble
Fizik  Rusça  270.000 Ruble  Klinik Psikoloji  Rusça  310.000 Ruble
Kimya  Rusça  270.000 Ruble  Psikoloji  Rusça  245.000 Ruble
Biyoloji  Rusça  270.000 Ruble  Temel ve Uygulamalı Fizik  Rusça  270.000 Ruble
Ekonomi  Rusça  301.000 Ruble  Astronomi  Rusça  270.000 Ruble
İnsan Kaynakları Yönetimi  Rusça  270.000 Ruble  Temel ve Uygulamalı Kimya  Rusça  270.000 Ruble
Kamu Yönetimi  Rusça  329.000 Ruble  Matematik  Rusça  245.000 Ruble
Siyaset Bilimi  Rusça  270.000 Ruble  Fizik-Kimya-Biyoloji  Rusça  279.000 Ruble
Uluslararası İlişkiler  Rusça  329.000 Ruble  Fizik ve Astronomi  İngilizce  391.000 Ruble
Halkla İlişkiler ve Reklamcılık  Rusça  329.000 Ruble  Ekonomik Güvenlik  Rusça  301.000 Ruble
Gazetecilik  Rusça  329.000 Ruble  Gümrük  Rusça  301.000 Ruble
Medya İletişimi  Rusça  329.000 Ruble  Adli Bilimler  Rusça  301.000 Ruble
Turizm  Rusça  270.000 Ruble  Ekonomi  İngilizce  428.000 Ruble',
  '{"country": "Rusya", "chunk": 1, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','rusya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Rusya Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'Otel İşletmeciliği  Rusça  245.000 Ruble  Sosyoloji  Rusça  245.000 Ruble
Uluslararası İlişkiler  Rusça  245.000 Ruble
Gazetecilik  Rusça  245.000 Ruble
Medya İletişimi  Rusça  245.000 Ruble
Halkla İlişkiler ve Reklamcılık  İngilizce  274.000 Ruble
LOMONOSOV MOSKOVA DEVLET  ÜNİVERSİTESİ  YUKSEKLİSANS  DİL  ÜCRET
Tıp  Rusça  734.000 Ruble  Biyoloji (2 yıl)  İngilizce  425.000 Ruble
Eczacılık  Rusça  634.000 Ruble  Rusça Hazırlık var. 565.500 Ruble  Nanobiyoteknoloji (2 yıl)  İngilizce  425.000 Ruble
Uygulamalı Matematik ve Bilgisayar Bilimleri  Rusça  539.070 Ruble  Eylül/ Ekim- Temmuz arasında eğitim.  Kimya (2 yıl)  İngilizce  666.700 Ruble
Hukuk  Rusça  720.000 Ruble  Radyofarmasötik Kimya (2 yıl)  İngilizce  666.700 Ruble
Temel Bilişim ve Bilgi Teknolojileri  Rusça  539.070 Ruble  Bütün bölümlerde alan dersi ve Rusça sınavı var.  Geometri ve kuantum alanları/ Matematik (2 yıl)  İngilizce  492.930 Ruble
Kimya  Rusça  455.990 Ruble  Uluslararası İşletme Yönetimi (2 yıl)  İngilizce  520.000 Ruble
Temel ve Uygulamalı Kimya  Rusça  455.990 Ruble  Uluslararası İlişkiler (2 yıl)  İngilizce  418.470 Ruble
Temel Matematik ve Mekanik  Rusça  409.980 Ruble  Yüksek Lisans programlarında giriş sınavı şartı istenebilir.  Siyaset Bilimi (2 yıl)  İngilizce  418.470 Ruble
Biyoloji  Rusça  575.240 Ruble  İngilizce Yüksek Lisans programları B2 İngilizce ister.  Uluslararası İlişkiler ve Ekonomi Diplomasisi (2 yıl)  İngilizce  418.470 Ruble
Ekoloji ve Doğa Yönetimi  Rusça  460.000 Ruble  Jeoloji (2 yıl)  İngilizce  465.450 Ruble
Coğrafya  Rusça  575.240 Ruble  Psikoloji (670 akademik saat)  İngilizce  400.000 Ruble
Haritacılık ve Jeoinformatik  Rusça  575.240 Ruble
Hidroloji/ Metalurji  Rusça  575.240 Ruble
Radyoekoloji ve Ekoteknoloji  Rusça  460.000 Ruble
Turizm  Rusça  539.070 Ruble
Toprak Bilimi  Rusça  460.000 Ruble
Matematik ve Matematiksel Fizik  Rusça  409.980 Ruble
Tarih /Felsefe  Rusça+İngilizce  411.070 Ruble
Sanat Tarihi  Rusça+İngilizce  411.070 Ruble
Reklamcılık ve Halkla İlişkiler/ TV  Rusça  449.960 Ruble
Dil Bilimi/ Modern ve Kültürel Rus Dili  Rusça  420.000 Ruble
Girişimcilik  Rusça  570.000 Ruble
Klinik Psikoloji (Uzmanlık 6 YIL)  Rusça  448.710 Ruble
Hizmet Faaliyeti Psikolojisi (Uzmanlık 6 YIL)  Rusça  448.710 Ruble
Filoloji ( Rus Dili Edebiyatı)  Rusça  449.960 Ruble
İşletme/ Yönetim  Rusça  539.070 Ruble
İnsan Kaynakları Yönetimi  Rusça  539.070 Ruble
Devlet ve Belediye Yönetimi  Rusça  539.070 Ruble
Siyaset Bilimi  Rusça  539.070 Ruble
Uluslararası İlişkiler  Rusça  449.960 Ruble
Siyaset Yönetimi ve Halkla İlişkiler  Rusça  539.070 Ruble
Sosyoloji  Rusça  412.000 Ruble
Temel Mekanik  Rusça  409.980 Ruble
Jeoloji (Lisans+ Yükseklisans)  Rusça  455.990 Ruble
Güzel Sanatlar( Güzel Sanatlar Teorisi, Müzik, Resim, Dans)  Rusça  539.070 Ruble
Fizik Coğrafyası ve Peyzaj Bilimi  Rusça  460.000 Ruble
MOSKOVA DEVLET HAVACILIK ÜNİVERSİTESİ  DİL  ÜCRET  YÜKSEK LİSANS  DİL  ÜCRET
Uçak Mühendisliği  Rusça  3900$ - 380.000 Ruble  İngilizce Hazırlık Paket Ücreti 5050$  Uçak Mühendisliği (2 yıl)  İngilizce  500.000 Ruble
Uçak Mühendisliği  İngilizce  5100$- 500.000 Ruble  Rusça Hazırlık Paket Ücreti  4150$  Uzay Aracı Mühendisliği (2 yıl)  İngilizce  500.000 Ruble
Havacılık Ekipmanları bakım ve Onarımı  İngilizce  5100$- 500.000 Ruble  Mühendislikte Kontrol Sistemleri ve Bilgisayar Bilimleri (2 yıl)  İngilizce  500.000 Ruble
Uzay Aracı Mühendisliği  Rusça  3900$ - 380.000 Ruble  İngilizce sadece hazırlık ücreti 3500$ - 280.000 ruble  Uçak Sevk Mühendisliği  İngilizce  500.000 Ruble
Uzay Aracı Mühendisliği  İngilizce  5100$- 500.000 Ruble  Rusça sadece hazırlık ücreti 2600$ - 250.000 ruble  Uçak Mühendisliği (2 yıl)  Rusça  440.000 Ruble
Uçak Sevk Mühendisliği  Rusça  3900$ - 380.000 Ruble  Uzay Aracı Mühendisliği (2 yıl)  Rusça  440.000 Ruble
Robotik ve Akıllı Sistemler  Rusça  3900$ - 380.000 Ruble  Mühendislikte Kontrol Sistemleri ve Bilgisayar Bilimleri (2 yıl)  Rusça  440.000 Ruble
Ekonomi Yönetimi ve Dil Bilimi  Rusça  3900$ - 380.000 Ruble  Uçak Sevk Mühendisliği  Rusça  440.000 Ruble
Malzeme Bilimi ve Teknolojisi  Rusça  3900$ - 380.000 Ruble  Radyo Elektroniği ve İletişim Sistemleri (2 yıl)  Rusça  440.000 Ruble
Matematik ve Bilgisayar Bilimi  Rusça  3900$ - 380.000 Ruble  Matematik ve Bilgisayar Bilimi (2 yıl)  Rusça  440.000 Ruble
Uçak Sevk Mühendisliği  İngilizce  5100$- 500.000 Ruble  Malzeme Bilimi ve Teknolojisi (2 yıl)  Rusça  440.000 Ruble
Araç İçi Elektroniği ve Teknik Sibernetik  Rusça  3900$ - 380.000 Ruble
MOSKOVA DEVLET TEKNİK ÜNİVERSİTESİ  DİL  ÜCRET  EK GİDERLER  DOKTORA  DİL  ÜCRET
Uygulamalı matematik ve bil. Bilim  Rusça  270119 RUBLE  Hazırlık Rusça Paketı 6750$  Yüksek ögrenim uzmanlıkları  - uzmanlık  Rusça  302533 RUBLE
Uygulamalı matematik  Rusça  270119 RUBLE  Bilgisaya güvenligi  Rusça  302533 RUBLE
Matematik ve bilgisayar bilimi  Rusça  270119 RUBLE  YURT ÜCRETİ  Otomatik sistemlerin bilgi güvenliği  Rusça  302533 RUBLE
Bilişim ve bilgisayar Mühendisliği  Rusça  302533 RUBLE  60$-100$  Karşı teknik istihbahrat  Rusça  302533 RUBLE
Bilgi sistemleri ve teknolojileri  Rusça  302533 RUBLE  SİGORTA  Elektronik sistemler ve kompleksler  Rusça  302533 RUBLE
Yazılım mühendisliği  Rusça  302533 RUBLE  SAĞLIK MUAYENESİ  Özel amaçlı elek. Ve optoelek cih. Ve sis  Rusça  302533 RUBLE
Elektronik tasarım ve teknolojileri  Rusça  302533 RUBLE  Nükleer reaktörler ve malzemeler  Rusça  350300 RUBLE
Elektronik ve nanoelektronik  Rusça  302533 RUBLE  Teknolojik makine ve komplekslerin tasarımı  Rusça  302533 RUBLE
Optik Mühendisliği  Rusça  302533 RUBLE  Özel yaşam destek sistemleri  Rusça  350300 RUBLE
Biyonteknik sistemler ve tekolojiler  Rusça  302533 RUBLE  Mühimmat ve sigortalar  Rusça  350300 RUBLE
Lazer teknolojisi ve lazer teknolojisi  Rusça  302533 RUBLE  Küçük silahlar,Topçu ve roket silahları  Rusça  350300 RUBLE
Elektrik Mühendisliği  Rusça  302533 RUBLE  Kara taşımacılığı  teknolojik araçlar  Rusça  302533 RUBLE',
  '{"country": "Rusya", "chunk": 2, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','rusya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Rusya Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'Nükleer Enerji Mühendisliği ve termal fizik  Rusça  350300 RUBLE  Roketlerin roket metotlarının tasarımı  Rusça  350300 RUBLE
Makine Mühendisliği  Rusça  302533 RUBLE  Uzay tek. Uygu. Nav. Ve balistik des.  Rusça  350300 RUBLE
Teknolojik makine ve ekipmanlar  Rusça  302533 RUBLE  Uçak kontrol sistemleri  Rusça  350300 RUBLE
Uygulamalı mekanik  Rusça  302533 RUBLE  Adli muayene  Rusça  270199 RUBLE
Teknolojik süeçlerin ve üretimin otomasyonu  Rusça  302533 RUBLE
Makine yap.endüstrilerinin tas. Ve tek.des.  Rusça  302533 RUBLE
Mekatronik ve robotik  Rusça  302533 RUBLE
Teknik fizik  Rusça  350300 RUBLE
Yüksek teknoloji plazma ve enerji santraleri  Rusça  350300 RUBLE
Sogutma kriyojenik tek. Ve yaşam destek sis.  Rusça  350300 RUBLE
Teknosfer güvenliği  Rusça  302533 RUBLE
Malzeme bilimi ve malzeme teknolojisi  Rusça  302533 RUBLE
Roket kompleksleri ve astronotik  Rusça  350300 RUBLE
Standardizasyon ve metroloji  Rusça  302533 RUBLE
Teknik sistemlerde yönetim  Rusça  302533 RUBLE
Yenilik  Rusça  302533 RUBLE
Nano Mühendisliği  Rusça  350300 RUBLE
Ekonomi  Rusça  270119 RUBLE
Yönetim  Rusça  270119 RUBLE
İşletme bilişimi  Rusça  270119 RUBLE
Sosyoloji  Rusça  270119 RUBLE
Dilbilim  Rusça  270119 RUBLE
Uygulamalı matematik  Rusça  290727 RUBLE
Matematik ve bilgisayar bilimi  Rusça  290727 RUBLE
Bilişim ve bilgisayar Mühendisliği  Rusça  324577 RUBLE
Bilgi sistemleri ve teknolojileri  Rusça  324577 RUBLE
Uygulamalı bilişim  Rusça  324577 RUBLE
Yazılım Mühendisliği  Rusça  324577 RUBLE
Bilgi güvenliği  Rusça  324577 RUBLE
Elektronik ve nanoelektronik  Rusça  324577 RUBLE
Optik Mühendisliği  Rusça  324577 RUBLE
Biyoteknik sistemler ve teknolojiler  Rusça  324577 RUBLE
Lazer teknolojisi ve lazer teknolojisi  Rusça  324577 RUBLE
Nükleer enerji Mühendisliği ve termal fizik  Rusça  324577 RUBLE
Makine Mühendisliği  Rusça  324577 RUBLE
Teknolojik süreçlerin ve üretimin otomasyonu  Rusça  324577 RUBLE
Makine yapı endüstrilerinin tası. Ve teki. Des.  Rusça  324577 RUBLE
Mekatronik ve robotik  Rusça  324577 RUBLE
Teknik fizik  Rusça  376255 RUBLE
Yüksek  teknoloji plazlama ve enerji santralleri  Rusça  376255 RUBLE
Sogutma kriyojenik tek. Ve yaşam destek sis  Rusça  376255 RUBLE
Teknosfer güvenliği  Rusça  324577 RUBLE
Malzeme bilimi ve malzeme teknolojisi  Rusça  324577 RUBLE
Kara taşımacılıgı ve teknolojik kompleksler  Rusça  324577 RUBLE
Roket kompleksleri ve astronotik  Rusça  376255 RUBLE
Standardizasyon ve metroloji  Rusça  324577 RUBLE
Teknik sistemlerde yönetim  Rusça  324577 RUBLE
Bilgi yoğun endüstrilerin org. Ve yönetimi  Rusça  324577 RUBLE
Bilim yogun teknolojiler ve inovasyon eko  Rusça  324577 RUBLE
Fikri mülkiyet yönetimi  Rusça  324577 RUBLE
NOVOSİBİRSK DEVLET ÜNİVERSİTESİ  DİL  ÜCRET  EK GİDERLER  YÜKSEK LİSANS  DİL  ÜCRET  DOKTORA  DİL  ÜCRET
Tıp  İngilizce-Rusça  6500$  Hazırlık İngilizce Paketi 6500$  Büyük veri analitiği ve yapay zeka  İngilizce  6500$  Astropartikül fizigi  İngilizce  5500$
Afrika ve doğu çalışmaları  Rusça  4500$  Hazırlık Rusça Paketi 5250$  Petrol ve gaz yönetimi  İngilizce  6501$  Biyoloji  Rusça  5500$
Uygulamalı matematik ve bilişim  Rusça  4500$  YURT ÜCRETİ  Finans yönetim  İngilizce  6502$  Kimya  Rusça  5500$
Biyoloji  Rusça  4500$  60$-100$  Klasikler ve felsefe  İngilizce  6503$  Bilgisayar bilimi ve mühendisliği  Rusça  5500$
İşletme enformatiği  Rusça  4500$  SİGORTA  Malzeme bilimi  İngilizce  6504$  Bilgisayar bilimi ve bilgisayar bil.  Rusça  5500$
Kimya  Rusça  4500$  SAĞLIK MUAYENESİ  Farmasökit  kimya  İngilizce  6505$  Yer bilimi  Rusça  5500$
Bilgisayar bilimi ve mühendisliği  Rusça  4500$  Fonksoniyel anatomi  İngilizce  6506$  Ekonomi  Rusça  5500$
Ekonomi  Rusça  4500$  Palebiota araş. Palebiyolojik ve stratik yön.  İngilizce  6507$  Tarih ve arkeoloji  Rusça  5500$
Temel ve uygulamalı kimya(uzm. Derecesi)  Rusça  4500$  Temel ve uygulamalı yerbilimleri  Rusça  3600$  Dil ve edebiyat çalışmaları  Rusça  5500$
Temel ve uygulamalı dilbilim  Rusça  4500$  Uygulamalı matematik ve bilişim  Rusça  3600$  Kitle iletişim. Araç. Ve kütüp. Ve bilgi bil.  Rusça  5500$
Jeoloji  Rusça  4500$  Biyoloji  Rusça  3600$  Matematik ve mekanik  Rusça  5500$
Tarih  Rusça  4500$  Kimya  Rusça  3600$  Felsefe etik ve di bilimleri  Rusça  5500$
Gazetecilik  Rusça  4500$  Bilgisayar bilimi ve mühendisliği  Rusça  3600$  Rus dili  Rusça  5500$
Hukuk  Rusça  4500$  Ekonomi  Rusça  3600$  Kimya  Rusça  5500$
Dilbilim(yabancı diller)  Rusça  4500$  Jeoloji  Rusça  3600$  Biyoloji  Rusça  5500$
Yönetim  Rusça  4500$  Tarih  Rusça  3600$  Matematik  Rusça  5500$
Matematik  Rusça  4500$  Bilgisayar işlemleri ve sistemleri  Rusça  3600$  Fizik  Rusça  5500$
Matematik ve bilgisayar bilimleri  Rusça  4500$  Gazetecilik  Rusça  3600$  Ekonomiye giriş  Rusça  5500$
Mekanik ve matematiksel modelleme  Rusça  4500$  Hukuk  Rusça  3600$  Sosyal çalışmalar  Rusça  5500$
Filoloji  Rusça  4500$  Yönetim  Rusça  3600$  Matematik  Rusça  5500$
Felsefe  Rusça  4500$  Matematik  Rusça  3600$
Fizik  Rusça  4500$  Matematik ve bilisayar bilimleri  Rusça  3600$
Psikoloji  Rusça  4500$  Mekanik ve matematiksel modelleme  Rusça  3600$
Sosyoloji  Rusça  4500$  Filoloji  Rusça  3600$
Felsefe  Rusça  3600$
Fizik  Rusça  3600$
Sosyoloji  Rusça  3600$
(RUDİN)HALKLARIN DOSTLUĞU ÜNİVERSİTESİ  DİL  ÜCRET  EK GİDERLER  YÜKSEK LİSANS  DİL  ÜCRET  DOKTORA  DİL  ÜCRET
Tıp  Rusça/İngilizce  9750$/11000$  HAZIRLIK ÜCRETİ 6100$  Ortopedik Diş Hekimliği (2 YIL)  Rusça  8100$  Veterinerlik bilimi  Rusça  5450$
Diş Hekimliği  Rusça/İngilizce  9450$/11000$  Cerrahi Diş Hekimliği (2 YIL)  Rusça  8100$  Klinik Psikoloji  Rusça  5550$
Eczacılık  Rusça/İngilizce  5700$/7800$  Yurt Ücreti: 400 – 500 USD/yıl  Biyoteknoloji (4 YIL)  Rusça  6200$  Sağlık Psikolojisi  Rusça  5550$
Hukuk  Rusça/İngilizce  5850$/6850$  SİGORTA  Biyokimya (4 YIL)  Rusça  6200$
Mimarlık  Rusça  5450$  SAĞLIK MUAYENESİ  Genel Tarih (3 YIL)  Rusça  6100$
Ekonomi  Rusça  4900$  Makine Mühendisliği ve Otomasyon (2 YIL)  Rusça  5900$',
  '{"country": "Rusya", "chunk": 3, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','rusya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Rusya Yurtdışı Eğitim Bilgileri (Bölüm 4)',
  'Biyomedikal  Rusça  5450$  Modern Peyzaj Mimarisi ve Kentsel Tasarım (2 YIL)  Rusça  5900$
Veterinerlik ve Hijyenik Muayene  Rusça  5450$  Peyzaj Mimarisi ve Tasarım (2 YIL)  Rusça  5900$
Gazetecilik  Rusça  6300$  Rus Dili (2 YIL)  Rusça  5250$
Bilgisayar ve Bilişim Bilimleri  Rusça  4850$  Medya İletişim ve Gazetecilik (3 YIL)  Rusça  6100$
Makine Mühendisliği  Rusça  5450$  Uluslararası Gazetecilik  Rusça  7900$
Peyzaj Mimarlığı  Rusça  6200$  Uluslararası ilişkiler (3 YIL)  Rusça  6100$
Tercümanlık  Rusça  6300$  Uluslararası Yönetim (2 YIL)  Rusça  5550$
Matematik  Rusça  4850$  Uluslararası Pazarlama (2 YIL)  Rusça  5550$
Matematik ve Mekanik  Rusça  4850$  Uluslararası İşletme Yönetimi (2 YIL)  Rusça  5550$
Uluslararası ilişkiler  Rusça  6150$  Mikrobiyoloji (3 YIL)  Rusça  6200$
Pazarlama  Rusça  6350$  Dünya Ekonomisi (3 YIL)  Rusça  6100$
İnsan Kaynakları  Rusça  6350$  Genel Psikoloji (İletişim ve Etkileşim Sorunları)(3 YIL)  Rusça  6100$
İşletme  Rusça  6350$  Genel Psikoloji, Kişilik Psikolojisi, Psikoloji Tarihi(3 YIL)  Rusça  6100$
Siyaset Bilimi  Rusça  5550$  Organik kimya (4 YIL)  Rusça  6200$
Hukuk ve Siyaset Bilimi  Rusça  6150$  Yapay Zeka ve Veri Analizi (2 YIL)  Rusça  5900$
Psikoloji  Rusça  4850$  Rus Edebiyatı (3 YIL)  Rusça  7900$
Reklamcılık ve Halkla İlişkiler  Rusça  6300$  Adli Tıp (4 YIL)  Rusça  6600$
Dijital Pazarlama İletişim  Rusça  6300$  Hemşirelik Yönetimi (2 YIL)  Rusça  6650$
Halkla İlişkiler  Rusça  6300$
Reklamcılık  Rusça  6300$
Hemşirelik  Rusça  5450$
Sosyoloji  Rusça  4850$
Uluslararası Turizm  Rusça  6150$
Filoloji  Rusça  5550$
Felsefe  Rusça  4850$
Yapay Zeka ve Akıllı Sistemler  Rusça  6000$
Kimya- Fizik  Rusça  5450$
Ekonmi ve İşletme  Rusça  6350$
Muhasebe ve Denetim  Rusça  6350$
Finans ve Kredi  Rusça  6350$
Hukuk  Rusça  6150$
Hukuk Felsefesi  Rusça  5550$
Uluslararası Hukuk  Rusça  6150$
Hukuk ve Siyaset  Rusça  6150$
Tarih  Rusça  4850$
Sanat ve Beşeri Bilimler  Rusça  5000$
Bilgisayar ve Bilişim Bilimleri  Rusça  4850$
Dijital Tasarım ve Web Geliştirme  Rusça  6350$
Uluslararası Yönetim  Rusça  6350$
Siyaset Bilimi ve Bölgesel Çalışmalar  Rusça  5550$
Uygulamalı Bilgisayar Bilimi  Rusça  5450$
Eğitim Psikolojisi  Rusça  4850$
ST. PETERSBURG  DEVLET ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER  YÜKSEK LİSANS  DİL  ÜCRET  DOKTORA  DİL  ÜCRET
Tıp  Rusça/İngilizce  466.500/506.100 Ruble  Hazırlık 272.000 Ruble  Yazılım Geliştirme ve Veri Bilimi  Rusça  373.400 Ruble  Matematiksel Mantık ve Cebir  Rusça  337.100 Ruble
Diş hekimliği  Rusça/İngilizce  437.000/474.000 Ruble  10 Ay Hazırlık Eğitimi (1080 Saat)  Oyun Teorisi ve Operayon Araştırması  Rusça  373.400 Ruble  Hesaplamalı Matematik  Rusça  337.100 Ruble
Eczacılık  Rusça  466.500 Ruble  Yapay Zeka Teknolojileri  Rusça  355.600 Ruble  Yapay Zeka ve Makine  Rusça  345.900 Ruble
Hemşirelik  Rusça/İngilizce  390.300/427.100 Ruble  Mühendislik Odaklı Fizik  Rusça  346.700 Ruble  Matematiksel Modelleme  Rusça  370.600 Ruble
Klinik Psikoloji  Rusça  350.000 Ruble  Fizik  Rusça  346.700 Ruble  Fizik (Teorik, Optik, Yoğun Madde,Plazma)  Rusça  367.400 Ruble
Oyunculuk  Rusça  472.900 Ruble  Kimya  Rusça  346.700 Ruble  Manyetik Olaylar Fiziği  Rusça  370.600 Ruble
Temel matematik ve Mekanik  Rusça/İngilizce  325.600 Ruble  Jeoloji  Rusça  391.600 Ruble  Atom Çekirdeği ve Temel Parçaları  Rusça  370.600 Ruble
Matematik  Rusça  377.300 Ruble  Biyoloji  Rusça  359.200 Ruble  Lazer Fiziği  Rusça  370.600 Ruble
Uygulamalı Matematik ve Bilgisayar Bilimleri (Yapay Zeka)  Rusça  367.700 Ruble  Coğrafya  Rusça  408.400 Ruble  Kimya (İnorganik, Analitik, Organik, Fiziksel)  Rusça  367.400 Ruble
Uygulamalı Matematik ve Bilgisayar Bilimleri  Rusça  312.000 Ruble  Yazılım Mühendisliği  Rusça  400.000 Ruble  Elektrokimya  Rusça  367.400 Ruble
Bilgisayar ve Modern Programlama  Rusça  312.000 Ruble  Arazi Yönetimi ve Kadastro  Rusça  375.300 Ruble  Radyokimya  Rusça  367.400 Ruble
Mekanik ve Matematik Modelleme  Rusça  368.600 Ruble  Psikoloji  Rusça  344.800 Ruble  Tıbbi Kimya  Rusça  367.400 Ruble
Veri Bilimi  Rusça  356.700 Ruble  Psikoloji- Çocukların Ruh Sağlığı  Rusça  344.800 Ruble  Biyokimya  Rusça  349.100 Ruble
Fizik  Rusça  387.400 Ruble  Psikoloji- Kişilik Psikolojisi  Rusça  344.800 Ruble  Genetik  Rusça  349.200 Ruble
Kimya  Rusça  373.300 Ruble  Psikoloji- Beden Eğitimi ve Spor Psikolojisi  Rusça  344.800 Ruble  Botanik  Rusça  349.200 Ruble
Malzemelerin Kimyası, Fiziği ve Mekaniği  Rusça  357.900 Ruble  Ekonomi  Rusça  488.300 Ruble  Mikrobiyoloji  Rusça  349.200 Ruble
Jeoloji  Rusça  383.300 Ruble  Sosyoloji  Rusça  475.000 Ruble  Zooloji  Rusça  349.200 Ruble
Coğrafya  Rusça  346.200 Ruble  Hukuk Felsefesi( İflas, Medeni,Aile, Kamu, Vergi,İş, Ceza vb.)  Rusça  446.300 Ruble  Ekoloji  Rusça  349.200 Ruble
Biyoloji  Rusça  377.300 Ruble  Uluslararası İlişkiler  Rusça/İngilizce  473.800/508.000 Ruble  Toprak Bilimi  Rusça  349.200 Ruble
Toprak bilimi  Rusça  352.600 Ruble  Gazetecilik  Rusça  463.600 Ruble  Mühendislik Jeolojisi/ Jeofizik  Rusça  444.800 Ruble
Uygulamalı bilgisayar Bilimi  Rusça  400.500 Ruble  Turizm  Rusça  383.900 Ruble  Fiziksel Coğrafya ve Biyocoğrafya  Rusça  340.600 Ruble
Yazılım Mühendisliği  Rusça  400.500 Ruble  Pedogojik Eğitim  Rusça  223.300 Ruble  Arazi Yönetimi ve Kadastro  Rusça  340.600 Ruble
Arazi Yönetimi ve Kadastro  Rusça  481.300 Ruble  Filoloji  Rusça  451.700 Ruble  Coğrafya (Ekonomik, Sosyal, Siyasi)  Rusça  340.600 Ruble
Psikoloji  Rusça  350.000 Ruble  Jeoekoloji  Rusça  444.800 Ruble
Ekonomi  Rusça  499.100 Ruble  Bilgisayar Bilimi  Rusça  345.900 Ruble
Sosyoloji  Rusça  302.200 Ruble  Tıp  Rusça  379.800 Ruble
Uluslararası ilişkiler  Rusça  422.000 Ruble  Diş Hekimliği  Rusça  391.900 Ruble
Reklamcılık ve Halkla İlişkiler  Rusça  446.400 Ruble  Hukuk  Rusça  351.100 Ruble
Gazetecilik  Rusça  249.100 Ruble  Dünya Ekonomisi/ Finans  Rusça  351.100 Ruble',
  '{"country": "Rusya", "chunk": 4, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','rusya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Rusya Yurtdışı Eğitim Bilgileri (Bölüm 5)',
  'Uluslararası Gazetecilik  Rusça  427.700 Ruble  Psikoloji (Genel, Eğitim, Sosyal, Tıbbi)  Rusça  343.900 Ruble
Turizm  Rusça  389.100 Ruble  Sosyoloji (Ekonomik, Siyasal, Kültür)  Rusça  336.300 Ruble
Filoloji( İngiliz Dili ve Edebiyatı)  Rusça  410.100 Ruble  Siyaset Tarihi/ Kamu Yönetimi  Rusça  327.500 Ruble
Filoloji (İtalyan Dili ve Edebiyatı)  Rusça  426.300 Ruble  Uluslararası İlişkiler  Rusça  336.800 Ruble
Filoloji (Klasik Filoloji)  Rusça  426.300 Ruble  Tarih (Ulusal, Genel) / Arkeoloji  Rusça  323.800 Ruble
Filoloji ( Rus Dili ve Edebiyatı)  Rusça  426.300 Ruble  Uluslararası İlişkiler ve Dış Politika  Rusça  332.900 Ruble
Filoloji (Fransız Dili ve Edebiyatı)  Rusça  426.300 Ruble  Felsefe (Tarih, Bilim ve Teknoloji, Sosyal ve Politik, Din)  Rusça  336.900 Ruble
Dil Bilimi (Tercümanlık)  Rusça  440.800 Ruble  Dünya halklarının Edebiyatı  Rusça  323.500 Ruble
Dil Bilimi (İspanyolca, Rusça, Slav)  Rusça  428.300 Ruble  Edebiyat Teorisi / Rus Halklarının Dilleri  Rusça  395.900 Ruble
Tarih  Rusça  313.600 Ruble  Medya İletişimi ve Gazetecilik  Rusça  271.200 Ruble
Felsefe  Rusça  313.600 Ruble  Teoloji (Din Bilimi- İslam, Yahudilik, Budizm vb.)  Rusça  336.900 Ruble
Din Bilimleri  Rusça  337.900 Ruble
Sanat Tarihi  Rusça  469.600 Ruble
İlahiyat (Yahudi Yahudi ve Hristiyan Teolojisi)  Rusça  337.900 Ruble
Müzecilik  Rusça  295.500 Ruble
Müzik ve Enstrüman (Org, Keman, Şarkı)  Rusça  591.100 Ruble
El sanatları  Rusça  460.600 Ruble
Restorasyon  Rusça  518.800 Ruble
Doğu Ve Afrika Çalışmaları Çeviri(Arapça, İbranice, Hintçe)  Rusça  516.100 Ruble
MOSKOVA DEVLET ULUSLARARASI İLİŞKİLER ENSTİTÜSÜ  DİL  ÜCRET  EK GİDERLER
TİCARET  Rusça  8310$  YURT ÜCRETİ
ULUSLARASI İLİŞKİLER  Rusça  8200$  60$-100$
SOSYOLOJİ  Rusça  8600$  SİGORTA
KAMU YÖNETİMİ  Rusça  8820$  SAĞLIK MUAYENESİ
SİYASET BİLİMİ  Rusça  8820$
YARGI YETKİSİ  Rusça  9300$
REKLAM VE HALKLA İLİŞKİLER  Rusça  9330$
GAZETECİLİK  Rusça  9750$
İŞLETME  Rusça  9940$
YABANCI BÖLGESEL ÇALIŞMALAR  Rusça  10.000$
EKONOMİ  Rusça  10.040$
KAZAN DEVLET İNŞAAT ÜNİVERSİTESİ  DİL  ÜCRET  EK GİDERLER  YÜKSEK LİSANS  DİL  ÜCRET  DOKTORA  DİL  ÜCRET
Mimarlık /  5 yıl  Rusça  187.335 Ruble  HAZIRLIK YOK.  Mimarlık (Mimarlık Teorisi ve Bilimsel ve Tasarım Modellemesi)  Rusça  199.968 Ruble  Gerçek, Entegre ve İşlevsel Analiz  Rusça  183.450 Ruble
Mimari Mirasın Yeniden İnşası, Restorasyonu / 5 yıl  Rusça  187.335 Ruble  KONAKLAMA AYLIK  Mimarlık (Binaların Mimari ve Yapısal Tasarımı)  Rusça  199.968 Ruble  Deforme Olabilen Katıların Mekaniği  Rusça  202.950 Ruble
Mimarlık Çevre Tasarımı /5 yıl  Rusça  187.335 Ruble  1.500-2.200 RUBLE  Mimari Mirasın Restorasyonu ve Yeniden İnşası  Rusça  199.968 Ruble  Su Temini, Kanalizasyon, İnşaat Su Koruma Sistemleri  Rusça  190.310 Ruble
Peyzaj Mimarlığı  Rusça  187.335 Ruble  Mimari Çevre Tasarımı  Rusça  199.968 Ruble  Bina yapıları, Binalar ve Tesisler  Rusça  190.310 Ruble
Şehir Planlama / 5 yıl  Rusça  187.335 Ruble  Şehir Planlama  Rusça  199.968 Ruble  Temeller ve Yeraltı Yapıları  Rusça  190.310 Ruble
İnşaat Mühendisliği  Rusça  187.335 Ruble  İnşaat Mühendisliği  Rusça  199.968 Ruble  Isıtma, Havalandırma, Klima, Gaz Temini ve Aydınlatma  Rusça  190.310 Ruble
Bilgi Sistemleri ve Teknolojileri  Rusça  187.335 Ruble  Isı Enerjisi ve Isı Mühendisliği  Rusça  199.968 Ruble  Yapı Malzemeleri ve Ürünleri  Rusça  190.310 Ruble
Teknosfer Güvenliği  Rusça  187.335 Ruble  İnşaat Teknolojisi ve Organizasyonu  Rusça  190.310 Ruble
Isı Enerjisi Mühendisliği ve Isı Mühendisliği  Rusça  187.335 Ruble  Şehir Planlama, Kırsal Planlama Yerleşimleri 3 Yıl  Rusça  190.310 Ruble
Arazi Yönetimi ve Kadastro  Rusça  219.771 Ruble  NİJNİY NOVGOROD  Bilgisayar Modelleme ve Otomasyon  Rusça  190.310 Ruble
Yönetim  Rusça  167.355 Ruble  Teorik ve Uygulamalı Isı Mühendisliği  Rusça  190.310 Ruble
Konut ve Tesis Altyapısı  Rusça  167.355 Ruble  Bölgesel ve Sektörel Ekonomi 3 Yıl  Rusça  183.450 Ruble
Tasarım/ Grafik Tasarım  Rusça  320.567 Ruble  Ulusal Tarih 3 Yıl  Rusça  183.450 Ruble
Taşıma Süreci Teknolojisi  Rusça  187.335 Ruble  Mesleki Eğitim Metodolojisi ve Teknolojisi 3 Yıl  Rusça  183.450 Ruble
Benzersiz Bina ve Yapıların İnşası / 6 yıl  Rusça  187.335 Ruble  Sanat Türleri 3 Yıl  Rusça  183.450 Ruble
KAZAN ULUSAL ARAŞTIRMA TEKNİK ÜNİVERSİTESİ  ÜCRET  DİL  EK GİDERLER
NANO TEKNOLOJİ MÜHENDİSLİĞİ :  1400$  Rusça  YURT ÜCRETİ
GEMİ İNŞA VE GEMİ MAKİNALARI MÜHENDİSLİĞİ  1400$  Rusça  60$-100$
BİLGİSAYAR MÜHENDİSLİĞİ  1400$  Rusça  SİGORTA
YAZILIM MÜHENDİSLİĞİ  1400$  Rusça  SAĞLIK MUAYENESİ
BİLGİ SİSTEMLERİ VE TEKNOLOJİLERİ  1400$  Rusça
UÇAK GÖVDE-MOTOR BAKIM  1600$  Rusça
BİYOMEDİKAL MÜHENDİSLİĞİ  1600$  Rusça
TELEKOMÜNİKASYON MÜHENDİSLİĞİ  1600$  Rusça
BİLGİ İLETİŞİM TEKNOLOJİLERİ VE SİSTEMLERİ  1600$  Rusça
MÜZİK ALETLERİ YAPIMI  1600$  Rusça
GÜÇ VE ISI MÜHENDİSLİĞİ  1600$  Rusça
GÜÇVE MAKİNE MÜHENDİSLİĞİ  1600$  Rusça
KONTROL MÜHENDİSLİĞİ  1600$  Rusça
FİZİK MÜHENDİSLİĞİ  1600$  Rusça
ÇEVRE MÜHENDİSLİĞİ  1600$  Rusça
EKONOMİ  1600$  Rusça
OPTİK VE AKUSTİK MÜHENDİSLİĞİ  1650$  Rusça
UYGULAMALI BİLİŞİM  1650$  Rusça
ELEKTRONİK VE NANOELEKTRONİK MÜHENDİSLİĞİ  1650$  Rusça
UÇAK MÜHENDİSLİĞİ  1650$  Rusça
MAKİNA MÜHENDİSLİĞİ  1650$  Rusça
ELEKTRİK MÜHENDİSLİĞİ  1750$  Rusça
MALZEME BİLİMİ VE MÜHENDİSLİĞİ  1750$  Rusça',
  '{"country": "Rusya", "chunk": 5, "total_chunks": 5}'::jsonb,
  ARRAY['ulke','rusya','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Sırbistan Yurtdışı Eğitim Bilgileri (Bölüm 1)',
  'SIRBİSTAN
--DANIŞMANLIK VE HAZIRLIK PAKET : 4550€
--ÖZELLİKLE ERKEK ÖĞRENCİLERDE  SINIRDA , YABANCILAR POLİSİNE KARŞI DAVRANIŞLARINA DİKKAT ETMELİLERDİR.
--VİZESİZ BİR ÜLKEDEDİR. OKUL BAŞLADIKTAN SONRA ÖĞRENCİ OTURUMU YAPILIR.
--OTURUM ALMAK İÇİN 1500€ TEMİNAT GÖSTERİLİYOR. 350-500 EURO ARASI OTURUM ÜCRETİ DEĞİŞİYOR.
--LİSE DENKLİKLERİ İÇİN ÖĞRENCİLER 100 EURO ÖDEYECEK.
--YÖK''ÜN KARARINA UYGUN OLARAK TIP, DİŞ, ECZACILIK VE HUKUK OKUMAK İSTEYEN ÖĞRENCİLER İÇİN İLK BİN ÜNİVERSİTELERİ:
--BELGRAD ÜNİVERSİTESİ   QS 721-730     THE 801-1000  CWTS 199  ARWU 301-400
BELGRAD DEVLET ÜNİVERSİTESİ  DİL  EK GİDERLER  YÜKSEK LİSANS 1*2 YIL 4000€  ÜCRET  DOKTORA 3 YIL  ÜCRET  DİL  ƒ
Tıp  8.000- 2500  Sırpça*İngilizce  6 yıl  YURT YOK - BİREYSEL EV KİRALANIYOR.  Avrupa ve Uluslararası  Politikaları*Kriz Yönetimi  2.200 €  Sırpça  Mimarlık ve Şehircilik  3.500 €  Sırpça
Diş Hekimliği  2500-5000  Sırpça*İngilizce  6 yıl  EVLER 500€''DAN BAŞLIYOR. (TEK KİŞİLİK)  Bitki Tıbbı  2.200 €  Sırpça  BiyoKimya  9.000 €  Sırpça
Eczacılık  2500- 3500  Sırpça*İngilizce  Gıda Teknolojisi  2.200 €  Sırpça  Kimya  9.000 €  Sırpça
HUKUK  2.400 €  Sırpça  İLK AY KİRA+DEPOZİTO+EMLAK ÜCRETİ ÖDENİYOR.  Sırpça  Sırpça
Hemşirelik  2.500 €  Sırpça  Tum Bölümlerin Mulakatı bulunuyor  Hayvancılık  2.200 €  Sırpça  İnşaat mühendisliği  4.000 €  Sırpça
Halk Sağlığı  2.500 €  Sırpça  Tarım Bilimleri  3.300 €  Sırpça  Geodezi*Geoinformatik  4.200 €  Sırpça
Veterinerlik  2.500 €  Sırpça  YAŞ SINIRI YOKTUR. DİPLOMA NOTU 85 ÜSTÜ OLMALI  Meyve Bilimi ve Bağcılık  2.200 €  Sırpça  Diş Hekimliğinde Klinik Uygulamalar 3 Yıl  5.000 €  Sırpça
Logopedi  1.800 €  Sırpça  Tarımda Cevre Koruma  2.200 €  Sırpça  Hukuk  3.000 €  Sırpça
Adli Tıp  1.800 €  Sırpça  Tarım Ekonomisi  3.300 €  Sırpça  AstroFizik  4.500 €  Sırpça
Agız Diş Sağlıgı  5.000 €  Sırpça  Mimarlık  3.000 €  Sırpça  Tıp Bilimleri  4.000 €  Sırpça
Mimarlık  3.000 €  İngilizce  Şehircilik Planlama  3.000 €  Sırpça  Maden Mühendisliği  2.500 €  Sırpça
Yazılım Mühendisliği  1.800 €  Sırpça  İç Mimarlık  3.000 €  Sırpça  Metalurji Mühendisliği  2.500 €  Sırpça
Bilişim Sistemleri Mühendisliği  3.500 €  İngilizce  Mimarlık ve Şehircilik Teknoloji Mühendisliği( İng)  2.000 €  Sırpça  Mühendislik Yönetimi  2.500 €  Sırpça
İnşaat Mühendisliği  2.400 €  Sırpça  Biyoloji  6.500 €  Sırpça  Kimya Mühendisliği  10.000  Sırpça
Bor Mühendisliği  2.000 €  Sırpça  Moleküler Biyoloji ve Fizyoloji  6500*4500  Sırpça  Cevre Mühendisliği  10.000  Sırpça
Ziraat Mühendisliği  2.200 €  Sırpça  Ekoloji  6.500 €  Sırpça  Malzeme Mühendisliği  10.000  Sırpça
Makine Mühendisliği  1.800 €  Sırpça  Biyoloji  4.500 €  Sırpça  Kimya  10.000  Sırpça
Metalurji Mühendisliği* Mühendislik Yönetimi  2.000 €  Sırpça  Biyoloji Öğretmenliği  4.500 €  Sırpça  BiyoKimya  10.000  Sırpça
Jeoloji Mühendisliği  1.100 €  Sırpça  Ekoloji ve Çevre Öğretmenliği  4.500 €  Sırpça  BiyoTeknoloji  10.000  Sırpça
Ulaştırma Mühendisliği  1.700 €  Sırpça  BiyoKimya  4.500 €  Sırpça  İşletme Yönetimi  2.500  Sırpça
Trafik Mühendisliği  1.700 €  Sırpça  Çevre Kimyası  4.500 €  Sırpça  İşletme ve İstatistik  2.500  Sırpça
Biyoloji  3.500 €  Sırpça  Kimya  3.000 €  Sırpça  İnşaat mühendisliği  4.000 €  Sırpça
Genetik Mühendisliği  3.500 €  Sırpça  İnşaat mühendisliği  4.200 €  Sırpça  Jeodezi*Geodezi  4.200 €  Sırpça
Moleküler Biyoloji  2.500 €  Sırpça  Binalarda Enerji verimliliği  2.400 €  Sırpça  9.000 €  Sırpça
Elektrik Mühendisliği  1.800 €  Sırpça  Geodezi Geoınformatik  2.400 €  Sırpça  Eczacılık  9.000 €  Sırpça
Maden Mühendisliği*Mühendislik Teknolojisi  2.000 €  Sırpça  İnsaat Mühendisliği  2.400 €  Sırpça  Moleküler Genetik  9.000 €  Sırpça
Nukleer Enerji Mühendisliği  1.800 €  Sırpça  Kamu İhaleleri Yönetimi  7.200 €  Sırpça
Coğrafya Bölümü  2.500 €  Sırpça  Avrupa Entegrasyonu  2.100 €  Sırpça
Matematik Bölümü  3.500 €  Sırpça  Hukuk  2.100 €  Sırpça
AstroFizik*Fizik Bölümü  3500€*2650€  İngilizce*Sırpça  AstroFizik Uzay Bilimi  12500  Sırpça
Kimya Teknolojileri Mühendisliği  2.500 €  Sırpça  Tıbbi laboratuvar Teknolojisi  1.900 €  Sırpça
Yönetim Ve Organizasyon  2.500 €  Sırpça  Tıp Hijyen  1.900 €  Sırpça
Kimya Bölümü* BiyoKimya*Cevre Kimyası  2.500 €  Sırpça  Radyasyon Terapsti  1.900 €  Sırpça
Ormancılık Mühendisliği  1.500 €  Sırpça  Halk Sağlığı  2900€*2500€  Sırpça
Peyzaj Mimarlığı  1.500 €  Sırpça  FizyoTerapı  1.900 €  Sırpça
Ahşap Teknolojileri  1.500 €  Sırpça  FizikTedavi ve SağlıkTerapi  2.000 €  Sırpça
Jeofizik  2.650 €  Sırpça  Eczacılık  2.900 €  Sırpça
Petrol ve Gaz Mühendisliği  1.800 €  Sırpça  Hemşirelik  1.900 €  Sırpça
Meteoroloji  1.800 €  Sırpça  Sağlık Yönetimi  3.500 €  Sırpça
İktisat, işletme yönetimi ve istatistik* Analizi ve Politika  1.500 €  Sırpça  Biyoetik  1.660 €  Sırpça
Ekonomi  1.500 €  İngilizce  Anestezi  1.660 €  Sırpça
Çevre Ekoloji Koruma*Ziraat Ekonomisi  2.500 €  Sırpça  Maden Mühendisliği  2.000 €  Sırpça
Pazarlama*Muhasebe, denetim ve finansal yönetim  1.500 €  Sırpça  Metalurji Mühendisliği  2.000 €  Sırpça
Ticari işletmesi ve pazarlama  1.500 €  Sırpça  Mühendislik Yönetimi  2.000 €  Sırpça
Finans,bankacılık ve sigortacılık  1.500 €  Sırpça  Mühendislik Teknolojisi  2.000 €  Sırpça
Turizm*Turizm ve Otelcilik  1.500 €  İngilizce  Veterinerlik Hayvan Ureme ve Biyoteknoloji  3.000 €  Sırpça
İstatistik, bilişim ve nicel finansı  1.800 €  Sırpça  Veterinerlik  2.500 €  Sırpça
Gıda Teknolojisi*BiyoTeknoloji*Bilgi Mühendisliği  2.200 €  Sırpça  Akıllı Sistemler  4.000 €  Sırpça
Uluslarası ekonomi ve ticaret  1.500 €  Sırpça  Gelişmiş Veri Data Analizi  2.500 €  Sırpça
Uluslararası ilişkiler  1.500 €  Sırpça  İnsan Bilimlerinde Bilgisayar Mühendisliği  2.500 €  Sırpça
Psikoloji  1.900 €  Sırpça  Eğitim Politikaları  2.000 €  Sırpça
Pedagoji  1.900 €  Sırpça  Terör Organize Suç ve Güvenlik  2.500 €  Sırpça
Özel Eğitim ve Rehabilitasyon  1.500 €  Sırpça  Tıbbı Mekatronik Aletleri  2.500 €  Sırpça',
  '{"country": "Sırbistan", "chunk": 1, "total_chunks": 4}'::jsonb,
  ARRAY['ulke','sirbistan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Sırbistan Yurtdışı Eğitim Bilgileri (Bölüm 2)',
  'Kimya*Cevre Kimyası*BiyoKimya  2.500 €  Sırpça  Toplum Kültür Avrupada Din Entagrasyonu  2.500 €  Sırpça
Sosyoloji*Felsefe  1.900 €  Sırpça  Malzeme Mühendisliği  4.400 €  Sırpça
Bitki TıpbI  2.200 €  Sırpça  BiyoKimya Mühendisliği  4.400 €  Sırpça
Gazetecilik ve İletişim  1.500 €  Sırpça  Kimya Mühendisliği  4.400 €  Sırpça
Güvenlik  1.800 €  Sırpça  Metalurji Mühendisliği  4.400 €  Sırpça
Politikoloji  1.500 €  Sırpça  Cevre Mühendisliği  4.400 €  Sırpça
Siyaset Bilimleri  1.000 €  İngilizce*Sırpça  Kimya  4.400 €  Sırpça
Sosyal Çalışma  1.500 €  Sırpça  Uluslararası Uygulamalı Ekonomi  4.000 €  Sırpça
Rekraasyon  2.000 €  Sırpça  Uluslararası İşletme Bilişimi  4.000 €  Sırpça
Sırbistan da bulunuyor. Eğitim dili  2.000 €  Sırpça  Uluslararası Finans  4.000 €  Sırpça
Andragoji  1.900 €  Sırpça  Uluslararası Vergilendirme  4.000 €  Sırpça
Arkeoloji  1.900 €  Sırpça  Petrol Mühendisliği  4.000 €  Sırpça
Etnoloji ve Antropoloji  1.900 €  Sırpça  Dijital Proses Mühendisliği  4.000 €  Sırpça
Tarih  2.100 €  Sırpça  Elektrik Mühendisliği  4.000 €  Sırpça
Sanat Tarihi  1.900 €  Sırpça  Orman Mühendisliği  4.000 €  Sırpça
Filoloji Fakültesi  2500-6000 €* (*Eğitimi inglizcede almak isteyen)
Sırpça Dili ve Edebiyatı  2500-6000€* (*Eğitimi inglizcede almak isteyenler)
Dil,Edebiyat,Kültür (Turkçe,Arnavutça, Arapça, Bulgarca, Beyazruşça, Yunanca, Danca, İnglizce, İtalyanca, Japonca, Katalanca, Koreice, Çince, Latince, Macarca, Makedonca, Almanca, Norveççe, Dutch, Osmanlıca, Polyonyaca, Portugalca, Ruşça, Rumence, Slovakça, Slovence, Eski slovence, Türkçe, Ukraynaca, Fransızca, Hollandaca, Çekçe, İsveççe, İspanyolca.  2500-6000€* (*Eğitimi inglizcede almak isteyen)
Yazılım Mühendisliği  2.500 €  Sırpça
Nukleer Enerji Mühendisliği  2.500 €  Sırpça
Hayvanat Bahcesi Bekcisi  1.800 €  Sırpça
Bilgi Sistemleri Yönetimi  2.500 €  Sırpça
Kamu Yönetimi  2.500 €  Sırpça
Jeodezi ve Jeoloji Mühendisliği  1.800 €  Sırpça
Tekstil Mühendisliği  1.900 €  Sırpça
Heykel  1.900 €  Sırpça
Endustriyel Tasarım  1.900 €  Sırpça
Kostüm  1.900 €  Sırpça
İç Mimarlık  1.900 €  Sırpça
Seramik  1.900 €  Sırpça
Resim  1.900 €  Sırpça
Oyunculuk  1.900 €  Sırpça
Tiyatro ve Radyo Yönetmenliği  1.900 €  Sırpça
Drama  1.900 €  Sırpça
Tiyatro Radyo ve Kültür Yönetimi ve Yapımcılığı  1.900 €  Sırpça
Film ve Televizyon Yönetmenliği  1.900 €  Sırpça
Film ve Televizyon Yapımcılığı  1.900 €  Sırpça
Kemeramanlık  1.900 €  Sırpça
Kurgu  1.900 €  Sırpça
Ses Kaydı ve Tasarımı  1.900 €  Sırpça
Yeni Medya  1.900 €  Sırpça
Grafik  1.900 €  Sırpça
NOVİSAD DEVLET ÜNİVERSİTESİ  KAYIT 1250€  DİL  OTURUM İZNİ ÜCRETİ  YUKSEK LİSANS 4000€  ÜCRET  DOKTORA
Tıp  6.500 €  İngilizce  200€  Yıllık  Bitki ilacı  4.000 €  Tarım bilimi
Diş Hekimliği  6.500 €  Sırpca -İngilizce  YURT  Su Yönetimi  4.000 €  Ziraat Ekonomisi
Ezcacılık  6.500 €  Sırpca -İngilizce  70*100€  Peyzaj Mimarlığı  4.000 €  Veteriner
Tarla ve Sebze Bitkileri  3.000 €  Sırpça  Ev Kirası 350€ Ortalama  Toprak, Bitki Ve Genetik  4.000 €  Sosyal ve Beşeri Bilimlerde Disiplinlerarası Doktora Programı
Bitki ilacı  3.000 €  Sırpça  180€  eve ait giderler  Hayvan bilimi  4.000 €  Dil ve Edebiyat
Su Yönetimi  3.000 €  Sırpça  350 € enaz yeme içme  Meyve Bilimi Ve Bağcılık  4.000 €  Tarih
Peyzaj Mimarlığı  3.000 €  Sırpça  Dil 600€ *1800€ * Arası  Hassas tarım  4.000 €  pedagoji
Organik tarım  3.000 €  Sırpça  EĞİTİME BAŞLAMA ZAMAN ARALIGI  Ziraat Ekonomisi  4.000 €  Psikoloji
Hayvan bilimi  3.000 €  Sırpça  Kış dönemi için Başlama 1 Ekim  Süs Bitkileri  4.000 €  sosyoloji
Meyve Bilimi, Bağcılık ve Bahçıvanlık  3.000 €  Sırpça  Bahar Dönemi İcin başlama 1 ŞUBAT  Dil, Edebiyat ve Kültür - modüller:  4.000 €  Felsefe
Ziraat Mühendisliği Ve Bilişim Sistemleri  3.000 €  Sırpça  Kış dönemi için son başvuru tarihi 25 Eylül''dür.  Sırp Dili ve Edebiyatı  4.000 €  Öğretme metodolojisi
Ziraat Ekonomisi  3.000 €  Sırpça  Bahar yarıyılı için son başvuru tarihi 20 Ocak''tır.  Yerli Olmayan ve Yabancı Bir Dil ve Edebiyat Olarak Sırpça  4.000 €  Gıda Mühendisliği
Veterinerlik  3.000 €  Sırpça  2 veya 3 seviye dil bilenler katılabilir  Sırp Edebiyatı ve Dili  4.000 €  Biyoteknoloji
Dil, Edebiyat ve Kültür - modüller:  3.000 €  Sırpça  Eylül, Aralık, Nisan ve Haziran  Karşılaştırmalı Edebiyat  4.000 €  ilaç mühendisliği
Sırp Dili ve Edebiyatı  3.000 €  Sırpça  Sırpça Dil Merkezi ALTA üniversitede hazırlık vermektedir.  İngiliz Dili ve Edebiyatı  4.000 €  Kimya Mühendisliği
Yerli Olmayan ve Yabancı Bir Dil ve Edebiyat Olarak Sırpça  3.000 €  Sırpça  Biyoloji*Kimya Sınavı Saglık isteyen giriyor  Alman dili ve edebiyatı  4.000 €  malzeme mühendisliği
Sırp Edebiyatı ve Dili  3.000 €  Sırpça  Matematik*Fizik sınavı mühendislik isteyen giriyor  Başka Bir Roman Dili ve Kültürü İle Fransız Dili ve Edebiyatı  4.000 €  Hukuk
Karşılaştırmalı Edebiyat  3.000 €  Sırpça  Bölüme yönelik hazırlık veriyor  Rus Dili ve Edebiyatı  4.000 €  Kütüphanecilik alanında doktora çalışmaları
İngiliz Dili ve Edebiyatı  3.000 €  Sırpça  Ekim 2. hafta eğitim başlar  Macar dili ve edebiyatı  4.000 €  Sınıf Öğretmenliği Didaktiği (İlköğretim Sınıf Öğretmenliği Metodolojisinde
Alman dili ve edebiyatı  3.000 €  Sırpça  NoviSad şehri kuzeydir  Slovak dili ve edebiyatı  4.000 €  Mühendislik Yönetimi
Başka Bir Roman Dili ve Kültürü İle Fransız Dili ve Edebiyatı  3.000 €  Sırpça  yatay geciş öğrencisi 4.sınıfa kadar almaktadır.  Başka Bir Roman Dili ve Kültürü ile Romen Dili  4.000 €  Beden Eğitimi ve Spor
Rus Dili ve Edebiyatı  3.000 €  Sırpça  ekstra kredi başına yaklaşık 100€  Ruthenian Dili ve Edebiyatı  4.000 €  İnşaat mühendisliği
Macar dili ve edebiyatı  3.000 €  Sırpça  Başkent Belgradtır 1.5 Saat ucak ile  İtalyan Dili, Edebiyatı ve Kültürü  4.000 €  Kompozisyon
Slovak dili ve edebiyatı  3.000 €  Sırpça  İspanyol Dili, Edebiyatı ve Kültürü  4.000 €  müzikoloji
Başka Bir Roman Dili ve Kültürü ile Romen Dili  3.000 €  Sırpça  Tarih  4.000 €  Güzel Sanatlar
Ruthenian Dili ve Edebiyatı  3.000 €  Sırpça  pedagoji  4.000 €  Uygulamalı Sanatlar ve Tasarım',
  '{"country": "Sırbistan", "chunk": 2, "total_chunks": 4}'::jsonb,
  ARRAY['ulke','sirbistan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Sırbistan Yurtdışı Eğitim Bilgileri (Bölüm 3)',
  'İtalyan Dili, Edebiyatı ve Kültürü  3.000 €  Sırpça  Psikoloji  4.000 €  Dramatik ve Görsel-İşitsel Sanatlar
İspanyol Dili, Edebiyatı ve Kültürü  3.000 €  Sırpça  sosyoloji  4.000 €  Müzik - Gösteri Sanatları
Tarih  3.000 €  Sırpça  Felsefe  4.000 €  etnomüzikoloji
pedagoji  3.000 €  Sırpça  İletişim Çalışmaları  4.000 €  ekonomi
Psikoloji  3.000 €  Sırpça  eğitimsel liderlik  4.000 €  İşletme Bilişimi
sosyoloji  3.000 €  Sırpça  Sosyal çalışma  4.000 €  Makine Mühendisliği
Felsefe  3.000 €  Sırpça  Sosyal Korumada Sosyoloji  4.000 €  Güç, Elektronik ve Telekomünikasyon Mühendisliği
Gazetecilik  3.000 €  Sırpça  kültür bilimi  4.000 €  Hesaplama ve Kontrol Mühendisliği
Sosyal çalışma  3.000 €  Sırpça  Konferans Tercümanlığı ve Çeviri  4.000 €  İnşaat mühendisliği
İngilizce ve Başka Bir Yabancı Dilde Çift Anadal  3.000 €  Sırpça  Gıda mikrobiyolojisi ve güvenliği  4.000 €  Mimari
kültür bilimi  3.000 €  Sırpça  Kozmetik teknolojisi  4.000 €  Sahne Tasarımı
İletişim ve Halkla İlişkiler  3.000 €  Sırpça  Gıda mühendisliği (Karbonhidrat gıda mühendisliği, Gıda koruma teknolojileri, Kalite kontrol)  4.000 €  Trafik mühendisliği
Gıda mühendisliği (Karbonhidrat gıda mühendisliği, Gıda koruma teknolojileri, Kalite kontrol)  3.000 €  Sırpça  Biyoteknoloji (Gıda biyoteknolojisi, Biyokimya mühendisliği)  4.000 €  Endüstri Mühendisliği / Mühendislik Yönetimi
Biyoteknoloji (Gıda biyoteknolojisi, Biyokimya mühendisliği)  3.000 €  Sırpça  ilaç mühendisliği  4.000 €  Grafik Mühendisliği ve Tasarım
ilaç mühendisliği  3.000 €  Sırpça  Kimya mühendisliği (Kimya işleme mühendisliği, Petrol-petrokimya mühendisliği, Eko-enerjik mühendislik)  4.000 €  Çevre Mühendisliği
Kimya mühendisliği (Kimya işleme mühendisliği, Petrol-petrokimya mühendisliği, Eko-enerjik mühendislik)  3.000 €  Sırpça  malzeme mühendisliği  4.000 €  İş güvenliği
malzeme mühendisliği  3.000 €  Sırpça  Hukuk, Güvenlik ve İçişleri  4.000 €  mekatronik
Hukuk, Güvenlik ve İçişleri  3.000 €  Sırpça  Adli Tıp Çalışmaları  4.000 €  Mühendislikte Matematik
İlköğretim Onur Derecesi ile Lisans  3.000 €  Sırpça  Vibro-Akustik Mühendisliği  4.000 €  Jeodezi ve Jeoinformatik
Okul Öncesi Eğitim Onur Derecesi ile Lisans  3.000 €  Sırpça  İlköğretim Yüksek Lisansı  4.000 €  Mühendislik Animasyonu
Komünikolojide Onur Derecesi ile Lisans  3.000 €  Sırpça  Okul Öncesi Eğitimi Yüksek Lisansı  4.000 €  Afet Risk Yönetimi ve Yangın Güvenliği
Öğrenci Danışmanı  3.000 €  Sırpça  Okul Öğretmenliğinde Usta  4.000 €  Biyomedikal mühendisliği
İlköğretim Öğretmenliği Eğitiminde Onur Derecesi ile Lisans  3.000 €  Sırpça  Kütüphanecilikte Usta  4.000 €  Bilgi Sistemleri Mühendisliği
Okul Öncesi Eğitimde Onur Derecesi ile Lisans  3.000 €  Sırpça  Bilgi Teknolojisi - modüller:  4.000 €  Biyomedikal Bilimlerde Doktora Akademik Çalışmaları - modüller:
Kütüphanecilikte Onur Derecesi ile Lisans  3.000 €  Sırpça  Bilgi Teknolojisi - Mühendislik  4.000 €  Morfolojik Bilimler ve Tanısal Görüntüleme
Bilgi teknolojisi - modüller:  3.000 €  Sırpça  Bilgi Teknolojileri - Yazılım Mühendisliği  4.000 €  Klinik ve Deneysel Farmakoloji, Biyokimya ve Laboratuvar Tıbbı
Bilgi Teknolojisi - mühendislik  3.000 €  Sırpça  Makine Mühendisliği  4.000 €  Modül: Fiziksel Tıp ve Rehabilitasyon ile Klinik ve Deneysel Fizyoloji
Bilgi Teknolojileri Yönetimi  3.000 €  Sırpça  Mühendislik Yönetimi  4.000 €  Eczacılık bilimi
Eğitimde bilgi teknolojisi ve tekniği  3.000 €  Sırpça  Giyim Mühendisliği  4.000 €  diş hekimliği
Bilgi Teknolojileri - Yazılım Mühendisliği  3.000 €  Sırpça  Eğitimde Bilişim ve Teknoloji  4.000 €  Halk Sağlığı
Mühendislik Yönetimi  3.000 €  Sırpça  Beden Eğitimi ve Spor  4.000 €  İnsan Üreme, Perinatoloji ve Pediatri
Makine Mühendisliği  3.000 €  Sırpça  Beden Eğitimi, Fiziksel Aktivite ve Sağlık  4.000 €  nörobilimler
Giyim Mühendisliği  3.000 €  Sırpça  İnşaat mühendisliği  4.000 €  Enflamasyon, Enfeksiyonlar ve Bağışıklık
Çevre Mühendisliği  3.000 €  Sırpça  jeodezi  4.000 €  Klinik ve Deneysel Dahiliye ve Onkoloji
Petrol ve Gaz İşletmelerinde Endüstri Mühendisliği  3.000 €  Sırpça  pişmiş toprak heykel  4.000 €  Klinik ve Deneysel Cerrahi ve Anestezi
Beden Eğitimi ve Spor 3 Yıl  3.000 €  Sırpça  Kompozisyon  4.000 €  hemşirelik
İnşaat mühendisliği  3.000 €  Sırpça  müzikoloji  4.000 €
jeodezi  3.000 €  Sırpça  Müzik ve Medya  4.000 €
Kompozisyon  3.000 €  Sırpça  etnomüzikoloji  4.000 €
müzikoloji  3.000 €  Sırpça  Müzik Pedagojisi  4.000 €
etnomüzikoloji  3.000 €  Sırpça  Performans sanatları  4.000 €
Müzik Pedagojisi  3.000 €  Sırpça  Gitar / Sahne Sanatları Ortak Yüksek Lisans Derecesi - Novi Sad Üniversitesi Sanat Akademisi Müzik Konservatuarı “Giuseppe Tartini”, Trieste, İtalya  4.000 €
Performans sanatları  3.000 €  Sırpça  Güzel Sanatlar Bölümü  4.000 €
Güzel Sanatlar Bölümü  3.000 €  Sırpça  Güzel Sanatlar  4.000 €
Uygulamalı Sanatlar ve Tasarım  3.000 €  Sırpça  Uygulamalı Sanatlar ve Tasarım  4.000 €
Drama Bölümü  3.000 €  Sırpça  Güzel ve Uygulamalı Sanatların Konservasyonu ve Restorasyonu  4.000 €
Sırp Dili Oyunculuk  3.000 €  Sırpça  Drama Bölümü  4.000 €
Macar Dili Oyunculuk (iki yılda bir kayıt)  3.000 €  Sırpça  Sırp Dili Oyunculuk  4.000 €
Dramaturji (iki yılda bir kayıt)  3.000 €  Sırpça  Macar Dili Oyunculuk (iki yılda bir kayıt)  4.000 €
Görsel-işitsel Medya  3.000 €  Sırpça  Dramaturji (iki yılda bir kayıt)  4.000 €
Multimedya Yönetmenliği (iki yılda bir kayıt)  3.000 €  Sırpça  Multimedya Yönetmenliği (iki yılda bir kayıt)  4.000 €
Müzik Prodüksiyonu  3.000 €  Sırpça  Uygulamalı Tiyatro  4.000 €
Video Oyunları Tasarımı  3.000 €  Sırpça  Görsel-işitsel Medya  4.000 €
Optometri  3.000 €  Sırpça  Biyoloji Bilim Ustası  4.000 €
Biyoloji Lisans Derecesi  3.000 €  Sırpça  Ekoloji Bilim Ustası  4.000 €
Ekoloji Bilim Lisansı  3.000 €  Sırpça  Üreme Biyolojisinde Bilim Ustası  4.000 €
Fizikte Bilim Lisansı  3.000 €  Sırpça  Fizikte Yüksek Lisans Akademik Çalışmaları  4.000 €
Coğrafya Bilim Lisansı  3.000 €  Sırpça  Coğrafya Bilim Ustası  4.000 €',
  '{"country": "Sırbistan", "chunk": 3, "total_chunks": 4}'::jsonb,
  ARRAY['ulke','sirbistan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Sırbistan Yurtdışı Eğitim Bilgileri (Bölüm 4)',
  'Jeoinformatik  3.000 €  Sırpça  Coğrafya Öğretiminde Bilim Ustası  4.000 €
Coğrafya Öğretmenliği Lisans Derecesi  3.000 €  Sırpça  Turizm Bilim Ustası  4.000 €
Turizm Bilim Lisansı  3.000 €  Sırpça  Kültürel Turizm ve Kültürel Miras Yönetiminde Yüksek Lisans Akademik Çalışmaları  4.000 €
Kimya Bilim Lisans Derecesi  3.000 €  Sırpça  Kimya Bilim Ustası  4.000 €
Kimya Bilim Lisansı - Kalite Kontrol ve Çevre Yönetimi  3.000 €  Sırpça  Biyokimya Bilim Ustası  4.000 €
Biyokimya Bilim Lisansı  3.000 €  Sırpça  Çevre Koruma Bilim Ustası  4.000 €
Çevre Koruma Bilim Lisansı - Çevre Koruma Analisti  3.000 €  Sırpça  Matematik Bilim Ustası  4.000 €
Matematik  3.000 €  Sırpça  Uygulamalı Matematik Bilim Ustası  4.000 €
Uygulamalı matematik  3.000 €  Sırpça  Uygulamalı Matematik Bilim Ustası: Veri Bilimi  4.000 €
Bilgisayar Bilimi  3.000 €  Sırpça  Bilgisayar Bilimi  4.000 €
Bilgi Teknolojisi  3.000 €  Sırpça  Bilişim Teknolojileri  4.000 €
Doğa bilimleri, matematik ve bilişim öğretimine yönelik entegre akademik iki ana çalışma  3.000 €  Sırpça  Yapay Zeka  4.000 €
Biyoloji Yüksek Lisans Profesörü  3.000 €  Sırpça  Finans, Bankacılık ve Sigortacılık  4.000 €
Fizik Öğretiminde Yüksek Lisans Profesörü  3.000 €  Sırpça  Pazarlama  4.000 €
Matematik Öğretiminde Yüksek Lisans Profesörü  3.000 €  Sırpça  Muhasebe ve Denetim  4.000 €
Kimya Öğretiminin Bütünleşik Akademik Çalışmaları  3.000 €  Sırpça  Tarım İşletmeciliği  4.000 €
ekonomi  3.000 €  Sırpça  Uluslararası Ekonomi ve İşletme  4.000 €
İşletme Bilişimi  3.000 €  Sırpça  Finans ve Bankacılık Yönetimi  4.000 €
Uluslararası ve Avrupa Ekonomisi ve Ticareti*  3.000 €  Sırpça  Dijital Pazarlama  4.000 €
İş Bilgi Sistemleri*  3.000 €  Sırpça  Liderlik ve İnsan Kaynakları Yönetimi  4.000 €
Muhasebe ve Denetim*  3.000 €  Sırpça  Çok Kanallı Ticaret  4.000 €
Yönetmek*  3.000 €  Sırpça  İşletme Bilişimi  4.000 €
*her üçüncü veya dördüncü yılda bir, Bujanovac Departmanı  3.000 €  Sırpça  İş Dünyasında Gelişmiş Veri Analitiği  4.000 €
Yazılım ve Bilgi Teknolojileri  3.000 €  Sırpça  Elektrik Mühendisliği  4.000 €
Elektrik Mühendisliği  3.000 €  Sırpça  Mühendislik Yönetimi - MBA  4.000 €
Üretim Mühendisliği  3.000 €  Sırpça  Üretim Mühendisliği  4.000 €
Mekanizasyon ve İnşaat Mühendisliği  3.000 €  Sırpça  Mühendislik Yönetimi  4.000 €
Enerji ve Proses Mühendisliği  3.000 €  Sırpça  Hemşirelikte yüksek lisans akademik çalışmaları  4.000 €
Teknik Mekanik ve Teknik Tasarım  3.000 €  Sırpça  Özel eğitim ve rehabilitasyon alanında yüksek lisans akademik çalışmaları  4.000 €
Güç, Elektronik ve Telekomünikasyon Mühendisliği  3.000 €  Sırpça  Tıbbi rehabilitasyon alanında yüksek lisans akademik çalışmaları  4.000 €
Hesaplama ve Kontrol Mühendisliği  3.000 €  Sırpça  Erken çocukluk müdahalesi  4.000 €
Güç Yazılım Mühendisliği  3.000 €  Sırpça
Ölçme ve Kontrol Mühendisliği  3.000 €  Sırpça
Yazılım Mühendisliği ve Bilişim Teknolojileri  3.000 €  Sırpça
Biyomedikal mühendisliği  3.000 €  Sırpça
İnşaat mühendisliği  3.000 €  Sırpça
Afet Risk Yönetimi ve Yangın Güvenliği  3.000 €  Sırpça
Mimari  3.000 €  Sırpça
Sahne Mimarisi, Teknik ve Tasarım  3.000 €  Sırpça
Trafik ve Ulaştırma Mühendisliği  3.000 €  Sırpça
Posta Trafiği ve Telekomünikasyon  3.000 €  Sırpça
Endüstri Mühendisliği  3.000 €  Sırpça
Mühendislik Yönetimi  3.000 €  Sırpça
Bilgi Sistemleri Mühendisliği  3.000 €  Sırpça
Grafik Mühendisliği ve Tasarım  3.000 €  Sırpça
Çevre Mühendisliği  3.000 €  Sırpça
İş güvenliği  3.000 €  Sırpça
mekatronik  3.000 €  Sırpça
Jeodezi ve Jeoinformatik  3.000 €  Sırpça
Mühendislik Animasyonu  3.000 €  Sırpça
Temiz Enerji Teknolojileri  3.000 €  Sırpça
Bilgi Mühendisliği  3.000 €  Sırpça
UzmanLIK akademik çalışmalar - Erken çocukluk müdahalesi  3.000 €  Sırpça
Radyoloji teknolojisi  3.000 €  Sırpça
Hemşirelik  3.000 €  Sırpça
Özel eğitim ve rehabilitasyon  3.000 €  Sırpça
engelli  3.000 €  Sırpça
logopedi  3.000 €  Sırpça
Kapsayıcı eğitim  3.000 €  Sırpça
Tıbbi rehabilitasyon  3.000 €  Sırpça
Pedagoji
Sosyal Korumada Sosyoloji
BELGRAD METROPOLİTAN ÜNİVERSİTESİ  UCRET  DİL  EK BİLGİLER  YUKSEK LİSANS  UCRET  DİL  DOKTORA  UCRET  DİL
Bilgi Teknolojileri  5000€ 2800€  İngilizce*Sırpça  Lisans Eğitimleri alan Öğrenciler  Yazılım Mühendisliği  5000€ 2800€  İngilizce*Sırpça  Yeni Medya Tasarımı  7000€ 4000€  İngilizce*Sırpça
Bilgi Sistemi  5000€ 2800€  İngilizce*Sırpça  Java Programlarının Temelleri  Bilgi Sistemi  5000€ 2800€  İngilizce*Sırpça  Yazılım Mühendisliği  7000€ 4000€  İngilizce*Sırpça
Yazılım Mühendisliği  5000€ 2800€  İngilizce*Sırpça  Java Gelişmiş Programlama  Bilgi Güvenliği  5000€ 2800€  İngilizce*Sırpça  Yönetim ve Geliştirme  7000€ 4000€  İngilizce*Sırpça
Oyun Geliştirme  5000€ 2800€  İngilizce*Sırpça  60 kredilik bir programdır Online Verilmektedir  Yeni Medya Tasarımı  5000€ 2800€  İngilizce*Sırpça
Mühendislik ve Operasyon Yönetimi  5000€ 2300€  İngilizce*Sırpça  Pazarlama Yönetimi  5000€ 2800€  İngilizce*Sırpça
İş ve Pazarlama  5000€ 2300€  İngilizce*Sırpça
Moda Tasarım  5000€ 2400€  İngilizce*Sırpça
Grafik Dizayn  5000€ 2300€  İngilizce*Sırpça',
  '{"country": "Sırbistan", "chunk": 4, "total_chunks": 4}'::jsonb,
  ARRAY['ulke','sirbistan','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'policy',
  'Eurostar Temsilcilik Ofisleri',
  'Eurostar Temsilcilik Ofisleri:

İSTANBUL:
  Adres: İSTİKLAL CADDESİ NO:49 (MAVİ HAN) KAT:5    TAKSİM/İSTANBUL
  Telefon/WhatsApp: 0212 709 87 09          0212 244 66 00

ANKARA -LEYLA HANIM:
  Adres: FİDANLIK MAHALLESİ MİTHATPAŞA CADDESİ NO:39/7 KAT:4     KIZILAY/ANKARA
  Telefon/WhatsApp: 0545 599 73 26

İZMİR - ŞÜHEDA HANIM:
  Adres: CUMHURİYET BULVARI KAPANİ İŞ MERKEZİ NO:36 KAT:7/711     KONAK/İZMİR
  Telefon/WhatsApp: 0553 407 01 43

ANTALYA - YEŞİM HANIM:
  Adres: ÜÇGEN MAHALLESİ ABDİ İPEKÇİ CADDESİ NO:13/7     MURATPAŞA/ANTALYA
  Telefon/WhatsApp: 0546 522 85 41

MUĞLA- GÜLCAN HANIM:
  Adres: ÇIRKAN MAHALLESİ MUSTAFA AYSU SOKAK NO:13/3     BODRUM/MUĞLA
  Telefon/WhatsApp: 0545 599 73 29       0538 436 05 01

HATAY - GÜLCAN HANIM:
  Adres: GAZİ MAHALLESİ 10.SOKAK NO:18     ANTAKYA/HATAY
  Telefon/WhatsApp: 0545 599 73 29      0538 436 05 01

ŞANLIURFA - HALİT HOCA:
  Adres: PAŞABAĞI MAHALLESİ 763. SOKAK ADLİYE İŞ MERKEZİ NO:2 HALİLİYE/ŞANLIURFA
  Telefon/WhatsApp: 0531 762 85 80

MARDİN - MEHMET ALİ HOCA:
  Adres: 0535 721 73 04

GAZİANTEP - ADİL BEY:
  Adres: 0553 087 31 69

ORDU - ASİYE HANIM:
  Adres: 0530 821 42 52

MERSİN-  MEHMET ALİ HOCA:
  Adres: 0535 721 73 04',
  '{"offices": [{"city": "İSTANBUL", "address": "İSTİKLAL CADDESİ NO:49 (MAVİ HAN) KAT:5    TAKSİM/İSTANBUL", "phone": "0212 709 87 09          0212 244 66 00"}, {"city": "ANKARA -LEYLA HANIM", "address": "FİDANLIK MAHALLESİ MİTHATPAŞA CADDESİ NO:39/7 KAT:4     KIZILAY/ANKARA", "phone": "0545 599 73 26"}, {"city": "İZMİR - ŞÜHEDA HANIM", "address": "CUMHURİYET BULVARI KAPANİ İŞ MERKEZİ NO:36 KAT:7/711     KONAK/İZMİR", "phone": "0553 407 01 43"}, {"city": "ANTALYA - YEŞİM HANIM", "address": "ÜÇGEN MAHALLESİ ABDİ İPEKÇİ CADDESİ NO:13/7     MURATPAŞA/ANTALYA", "phone": "0546 522 85 41"}, {"city": "MUĞLA- GÜLCAN HANIM", "address": "ÇIRKAN MAHALLESİ MUSTAFA AYSU SOKAK NO:13/3     BODRUM/MUĞLA", "phone": "0545 599 73 29       0538 436 05 01"}, {"city": "HATAY - GÜLCAN HANIM", "address": "GAZİ MAHALLESİ 10.SOKAK NO:18     ANTAKYA/HATAY", "phone": "0545 599 73 29      0538 436 05 01"}, {"city": "ŞANLIURFA - HALİT HOCA", "address": "PAŞABAĞI MAHALLESİ 763. SOKAK ADLİYE İŞ MERKEZİ NO:2 HALİLİYE/ŞANLIURFA", "phone": "0531 762 85 80"}, {"city": "MARDİN - MEHMET ALİ HOCA", "address": "0535 721 73 04"}, {"city": "GAZİANTEP - ADİL BEY", "address": "0553 087 31 69"}, {"city": "ORDU - ASİYE HANIM", "address": "0530 821 42 52"}, {"city": "MERSİN-  MEHMET ALİ HOCA", "address": "0535 721 73 04"}]}'::jsonb,
  ARRAY['temsilcilik','ofis','iletisim','sehir','istanbul','ankara','izmir'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'country',
  'Kosova Yurtdışı Eğitim Bilgileri',
  'KOSOVA ÜNİVERSİTELERİ  KAYIT DANIŞMANLIK 1400€  HAZIRLIK ARNAVUTÇA 2500€
VİZESİZ BİR ÜLKEDEDİR. OKUL BAŞLADIKTAN SONRA ÖĞRENCİ OTURUMU YAPILIR.
UNIVERSUM INTERNATIONAL COLLEGE  YAŞ SINIRI YOKTUR. DİPLOMA PUANI SINIRI YOKTUR. DÜŞÜKTE OLSA ALINIR.
BÖLÜMLER  ÜCRET  EĞİTİM DİLİ
HEMŞİRELİK (1 YIL KOSOVA + 2 YIL ALMANYADA HEM OKUYUP HEMDE ÇALIŞACAK)  9.000€  Almanca
Kosova Almanya hemşirelik programı toplam üç yıldır. Öğrenci ilk yıl Kosova’da ikinci ve üçüncü seneler Almanya’da eğitim alır.
İlk yıl yoğun Almanca ve hemşirelik dersleri görür. Bu eğitim Türkçe desteklidir ikinci dönem biraz Almanca’ya kayabilir. Sene sonu GÖTE nin sınavına girer. Bu sınavdan B2 alması gerekir.
Bu sınavı geçenler Almanya’ya gider. Almanya’da haftanın belli günleri staj belli günleri eğitim görür. Staj ücreti olarak 1300 Euro maaş alır. Program ücreti toplam 9000 Euro’dur. Kayıt danışmanlık, okul ücreti, Almanca dersleri bu ücrete dahildir.
HUKUK (KOSOVA+İNGİLİTERE DİPLOMASI) HIZLANDIRILMIŞ HUKUK EĞİTİM- DENKLİK İSTEYENLER İÇİN  5.500€  Türkçe- İngilizce
Öğrenci 4 yıl eğitim alır ancak 3 yıl ödeme yapar. Son yıl bir ödeme yapılmaz. Öğrenci eğitimini 4 yıl Kosova''da tamamlar.
Son yıl Kosova İngiltere programından mezun olur. İngiltere LİVERPOOL JHON MOORES üniversitesi ilk binde yer aldığı için öğrenci Türkiye''den denkliğini alabilir.
Türkiye''de adalet bölümü mezunu olan öğrenciler için bu programda 2. sınıftan eğitime başlayabilmektedir. Eğitim süresi toplamda üç yıldır.
Üç yıl ödeme yapıyor. yıllık 5.500€
Kosova Universum Üniversitesi SİBER GÜVENLİK ve YAZILIM -BİLGİSAYAR MÜHENDİSLİĞİ bölümü ile Amerika''da Arizona Devlet Üniversitesi''nde +1 Amerika Çifte Diploma programı
Program Süresi: 3 Yıl + 1 Yıl
Eğitim Dili: İngilizce
Program Ücreti :2.800€ Yıllık
Burs İmkanları:
Öğrenciler, 50.000$''a kadar burs alarak 36.000$ olan eğitim ücretini bursla karşılama ve geri kalan 14.000$ ile Amerika''da 1 yıl yaşama fırsatına sahip olurlar.
Bu burs geri ödemeli olup, bursu veren kuruluş, öğrencinin 3 yıllık Amerika işçi oturum iznini alarak 3 yıl çalışmasını sağlar ve maaşının %50''sini keserek bursunu öder.
PSİKOLOJİ  €3.000,00  İngilizce
İŞLETME ve YÖNETİM  €2.800,00  Arnavutça
SİBER GÜVENLİK  €2.800,00  Arnavutça
BİLGİSAYAR BİLİMLERİ  €2.800,00  Arnavutça
FİZYOTERAPİ  €3.200,00  Arnavutça
SİYASET BİLİMİ  €2.200,00  Arnavutça
DİŞ HİJEN  €3.200,00  Arnavutça
DİJİTAL GAZTECELİK  €2.200,00  Arnavutça
DİŞ TEKNİSYENLİĞİ  €3.200,00  Arnavutça
MODA TASARIM  €2.200,00  Arnavutça
GRAFİK TASARIM  €2.200,00  Arnavutça
HEMŞİRELİK  €3.200,00  Arnavutça
DİŞ HEKİMLİĞİ  €7.500,00  Arnavutça
Laboratory Biomedicine  €3.500,00  Arnavutça
PSİKOLOJİ  €2.200,00  Arnavutça
KOZMETOLOJİ  €3.500,00  Arnavutça
BESLENME VE FİTNES (FR)  €2.800,00  Arnavutça
Professional Programs- Level 5- Accredited by Pearson
HEMŞİRELİK  €1.800,00  Arnavutça
GRAFİK TASARIM  €1.800,00  Arnavutça
İÇ MİMARLIK  €1.800,00  Arnavutça
MODA TASARIMI  €1.800,00  Arnavutça
eSport  €850,00  Arnavutça
TURİZİM  €1.400,00  Arnavutça
HASTANECİLİK  €1.400,00  Arnavutça
PAZARLAMA  €1.400,00  Arnavutça
DİJİTAL TEKNOLOJİ  €1.800,00  Arnavutça
LİSANS PROGRAMLARI (University of Northampton)
İŞLETME VE YÖNETİM  €2.900,00  Arnavutça
BİLGİSAYAR BİLİMLERİ  €2.900,00  Arnavutça
HEMŞİRELİK  €2.900,00  Arnavutça
MODA TASARIMI  €2.900,00  Arnavutça
YÜKSEK LİSANS EĞİTİM PROGRAMLARI
YÖNETİM YÜKSEK LİSANS  €2.500,00  Arnavutça
YÖNETİM VE ULUSAL GÜVENLİK  €2.500,00  Arnavutça
VERİ BİLİMİ ve ANALİTİĞİ  €2.500,00  Arnavutça
Master Study Programs- Double Degrees
Master in Business Administration (MBA) with Ludwigshafen University of Applied Sciences  €2.700,00  Arnavutça
Master''s degree programs with degrees from the University of Northampton
YÖNETİM YÜKSEK LİSANS  €3.100,00  Arnavutça
İŞLETME YÜKSEK LİSANSI (MBA)  €3.500,00  Arnavutça
ULUSLARARASI İLİŞKİLER  €3.100,00  Arnavutça',
  '{"country": "Kosova", "chunk": 1, "total_chunks": 1}'::jsonb,
  ARRAY['ulke','kosova','program','fiyat'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'DENKLİK NEDİR?',
  'DENKLİK NEDİR?

Denklik; yurtdışındaki bir üniversiteden alınan diplomanın, Türkiye’deki üniversite diplomalarına eşdeğer olup olmadığının Yükseköğretim Kurulu (YÖK) tarafından değerlendirilmesi ve onaylanmasıdır.
Denklik sürecinde üniversitenin tanınırlığı, eğitim programı, alınan dersler ve eğitim süresi gibi kriterler değerlendirilir.
İnceleme sonucunda diploma doğrudan denk sayılabilir veya bazı durumlarda ek ders, sınav ya da uygulama gibi ek şartlar istenebilir.',
  '{}'::jsonb,
  ARRAY['denklik','faq','genel'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'TANINIRLIK NEDİR?',
  'TANINIRLIK NEDİR?

Tanınırlık, yurtdışındaki bir üniversitenin Türkiye’de Yükseköğretim Kurulu (YÖK) tarafından resmi olarak kabul edilip edilmediğini ifade eder.
Bir üniversitenin tanınırlığı varsa, o üniversitede alınan diploma denklik başvurusu yapmaya (BAZI BÖLÜMLER HARİÇ) uygun kabul edilir.
Tanınırlık: Üniversitenin YÖK tarafından kabul edilmesi (TANINIRLIK E-DEVLETTE BAKILIYOR
Denklik: Alınan diplomanın Türkiye’de geçerli sayılması
Denklikte sadece tanınırlığa bakılmayan bölümler bulunmaktadır.   (karar mart 2024te yayınlandı.)
YÖK tarafından alınan karara göre Tıp, Diş Hekimliği, Eczacılık ve Hukuk okumak isteyen öğrenciler ya YKS''ye girip ülkede kazanmış gibi bir puan ve sıralama yapacak ya da
YÖK''ün kabul ettiği üniversite sıralama kuruluşlarında ilk binde yer alan üniversitelerde okuyacak. Bizim çalıştığımız ülkeler: kosova çifte diploma hukuk programı, sırbistan, iran ve rusyadır
sıralama kuruluşları; arwu , cwts, qs, the higher education
Çalıştığımız ülkeler:
Kuzey Makedonya, Bosna hersek, Sırbistan, Kosova, Bulgaristan, Gürcistan, Moldova, Polonya , Romanya, Rusya, Azerbaycan, Iran',
  '{}'::jsonb,
  ARRAY['denklik','faq','genel'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'EN ÇOK SORULAN SORULAR',
  'EN ÇOK SORULAN SORULAR

1- KAYIT DANIŞMANLIK ÜCRETİNE HANGİ HİZMETLER DAHİLDİR.
Üniversite kayıt, Havalimanında karşılama, yerleştirme, kalacak yer bakanlık ve oturum işlemlerinde rehberlik.
2- KAYIT DANIŞMANLIK ÜCRETİ HER YIL ÖDENİYOR MU?
Ücret kayıt esnasında tek seferlik alınır.
3- KAYIT DANIŞMANLIK ÜCRETİNE VİZE DAHİL Mİ?
Biz vizeci değiliz, vizeye yönlendiriyoruz. ücretlendirmesi vize şirketlerine yapılıyor.
4- HERHANGİ BİR EVRAK HAZIRLAMAYA GEREK VAR MI?
Öğrencilere evrak listesi iletilir ve evrakların hangi kurumlardan alınacağı konusunda yönlendirilir.',
  '{}'::jsonb,
  ARRAY['denklik','faq','genel'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'DENKLİK ALMAK İÇİN NE YAPILMALI?',
  'DENKLİK ALMAK İÇİN NE YAPILMALI?

1- YÖK''ün denklik için istediği şartları sağlayan bir mezun olmak gerekir. Öğrenci Okuduğu yıl boyunca dönemlik 49 iş günü
yurtdışında bulunmalıdır. Denklik müracatında yurtdışı giriş-çıkışları teslim edilir.
2-Bölüme göre denklik prosedürleri değişkenlik gösterir. Bazı bölümlerde fark dersleri çıkar ve bu dersleri
Türkiye''deki üniversitelerden alır.',
  '{}'::jsonb,
  ARRAY['denklik','faq','genel'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'BÖLÜM  FARK DERSİ  SINAV',
  'BÖLÜM  FARK DERSİ  SINAV

TIP FAKÜLTESİ  çıkmaz  TUS 2. OTURUM
DİŞ HEKİMLİĞİ  çıkmaz  DUS 2. OTURUM
ECZACILIK  1 ders  İlmi Hüviyet (sınav mülakat formunda gerçekleşir.)
HUKUK  9 ila 12 ders  STS
VETERİNERLİK  çıkabilir  STS
DİĞER BÖLÜMLER  çıkabilir  STS
*mühendislikler proje teslimi de yapabiliyorlar.
*denklik için staj yapması gereken bölümlerde, staj eksiksiz tamamlanmalı gerekli evraklar denklik aşamasında
YÖK''e teslim edilmelidr.
*sınavlarda %40lık başarı istenmektedir.
*denklik sınavları yılda 2 kez yapılmaktadır. Sınırsız giriş hakkı bulunmaktadır.
not: Doktora kaydı almıyoruz.
not2: Yurtdışında bütünleşik doktora yoktur.
not3: Yüksek lisans kayıtları için lisans evraklarının okula sorulması gerekmektedir.',
  '{}'::jsonb,
  ARRAY['denklik','faq','genel'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'policy',
  'Hizmet Kapsamı Dışındaki Konular',
  'Eurostar Yurtdışı Eğitim Danışmanlığı olarak şu hizmetleri SUNMUYORUZ ve bu konularda kesinlikle bilgi vermiyoruz:

1. LİSE EĞİTİMİ: Yurt dışında lise eğitimi için öğrenci göndermiyoruz. Yalnızca lisans ve yüksek lisans düzeyinde hizmet veriyoruz. Lise soranları nazikçe bilgilendirip kapatıyoruz.

2. ONLİNE EĞİTİM: Online, uzaktan veya e-learning programı sunmuyoruz. Tüm programlarımız yurt dışında yüz yüze eğitim şeklinde.

3. İŞÇİ / ÇALIŞAN GÖNDERME: Yurt dışı iş yerleştirme, çalışma vizesi veya işçi göçü hizmeti sunmuyoruz. Bu konuda kesinlikle yönlendirme yapmayız.

4. UKRAYNA DURUMU: Ukrayna''da diploma kaybı veya Ukraynalı öğrencilerle ilgili sorular için danışmana yönlendirme yapılır — bu konuyu AI olarak yanıtlamıyoruz.

5. ÜNİVERSİTE DEĞİLİZ: Üniversitelere öğrenci yerleştirme danışmanlığı yapıyoruz. Belirli bir fakültenin hocası, rektörü veya akademik personeli değiliz.

6. BURS SORUSU: Üniversiteler kendi burs programlarını yönetir. Burs başvuruları hakkında net bilgimiz yoksa danışmana yönlendiririz.

7. VİZE İŞLEMLERİ: Vize yapımı bizim hizmetimiz dışındadır. Vize şirketlerine yönlendiriyoruz. Vize ücretini biz almıyoruz.',
  '{"type": "hard_stops"}'::jsonb,
  ARRAY['kapsam_disi','policy','lise','online','ukrayna','vize','burs'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'YKS Dönemi ve Sınav Sonrası Başvuru',
  'YKS (Yükseköğretim Kurumları Sınavı) dönemi özel durumlar:

YKS sınavı genellikle Haziran ayında yapılır. Sonuçlar Temmuz-Ağustos''ta açıklanır.
Bu dönemde arama hacmi önemli ölçüde artar.

YKS puanıyla yurt dışı başvurusu nasıl işliyor?
- Türkiye''deki üniversiteye YKS ile yerleşemeyen öğrenciler yurt dışı seçeneğini değerlendirebilir.
- Yurt dışı üniversitelerin büyük çoğunluğu YKS puanı değil, lise diploma notu ve diğer kriterler bakar.
- İstisna: Tıp, Diş Hekimliği, Eczacılık, Hukuk bölümlerinde YÖK denklik için YKS puan şartı olabilir.

Sınav sonucu yeni açıklandıysa ne yapmalı?
1. Üniversiteye kayıt dönemleri genellikle Ağustos-Eylül''dür — acele gerekebilir.
2. Bazı üniversitelerin başvuru son tarihleri kapanmış olabilir — danışmanla hemen görüşülmelidir.
3. Diploma notu ve yaş bilgisi hazırlanmalıdır.

Eski öğrenci mi arıyorsunuz?
Daha önce başvurusu olan veya kayıt yaptırmış öğrenciler öncelikli olarak danışmana bağlanır.',
  '{"seasonal": true, "period": "haziran-eylul"}'::jsonb,
  ARRAY['yks','sinav','sezonsal','faq','puan','mezun'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'Sık Sorulan Sorular — Genel',
  'En sık sorulan sorular ve cevapları:

S: Kayıt danışmanlık ücreti ne kadar?
C: Ülkeye ve üniversiteye göre değişir. Azerbaycan için 1.150-1.500 USD, Polonya için Tıp/Hukuk bölümlerinde 1.550 EUR, diğerleri farklıdır. Net fiyat için danışmana yönlendirilirsiniz.

S: Ücrete neler dahil?
C: Üniversiteye kayıt, havalimanı karşılama, kalacak yer desteği, oturum ve bakanlık işlemlerinde rehberlik. Ücret tek seferlik alınır.

S: Vize işlemleri dahil mi?
C: Hayır. Biz vizeci değiliz. Vize şirketlerine yönlendiriyoruz, ücret onlara ödenir.

S: Denklik alabilecek miyim?
C: Çalıştığımız üniversitelerin büyük çoğunluğu YÖK tarafından tanınmaktadır. Tıp, Diş, Eczacılık, Hukuk için ek şartlar var — denklik bilgileri için detaylı konuşmak gerekiyor.

S: Yurt dışında yardımcı olunuyor mu?
C: Evet. Havalimanı karşılama, yerleşme, oturum işlemleri ve bakanlık işlemlerinde rehberlik sağlanıyor.

S: Kaç yaşında olunmalı?
C: Genel kural 17-25 yaş arası. Bazı ülkeler farklılık gösterir — Azerbaycan''da yaş sınırı yoktur, Rusya''da 25 yaş üstü için sınırlı üniversite vardır.

S: Adli sicil kaydı olursa ne olur?
C: Birçok ülkede adli sicil kaydı başvuruyu engeller. Duruma göre değerlendirme için danışmana görüşülmesi gerekir.

S: İngilizce bilmek şart mı?
C: İngilizce programlar için gereklidir. Ancak birçok programda hazırlık sınıfı mevcuttur. Dil gerekliliği ülke ve üniversiteye göre değişir.',
  '{}'::jsonb,
  ARRAY['sss','faq','genel','ucret','vize','denklik','yas'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'policy',
  'Çalıştığımız Ülkeler',
  'Eurostar olarak yurtdışı eğitim için çalıştığımız ülkeler:
Azerbaycan, Bosna Hersek, Bulgaristan, Gürcistan, Kuzey Makedonya, Moldova, Polonya, Romanya, Rusya, Sırbistan, Kosova, İran.

Tıp, Diş Hekimliği, Eczacılık ve Hukuk için YÖK denklik şartı önemlidir.
Bu bölümler için: QS, THE, CWTS, ARWU sıralamalarında ilk binde olan üniversiteler veya Kosova çifte diploma programları tercih edilir.
Bu kriterlere uyan ülkelerimiz: Kosova (çifte diploma hukuk), Sırbistan, İran, Rusya.',
  '{"countries": ["Azerbaycan", "Bosna Hersek", "Bulgaristan", "Gürcistan", "Kuzey Makedonya", "Moldova", "Polonya", "Romanya", "Rusya", "Sırbistan", "Kosova", "İran"]}'::jsonb,
  ARRAY['ulkeler','genel','denklik','policy'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'Kayıt Danışmanlık Ücreti Ne İçeriyor?',
  'Kayıt danışmanlık ücretine dahil hizmetler:
- Üniversiteye kayıt işlemleri
- Havalimanında karşılama
- Kalacak yer arama desteği
- Bakanlık (Diploma denklik/onay) işlemlerinde rehberlik
- Oturum izni işlemlerinde rehberlik

Ücret kayıt esnasında tek seferlik alınır, her yıl tekrarlanmaz.
Vize işlemleri ayrıca ücretlendirilir — biz vizeci değiliz, vize şirketine yönlendiriyoruz.',
  '{}'::jsonb,
  ARRAY['fiyat','ucret','danismanlik','faq'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'Yaşam Maliyeti ve Barınma',
  'Ülkelere göre tahmini aylık yaşam maliyetleri (barınma hariç):
- Azerbaycan: 500-600 AZN/ay. Yurt: 250 AZN, Hat+internet: 35 AZN, Sigorta (ilk yıl inşaat/mimarlık): 200 AZN
- Bosna Hersek: Yurt 700-1050 KM/ay (oda tipine göre), Oturum izni 295€ (ilk yıl), 140€ (sonraki yıllar)
- Polonya: Ev kirası 200-300€, Yurt 100-150€
- Rusya: Yurt 100-200 USD/ay

Ülkeye gidildikten sonra yardımcı olunuyor mu?
Evet. Havalimanı karşılama, yerleştirme, oturum ve bakanlık işlemlerinde rehberlik sağlanıyor.',
  '{}'::jsonb,
  ARRAY['yasam_maliyeti','barinma','yurt','faq'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'faq',
  'Başvuru İçin Gerekli Belgeler',
  'Başvuru için genel gereklilikler:
- Lise diploması (apostilli, çevrilmiş)
- Pasaport kopyası
- Diploma notu / transkript
- Adli sicil kaydı (suçsuzluk belgesi)
- Fotoğraf

Ülkeye ve üniversiteye göre ek belgeler istenebilir. Öğrencilere evrak listesi ayrıca iletilir,
hangi kurumlardan alınacağı konusunda yönlendirme yapılır.',
  '{}'::jsonb,
  ARRAY['evrak','belge','basvuru','faq'],
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();

