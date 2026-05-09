-- Eurostar Yurtdışı Eğitim: 100dk/ay voice limiti
-- Legacy plan override — checkEntitlement artık legacy'de de override kontrol ediyor

INSERT INTO org_entitlement_overrides (organization_id, feature_key, enabled, limit_override, reason)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 'voice_agent_inbound', true, 100, 'Eurostar başlangıç paketi — 100dk/ay')
ON CONFLICT DO NOTHING;
