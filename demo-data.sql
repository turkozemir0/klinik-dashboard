-- ═══════════════════════════════════════════════════════════════
-- DEMO DATA — 3 KLİNİK + TAM VERİ SETİ
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════

-- Önce mevcut demo veriyi temizle (isteğe bağlı)
-- DELETE FROM daily_stats; DELETE FROM handoff_logs; DELETE FROM messages; DELETE FROM conversations;

-- ─── 2. KLİNİK: ANKARA KLİNİK ────────────────────────────────
WITH ankara AS (
  INSERT INTO clinics (
    name, slug, clinic_type, status, phone, email, website,
    address, district, city, parking_info,
    working_hours, lead_doctor_name, lead_doctor_title,
    lead_doctor_experience_years, lead_doctor_credentials,
    consultation_fee, consultation_types, pricing_policy,
    payment_options, tone_profile, emoji_usage,
    greeting_message, forbidden_topics, ghl_location_id
  ) VALUES (
    'Ankara Klinik', 'ankara-klinik', 'estetik_cerrahi', 'active',
    '+90 532 100 20 30', 'info@ankaraklinik.com', 'https://www.ankaraklinik.com',
    'Çankaya Caddesi No: 45 Kat: 2', 'Çankaya', 'Ankara',
    'Bina önünde ücretsiz otopark mevcuttur.',
    '{"pazartesi":"09:00-18:00","sali":"09:00-18:00","carsamba":"09:00-18:00","persembe":"09:00-18:00","cuma":"09:00-18:00","cumartesi":"10:00-15:00","pazar":"Kapalı"}'::jsonb,
    'Op. Dr. Ayşe Kaya', 'Plastik ve Rekonstrüktif Cerrahi Uzmanı', 12,
    'Hacettepe Üniversitesi Tıp Fakültesi mezunu. 4000+ başarılı operasyon.',
    'Ücretsiz ön görüşme', ARRAY['yuz_yuze','online'],
    'Fiyatlar kişiye özel belirlenir.', ARRAY['nakit','kredi_karti','taksit'],
    'warm-professional', 'minimal',
    'Merhaba! 👋 Ankara Klinik''e hoş geldiniz.',
    'Rakip klinik isimleri, kesin fiyat, tıbbi teşhis',
    'loc_ankaraklinik_001'
  ) RETURNING id
),
ankara_svc AS (
  INSERT INTO services (clinic_id, service_key, display_name, category, sort_order, description_for_ai, procedure_duration, anesthesia_type, recovery_time, final_result_time, pricing_response, is_active)
  VALUES
  ((SELECT id FROM ankara), 'rhinoplasty', 'Burun Estetiği', 'yüz_estetiği', 1, 'Burun şekil düzeltme ve fonksiyonel düzeltme işlemi.', '2-3 saat', 'Genel anestezi', '1-2 hafta', '6-12 ay', 'Fiyat ön görüşmede belirlenir.', true),
  ((SELECT id FROM ankara), 'liposuction', 'Liposuction', 'vücut_estetiği', 2, 'Bölgesel yağ alma işlemi.', '1-2 saat', 'Lokal/Genel', '1 hafta', '3-6 ay', 'Bölge sayısına göre fiyat değişir.', true),
  ((SELECT id FROM ankara), 'blepharoplasty', 'Göz Kapağı Estetiği', 'yüz_estetiği', 3, 'Üst/alt göz kapağı düzeltme.', '1-2 saat', 'Lokal anestezi', '10-14 gün', '3-6 ay', 'Ön görüşmede fiyat verilir.', true)
  RETURNING clinic_id
),
ankara_faqs AS (
  INSERT INTO faqs (clinic_id, question_patterns, answer, category, is_active)
  VALUES
  ((SELECT id FROM ankara), ARRAY['fiyat','ücret','ne kadar'], 'Fiyatlarımız kişiye özel belirlenir. Ön görüşmede detaylı bilgi alabilirsiniz.', 'fiyat', true),
  ((SELECT id FROM ankara), ARRAY['adres','nerede','konum'], 'Çankaya Caddesi No: 45 Kat: 2, Çankaya/Ankara adresindeyiz.', 'genel', true)
  RETURNING clinic_id
)
SELECT (SELECT id FROM ankara) as ankara_clinic_id;

-- ─── 3. KLİNİK: İZMİR KLİNİK ────────────────────────────────
WITH izmir AS (
  INSERT INTO clinics (
    name, slug, clinic_type, status, phone, email, website,
    address, district, city, parking_info,
    working_hours, lead_doctor_name, lead_doctor_title,
    lead_doctor_experience_years, lead_doctor_credentials,
    consultation_fee, consultation_types, pricing_policy,
    payment_options, tone_profile, emoji_usage,
    greeting_message, forbidden_topics, ghl_location_id
  ) VALUES (
    'İzmir Klinik', 'izmir-klinik', 'estetik_cerrahi', 'active',
    '+90 532 300 40 50', 'info@izmirklinik.com', 'https://www.izmirklinik.com',
    'Alsancak Kordon No: 12 Kat: 4', 'Konak', 'İzmir',
    'Yakın çevrede ücretli otopark mevcuttur.',
    '{"pazartesi":"09:00-19:00","sali":"09:00-19:00","carsamba":"09:00-19:00","persembe":"09:00-19:00","cuma":"09:00-19:00","cumartesi":"09:00-14:00","pazar":"Kapalı"}'::jsonb,
    'Op. Dr. Can Yılmaz', 'Estetik Cerrahi Uzmanı', 15,
    'Ege Üniversitesi Tıp Fakültesi mezunu. ISAPS üyesi. 5000+ operasyon.',
    'Ücretsiz ön görüşme', ARRAY['yuz_yuze','online'],
    'Fiyatlar muayene sonrası belirlenir.', ARRAY['nakit','kredi_karti','taksit','havale'],
    'warm-professional', 'minimal',
    'Merhaba! 👋 İzmir Klinik''e hoş geldiniz.',
    'Rakip klinik isimleri, kesin fiyat, tıbbi teşhis',
    'loc_izmirklinik_001'
  ) RETURNING id
),
izmir_svc AS (
  INSERT INTO services (clinic_id, service_key, display_name, category, sort_order, description_for_ai, procedure_duration, anesthesia_type, recovery_time, final_result_time, pricing_response, is_active)
  VALUES
  ((SELECT id FROM izmir), 'breast_augmentation', 'Meme Büyütme', 'vücut_estetiği', 1, 'Silikon protez ile meme hacmi artırma.', '1.5-2.5 saat', 'Genel anestezi', '1 hafta', '3-6 ay', 'Protez markasına göre fiyat değişir.', true),
  ((SELECT id FROM izmir), 'abdominoplasty', 'Karın Germe', 'vücut_estetiği', 2, 'Karın bölgesi düzeltme ve sıkılaştırma.', '2-4 saat', 'Genel anestezi', '2 hafta', '6-12 ay', 'Kapsama göre fiyatlandırılır.', true),
  ((SELECT id FROM izmir), 'facelift', 'Yüz Germe', 'yüz_estetiği', 3, 'Yüz ve boyun bölgesi gençleştirme.', '3-5 saat', 'Genel anestezi', '4-6 hafta', '6-12 ay', 'Ön görüşmede fiyat verilir.', true)
  RETURNING clinic_id
),
izmir_faqs AS (
  INSERT INTO faqs (clinic_id, question_patterns, answer, category, is_active)
  VALUES
  ((SELECT id FROM izmir), ARRAY['fiyat','ücret'], 'Fiyatlarımız muayene sonrası belirlenir. Taksit imkânımız mevcuttur.', 'fiyat', true),
  ((SELECT id FROM izmir), ARRAY['adres','nerede'], 'Alsancak Kordon No: 12 Kat: 4, Konak/İzmir adresindeyiz.', 'genel', true)
  RETURNING clinic_id
)
SELECT (SELECT id FROM izmir) as izmir_clinic_id;


-- ─── DEMO CONVERSATIONS + MESSAGES + HANDOFFS ────────────────
-- Tüm kliniklerin ID'lerini al ve demo veri oluştur

DO $$
DECLARE
  istanbul_id UUID;
  ankara_id   UUID;
  izmir_id    UUID;
  conv_id     UUID;
  
  -- Örnek isimler
  names TEXT[] := ARRAY['Ayşe Yılmaz','Mehmet Kaya','Fatma Demir','Ali Çelik','Zeynep Arslan',
                         'Mustafa Şahin','Elif Öztürk','Hüseyin Aydın','Merve Doğan','Can Yıldız',
                         'Selin Aktaş','Burak Koç','Deniz Erdoğan','Gül Şimşek','Emre Çetin'];
  phones TEXT[] := ARRAY['+90 532 111 11 11','+90 533 222 22 22','+90 534 333 33 33',
                          '+90 535 444 44 44','+90 536 555 55 55','+90 537 666 66 66',
                          '+90 538 777 77 77','+90 539 888 88 88','+90 530 999 99 99',
                          '+90 531 000 00 00','+90 532 111 22 33','+90 533 444 55 66',
                          '+90 534 777 88 99','+90 535 000 11 22','+90 536 333 44 55'];

  -- İstanbul servisleri
  ist_services TEXT[] := ARRAY['Burun Estetiği','Göz Kapağı Estetiği','Yüz Germe','Meme Büyütme','Liposuction','Karın Germe'];
  ist_keys     TEXT[] := ARRAY['rhinoplasty','blepharoplasty','facelift','breast_augmentation','liposuction','abdominoplasty'];
  -- Ankara servisleri
  ank_services TEXT[] := ARRAY['Burun Estetiği','Liposuction','Göz Kapağı Estetiği'];
  ank_keys     TEXT[] := ARRAY['rhinoplasty','liposuction','blepharoplasty'];
  -- İzmir servisleri
  izm_services TEXT[] := ARRAY['Meme Büyütme','Karın Germe','Yüz Germe'];
  izm_keys     TEXT[] := ARRAY['breast_augmentation','abdominoplasty','facelift'];

  statuses TEXT[] := ARRAY['active','active','active','handed_off','closed'];
  stages   TEXT[] := ARRAY['GREETING','DISCOVERY','QUALIFICATION','INTEREST_CHECK','APPOINTMENT_PUSH','HANDOFF'];
  urgencies TEXT[] := ARRAY['high','medium','low','high','medium'];
  intents   TEXT[] := ARRAY['high','medium','high','low','medium'];
  
  i INT;
  svc_idx INT;
  score INT;
  is_handoff BOOLEAN;
  conv_date TIMESTAMPTZ;
  
BEGIN
  -- Klinik ID'lerini al
  SELECT id INTO istanbul_id FROM clinics WHERE slug = 'istanbul-klinik' LIMIT 1;
  SELECT id INTO ankara_id   FROM clinics WHERE slug = 'ankara-klinik'   LIMIT 1;
  SELECT id INTO izmir_id    FROM clinics WHERE slug = 'izmir-klinik'    LIMIT 1;

  -- ── İSTANBUL KLİNİK CONVERSATIONS ──────────────────────────
  FOR i IN 1..15 LOOP
    svc_idx := (i % array_length(ist_services, 1)) + 1;
    score   := 20 + (random() * 80)::int;
    is_handoff := score >= 65 AND random() > 0.3;
    conv_date := now() - (random() * 14 || ' days')::interval;

    INSERT INTO conversations (
      clinic_id, ghl_contact_id, ghl_conversation_id,
      contact_name, contact_phone, status, current_stage,
      collected_data, lead_signals, lead_score,
      handoff_triggered, handoff_at,
      message_count, images_received,
      first_message_at, last_message_at, created_at, updated_at
    ) VALUES (
      istanbul_id,
      'ghl_ist_' || i,
      'conv_ist_' || i,
      names[i],
      phones[i],
      CASE WHEN is_handoff THEN 'handed_off'
           WHEN score < 30 AND random() > 0.7 THEN 'closed'
           ELSE 'active' END,
      stages[(i % array_length(stages, 1)) + 1],
      jsonb_build_object(
        'name', names[i],
        'interested_service', ist_services[svc_idx],
        'interested_service_key', ist_keys[svc_idx],
        'pain_point', CASE WHEN i % 3 = 0 THEN 'Uzun süredir düşünüyorum' ELSE 'Fiyat araştırması yapıyorum' END,
        'timeline', CASE WHEN i % 4 = 0 THEN '1-2 ay içinde' WHEN i % 4 = 1 THEN '3-6 ay' ELSE 'Araştırma aşamasında' END,
        'budget_awareness', CASE WHEN score > 60 THEN 'aware' ELSE 'not_asked' END,
        'preferred_consultation_type', CASE WHEN i % 2 = 0 THEN 'yuz_yuze' ELSE 'online' END
      ),
      jsonb_build_object(
        'urgency', urgencies[(i % array_length(urgencies, 1)) + 1],
        'engagement_level', CASE WHEN score > 70 THEN 'high' WHEN score > 40 THEN 'medium' ELSE 'low' END,
        'buying_intent', intents[(i % array_length(intents, 1)) + 1],
        'objections_raised', CASE WHEN i % 3 = 0 THEN '["fiyat"]'::jsonb ELSE '[]'::jsonb END,
        'objections_resolved', '[]'::jsonb
      ),
      score,
      is_handoff,
      CASE WHEN is_handoff THEN conv_date + interval '2 hours' ELSE NULL END,
      3 + (random() * 12)::int,
      CASE WHEN i % 5 = 0 THEN 1 ELSE 0 END,
      conv_date,
      conv_date + (random() * 4 || ' hours')::interval,
      conv_date,
      conv_date + (random() * 4 || ' hours')::interval
    ) RETURNING id INTO conv_id;

    -- Mesajlar ekle
    INSERT INTO messages (conversation_id, clinic_id, role, content, created_at) VALUES
    (conv_id, istanbul_id, 'user', 'Merhaba, ' || ist_services[svc_idx] || ' hakkında bilgi almak istiyorum.', conv_date),
    (conv_id, istanbul_id, 'assistant', 'Merhaba ' || split_part(names[i], ' ', 1) || ' Hanım/Bey! ' || ist_services[svc_idx] || ' konusunda yardımcı olmaktan memnuniyet duyarım. Size nasıl yardımcı olabilirim?', conv_date + interval '1 minute'),
    (conv_id, istanbul_id, 'user', 'Fiyat bilgisi alabilir miyim?', conv_date + interval '3 minutes');

    -- Handoff logu ekle
    IF is_handoff THEN
      INSERT INTO handoff_logs (
        clinic_id, conversation_id, ghl_contact_id,
        trigger_type, lead_score_at_handoff,
        salesperson_notified_at, outcome, outcome_notes, created_at
      ) VALUES (
        istanbul_id, conv_id, 'ghl_ist_' || i,
        CASE WHEN score >= 80 THEN 'score_threshold' WHEN i % 2 = 0 THEN 'manual' ELSE 'keyword_trigger' END,
        score,
        conv_date + interval '2 hours',
        CASE WHEN random() > 0.6 THEN 'converted'
             WHEN random() > 0.4 THEN 'pending'
             WHEN random() > 0.2 THEN 'no_answer'
             ELSE 'lost' END,
        CASE WHEN random() > 0.5 THEN 'Hasta randevu aldı' ELSE NULL END,
        conv_date + interval '2 hours'
      );
    END IF;
  END LOOP;

  -- ── ANKARA KLİNİK CONVERSATIONS ─────────────────────────────
  FOR i IN 1..10 LOOP
    svc_idx := (i % array_length(ank_services, 1)) + 1;
    score   := 15 + (random() * 85)::int;
    is_handoff := score >= 60 AND random() > 0.35;
    conv_date := now() - (random() * 14 || ' days')::interval;

    INSERT INTO conversations (
      clinic_id, ghl_contact_id, ghl_conversation_id,
      contact_name, contact_phone, status, current_stage,
      collected_data, lead_signals, lead_score,
      handoff_triggered, handoff_at,
      message_count, images_received,
      first_message_at, last_message_at, created_at, updated_at
    ) VALUES (
      ankara_id,
      'ghl_ank_' || i,
      'conv_ank_' || i,
      names[((i + 5) % 15) + 1],
      phones[((i + 5) % 15) + 1],
      CASE WHEN is_handoff THEN 'handed_off' WHEN score < 25 THEN 'closed' ELSE 'active' END,
      stages[(i % array_length(stages, 1)) + 1],
      jsonb_build_object(
        'name', names[((i + 5) % 15) + 1],
        'interested_service', ank_services[svc_idx],
        'interested_service_key', ank_keys[svc_idx],
        'timeline', CASE WHEN i % 3 = 0 THEN '1 ay içinde' ELSE '3-6 ay' END,
        'budget_awareness', CASE WHEN score > 55 THEN 'aware' ELSE 'not_asked' END
      ),
      jsonb_build_object(
        'urgency', CASE WHEN score > 70 THEN 'high' WHEN score > 40 THEN 'medium' ELSE 'low' END,
        'engagement_level', CASE WHEN score > 65 THEN 'high' WHEN score > 35 THEN 'medium' ELSE 'low' END,
        'buying_intent', CASE WHEN score > 60 THEN 'high' ELSE 'medium' END,
        'objections_raised', '[]'::jsonb,
        'objections_resolved', '[]'::jsonb
      ),
      score, is_handoff,
      CASE WHEN is_handoff THEN conv_date + interval '3 hours' ELSE NULL END,
      2 + (random() * 10)::int, 0,
      conv_date, conv_date + (random() * 5 || ' hours')::interval,
      conv_date, conv_date + (random() * 5 || ' hours')::interval
    ) RETURNING id INTO conv_id;

    INSERT INTO messages (conversation_id, clinic_id, role, content, created_at) VALUES
    (conv_id, ankara_id, 'user', ank_services[svc_idx] || ' için randevu almak istiyorum.', conv_date),
    (conv_id, ankara_id, 'assistant', 'Merhaba! ' || ank_services[svc_idx] || ' konusunda bilgi vermekten memnuniyet duyarım.', conv_date + interval '1 minute');

    IF is_handoff THEN
      INSERT INTO handoff_logs (
        clinic_id, conversation_id, ghl_contact_id,
        trigger_type, lead_score_at_handoff,
        salesperson_notified_at, outcome, created_at
      ) VALUES (
        ankara_id, conv_id, 'ghl_ank_' || i,
        'score_threshold', score,
        conv_date + interval '3 hours',
        CASE WHEN random() > 0.5 THEN 'converted' WHEN random() > 0.3 THEN 'pending' ELSE 'no_answer' END,
        conv_date + interval '3 hours'
      );
    END IF;
  END LOOP;

  -- ── İZMİR KLİNİK CONVERSATIONS ──────────────────────────────
  FOR i IN 1..12 LOOP
    svc_idx := (i % array_length(izm_services, 1)) + 1;
    score   := 25 + (random() * 75)::int;
    is_handoff := score >= 65 AND random() > 0.3;
    conv_date := now() - (random() * 14 || ' days')::interval;

    INSERT INTO conversations (
      clinic_id, ghl_contact_id, ghl_conversation_id,
      contact_name, contact_phone, status, current_stage,
      collected_data, lead_signals, lead_score,
      handoff_triggered, handoff_at,
      message_count, images_received,
      first_message_at, last_message_at, created_at, updated_at
    ) VALUES (
      izmir_id,
      'ghl_izm_' || i,
      'conv_izm_' || i,
      names[((i + 3) % 15) + 1],
      '+90 537 ' || (100 + i)::text || ' 00 ' || lpad(i::text, 2, '0'),
      CASE WHEN is_handoff THEN 'handed_off' WHEN score < 30 THEN 'closed' ELSE 'active' END,
      stages[(i % array_length(stages, 1)) + 1],
      jsonb_build_object(
        'name', names[((i + 3) % 15) + 1],
        'interested_service', izm_services[svc_idx],
        'interested_service_key', izm_keys[svc_idx],
        'timeline', CASE WHEN i % 2 = 0 THEN '1-2 ay' ELSE 'Araştırıyorum' END,
        'budget_awareness', CASE WHEN score > 60 THEN 'aware' ELSE 'not_asked' END
      ),
      jsonb_build_object(
        'urgency', CASE WHEN score > 70 THEN 'high' ELSE 'medium' END,
        'engagement_level', CASE WHEN score > 60 THEN 'high' ELSE 'medium' END,
        'buying_intent', CASE WHEN score > 65 THEN 'high' ELSE 'medium' END,
        'objections_raised', '[]'::jsonb,
        'objections_resolved', '[]'::jsonb
      ),
      score, is_handoff,
      CASE WHEN is_handoff THEN conv_date + interval '2 hours' ELSE NULL END,
      2 + (random() * 15)::int,
      CASE WHEN i % 4 = 0 THEN 2 ELSE 0 END,
      conv_date, conv_date + (random() * 6 || ' hours')::interval,
      conv_date, conv_date + (random() * 6 || ' hours')::interval
    ) RETURNING id INTO conv_id;

    INSERT INTO messages (conversation_id, clinic_id, role, content, created_at) VALUES
    (conv_id, izmir_id, 'user', izm_services[svc_idx] || ' hakkında detaylı bilgi alabilir miyim?', conv_date),
    (conv_id, izmir_id, 'assistant', 'Merhaba! ' || izm_services[svc_idx] || ' ile ilgili her türlü sorunuzu yanıtlamaktan memnuniyet duyarım.', conv_date + interval '2 minutes'),
    (conv_id, izmir_id, 'user', 'Ücretlendirme nasıl?', conv_date + interval '5 minutes');

    IF is_handoff THEN
      INSERT INTO handoff_logs (
        clinic_id, conversation_id, ghl_contact_id,
        trigger_type, lead_score_at_handoff,
        salesperson_notified_at, outcome, created_at
      ) VALUES (
        izmir_id, conv_id, 'ghl_izm_' || i,
        CASE WHEN i % 2 = 0 THEN 'score_threshold' ELSE 'manual' END,
        score,
        conv_date + interval '2 hours',
        CASE WHEN random() > 0.55 THEN 'converted' WHEN random() > 0.3 THEN 'pending' ELSE 'lost' END,
        conv_date + interval '2 hours'
      );
    END IF;
  END LOOP;

END $$;


-- ─── DAILY STATS — Son 14 gün (3 klinik) ─────────────────────
INSERT INTO daily_stats (clinic_id, date, new_conversations, hot_leads, warm_leads, cold_leads, handed_off_leads, avg_lead_score, images_received)
SELECT
  c.id,
  (CURRENT_DATE - s.day_offset)::date,
  (2 + random() * 6)::int,
  (random() * 3)::int,
  (1 + random() * 4)::int,
  (random() * 3)::int,
  (random() * 2)::int,
  ROUND((35 + random() * 40)::numeric, 1),
  (random() * 2)::int
FROM clinics c
CROSS JOIN (
  SELECT generate_series(0, 13) AS day_offset
) s
WHERE c.slug IN ('istanbul-klinik', 'ankara-klinik', 'izmir-klinik')
ON CONFLICT (clinic_id, date) DO UPDATE
  SET new_conversations = EXCLUDED.new_conversations,
      hot_leads         = EXCLUDED.hot_leads,
      warm_leads        = EXCLUDED.warm_leads,
      handed_off_leads  = EXCLUDED.handed_off_leads,
      avg_lead_score    = EXCLUDED.avg_lead_score;


-- ─── SONUÇ ───────────────────────────────────────────────────
SELECT
  c.name,
  COUNT(DISTINCT conv.id)   as conversations,
  COUNT(DISTINCT hl.id)     as handoffs,
  COUNT(DISTINCT m.id)      as messages,
  ROUND(AVG(conv.lead_score),1) as avg_score
FROM clinics c
LEFT JOIN conversations conv ON c.id = conv.clinic_id
LEFT JOIN handoff_logs  hl   ON c.id = hl.clinic_id
LEFT JOIN messages      m    ON c.id = m.clinic_id
WHERE c.slug IN ('istanbul-klinik','ankara-klinik','izmir-klinik')
GROUP BY c.name
ORDER BY c.name;
