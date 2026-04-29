-- EsteLife Intake Schema — zorunlu alan güncelleme
-- hair_loss_duration, hair_loss_area, when_to_plan → must

-- WhatsApp
UPDATE intake_schemas
SET fields = '[
    {"key":"full_name","label":"Vollständiger Name","type":"text","priority":"must"},
    {"key":"age","label":"Alter","type":"number","priority":"should"},
    {"key":"city","label":"Stadt","type":"text","priority":"should"},
    {"key":"hair_loss_duration","label":"Dauer des Haarausfalls","type":"text","priority":"must"},
    {"key":"hair_loss_area","label":"Bereich des Haarausfalls","type":"text","priority":"must"},
    {"key":"when_to_plan","label":"Gewünschter Zeitraum","type":"text","priority":"must"}
  ]'::jsonb
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND channel = 'whatsapp';

-- Instagram
UPDATE intake_schemas
SET fields = '[
    {"key":"full_name","label":"Vollständiger Name","type":"text","priority":"must"},
    {"key":"phone","label":"Telefonnummer","type":"phone","priority":"must"},
    {"key":"age","label":"Alter","type":"number","priority":"should"},
    {"key":"city","label":"Stadt","type":"text","priority":"should"},
    {"key":"hair_loss_duration","label":"Dauer des Haarausfalls","type":"text","priority":"must"},
    {"key":"hair_loss_area","label":"Bereich des Haarausfalls","type":"text","priority":"must"},
    {"key":"when_to_plan","label":"Gewünschter Zeitraum","type":"text","priority":"must"}
  ]'::jsonb
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND channel = 'instagram';
