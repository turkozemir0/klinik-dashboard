-- Demo Diş Kliniği: intake schema fix
--
-- 2 sorun:
-- 1. channel='all' → dashboard UI sadece 'voice'/'whatsapp' çekiyor → intake hiç yüklenmiyor
-- 2. priority/voice_prompt eksik → agent.py must field bulamıyor → qualification score 0
--
-- Çözüm: channel='all' kaydını sil, voice + whatsapp olarak 2 ayrı kayıt oluştur

-- ai_persona: Selin (voice agent persona_name olarak kullanır)
UPDATE organizations
SET ai_persona = '{"persona_name": "Selin", "language": "tr", "tone": "warm-professional"}'::jsonb
WHERE id = 'de000000-0000-0000-0000-000000000001';

-- Playbook isimlerini güncelle (Ayşe → Selin)
UPDATE agent_playbooks SET name = 'Sesli Asistan - Selin'   WHERE id = 'de000000-0000-0000-0000-a2b000000001';
UPDATE agent_playbooks SET name = 'WhatsApp Asistan - Selin' WHERE id = 'de000000-0000-0000-0000-a2b000000002';

-- Eski 'all' kaydını sil
DELETE FROM intake_schemas
WHERE id = 'de000000-0000-0000-0000-a1ca00000001';

-- Voice intake (agent.py bu kaydı kullanır)
INSERT INTO intake_schemas (id, organization_id, channel, name, fields)
VALUES (
  'de000000-0000-0000-0000-a1ca00000a01',
  'de000000-0000-0000-0000-000000000001',
  'voice',
  'Diş Kliniği Veri Toplama (Sesli)',
  '[
    {"key": "full_name",      "label": "Ad Soyad",       "type": "text",   "required": true,  "priority": "must",   "voice_prompt": "Adınızı alabilir miyim?"},
    {"key": "phone",          "label": "Telefon",        "type": "phone",  "required": true,  "priority": "must",   "voice_prompt": "Telefon numaranızı alabilir miyim?"},
    {"key": "email",          "label": "E-posta",        "type": "email",  "required": false, "priority": "should", "voice_prompt": "E-posta adresinizi paylaşır mısınız?"},
    {"key": "city",           "label": "Şehir",          "type": "text",   "required": false, "priority": "nice",   "voice_prompt": "Hangi şehirdesiniz?"},
    {"key": "age",            "label": "Yaş",            "type": "number", "required": false, "priority": "nice",   "voice_prompt": "Yaşınızı öğrenebilir miyim?"},
    {"key": "treatment_type", "label": "Tedavi Türü",    "type": "select", "required": true,  "priority": "must",   "voice_prompt": "Hangi tedavi için düşünüyorsunuz?", "options": ["İmplant", "Zirkonyum Kaplama", "Gülüş Tasarımı", "Diş Beyazlatma", "Kanal Tedavisi", "Ortodonti", "Diğer"]},
    {"key": "budget",         "label": "Bütçe Aralığı",  "type": "select", "required": false, "priority": "should", "voice_prompt": "Bütçe aralığınız hakkında fikriniz var mı?", "options": ["10.000-25.000 TL", "25.000-50.000 TL", "50.000-100.000 TL", "100.000+ TL"]},
    {"key": "urgency",        "label": "Aciliyet",       "type": "select", "required": false, "priority": "should", "voice_prompt": "Ne zaman başlamayı düşünüyorsunuz?", "options": ["Bu hafta", "Bu ay", "1-3 ay içinde", "Sadece araştırıyorum"]}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET fields = EXCLUDED.fields, name = EXCLUDED.name;

-- WhatsApp/Chat intake (dashboard UI bu kaydı kullanır)
INSERT INTO intake_schemas (id, organization_id, channel, name, fields)
VALUES (
  'de000000-0000-0000-0000-a1ca00000b01',
  'de000000-0000-0000-0000-000000000001',
  'whatsapp',
  'Diş Kliniği Veri Toplama (WhatsApp)',
  '[
    {"key": "full_name",      "label": "Ad Soyad",       "type": "text",   "required": true,  "priority": "must",   "voice_prompt": "Adınızı alabilir miyim?"},
    {"key": "phone",          "label": "Telefon",        "type": "phone",  "required": true,  "priority": "must",   "voice_prompt": "Telefon numaranızı alabilir miyim?"},
    {"key": "email",          "label": "E-posta",        "type": "email",  "required": false, "priority": "should", "voice_prompt": "E-posta adresinizi paylaşır mısınız?"},
    {"key": "city",           "label": "Şehir",          "type": "text",   "required": false, "priority": "nice",   "voice_prompt": "Hangi şehirdesiniz?"},
    {"key": "age",            "label": "Yaş",            "type": "number", "required": false, "priority": "nice",   "voice_prompt": "Yaşınızı öğrenebilir miyim?"},
    {"key": "treatment_type", "label": "Tedavi Türü",    "type": "select", "required": true,  "priority": "must",   "voice_prompt": "Hangi tedavi için düşünüyorsunuz?", "options": ["İmplant", "Zirkonyum Kaplama", "Gülüş Tasarımı", "Diş Beyazlatma", "Kanal Tedavisi", "Ortodonti", "Diğer"]},
    {"key": "budget",         "label": "Bütçe Aralığı",  "type": "select", "required": false, "priority": "should", "voice_prompt": "Bütçe aralığınız hakkında fikriniz var mı?", "options": ["10.000-25.000 TL", "25.000-50.000 TL", "50.000-100.000 TL", "100.000+ TL"]},
    {"key": "urgency",        "label": "Aciliyet",       "type": "select", "required": false, "priority": "should", "voice_prompt": "Ne zaman başlamayı düşünüyorsunuz?", "options": ["Bu hafta", "Bu ay", "1-3 ay içinde", "Sadece araştırıyorum"]}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET fields = EXCLUDED.fields, name = EXCLUDED.name;

-------------------------------------------------------------------
-- SENARYO PLAYBOOK'LARI (appt_confirm + reactivation)
-------------------------------------------------------------------

-- Randevu Teyit & Hatırlatma
INSERT INTO agent_playbooks (id, organization_id, channel, scenario, name, system_prompt_template, opening_message, hard_blocks, few_shot_examples, fallback_responses, features, is_active)
VALUES (
  'de000000-0000-0000-0000-a2b000000003',
  'de000000-0000-0000-0000-000000000001',
  'voice',
  'appt_confirm',
  'Randevu Teyit - Selin',
  '# ROL
Sen Demo Diş Kliniği''nin asistanı Selin''sin. Bu aramayı randevu teyidi veya hatırlatması amacıyla yapıyorsun.

# GÖREV
- Hastayı ismiyle selamla
- Randevu tarih/saatini belirt ve teyit iste
- Gelip gelemeyeceğini öğren
- İptal veya erteleme isterse notu al ve kliniği aramasını öner

# KURALLAR
- Maks 2 cümle, net ve kısa
- Emoji veya markdown kullanma — TTS okur
- Teyit alınca kibarca kapat, gereksiz uzatma
- "Başka bir konuda yardımcı olabilir miyim?" YASAK
- Tıbbi soru gelirse: "Randevunuzda doktorumuz yanıtlayacaktır" de',
  'Merhaba! Ben Demo Diş Kliniği''nden Selin. Yaklaşan randevunuzu teyit etmek için arıyorum, uygun bir anınız var mı?',
  '[
    {"trigger_id":"block_0","action":"soft_block","keywords":["iptal","gelmeyeceğim","randevuyu iptal et","vazgeçtim"],"response":"Anlıyorum, iptal için not aldım. Yeni bir tarih için bizi arayabilirsiniz, iyi günler."},
    {"trigger_id":"block_1","action":"soft_block","keywords":["ertelemek istiyorum","başka gün","tarih değişsin","öne alabilir miyiz"],"response":"Tabii, tarih değişikliği için sizi kliniğimize yönlendireyim. Bir an bekleyebilir misiniz?"}
  ]'::jsonb,
  '[
    {"user":"Evet, uygunum, randevuyu hatırlıyorum.","assistant":"Harika, o zaman randevunuzda görüşmek üzere! İyi günler."},
    {"user":"Aslında o gün gelemeyeceğim, iptal edebilir misiniz?","assistant":"Tabii, iptal için not aldım. Başka bir zaman randevu almak isterseniz bizi arayabilirsiniz, iyi günler."},
    {"user":"Randevumu bir gün öne alabilir miyiz?","assistant":"Tarih değişikliği için sizi kliniğimize yönlendireyim. Bir an bekleyebilir misiniz?"},
    {"user":"Saat kaçtaydı randevum?","assistant":"Randevu detaylarınızı kliniğimiz size iletmiş olmalı. Teyit edebilmem için sizi kısaca kliniğimizle bağlayayım mı?"}
  ]'::jsonb,
  '{"no_kb_match":"Bu konuda yardımcı olmak için sizi kliniğimizle bağlayayım."}'::jsonb,
  '{"calendar_booking":false,"voice_language":"tr","model":"claude-haiku-4-5-20251001"}'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Reaktivasyon Araması
INSERT INTO agent_playbooks (id, organization_id, channel, scenario, name, system_prompt_template, opening_message, hard_blocks, few_shot_examples, fallback_responses, features, is_active)
VALUES (
  'de000000-0000-0000-0000-a2b000000004',
  'de000000-0000-0000-0000-000000000001',
  'voice',
  'reactivation',
  'Reaktivasyon - Selin',
  '# ROL
Sen Demo Diş Kliniği''nin asistanı Selin''sin. Bir süredir görüşülemeyen hastalarla iletişime geçip geri kazanım için arıyorsun.

# GÖREV
- Hastayı ismiyle samimiyetle selamla
- Kliniği hatırlat, neden arandığını kısaca açıkla
- İhtiyacı veya tedaviye dönmesini engelleyen şeyi anlamaya çalış
- Yeni randevu veya bilgi için kapı aç

# İTİRAZ YÖNETİMİ
"Fiyatlar yüksekti" → "Anlıyorum, fiyat önemli. Şu an farklı ödeme seçeneklerimiz mevcut. Detay paylaşmamı ister misiniz?"
"Artık ilgilenmiyorum" → "Elbette, sizi listeden çıkarıyorum. Kendinize iyi bakın, iyi günler."
"Zamanım yok" → "Anlıyorum, sizi oyalamak istemem. Hazır olduğunuzda bizi arayabilirsiniz."
"Başka klinikle devam ettim" → "Anlıyorum, sağlığınız önemli. Herhangi bir konuda bize danışmak isterseniz kapımız açık."

# KURALLAR
- Maks 2 cümle. Baskı yapma, ısrarcı olma
- İlgilenmiyorsa nazikçe kapat, israr etme
- Empati önce, teklif sonra
- Emoji veya markdown kullanma — TTS okur
- Max 3-4 tur',
  'Merhaba! Ben Demo Diş Kliniği''nden Selin. Sizi bir süredir göremedik, nasılsınız?',
  '[
    {"trigger_id":"block_0","action":"soft_block","keywords":["aramayın","istemiyorum","listeden çıkarın","rahatsız etmeyin","bir daha aramayın"],"response":"Elbette, sizi listeden çıkarıyorum. Kendinize iyi bakın, iyi günler."},
    {"trigger_id":"block_1","action":"soft_block","keywords":["meşgulüm","uygun değilim","zamanım yok","şu an müsait değilim"],"response":"Anlıyorum, sizi oyalamak istemem. Hazır hissettiğinizde bizi aramaktan çekinmeyin, iyi günler."},
    {"trigger_id":"block_2","action":"soft_block","keywords":["şikayet","dava","avukat","hukuki"],"response":"Bu konuyu ilgili birimimize aktarmam gerekiyor. Sizi yönlendiriyorum."}
  ]'::jsonb,
  '[
    {"user":"Ah evet, kliniğinizi hatırladım. Tekrar gelmek istiyordum.","assistant":"Ne güzel! Size uygun bir randevu ayarlayalım mı?"},
    {"user":"Şu an çok meşgulüm, müsait değilim.","assistant":"Anlıyorum, sizi oyalamak istemem. Hazır olduğunuzda bizi aramaktan çekinmeyin, iyi günler."},
    {"user":"Fiyatlar çok yüksekti, bu yüzden bırakmıştım.","assistant":"Anlıyorum, fiyat önemli bir faktör. Bu dönemde farklı ödeme seçeneklerimiz mevcut, detay vermemi ister misiniz?"},
    {"user":"Artık ilgilenmiyorum, listeden çıkarın.","assistant":"Elbette, sizi listeden çıkarıyorum. Kendinize iyi bakın, iyi günler."},
    {"user":"Başka bir klinikle devam ettim.","assistant":"Anlıyorum, sağlığınız önemli. Herhangi bir konuda bize danışmak isterseniz kapımız açık. İyi günler."}
  ]'::jsonb,
  '{"no_kb_match":"Bu konuyu detaylı konuşmak için sizi uzmanımıza bağlayayım, uygun mu?"}'::jsonb,
  '{"calendar_booking":false,"voice_language":"tr","model":"claude-sonnet-4-6"}'::jsonb,
  true
) ON CONFLICT DO NOTHING;
