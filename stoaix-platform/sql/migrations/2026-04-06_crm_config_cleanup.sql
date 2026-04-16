-- GHL provider → none for all orgs that had GHL as their CRM provider
-- stoaix platform is now the primary CRM; external CRM = outbound webhook only

UPDATE organizations
SET crm_config = jsonb_set(
  COALESCE(crm_config, '{}'),
  '{provider}',
  '"none"'
)
WHERE crm_config->>'provider' = 'ghl'
   OR crm_config IS NULL;
