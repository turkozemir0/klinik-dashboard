-- Solo Dent Diş Kliniği — Bütçe Sorusu Ekleme
-- Org ID: 4269dd48-3431-48ab-a716-48b5d1398cd8
-- Tüm intake schema kanallarına "budget" (should) field eklenir
-- Chat playbook'a bütçe sorusu satırı eklenir

-- ── 1. Voice intake schema: budget field (preferred_time'dan önce) ─────────────
UPDATE intake_schemas
SET fields = '[
  {
    "key": "complaint",
    "label": "Şikayet / İlgilenilen Tedavi",
    "type": "text",
    "priority": "must",
    "voice_prompt": "Şikayetinizi veya ilgilendiğiniz tedaviyi öğrenebilir miyim?"
  },
  {
    "key": "full_name",
    "label": "Ad Soyad",
    "type": "text",
    "priority": "must",
    "voice_prompt": "Adınızı ve soyadınızı alabilir miyim?"
  },
  {
    "key": "budget",
    "label": "Bütçe",
    "type": "text",
    "priority": "should",
    "voice_prompt": "Tedavi için yaklaşık bir bütçeniz var mı?"
  },
  {
    "key": "preferred_time",
    "label": "Uygun Randevu Zamanı",
    "type": "text",
    "priority": "should",
    "voice_prompt": "Randevu için günün hangi saatleri size daha uygun?"
  }
]'::jsonb
WHERE organization_id = '4269dd48-3431-48ab-a716-48b5d1398cd8'
  AND channel = 'voice';


-- ── 2. WhatsApp intake schema: budget field (preferred_time'dan önce) ──────────
UPDATE intake_schemas
SET fields = '[
  {
    "key": "complaint",
    "label": "Şikayet / İlgilenilen Tedavi",
    "type": "text",
    "priority": "must"
  },
  {
    "key": "full_name",
    "label": "Ad Soyad",
    "type": "text",
    "priority": "must"
  },
  {
    "key": "phone",
    "label": "Telefon",
    "type": "phone",
    "priority": "must"
  },
  {
    "key": "budget",
    "label": "Bütçe",
    "type": "text",
    "priority": "should"
  },
  {
    "key": "preferred_time",
    "label": "Uygun Gün / Saat",
    "type": "text",
    "priority": "should"
  }
]'::jsonb
WHERE organization_id = '4269dd48-3431-48ab-a716-48b5d1398cd8'
  AND channel = 'whatsapp';


-- ── 3. Instagram intake schema: budget field (preferred_time'dan önce) ──────────
UPDATE intake_schemas
SET fields = '[
  {
    "key": "complaint",
    "label": "Şikayet / İlgilenilen Tedavi",
    "type": "text",
    "priority": "must"
  },
  {
    "key": "full_name",
    "label": "Ad Soyad",
    "type": "text",
    "priority": "must"
  },
  {
    "key": "phone",
    "label": "Telefon",
    "type": "phone",
    "priority": "must"
  },
  {
    "key": "budget",
    "label": "Bütçe",
    "type": "text",
    "priority": "should"
  },
  {
    "key": "preferred_time",
    "label": "Uygun Gün / Saat",
    "type": "text",
    "priority": "should"
  }
]'::jsonb
WHERE organization_id = '4269dd48-3431-48ab-a716-48b5d1398cd8'
  AND channel = 'instagram';


-- ── 4. Chat playbook: bütçe sorusu satırı ekle ───────────────────────────────
-- "all" channel playbook'ta BİLGİ TOPLAMA listesine 4. sıra olarak budget eklenir
UPDATE agent_playbooks
SET system_prompt_template = $PROMPT$Sen Solo Dent Diş Kliniği'nin mesajlaşma asistanı Selin'sin.
Hastalara kliniğimizin hizmetleri hakkında bilgi verir, randevu talebi için gerekli bilgileri toplayarak koordinatöre iletirsin.

KARAKTER:
- Sıcak, samimi ama profesyonel. Emoji kullanabilirsin ama abartma.
- "Harika!", "Mükemmel seçim!" gibi abartılı ifadeler KULLANMA.
- Kısa ve net yanıtlar ver. Uzun paragraflar yazma.
- Aynı mesajda yalnızca 1 soru sor.

BİLGİ TOPLAMA — sırayla sor:
1. Şikayet veya ilgilenilen tedavi → "Hangi konuda randevu almak istiyorsunuz veya şikayetiniz nedir?"
2. Ad soyad → "Adınızı ve soyadınızı alabilir miyim?"
3. Telefon → "Sizi arayabilmemiz için telefon numaranızı paylaşır mısınız?"
4. Bütçe → "Tedavi için yaklaşık bir bütçeniz var mı?" (should — hasta vermezse zorlama, devam et)
5. Uygun gün/saat → "Randevu için hangi gün ve saatler size uygun?"

Bilgi zaten verildiyse bir daha SORMA.
Tüm zorunlu bilgiler (şikayet, ad, telefon) toplandığında:
"Bilgilerinizi aldım, koordinatörümüz randevu için en kısa sürede sizi arayacak. 😊" de.

FİYAT KURALI:
- Fiyat sorulursa: "Tedavi planı ve fiyat, muayene sonrası doktorumuz tarafından belirleniyor. Koordinatörümüz size özel bilgi verecek." de.

ACİL DURUM:
- Şiddetli ağrı/şişlik varsa: "Acil durum için lütfen kliniğimizi doğrudan arayın."

NOT ALMA KURALI:
- Bilgi tabanında cevap bulamazsan: "Bu konuyu not aldım, uzmanlarımız size dönüş yapacak."
$PROMPT$
WHERE organization_id = '4269dd48-3431-48ab-a716-48b5d1398cd8'
  AND channel = 'all'
  AND is_active = true;
