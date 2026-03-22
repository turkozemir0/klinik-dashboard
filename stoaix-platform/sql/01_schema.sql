-- ═══════════════════════════════════════════════════════════════
-- stoaix Platform — Multi-Tenant Schema
-- Yeni Supabase projesinde çalıştır (klinik DB'den bağımsız)
-- Sırayla: 01 → 02 → 03 → 04
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 1. ORGANIZATIONS ─────────────────────────────────────────
-- Tenant kökü. Her müşteri = bir organization.
CREATE TABLE IF NOT EXISTS public.organizations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  slug            text        NOT NULL UNIQUE,
  sector          text        NOT NULL DEFAULT 'other',
  -- 'education' | 'clinic' | 'tech_service' | 'real_estate' | 'other'
  status          text        NOT NULL DEFAULT 'onboarding'
                              CHECK (status IN ('onboarding', 'active', 'inactive')),
  onboarding_status text      NOT NULL DEFAULT 'not_started'
                              CHECK (onboarding_status IN ('not_started','in_progress','completed')),

  -- İletişim (structured — arama/filtreleme için)
  phone           text,
  email           text,
  city            text,
  country         text        DEFAULT 'TR',

  -- Config JSONB'ler
  ai_persona      jsonb       NOT NULL DEFAULT '{
    "persona_name": "AI Asistan",
    "language": "tr",
    "tone": "warm-professional",
    "never_hallucinate": true,
    "fallback_instruction": "Eğer bilgi tabanında kesin cevap bulamazsan KESİNLİKLE uydurma. Fallback yanıtı kullan.",
    "fallback_responses": {
      "no_kb_match": "Bu konuda elimde net bir bilgi yok. Uzman danışmanımıza not alıyorum, en kısa sürede dönecekler.",
      "off_topic": "Bu konu uzmanlık alanımın dışında. Başka konularda yardımcı olabilir miyim?",
      "kb_empty_3x": "Birkaç sorunuzu yanıtlayamadım. Sizi uzman ekibimize bağlayayım."
    }
  }'::jsonb,

  channel_config  jsonb       NOT NULL DEFAULT '{
    "voice_inbound":  {"active": false},
    "voice_outbound": {"active": false},
    "whatsapp":       {"active": false},
    "instagram":      {"active": false}
  }'::jsonb,

  crm_config      jsonb       NOT NULL DEFAULT '{"provider": "none"}'::jsonb,
  -- GHL: {"provider":"ghl","location_id":"...","pit_token":"...","pipeline_id":"...","stage_mapping":{}}

  working_hours   jsonb       DEFAULT '{"weekdays":"09:00-18:00","saturday":"10:00-16:00","sunday":"Kapalı"}'::jsonb,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_orgs_slug   ON public.organizations(slug);
CREATE INDEX idx_orgs_sector ON public.organizations(sector);
CREATE INDEX idx_orgs_status ON public.organizations(status);

-- ─── 2. ORG_USERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_users (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role            text        NOT NULL DEFAULT 'viewer'
                              CHECK (role IN ('admin', 'viewer')),
  created_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_org_users_user ON public.org_users(user_id);
CREATE INDEX idx_org_users_org  ON public.org_users(organization_id);

-- ─── 3. SUPER_ADMIN_USERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.super_admin_users (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text,
  created_at      timestamptz DEFAULT now()
);

-- ─── 4. INVITE_TOKENS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token           text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  organization_id uuid        REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by      uuid        REFERENCES auth.users(id),
  used_by         uuid        REFERENCES auth.users(id),
  used_at         timestamptz,
  expires_at      timestamptz DEFAULT (now() + interval '7 days'),
  is_used         boolean     DEFAULT false,
  note            text,
  created_at      timestamptz DEFAULT now()
);

-- ─── 5. CONTACTS ──────────────────────────────────────────────
-- Tüm kanallardan gelen kişilerin tek profili.
-- Deduplication: phone (primary) → email (secondary)
CREATE TABLE IF NOT EXISTS public.contacts (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Structured (dedup + arama için)
  phone               text,
  email               text,
  full_name           text,

  -- Kanal kimlikleri (WhatsApp numarası, Instagram handle, GHL contact ID vs.)
  channel_identifiers jsonb   DEFAULT '{}'::jsonb,
  -- {"whatsapp": "+905...", "instagram": "user123", "ghl_contact_id": "abc"}

  status              text    NOT NULL DEFAULT 'new'
                              CHECK (status IN ('anonymous','new','known','qualified','customer')),
  source_channel      text,   -- ilk temas kanalı
  crm_contact_id      text,   -- external CRM'deki ID (sync sonrası)
  tags                text[]  DEFAULT '{}',
  metadata            jsonb   DEFAULT '{}'::jsonb,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_contacts_org   ON public.contacts(organization_id);
CREATE INDEX idx_contacts_phone ON public.contacts(organization_id, phone);
CREATE INDEX idx_contacts_email ON public.contacts(organization_id, email);
CREATE INDEX idx_contacts_status ON public.contacts(organization_id, status);
CREATE INDEX idx_contacts_ch_ids ON public.contacts USING GIN (channel_identifiers);

-- ─── 6. LEADS ─────────────────────────────────────────────────
-- Kalifikasyon takibi. Bir contact'ın birden fazla lead'i olabilir.
CREATE TABLE IF NOT EXISTS public.leads (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id          uuid    NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

  status              text    NOT NULL DEFAULT 'new'
                              CHECK (status IN ('new','in_progress','qualified','handed_off','lost','converted')),
  source_channel      text    NOT NULL DEFAULT 'voice',
  -- 'voice_inbound' | 'whatsapp' | 'instagram'

  -- Toplanan veri (sektöre göre değişir)
  collected_data      jsonb   NOT NULL DEFAULT '{}'::jsonb,
  -- {"full_name":"Ali","target_country":"UK","budget_range":null}

  -- Her field'ın durumu: collected|not_collected|declined|unknown|pending_followup
  data_completeness   jsonb   NOT NULL DEFAULT '{}'::jsonb,

  -- n8n için kolay okuma — data_completeness'ten türetilir
  missing_fields      text[]  DEFAULT '{}',

  qualification_score integer DEFAULT 0 CHECK (qualification_score BETWEEN 0 AND 100),

  -- Handoff
  handoff_triggered   boolean DEFAULT false,
  handoff_at          timestamptz,
  handoff_summary     text,   -- AI-üretilen satış özeti
  next_action         text,
  follow_up_at        timestamptz,
  assigned_to         text,   -- satış ekibinden kişi adı/email

  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_leads_org    ON public.leads(organization_id);
CREATE INDEX idx_leads_contact ON public.leads(contact_id);
CREATE INDEX idx_leads_status ON public.leads(organization_id, status);
CREATE INDEX idx_leads_handoff ON public.leads(organization_id, handoff_triggered);
CREATE INDEX idx_leads_data   ON public.leads USING GIN (collected_data);

-- ─── 7. CONVERSATIONS ─────────────────────────────────────────
-- Kanal-agnostik konuşma kaydı.
CREATE TABLE IF NOT EXISTS public.conversations (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id          uuid    NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id             uuid    REFERENCES public.leads(id) ON DELETE SET NULL,

  channel             text    NOT NULL CHECK (channel IN ('voice','whatsapp','instagram','web')),
  status              text    NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','closed','handed_off')),

  channel_metadata    jsonb   DEFAULT '{}'::jsonb,
  -- voice: {"livekit_room":"..."}
  -- whatsapp: {"ghl_conversation_id":"...","message_count":12}

  started_at          timestamptz DEFAULT now(),
  ended_at            timestamptz
);

CREATE INDEX idx_convs_org     ON public.conversations(organization_id);
CREATE INDEX idx_convs_contact ON public.conversations(contact_id);
CREATE INDEX idx_convs_lead    ON public.conversations(lead_id);
CREATE INDEX idx_convs_channel ON public.conversations(organization_id, channel);
CREATE INDEX idx_convs_status  ON public.conversations(organization_id, status);

-- ─── 8. MESSAGES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid    NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  role                text    NOT NULL CHECK (role IN ('user','assistant','system')),
  content             text    NOT NULL,
  content_type        text    NOT NULL DEFAULT 'text'
                              CHECK (content_type IN ('text','image','audio_transcript')),
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX idx_messages_org  ON public.messages(organization_id, created_at DESC);

-- ─── 9. VOICE_CALLS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.voice_calls (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id          uuid    REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id     uuid    REFERENCES public.conversations(id) ON DELETE SET NULL,
  lead_id             uuid    REFERENCES public.leads(id) ON DELETE SET NULL,

  direction           text    NOT NULL DEFAULT 'inbound'
                              CHECK (direction IN ('inbound','outbound')),
  status              text    NOT NULL DEFAULT 'completed'
                              CHECK (status IN ('completed','missed','dropped','in_progress')),

  phone_from          text,
  phone_to            text,
  duration_seconds    integer DEFAULT 0,
  transcript          text,
  livekit_room_name   text,

  started_at          timestamptz DEFAULT now(),
  ended_at            timestamptz,
  metadata            jsonb   DEFAULT '{}'::jsonb
);

CREATE INDEX idx_vcalls_org     ON public.voice_calls(organization_id);
CREATE INDEX idx_vcalls_contact ON public.voice_calls(contact_id);
CREATE INDEX idx_vcalls_started ON public.voice_calls(organization_id, started_at DESC);

-- ─── 10. KNOWLEDGE_ITEMS ──────────────────────────────────────
-- Tek KB tablosu, tüm sektörler.
CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  item_type           text    NOT NULL DEFAULT 'faq',
  -- 'faq' | 'program' | 'service' | 'country' | 'policy' | 'team_member' | 'pricing'

  title               text    NOT NULL,
  description_for_ai  text    NOT NULL,   -- embedding kaynağı + AI context
  data                jsonb   DEFAULT '{}'::jsonb,  -- sektöre özel alanlar
  tags                text[]  DEFAULT '{}',
  is_active           boolean DEFAULT true,
  embedding           vector(1536),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  -- Güncelleme mekanizması için stable key
  UNIQUE(organization_id, item_type, title)
);

CREATE INDEX idx_kb_org      ON public.knowledge_items(organization_id);
CREATE INDEX idx_kb_type     ON public.knowledge_items(organization_id, item_type);
CREATE INDEX idx_kb_active   ON public.knowledge_items(organization_id, is_active);
CREATE INDEX idx_kb_tags     ON public.knowledge_items USING GIN (tags);

-- ─── 11. INTAKE_SCHEMAS ───────────────────────────────────────
-- Hangi bilginin toplanacağı, hangi sırada, nasıl.
CREATE TABLE IF NOT EXISTS public.intake_schemas (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel             text    NOT NULL DEFAULT 'all'
                              CHECK (channel IN ('voice','chat','whatsapp','instagram','all')),
  name                text    NOT NULL,
  fields              jsonb   NOT NULL DEFAULT '[]'::jsonb,
  -- [{key, label, type, priority: must|should|nice, ask_first, voice_prompt, options, validation}]
  is_active           boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_intake_org ON public.intake_schemas(organization_id);

-- ─── 12. AGENT_PLAYBOOKS ──────────────────────────────────────
-- AI davranış konfigürasyonu.
CREATE TABLE IF NOT EXISTS public.agent_playbooks (
  id                      uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel                 text    NOT NULL DEFAULT 'voice',
  name                    text    NOT NULL,
  version                 integer NOT NULL DEFAULT 1,

  system_prompt_template  text    NOT NULL,

  fallback_responses      jsonb   DEFAULT '{}'::jsonb,
  handoff_triggers        jsonb   DEFAULT '{
    "keywords": [],
    "missing_required_after_turns": 10,
    "kb_empty_consecutive": 3,
    "frustration_keywords": ["saçma","berbat","anlayamıyorsunuz"]
  }'::jsonb,
  hard_blocks             jsonb   DEFAULT '[]'::jsonb,
  routing_rules           jsonb   DEFAULT '[]'::jsonb,

  is_active               boolean DEFAULT true,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_playbooks_org ON public.agent_playbooks(organization_id, is_active);

-- ─── 13. HANDOFF_LOGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.handoff_logs (
  id                      uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id                 uuid    REFERENCES public.leads(id) ON DELETE SET NULL,
  conversation_id         uuid    REFERENCES public.conversations(id) ON DELETE SET NULL,

  trigger_reason          text    NOT NULL,
  -- 'user_requested'|'qualified'|'frustration'|'timeout'|'cant_help'|'routing'

  summary                 text,   -- AI-üretilen satış özeti
  collected_data_snapshot jsonb   DEFAULT '{}'::jsonb,
  missing_at_handoff      text[]  DEFAULT '{}',
  routing_target          text,   -- temsilcilik adı veya danışman

  status                  text    NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','accepted','resolved')),
  assigned_to             text,
  created_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_handoff_org    ON public.handoff_logs(organization_id, status);
CREATE INDEX idx_handoff_lead   ON public.handoff_logs(lead_id);
CREATE INDEX idx_handoff_time   ON public.handoff_logs(organization_id, created_at DESC);

-- ─── 14. FOLLOW_UP_TASKS ──────────────────────────────────────
-- Eksik veri tamamlama + follow-up görevleri.
CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id             uuid    REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id          uuid    REFERENCES public.contacts(id) ON DELETE CASCADE,

  task_type           text    NOT NULL,
  -- 'whatsapp_followup'|'voice_callback'|'email'|'sales_notify'

  scheduled_at        timestamptz NOT NULL,
  status              text    NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','sent','done','cancelled')),
  template_key        text,
  variables           jsonb   DEFAULT '{}'::jsonb,
  -- {"missing_fields":["budget_range"],"name":"Ali","target_country":"UK"}
  attempt_count       integer DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_tasks_org       ON public.follow_up_tasks(organization_id);
CREATE INDEX idx_tasks_scheduled ON public.follow_up_tasks(scheduled_at, status);
CREATE INDEX idx_tasks_lead      ON public.follow_up_tasks(lead_id);

-- ─── 15. CRM_SYNC_LOGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_sync_logs (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type         text    NOT NULL CHECK (entity_type IN ('contact','lead','handoff')),
  entity_id           uuid    NOT NULL,

  crm_provider        text    NOT NULL,
  crm_record_id       text,
  sync_status         text    NOT NULL DEFAULT 'pending'
                              CHECK (sync_status IN ('synced','failed','pending')),
  last_synced_at      timestamptz,
  error_details       text,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_sync_org    ON public.crm_sync_logs(organization_id);
CREATE INDEX idx_crm_sync_entity ON public.crm_sync_logs(entity_id);

-- ─── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_contacts_updated
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_kb_updated
  BEFORE UPDATE ON public.knowledge_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_playbooks_updated
  BEFORE UPDATE ON public.agent_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
