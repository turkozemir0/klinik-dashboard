-- Estelife: old lead reactivation workflow aktivasyonu
-- Template: first_contact_v1_de_2 (Meta onaylı, 1 param: {{1}} = isim, Almanca)
-- Org: ecd032a8-f40c-4171-947a-b6417461e987
-- Multi-step sequence: step 1 active, steps 2-5 TBD (Meta onayı bekleniyor)

INSERT INTO org_workflows (organization_id, template_id, is_active, config)
VALUES (
  'ecd032a8-f40c-4171-947a-b6417461e987',
  'reactivation_chat', true,
  '{
    "inactive_days": 30,
    "daily_limit": 50,
    "working_hours_start": "09:00",
    "working_hours_end": "18:00",
    "timezone": "Europe/Berlin",
    "target_statuses": "lost,new,in_progress",
    "message_template": "first_contact_v1_de_2",
    "template_param_count": 1,
    "sequence": [
      { "step": 1, "template": "first_contact_v1_de_2", "param_count": 1, "delay_days": 0 },
      { "step": 2, "template": "TBD_step2",              "param_count": 1, "delay_days": 3 },
      { "step": 3, "template": "TBD_step3",              "param_count": 1, "delay_days": 7 },
      { "step": 4, "template": "TBD_step4",              "param_count": 1, "delay_days": 14 },
      { "step": 5, "template": "TBD_step5",              "param_count": 1, "delay_days": 30 }
    ]
  }'::jsonb
) ON CONFLICT (organization_id, template_id) DO UPDATE SET
  is_active = true, config = EXCLUDED.config, updated_at = now();
