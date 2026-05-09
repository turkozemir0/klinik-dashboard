-- ============================================================
-- 2026-05-04: Support KB — Fiyat düzeltme + Eksik doküman ekleme
-- ============================================================
-- 1) Pricing v2 → v3 güncelleme (2 doc UPDATE)
-- 2) Eksik konular ekleme (2 doc INSERT)
-- 3) Embedding NULL reset (yeniden üretilmesi için)
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────
-- Doc 1 UPDATE: billing / Planlar ve Fiyatlandırma
-- ─────────────────────────────────────────────────────────
UPDATE public.support_docs
SET content = E'## stoaix Platform Planları ve Fiyatlandırma\n\nstoaix üç ana plan sunar. Tüm planlarda tam CRM, sınırsız WhatsApp/Instagram/Web chat kanalı ve Bilgi Bankası dahildir.\n\n### Essential — $129/ay ($103/ay yıllık)\n- Tam CRM + sınırsız chat kanalları\n- **1.000 AI konuşma/ay**\n- Bilgi Bankası yönetimi\n- 5 kullanıcıya kadar\n- Sesli arama dahil değil\n\n### Professional — $249/ay ($199/ay yıllık)\n- Essential''deki her şey +\n- **200 dakika/ay Voice Inbound** (gelen arama)\n- **2.000 AI konuşma/ay**\n- Gelişmiş analitik\n- 10 kullanıcıya kadar\n- 3 pipeline''a kadar (multi-pipeline)\n\n### Business — $599/ay ($479/ay yıllık)\n- Professional''daki her şey +\n- **500 dakika/ay Voice In+Out shared pool** (gelen + giden arama)\n- **5.000 AI konuşma/ay**\n- Çok dilli ses desteği\n- Tüm iş akışı şablonları\n- 20 kullanıcıya kadar\n\n### Custom\n- Özel ihtiyaçlar için görüşmeli fiyat\n- Sınırsız AI konuşma, sınırsız ses dakikası\n- Özel entegrasyonlar\n\n### Yıllık Ödeme\nYıllık planlarda **%20 indirim** uygulanır.\n\n### Limit Aşımı\n- Ses dakikası aşımı: $0,19/dk\n- AI konuşma aşımı: $0,09/konuşma\n- Limitinize ulaştığınızda ilgili özellik geçici olarak kısıtlanır. Plan yükseltme ile limitler artırılabilir.\n\n### Plan Değiştirme\nDashboard → Abonelik sayfasından planınızı yükseltebilir veya değiştirebilirsiniz.',
    embedding = NULL,
    updated_at = now()
WHERE id = '7fbee701-0f6c-4006-9c20-6f3a72dc06d0';

-- ─────────────────────────────────────────────────────────
-- Doc 2 UPDATE: voice_agent / Sesli AI Asistan
-- ─────────────────────────────────────────────────────────
UPDATE public.support_docs
SET content = E'## Sesli AI Asistan (Voice Agent) Nasıl Çalışır?\n\nstoaix Sesli AI Asistan, gelen ve giden telefon aramalarını yapay zeka ile yönetir. Müşterilerinizle doğal bir şekilde konuşur, bilgi toplar ve randevu planlayabilir.\n\n### Nasıl Çalışır?\n1. Müşteri belirlenen numarayı arar (veya sistem giden arama yapar)\n2. AI asistan, Bilgi Bankası''ndaki içerikleri kullanarak müşteriye yanıt verir\n3. Görüşme kaydedilir, transkript oluşturulur\n4. Toplanan bilgiler CRM''e otomatik aktarılır\n5. Gerektiğinde lead skoru güncellenir veya insan devirleri yapılır\n\n### Plan Bazlı Ses Dakikaları\n- **Essential:** Sesli arama dahil değil\n- **Professional:** 200 dakika/ay gelen arama (Voice Inbound)\n- **Business:** 500 dakika/ay gelen + giden arama (shared pool)\n- **Custom:** Sınırsız\n\nLimit aşımında $0,19/dk ek ücret uygulanır.\n\n### Desteklenen Senaryolar\n- **İlk temas (first_contact):** Yeni müşteriye karşılama ve bilgi toplama\n- **Takip araması (warm_followup):** Daha önce iletişime geçilen müşteriye geri dönüş\n- **Randevu onayı (appt_confirm):** Planlanan randevuyu telefonla onaylama\n- **No-show takibi (noshow_followup):** Gelmeyenlere ulaşma\n- **Memnuniyet anketi (satisfaction_survey):** İşlem sonrası değerlendirme\n- **Tedavi hatırlatma (treatment_reminder):** Kontrol/seans hatırlatması\n- **Yeniden etkinleştirme (reactivation):** Uzun süredir iletişim kurulmayan müşteri\n- **Ödeme takibi (payment_followup):** Ödeme hatırlatması\n\n### Arama Kayıtları\nDashboard → Aramalar sayfasından tüm arama kayıtlarını, transkriptleri ve süreleri görebilirsiniz.\n\n### Çok Dilli Ses\nBusiness ve üzeri planlarda AI asistan birden fazla dilde konuşabilir. Dashboard → Ayarlar sayfasından ses dilini değiştirebilirsiniz.',
    embedding = NULL,
    updated_at = now()
WHERE id = '311136e5-1821-49bc-b2e6-9d845b545bc3';

-- ─────────────────────────────────────────────────────────
-- Yeni Doc 1 INSERT: billing / AI Konuşma Limitleri
-- ─────────────────────────────────────────────────────────
INSERT INTO public.support_docs (category, subcategory, title, content, tags, is_active)
VALUES (
  'billing',
  NULL,
  'AI Konuşma Limitleri',
  E'## AI Konuşma Limitleri\n\nHer plan belirli sayıda aylık AI konuşma hakkı içerir.\n\n### Plan Bazlı Limitler\n| Plan | Aylık AI Konuşma |\n|------|------------------|\n| Essential | 1.000 |\n| Professional | 2.000 |\n| Business | 5.000 |\n| Custom | Sınırsız |\n\n### Konuşma Nedir?\nBir konuşma, bir contact (müşteri) ile yapılan bir mesajlaşma oturumunu ifade eder. Aynı contact ile aynı gün içinde birden fazla mesajlaşma tek bir konuşma olarak sayılır.\n\n### Limit Aşıldığında Ne Olur?\nAylık konuşma limitinize ulaştığınızda AI yanıtlama özelliği geçici olarak kısıtlanır. Bu durumda:\n- Mevcut konuşmalar devam eder ancak yeni AI konuşma başlatılamaz\n- Manuel (insan) yanıtlama her zaman çalışır\n- Bir sonraki ayda limit sıfırlanır\n- Plan yükseltme ile limitinizi hemen artırabilirsiniz\n\n### Ek Konuşma Aşım Ücreti\nLimit aşıldıktan sonra devam eden her konuşma için **$0,09/konuşma** ek ücret uygulanır.\n\n### Kullanımınızı Takip Edin\nDashboard → Abonelik sayfasından mevcut kullanım durumunuzu ve kalan konuşma hakkınızı görebilirsiniz.',
  ARRAY['billing', 'ai', 'konuşma', 'limit', 'plan', 'kullanım'],
  true
)
ON CONFLICT (category, title) DO UPDATE SET
  content = EXCLUDED.content,
  tags = EXCLUDED.tags,
  embedding = NULL,
  updated_at = now();

-- ─────────────────────────────────────────────────────────
-- Yeni Doc 2 INSERT: general / Sorun Giderme
-- ─────────────────────────────────────────────────────────
INSERT INTO public.support_docs (category, subcategory, title, content, tags, is_active)
VALUES (
  'general',
  NULL,
  'Sorun Giderme — Sık Karşılaşılan Durumlar',
  E'## Sorun Giderme — Sık Karşılaşılan Durumlar\n\nAşağıda platform kullanımında sık karşılaşılan durumlar ve çözüm önerileri yer almaktadır.\n\n### WhatsApp Bağlantısı Koptu\nWhatsApp entegrasyonunuz çalışmayı durdurduysa:\n1. Dashboard → Ayarlar sayfasına gidin\n2. WhatsApp bölümünde "Yeniden Bağla" butonuna tıklayın\n3. Meta Business hesabınızla tekrar yetkilendirme yapın\n\n### Instagram DM Çalışmıyor\nInstagram mesajları gelmiyorsa kontrol edin:\n- Instagram hesabınızın **Professional** (İşletme veya İçerik Üretici) hesap olduğundan emin olun\n- Facebook sayfanızın Instagram hesabınıza bağlı olduğunu doğrulayın\n- Dashboard → Ayarlar → Instagram bölümünden bağlantıyı yenileyin\n\n### AI Yanlış Bilgi Veriyor\nAI asistanınız hatalı yanıtlar veriyorsa:\n- Dashboard → Bilgi Bankası sayfasından ilgili içerikleri güncelleyin\n- Yanlış veya güncel olmayan bilgileri düzeltin\n- AI, Bilgi Bankası''ndaki içerikleri temel alarak yanıt verir\n\n### Lead Skoru Düşük Görünüyor\nLead skorunun düşük olması, müşteriden henüz yeterli bilgi toplanamadığı anlamına gelir. AI daha fazla soru sorarak bilgi topladıkça skor otomatik olarak yükselir.\n\n### WhatsApp Template Reddedildi\nMeta tarafından reddedilen şablonlar için:\n- Agresif veya baskıcı satış dili kullanmayın\n- Meta''nın ticari mesaj politikalarına uygun içerik hazırlayın\n- Dashboard → Şablonlar sayfasından şablonu düzenleyip tekrar gönderin\n\n### Diğer Teknik Sorunlar\nYukarıdaki adımlar sorununuzu çözmediyse veya farklı bir teknik sorunla karşılaştıysanız:\n**Dashboard → Ayarlar → Destek** sayfasından destek talebi oluşturabilirsiniz. Ekibimiz en kısa sürede size dönüş yapacaktır.',
  ARRAY['sorun', 'giderme', 'troubleshooting', 'whatsapp', 'instagram', 'hata', 'çözüm'],
  true
)
ON CONFLICT (category, title) DO UPDATE SET
  content = EXCLUDED.content,
  tags = EXCLUDED.tags,
  embedding = NULL,
  updated_at = now();

COMMIT;
