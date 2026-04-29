-- EsteLife: calendar_booking aktifleştir
-- Google Calendar bağlantısı yapılacak, chatbot randevu teklif edebilsin

-- WhatsApp playbook
UPDATE agent_playbooks
SET features = jsonb_set(features, '{calendar_booking}', 'true'),
    updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND channel = 'whatsapp'
  AND (scenario IS NULL);

-- Instagram playbook
UPDATE agent_playbooks
SET features = jsonb_set(features, '{calendar_booking}', 'true'),
    updated_at = now()
WHERE organization_id = 'ecd032a8-f40c-4171-947a-b6417461e987'
  AND channel = 'instagram'
  AND (scenario IS NULL);
