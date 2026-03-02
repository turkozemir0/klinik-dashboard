-- ═══════════════════════════════════════════════════════════════
-- stoaix AI Klinik System — TAM SCHEMA
-- Supabase SQL Editor'da çalıştır
-- Sırayla çalıştır: 01 → 02 → 03 → 04
-- ═══════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 1. CLINICS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  clinic_type text NOT NULL,
  clinic_types text[] DEFAULT '{}',
  clinic_type_other text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_approved boolean DEFAULT false,
  onboarding_status text DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed')),

  -- İletişim
  phone text,
  email text,
  website text,
  address text,
  district text,
  city text DEFAULT 'İzmir',
  parking_info text,

  -- Çalışma saatleri
  working_hours jsonb DEFAULT '{"sunday": "Kapalı", "saturday": "10:00-16:00", "weekdays": "09:00-19:00"}',

  -- Doktor bilgileri
  lead_doctor_name text,
  lead_doctor_title text,
  lead_doctor_experience_years integer,
  lead_doctor_credentials text,

  -- Randevu & Fiyat
  consultation_fee text DEFAULT 'Ücretsiz',
  consultation_types text[] DEFAULT ARRAY['yuz_yuze', 'online'],
  cancellation_policy text,
  pricing_policy text DEFAULT 'Kişiye özel, ön görüşme sonrası belirlenir',
  payment_options text[] DEFAULT ARRAY['nakit', 'kredi_karti', 'taksit'],

  -- AI Kişilik
  tone_profile text DEFAULT 'warm-professional',
  emoji_usage text DEFAULT 'minimal',
  greeting_message text,
  forbidden_topics text,

  -- GoHighLevel Entegrasyonu
  ghl_location_id text,
  ghl_pit_token text,
  ghl_pipeline_id text,
  ghl_pipeline_stages jsonb DEFAULT '{}',

  -- n8n
  n8n_webhook_url text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clinics_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_clinics_slug ON public.clinics(slug);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON public.clinics(status);

-- ─── 2. CLINIC_USERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinic_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT clinic_users_pkey PRIMARY KEY (id),
  UNIQUE(user_id, clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_users_user ON public.clinic_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic ON public.clinic_users(clinic_id);

-- ─── 3. SUPER_ADMIN_USERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.super_admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT super_admin_users_pkey PRIMARY KEY (id)
);

-- ─── 4. INVITE_TOKENS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by uuid REFERENCES auth.users(id),
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  is_used boolean DEFAULT false,
  note text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT invite_tokens_pkey PRIMARY KEY (id)
);

-- ─── 5. CLINIC_REGISTRATIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinic_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_name text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  city text,
  clinic_type text DEFAULT 'estetik_cerrahi',
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_note text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT clinic_registrations_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.clinic_registrations(status, created_at DESC);

-- ─── 6. ONBOARDING_SUBMISSIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('profile', 'services', 'faqs')),
  data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_note text,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT onboarding_submissions_pkey PRIMARY KEY (id),
  UNIQUE(clinic_id, section)
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.onboarding_submissions(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_clinic ON public.onboarding_submissions(clinic_id);

-- ─── 7. ONBOARDING_PROGRESS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL UNIQUE REFERENCES public.clinics(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1,
  completed_steps integer[] DEFAULT '{}',
  completion_pct integer NOT NULL DEFAULT 0,
  profile_done boolean DEFAULT false,
  services_done boolean DEFAULT false,
  faqs_done boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id)
);

-- ─── 8. SERVICES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  service_key text NOT NULL,
  display_name text NOT NULL,
  category text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  description_for_ai text NOT NULL,
  common_patient_concerns text[],
  procedure_duration text,
  anesthesia_type text,
  recovery_time text,
  final_result_time text,
  hospital_stay text,
  what_ai_can_say text[],
  what_ai_must_not_say text[],
  pricing_response text,
  objections jsonb DEFAULT '{}',
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_services_clinic ON public.services(clinic_id);

-- ─── 9. FAQS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  question_patterns text[] NOT NULL,
  answer text NOT NULL,
  category text,
  service_id uuid REFERENCES public.services(id),
  is_active boolean DEFAULT true,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT faqs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_faqs_clinic ON public.faqs(clinic_id);

-- ─── 10. KB_DOCUMENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kb_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  source_type text,
  source_id uuid,
  content text,
  metadata jsonb,
  embedding vector(1536),
  CONSTRAINT kb_documents_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_kb_docs_clinic ON public.kb_documents(clinic_id);

-- ─── 11. KB_CHANGE_REQUESTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kb_change_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  table_name text NOT NULL CHECK (table_name IN ('clinics', 'services', 'faqs')),
  record_id uuid NOT NULL,
  record_label text,
  field_name text NOT NULL,
  field_label text,
  old_value text,
  new_value text NOT NULL,
  change_note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_note text,
  notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT kb_change_requests_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_kb_requests_clinic ON public.kb_change_requests(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_kb_requests_status ON public.kb_change_requests(status, created_at DESC);

-- ─── 12. CONVERSATIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id),
  ghl_contact_id text NOT NULL,
  ghl_conversation_id text,
  contact_name text,
  contact_phone text NOT NULL,
  status text DEFAULT 'active',
  current_stage text DEFAULT 'GREETING',
  collected_data jsonb DEFAULT '{
    "name": null,
    "timeline": null,
    "pain_point": null,
    "referral_source": null,
    "budget_awareness": "not_asked",
    "interested_service": null,
    "preferred_day_time": null,
    "previous_procedure": null,
    "pain_point_duration": null,
    "special_health_notes": null,
    "previous_consultation": null,
    "interested_service_key": null,
    "preferred_consultation_type": null
  }',
  lead_signals jsonb DEFAULT '{
    "urgency": "unknown",
    "buying_intent": "unknown",
    "engagement_level": "unknown",
    "objections_raised": [],
    "objections_resolved": []
  }',
  lead_score integer DEFAULT 0,
  score_breakdown jsonb DEFAULT '{}',
  human_takeover boolean DEFAULT false,
  human_takeover_at timestamptz,
  human_takeover_by text,
  handoff_triggered boolean DEFAULT false,
  handoff_at timestamptz,
  handoff_summary text,
  handoff_suggested_approach text,
  images_received integer DEFAULT 0,
  message_count integer DEFAULT 0,
  first_message_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_clinic ON public.conversations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_conversations_ghl ON public.conversations(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_score ON public.conversations(lead_score DESC);

-- ─── 13. MESSAGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id),
  clinic_id uuid REFERENCES public.clinics(id),
  role text NOT NULL,
  content text NOT NULL,
  contains_image boolean DEFAULT false,
  image_count integer DEFAULT 0,
  ai_metadata jsonb,
  tokens_used integer,
  ghl_message_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_clinic ON public.messages(clinic_id);

-- ─── 14. MESSAGE_BUFFER ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_buffer (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id text,
  ghl_contact_id text NOT NULL,
  message_text text NOT NULL,
  contains_image boolean DEFAULT false,
  image_url text,
  received_at timestamptz DEFAULT now(),
  CONSTRAINT message_buffer_pkey PRIMARY KEY (id)
);

-- ─── 15. CONVERSATION_LOCKS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_locks (
  ghl_contact_id text NOT NULL,
  status text DEFAULT 'idle',
  locked_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 minute'),
  CONSTRAINT conversation_locks_pkey PRIMARY KEY (ghl_contact_id)
);

-- ─── 16. HANDOFF_LOGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.handoff_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id),
  conversation_id uuid REFERENCES public.conversations(id),
  ghl_contact_id text NOT NULL,
  trigger_type text NOT NULL,
  lead_score_at_handoff integer,
  salesperson_notified_at timestamptz DEFAULT now(),
  salesperson_contacted_at timestamptz,
  outcome text DEFAULT 'pending',
  outcome_notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT handoff_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_handoff_clinic ON public.handoff_logs(clinic_id);

-- ─── 17. DAILY_STATS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id),
  date date NOT NULL,
  new_conversations integer DEFAULT 0,
  hot_leads integer DEFAULT 0,
  warm_leads integer DEFAULT 0,
  cold_leads integer DEFAULT 0,
  handed_off_leads integer DEFAULT 0,
  avg_lead_score numeric DEFAULT 0,
  service_breakdown jsonb DEFAULT '{}',
  images_received integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT daily_stats_pkey PRIMARY KEY (id),
  UNIQUE(clinic_id, date)
);

-- ─── 18. SUPPORT_TICKETS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  category text NOT NULL CHECK (category IN ('technical', 'kb_urgent', 'general')),
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  admin_reply text,
  replied_by uuid REFERENCES auth.users(id),
  replied_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_clinic ON public.support_tickets(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status, created_at DESC);

SELECT 'Schema kurulumu tamamlandı ✅' as durum;
