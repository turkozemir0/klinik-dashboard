-- EsteLife Aesthetik intake schemas (hair transplant, German-speaking customers)
-- Only inserts if EsteLife has no schemas yet (safe to run multiple times)

INSERT INTO public.intake_schemas (organization_id, channel, name, fields)
SELECT
  'ecd032a8-f40c-4171-947a-b6417461e987',
  'whatsapp',
  'EsteLife WhatsApp Başvuru Formu',
  '[
    {"key":"full_name","label":"Ad Soyad","type":"text","priority":"must"},
    {"key":"age","label":"Yaş","type":"number","priority":"should"},
    {"key":"city","label":"Şehir / Stadt","type":"text","priority":"should"},
    {"key":"hair_loss_duration","label":"Ne Zamandır Saç Dökülüyor","type":"text","priority":"should"},
    {"key":"hair_loss_area","label":"Saç Dökülme Bölgesi","type":"text","priority":"should"},
    {"key":"when_to_plan","label":"Ne Zaman Planladığı","type":"text","priority":"should"}
  ]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.intake_schemas
  WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
    AND channel = 'whatsapp'
);

INSERT INTO public.intake_schemas (organization_id, channel, name, fields)
SELECT
  'ecd032a8-f40c-4171-947a-b6417461e987',
  'instagram',
  'EsteLife Instagram Başvuru Formu',
  '[
    {"key":"full_name","label":"Ad Soyad","type":"text","priority":"must"},
    {"key":"phone","label":"Telefon","type":"phone","priority":"must"},
    {"key":"age","label":"Yaş","type":"number","priority":"should"},
    {"key":"city","label":"Şehir / Stadt","type":"text","priority":"should"},
    {"key":"hair_loss_duration","label":"Ne Zamandır Saç Dökülüyor","type":"text","priority":"should"},
    {"key":"hair_loss_area","label":"Saç Dökülme Bölgesi","type":"text","priority":"should"},
    {"key":"when_to_plan","label":"Ne Zaman Planladığı","type":"text","priority":"should"}
  ]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.intake_schemas
  WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
    AND channel = 'instagram'
);

INSERT INTO public.intake_schemas (organization_id, channel, name, fields)
SELECT
  'ecd032a8-f40c-4171-947a-b6417461e987',
  'voice',
  'EsteLife Sesli Başvuru Formu',
  '[
    {"key":"full_name","label":"Ad Soyad","type":"text","priority":"must","voice_prompt":"Adınızı ve soyadınızı öğrenebilir miyim?"},
    {"key":"phone","label":"Telefon","type":"phone","priority":"must","voice_prompt":"Sizi daha sonra arayabilmemiz için telefon numaranızı alabilir miyim?"},
    {"key":"age","label":"Yaş","type":"number","priority":"should","voice_prompt":"Yaşınızı sorabilir miyim?"},
    {"key":"city","label":"Şehir","type":"text","priority":"should","voice_prompt":"Hangi şehirde yaşıyorsunuz?"},
    {"key":"hair_loss_duration","label":"Ne Zamandır Saç Dökülüyor","type":"text","priority":"should","voice_prompt":"Ne zamandır saç dökülme probleminiz var?"},
    {"key":"hair_loss_area","label":"Saç Dökülme Bölgesi","type":"text","priority":"should","voice_prompt":"Saç dökülmesi hangi bölgelerde yoğun, örneğin alnın kenarları mı yoksa tepe mi?"},
    {"key":"when_to_plan","label":"Ne Zaman Planladığı","type":"text","priority":"should","voice_prompt":"Operasyonu ne zaman yapmayı düşünüyorsunuz?"}
  ]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.intake_schemas
  WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
    AND channel = 'voice'
);
