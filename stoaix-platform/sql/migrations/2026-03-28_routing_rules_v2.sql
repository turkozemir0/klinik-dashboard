-- 2026-03-28_routing_rules_v2.sql
-- Çağrı yönlendirme (routing) sistemi — Eurostar seed verisi
-- 1. organizations.working_hours kolonu ekle
-- 2. Eurostar organizations.working_hours güncelle
-- 3. Eurostar agent_playbooks.routing_rules güncelle

-- 1. Kolon ekle (eğer yoksa)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT NULL;

-- 2. Eurostar mesai saatleri
UPDATE organizations
SET working_hours = '{
  "weekdays": "09:30-19:00",
  "saturday": "10:00-17:00",
  "sunday": null,
  "timezone": "Europe/Istanbul"
}'::jsonb
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';

-- 3. Eurostar routing_rules (voice playbook'a yaz)
UPDATE agent_playbooks
SET routing_rules = '{
  "transfer_numbers": {
    "primary": "02122446600",
    "voice_agent": "02127098709"
  },
  "rules": [
    {
      "id": "kb_fallback",
      "type": "kb_fallback",
      "tier": 1,
      "active": true,
      "priority": 1,
      "transition_message": "Bu konu hakkında size daha net bilgi verebilmek için ilgili departmanımıza aktarıyoruz. Lütfen hattan ayrılmayın.",
      "after_hours_message": "Bu konu hakkında uzmanımız sizi arayacak, bilgilerinizi kaydettim."
    },
    {
      "id": "direct_request",
      "type": "intent",
      "tier": 1,
      "active": true,
      "priority": 2,
      "keywords": ["temsilci", "insan bağla", "aktar", "gerçek biri", "danışman istiyorum"],
      "transition_message": "Tabii ki, sizi hemen bir eğitim danışmanımıza aktarıyorum. Lütfen hattan ayrılmayın.",
      "after_hours_message": "Şu anda mesai saatlerimiz dışındayız. Bilgilerinizi kaydettim, danışmanımız sizi arayacak."
    },
    {
      "id": "person_request",
      "type": "intent",
      "tier": 1,
      "active": true,
      "priority": 3,
      "keywords": ["nurşah", "sümeyye"],
      "transition_message": "Sizi hemen ilgili kişiye aktarıyorum, lütfen hattan ayrılmayın.",
      "after_hours_message": "Mesajınızı ilettim, en kısa sürede sizi arayacaklar."
    },
    {
      "id": "existing_student",
      "type": "intent",
      "tier": 1,
      "active": true,
      "priority": 4,
      "keywords": ["öğrencinizim", "kayıt yaptırdım", "daha önce kaydoldum", "denklik", "danışmanıma ulaşamıyorum"],
      "transition_message": "Anlıyorum, sizi hemen ilgili uzman eğitim danışmanımıza yönlendiriyorum, biraz bekleteceğim.",
      "after_hours_message": "Notunuzu aldım, danışmanımız en kısa sürede sizi arayacak."
    },
    {
      "id": "military",
      "type": "topic_note",
      "tier": 2,
      "active": true,
      "priority": 10,
      "keywords": ["askerlik", "asker", "bedelli", "celp"],
      "note_message": "Bu konu hakkında uzman danışmanımız sizi arayacak."
    },
    {
      "id": "residence_citizenship",
      "type": "topic_note",
      "tier": 2,
      "active": true,
      "priority": 11,
      "keywords": ["oturum", "vatandaşlık", "ikamet", "çalışma izni"],
      "note_message": "Bu konuda uzman danışmanımız sizi arayacak."
    },
    {
      "id": "negative_sentiment",
      "type": "sentiment_note",
      "tier": 2,
      "active": true,
      "priority": 12,
      "keywords": ["ne biçim", "berbat", "rezalet", "kimseye ulaşamıyorum", "hizmetiniz"],
      "note_message": "Anlıyorum, özür dileriz. Konunuzu kaydettim, yetkili danışmanımız sizi arayacak."
    }
  ]
}'::jsonb
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND channel IN ('voice', 'all')
  AND is_active = true;
