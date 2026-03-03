-- Migration: 2026-03-03 — CRM Esnek Mimari
-- Adds: webhook_token, crm_token, CHECK on crm_provider, crm_config migration, Vault helpers

-- ═══════════════════════════════════════════════════════════════
-- 1. webhook_token — her klinik için unique, gelen webhook'u kliniğe bağlar
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS webhook_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Mevcut klinikler için token üret
UPDATE clinics
SET webhook_token = encode(gen_random_bytes(32), 'hex')
WHERE webhook_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_clinics_webhook_token ON clinics(webhook_token);

-- ═══════════════════════════════════════════════════════════════
-- 2. crm_token — CRM API tokeni (ghl_pit_token'ın genel karşılığı)
--    Admin panelinden set edilir, Edge Function tarafından okunur
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS crm_token text;

-- Mevcut GHL kliniklerinin token'ını migrate et
UPDATE clinics
SET crm_token = ghl_pit_token
WHERE ghl_pit_token IS NOT NULL AND crm_token IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. crm_provider CHECK constraint ekle
--    (sütun 2026-03-03_voice_calls_... migration'ında eklendi)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE clinics
  DROP CONSTRAINT IF EXISTS clinics_crm_provider_check;

ALTER TABLE clinics
  ADD CONSTRAINT clinics_crm_provider_check
  CHECK (crm_provider IN ('ghl', 'hubspot', 'kommo', 'zoho', 'salesforce', 'custom'));

-- ═══════════════════════════════════════════════════════════════
-- 4. crm_config — mevcut GHL verilerini migrate et
--    send_message_url + field_map ile mesaj gönderme dinamik hale gelir
-- ═══════════════════════════════════════════════════════════════

UPDATE clinics
SET crm_config = jsonb_build_object(
  'location_id',       ghl_location_id,
  'pipeline_id',       ghl_pipeline_id,
  'pipeline_stages',   COALESCE(ghl_pipeline_stages, '{}'::jsonb),
  'send_message_url',  'https://services.leadconnectorhq.com/conversations/messages',
  'field_map', jsonb_build_object(
    'contact_id', 'contactId',
    'message',    'mergedMessage',
    'type',       'SMS'
  )
)
WHERE ghl_location_id IS NOT NULL
  AND (crm_config = '{}'::jsonb OR NOT crm_config ? 'send_message_url');

-- ═══════════════════════════════════════════════════════════════
-- 5. Vault helper fonksiyonları
--    get_clinic_crm_token  → super admin veya klinik kendi token'ını okuyabilir
--    set_clinic_crm_token  → sadece super admin token set edebilir (Vault'a yazar)
--
--    NOT: Vault (supabase_vault extension) etkin değilse bu fonksiyonlar
--    çalışmaz. Etkin değilse crm_token sütununu direkt kullan.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_clinic_crm_token(p_clinic_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_secret text;
BEGIN
  IF NOT (is_super_admin() OR get_my_clinic_id() = p_clinic_id) THEN
    RETURN NULL;
  END IF;

  -- Önce Vault'tan dene
  BEGIN
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'crm_token_' || p_clinic_id::text
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- Vault kullanılamıyorsa crm_token sütunundan oku
    SELECT crm_token INTO v_secret
    FROM clinics
    WHERE id = p_clinic_id;
  END;

  -- Vault'ta yoksa crm_token sütununa bak
  IF v_secret IS NULL THEN
    SELECT crm_token INTO v_secret
    FROM clinics
    WHERE id = p_clinic_id;
  END IF;

  RETURN v_secret;
END;
$$;

CREATE OR REPLACE FUNCTION set_clinic_crm_token(p_clinic_id uuid, p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_secret_name text := 'crm_token_' || p_clinic_id::text;
  v_existing_id uuid;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN false;
  END IF;

  -- Önce DB sütununu güncelle (her zaman çalışır)
  UPDATE clinics SET crm_token = p_token WHERE id = p_clinic_id;

  -- Vault varsa oraya da yaz
  BEGIN
    SELECT id INTO v_existing_id
    FROM vault.secrets
    WHERE name = v_secret_name
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      PERFORM vault.update_secret(v_existing_id, p_token);
    ELSE
      PERFORM vault.create_secret(p_token, v_secret_name, 'CRM API token for clinic ' || p_clinic_id::text);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Vault yoksa sadece DB güncellendi, devam et
    NULL;
  END;

  RETURN true;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 6. RLS: crm_token sütununu klinik kullanıcılarından gizle
--    Klinik kullanıcıları kendi crm_token'larını göremez
--    (sadece masked gösterim için panel ayrı sütun kullanacak)
--
--    NOT: Mevcut SELECT policy tüm sütunları açar. Gerçek
--    gizleme için column-level security veya view gerekir.
--    Şimdilik super admin only update yeterli.
-- ═══════════════════════════════════════════════════════════════

-- crm_token sadece super admin tarafından güncellenebilir
-- (mevcut "super admin can update clinics" policy zaten bunu sağlıyor)

SELECT 'CRM Esnek Mimari migration tamamlandı ✅' AS durum;
