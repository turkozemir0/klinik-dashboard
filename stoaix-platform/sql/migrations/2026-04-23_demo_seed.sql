-- Demo Seed Data: Diş Kliniği
-- 2026-04-23

-- Demo org
INSERT INTO organizations (id, name, slug, sector, status, onboarding_status, is_demo, channel_config)
VALUES (
  'de000000-0000-0000-0000-000000000001',
  'Demo Diş Kliniği',
  'demo-klinik',
  'clinic',
  'active',
  'completed',
  true,
  '{"whatsapp": {"provider": "meta_cloud", "enabled": false}, "voice_inbound": {"enabled": true}}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Demo subscription (legacy = entitlement bypass)
INSERT INTO org_subscriptions (id, organization_id, plan_id, status, current_period_start, current_period_end)
VALUES (
  'de000000-0000-0000-0000-a0b000000001',
  'de000000-0000-0000-0000-000000000001',
  'legacy',
  'active',
  now(),
  now() + interval '10 years'
) ON CONFLICT (id) DO NOTHING;

-- Intake schema
INSERT INTO intake_schemas (id, organization_id, channel, name, fields)
VALUES (
  'de000000-0000-0000-0000-a1ca00000001',
  'de000000-0000-0000-0000-000000000001',
  'all',
  'Diş Kliniği Veri Toplama',
  '[
    {"key": "full_name", "label": "Ad Soyad", "type": "text", "required": true},
    {"key": "phone", "label": "Telefon", "type": "phone", "required": true},
    {"key": "email", "label": "E-posta", "type": "email", "required": false},
    {"key": "city", "label": "Şehir", "type": "text", "required": false},
    {"key": "age", "label": "Yaş", "type": "number", "required": false},
    {"key": "treatment_type", "label": "Tedavi Türü", "type": "select", "required": true, "options": ["İmplant", "Zirkonyum Kaplama", "Gülüş Tasarımı", "Diş Beyazlatma", "Kanal Tedavisi", "Ortodonti", "Diğer"]},
    {"key": "budget", "label": "Bütçe Aralığı", "type": "select", "required": false, "options": ["10.000-25.000 TL", "25.000-50.000 TL", "50.000-100.000 TL", "100.000+ TL"]},
    {"key": "urgency", "label": "Aciliyet", "type": "select", "required": false, "options": ["Bu hafta", "Bu ay", "1-3 ay içinde", "Sadece araştırıyorum"]}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Agent playbooks (voice + whatsapp)
INSERT INTO agent_playbooks (id, organization_id, channel, name, system_prompt_template, routing_rules)
VALUES
(
  'de000000-0000-0000-0000-a2b000000001',
  'de000000-0000-0000-0000-000000000001',
  'voice',
  'Sesli Asistan - Selin',
  E'Sen Demo Diş Kliniği''nin AI asistanı Ayşe''sin. Profesyonel, sıcak ve güler yüzlü bir tonla konuş.\n\nKliniğimiz İstanbul Kadıköy''de, 15 yıllık deneyime sahip. Uzman kadromuzla implant, zirkonyum kaplama, gülüş tasarımı, diş beyazlatma ve kanal tedavisi hizmetleri sunuyoruz.\n\nGörevlerin:\n1. Hastanın tedavi ihtiyacını anla\n2. Uygun tedavi seçeneklerini bilgi bankasından sun\n3. Fiyat bilgisi ver (bilgi bankasındaki fiyatları kullan)\n4. Randevu almak isterse bilgilerini topla\n5. Acil durumlarda insan satışçıya devret\n\nÖnemli: Tıbbi teşhis koyma, sadece bilgi ver ve randevuya yönlendir.',
  '[{"type": "handoff", "keywords": ["doktor", "acil", "şikayet", "ağrı"], "threshold": 80}]'::jsonb
),
(
  'de000000-0000-0000-0000-a2b000000002',
  'de000000-0000-0000-0000-000000000001',
  'whatsapp',
  'WhatsApp Asistan - Selin',
  E'Sen Demo Diş Kliniği''nin WhatsApp asistanı Ayşe''sin. Kısa, öz ve yardımsever mesajlar yaz.\n\nKliniğimiz İstanbul Kadıköy''de. İmplant, zirkonyum, gülüş tasarımı, beyazlatma, kanal tedavisi hizmetlerimiz var.\n\nGörevlerin:\n1. Hastanın sorusunu anla\n2. Bilgi bankasından doğru bilgiyi sun\n3. Fiyat sorarsa bilgi bankasındaki güncel fiyatları paylaş\n4. Randevu talebi varsa bilgileri topla\n5. Gerekirse insan satışçıya devret\n\nWhatsApp''ta kısa paragraflar kullan, emoji ile destekle.',
  '[{"type": "handoff", "keywords": ["doktor", "acil", "şikayet"], "threshold": 80}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Knowledge items (12 items)
-- Schema: id, organization_id, item_type, title, description_for_ai, data, tags, is_active
INSERT INTO knowledge_items (id, organization_id, item_type, title, description_for_ai, data, tags) VALUES
('de000000-0000-0000-0000-ab0000000001', 'de000000-0000-0000-0000-000000000001',
 'service', 'İmplant Tedavisi',
 'Diş implantı, kaybedilen dişlerin yerine titanyum vida ile yapılan kalıcı tedavidir. Kliniğimizde Straumann ve Osstem marka implantlar kullanılmaktadır. İşlem lokal anestezi altında yapılır, 15-20 dakika sürer. Ossifikasyon süreci 2-4 ay sürer, ardından üst yapı (kron) takılır. Başarı oranı %97+.',
 '{"category": "tedavi"}'::jsonb, ARRAY['implant', 'tedavi']),

('de000000-0000-0000-0000-ab0000000002', 'de000000-0000-0000-0000-000000000001',
 'service', 'İmplant Fiyatları',
 'Tek diş implant (Osstem): 15.000 - 20.000 TL. Tek diş implant (Straumann): 25.000 - 35.000 TL. All-on-4 implant (tek çene): 120.000 - 180.000 TL. All-on-6 implant (tek çene): 150.000 - 220.000 TL. Fiyatlar KDV dahildir. Taksit seçenekleri mevcuttur (6-12 ay).',
 '{"category": "fiyat"}'::jsonb, ARRAY['implant', 'fiyat']),

('de000000-0000-0000-0000-ab0000000003', 'de000000-0000-0000-0000-000000000001',
 'service', 'Zirkonyum Kaplama',
 'Zirkonyum kaplama, dişlerin üzerine yapılan doğal görünümlü, dayanıklı porselen kaplamadır. Metal altyapı içermez, alerji riski yoktur. Doğal diş görünümü sağlar. Ortalama ömrü 15-20 yıl. İşlem 2 seansta tamamlanır: 1. seans diş kesimi + ölçü, 2. seans yapıştırma.',
 '{"category": "tedavi"}'::jsonb, ARRAY['zirkonyum', 'tedavi']),

('de000000-0000-0000-0000-ab0000000004', 'de000000-0000-0000-0000-000000000001',
 'service', 'Zirkonyum Fiyatları',
 'Zirkonyum kaplama (tek diş): 5.000 - 8.000 TL. Tam ağız zirkonyum (20 diş): 80.000 - 140.000 TL. Laminate veneer (tek diş): 6.000 - 10.000 TL. Hollywood smile paketi (20 diş): 100.000 - 160.000 TL. Garanti süresi: 5 yıl.',
 '{"category": "fiyat"}'::jsonb, ARRAY['zirkonyum', 'fiyat']),

('de000000-0000-0000-0000-ab0000000005', 'de000000-0000-0000-0000-000000000001',
 'service', 'Gülüş Tasarımı (Smile Design)',
 'Dijital gülüş tasarımı ile yüz hatlarınıza uygun mükemmel gülüş oluşturulur. 3D tarama ve dijital simülasyon ile tedavi öncesi sonucu görebilirsiniz. Tedavi seçenekleri: laminate veneer, zirkonyum kaplama, diş beyazlatma veya kombinasyon. Süre: 1-2 hafta.',
 '{"category": "tedavi"}'::jsonb, ARRAY['estetik', 'tedavi']),

('de000000-0000-0000-0000-ab0000000006', 'de000000-0000-0000-0000-000000000001',
 'service', 'Diş Beyazlatma',
 'Profesyonel diş beyazlatma ile dişleriniz 3-8 ton açılır. Klinikte (ofis tipi): 1 seansta 45 dk. Evde beyazlatma kiti: 10-14 gün. Sonuçlar 1-2 yıl sürer. Hassasiyet minimum düzeydedir. Fiyat: Klinikte beyazlatma 3.000 - 5.000 TL, evde kit 2.000 - 3.000 TL.',
 '{"category": "tedavi"}'::jsonb, ARRAY['beyazlatma', 'tedavi']),

('de000000-0000-0000-0000-ab0000000007', 'de000000-0000-0000-0000-000000000001',
 'service', 'Kanal Tedavisi',
 'İltihaplanmış veya enfekte olmuş diş sinirinin temizlenmesi ve doldurulması işlemidir. Modern döner alet sistemleri ile ağrısız yapılır. Tek seansta tamamlanır (45-90 dk). Başarı oranı %95+. Tedavi sonrası kron kaplama önerilir. Fiyat: 2.000 - 4.000 TL (diş türüne göre).',
 '{"category": "tedavi"}'::jsonb, ARRAY['kanal', 'tedavi']),

('de000000-0000-0000-0000-ab0000000008', 'de000000-0000-0000-0000-000000000001',
 'faq', 'Çalışma Saatleri ve Konum',
 'Adres: Demo Diş Kliniği, Kadıköy, İstanbul. Çalışma saatleri: Pazartesi-Cuma 09:00-19:00, Cumartesi 09:00-15:00, Pazar kapalı. Ücretsiz otopark mevcuttur. Kadıköy metro durağına 5 dakika yürüme mesafesinde.',
 '{"category": "genel"}'::jsonb, ARRAY['konum', 'saat']),

('de000000-0000-0000-0000-ab0000000009', 'de000000-0000-0000-0000-000000000001',
 'faq', 'Ödeme ve Taksit Seçenekleri',
 'Nakit, kredi kartı ve havale/EFT kabul edilir. Taksit seçenekleri: 3, 6, 9 ve 12 aya kadar taksit imkanı. Anlaşmalı bankalar: Garanti, İş Bankası, Yapı Kredi, Akbank. 20.000 TL üzeri tedavilerde %10 nakit indirimi uygulanır.',
 '{"category": "ödeme"}'::jsonb, ARRAY['ödeme', 'taksit']),

('de000000-0000-0000-0000-ab0000000010', 'de000000-0000-0000-0000-000000000001',
 'faq', 'SSS - İmplant Ağrılı mı?',
 'İmplant işlemi lokal anestezi altında yapılır, işlem sırasında ağrı hissedilmez. İşlem sonrası 1-2 gün hafif şişlik ve hassasiyet olabilir, reçeteli ağrı kesici ile kontrol altına alınır. Çoğu hasta ertesi gün normal hayatına döner.',
 '{"category": "sss"}'::jsonb, ARRAY['sss', 'implant']),

('de000000-0000-0000-0000-ab0000000011', 'de000000-0000-0000-0000-000000000001',
 'faq', 'SSS - Tedavi Garantisi',
 'İmplant: 10 yıl garanti (Straumann), 5 yıl garanti (Osstem). Zirkonyum kaplama: 5 yıl garanti. Dolgu: 2 yıl garanti. Garanti kapsamında ücretsiz kontroller yapılır. Garanti şartı: 6 ayda bir düzenli kontrol.',
 '{"category": "sss"}'::jsonb, ARRAY['sss', 'garanti']),

('de000000-0000-0000-0000-ab0000000012', 'de000000-0000-0000-0000-000000000001',
 'service', 'Ortodonti (Tel Tedavisi)',
 'Şeffaf plak (Invisalign): 40.000 - 80.000 TL, süre 6-18 ay. Metal braket: 20.000 - 35.000 TL, süre 12-24 ay. Seramik braket: 30.000 - 50.000 TL, süre 12-24 ay. Ücretsiz ortodonti konsültasyonu sunulmaktadır.',
 '{"category": "tedavi"}'::jsonb, ARRAY['ortodonti', 'tedavi'])

ON CONFLICT (id) DO NOTHING;

-- Demo contacts (5)
-- Schema: id, organization_id, full_name, phone, email, source_channel
INSERT INTO contacts (id, organization_id, full_name, phone, email, source_channel, created_at) VALUES
('de000000-0000-0000-0000-c00000000001', 'de000000-0000-0000-0000-000000000001',
 'Mehmet Yılmaz', '+905551234567', 'mehmet@example.com', 'whatsapp', now() - interval '5 days'),
('de000000-0000-0000-0000-c00000000002', 'de000000-0000-0000-0000-000000000001',
 'Ayşe Kaya', '+905559876543', 'ayse.kaya@example.com', 'voice', now() - interval '3 days'),
('de000000-0000-0000-0000-c00000000003', 'de000000-0000-0000-0000-000000000001',
 'Fatma Demir', '+905553456789', null, 'whatsapp', now() - interval '2 days'),
('de000000-0000-0000-0000-c00000000004', 'de000000-0000-0000-0000-000000000001',
 'Ali Öztürk', '+905557654321', 'ali.ozturk@example.com', 'whatsapp', now() - interval '1 day'),
('de000000-0000-0000-0000-c00000000005', 'de000000-0000-0000-0000-000000000001',
 'Zeynep Arslan', '+905552345678', null, 'voice', now() - interval '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Demo leads (5, various statuses)
INSERT INTO leads (id, organization_id, contact_id, status, qualification_score, collected_data, created_at) VALUES
('de000000-0000-0000-0000-1ead00000001', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000001', 'qualified', 85,
 '{"treatment_type": "İmplant", "budget": "25.000-50.000 TL", "urgency": "Bu ay", "age": "45"}'::jsonb,
 now() - interval '5 days'),

('de000000-0000-0000-0000-1ead00000002', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000002', 'handed_off', 92,
 '{"treatment_type": "Gülüş Tasarımı", "budget": "100.000+ TL", "urgency": "Bu hafta", "age": "32"}'::jsonb,
 now() - interval '3 days'),

('de000000-0000-0000-0000-1ead00000003', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000003', 'in_progress', 45,
 '{"treatment_type": "Diş Beyazlatma", "urgency": "Sadece araştırıyorum"}'::jsonb,
 now() - interval '2 days'),

('de000000-0000-0000-0000-1ead00000004', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000004', 'new', 20,
 '{"treatment_type": "Zirkonyum Kaplama"}'::jsonb,
 now() - interval '1 day'),

('de000000-0000-0000-0000-1ead00000005', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000005', 'in_progress', 60,
 '{"treatment_type": "Kanal Tedavisi", "urgency": "Bu hafta", "age": "28"}'::jsonb,
 now() - interval '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Demo conversations (3)
-- Schema: id, organization_id, contact_id, channel, status, started_at
INSERT INTO conversations (id, organization_id, contact_id, channel, status, started_at) VALUES
('de000000-0000-0000-0000-c0e000000001', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000001', 'whatsapp', 'active', now() - interval '5 days'),
('de000000-0000-0000-0000-c0e000000002', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000003', 'whatsapp', 'active', now() - interval '2 days'),
('de000000-0000-0000-0000-c0e000000003', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000002', 'voice', 'closed', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Demo messages (conversation 1: implant inquiry)
-- Schema: id, conversation_id, organization_id, role (user|assistant|system), content
INSERT INTO messages (id, conversation_id, organization_id, role, content, created_at) VALUES
('de000000-0000-0000-0000-e00000000001', 'de000000-0000-0000-0000-c0e000000001',
 'de000000-0000-0000-0000-000000000001',
 'user', 'Merhaba, diş implant yaptırmak istiyorum. Fiyatları öğrenebilir miyim?', now() - interval '5 days'),
('de000000-0000-0000-0000-e00000000002', 'de000000-0000-0000-0000-c0e000000001',
 'de000000-0000-0000-0000-000000000001',
 'assistant', E'Merhaba Mehmet Bey! 😊 Demo Diş Kliniği''ne hoş geldiniz. İmplant tedavisi hakkında bilgi vermekten mutluluk duyarım.\n\nKliniğimizde iki marka implant kullanıyoruz:\n\n🦷 Osstem İmplant: 15.000 - 20.000 TL\n🦷 Straumann İmplant: 25.000 - 35.000 TL\n\nFiyatlar KDV dahildir ve 12 aya kadar taksit imkanımız var.\n\nKaç diş implant düşünüyorsunuz?', now() - interval '5 days' + interval '30 seconds'),
('de000000-0000-0000-0000-e00000000003', 'de000000-0000-0000-0000-c0e000000001',
 'de000000-0000-0000-0000-000000000001',
 'user', '2 diş eksik, alt çenede. Straumann daha mı iyi?', now() - interval '5 days' + interval '5 minutes'),
('de000000-0000-0000-0000-e00000000004', 'de000000-0000-0000-0000-c0e000000001',
 'de000000-0000-0000-0000-000000000001',
 'assistant', E'Straumann İsviçre menşeli premium bir markadır ve 10 yıl garanti sunuyoruz. Osstem de çok kaliteli bir Güney Kore markasıdır, 5 yıl garantili.\n\n2 adet Straumann implant için yaklaşık toplam: 50.000 - 70.000 TL\n2 adet Osstem implant için yaklaşık toplam: 30.000 - 40.000 TL\n\nÜcretsiz muayene ile doktorumuz size en uygun seçeneği önerebilir. Randevu almak ister misiniz?', now() - interval '5 days' + interval '6 minutes'),
('de000000-0000-0000-0000-e00000000005', 'de000000-0000-0000-0000-c0e000000001',
 'de000000-0000-0000-0000-000000000001',
 'user', 'Evet, bu hafta müsaitim. Çarşamba veya perşembe olabilir mi?', now() - interval '5 days' + interval '10 minutes'),
('de000000-0000-0000-0000-e00000000006', 'de000000-0000-0000-0000-c0e000000001',
 'de000000-0000-0000-0000-000000000001',
 'assistant', E'Harika! Randevu bilgilerinizi oluşturalım.\n\nÇarşamba veya Perşembe, saat tercihiniz var mı? Sabah 09:00-12:00 arası mı yoksa öğleden sonra 14:00-18:00 arası mı daha uygun olur?', now() - interval '5 days' + interval '11 minutes')
ON CONFLICT (id) DO NOTHING;

-- Demo messages (conversation 2: whitening inquiry)
INSERT INTO messages (id, conversation_id, organization_id, role, content, created_at) VALUES
('de000000-0000-0000-0000-e00000000007', 'de000000-0000-0000-0000-c0e000000002',
 'de000000-0000-0000-0000-000000000001',
 'user', 'Diş beyazlatma fiyatları ne kadar?', now() - interval '2 days'),
('de000000-0000-0000-0000-e00000000008', 'de000000-0000-0000-0000-c0e000000002',
 'de000000-0000-0000-0000-000000000001',
 'assistant', E'Merhaba! 😊 Diş beyazlatma hizmetlerimiz hakkında bilgi vereyim:\n\nKlinikte Beyazlatma: 3.000 - 5.000 TL (1 seansta, 45 dk)\nEvde Beyazlatma Kiti: 2.000 - 3.000 TL (10-14 gün)\n\nKlinikte beyazlatma ile dişleriniz tek seansta 3-8 ton açılır. Sonuçlar 1-2 yıl sürer.\n\nBir randevu ayarlamak ister misiniz?', now() - interval '2 days' + interval '25 seconds'),
('de000000-0000-0000-0000-e00000000009', 'de000000-0000-0000-0000-c0e000000002',
 'de000000-0000-0000-0000-000000000001',
 'user', 'Hassasiyet yapıyor mu? Biraz korkuyorum', now() - interval '2 days' + interval '3 minutes'),
('de000000-0000-0000-0000-e00000000010', 'de000000-0000-0000-0000-c0e000000002',
 'de000000-0000-0000-0000-000000000001',
 'assistant', E'Endişelenmenize gerek yok! Modern beyazlatma jelleri hassasiyeti minimum düzeyde tutar. İşlem öncesi koruyucu jel uygulanır.\n\nBazı hastalarda işlem sonrası 24-48 saat hafif hassasiyet olabilir, bu tamamen normaldir ve kendiliğinden geçer.\n\nDaha detaylı bilgi için ücretsiz konsültasyon randevusu ayarlayabilirim. İlginiz var mı?', now() - interval '2 days' + interval '4 minutes')
ON CONFLICT (id) DO NOTHING;

-- Demo voice calls (2)
-- Schema: id, organization_id, contact_id, direction, status, duration_seconds, transcript, metadata, started_at
INSERT INTO voice_calls (id, organization_id, contact_id, direction, status, duration_seconds, transcript, metadata, started_at) VALUES
('de000000-0000-0000-0000-ca1100000001', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000002', 'inbound', 'completed', 185,
 E'[Selin]: Demo Diş Kliniği, ben Selin, nasıl yardımcı olabilirim?\n[Hasta]: Merhaba, gülüş tasarımı hakkında bilgi almak istiyorum.\n[Selin]: Tabii ki! Gülüş tasarımı yani smile design, dijital 3D tarama ile yüz hatlarınıza uygun mükemmel gülüş oluşturma işlemidir.\n[Hasta]: Fiyatı ne kadar?\n[Selin]: Hollywood smile paketi 20 diş için 100.000 ile 160.000 TL arasında. 12 aya kadar taksit imkanımız var.\n[Hasta]: Randevu almak istiyorum.\n[Selin]: Harika! Bilgilerinizi alayım...',
 '{"save_version": "v2", "livekit_room": "demo_room_001"}'::jsonb,
 now() - interval '3 days'),

('de000000-0000-0000-0000-ca1100000002', 'de000000-0000-0000-0000-000000000001',
 'de000000-0000-0000-0000-c00000000005', 'inbound', 'completed', 120,
 E'[Selin]: Demo Diş Kliniği, ben Selin, hoş geldiniz!\n[Hasta]: Merhaba, dişim çok ağrıyor, kanal tedavisi gerekebilir.\n[Selin]: Geçmiş olsun! Ağrınız ne zamandan beri var?\n[Hasta]: 3 gündür, sıcak soğuk içeceklerde çok acıyor.\n[Selin]: Kanal tedavisi modern tekniklerle ağrısız yapılıyor, tek seansta 45-90 dakikada tamamlanıyor. Fiyatı 2.000 ile 4.000 TL arasında.\n[Hasta]: En erken ne zaman gelebilirim?\n[Selin]: Acil durumlar için aynı gün randevu veriyoruz. Yarın sabah 09:00 uygun olur mu?',
 '{"save_version": "v2", "livekit_room": "demo_room_002"}'::jsonb,
 now() - interval '12 hours')
ON CONFLICT (id) DO NOTHING;

-- org_users — demo user
INSERT INTO org_users (organization_id, user_id, role)
VALUES ('de000000-0000-0000-0000-000000000001', '07a3b856-60c8-4dbc-a0a5-620b0c45ef58', 'viewer')
ON CONFLICT DO NOTHING;
