-- Migration: message_templates tablosu
-- WhatsApp Business template mesajları yönetimi
-- Çalıştırma: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.message_templates (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             text        NOT NULL,   -- Meta'daki template adı (lowercase, underscore)
  language         text        NOT NULL DEFAULT 'tr',
  category         text        NOT NULL,   -- MARKETING | UTILITY | AUTHENTICATION
  components       jsonb       NOT NULL,   -- Meta format: [{type:'BODY', text:'...'}]
  status           text        NOT NULL DEFAULT 'draft',  -- draft|pending|approved|rejected
  meta_template_id text,                   -- Meta'dan dönen template ID
  rejection_reason text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Name + org kombinasyonu unique (aynı org'da aynı template adı 1 kere olabilir)
CREATE UNIQUE INDEX IF NOT EXISTS message_templates_org_name_idx
  ON public.message_templates (organization_id, name);

-- RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select" ON public.message_templates
  FOR SELECT USING (
    (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
    OR
    (SELECT EXISTS (
      SELECT 1 FROM public.org_users
      WHERE user_id = auth.uid() AND organization_id = message_templates.organization_id
    ))
  );

CREATE POLICY "templates_insert" ON public.message_templates
  FOR INSERT WITH CHECK (
    (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
    OR
    (SELECT EXISTS (
      SELECT 1 FROM public.org_users
      WHERE user_id = auth.uid() AND organization_id = message_templates.organization_id
    ))
  );

CREATE POLICY "templates_update" ON public.message_templates
  FOR UPDATE USING (
    (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
    OR
    (SELECT EXISTS (
      SELECT 1 FROM public.org_users
      WHERE user_id = auth.uid() AND organization_id = message_templates.organization_id
    ))
  );

CREATE POLICY "templates_delete" ON public.message_templates
  FOR DELETE USING (
    (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
    OR
    (SELECT EXISTS (
      SELECT 1 FROM public.org_users
      WHERE user_id = auth.uid()
        AND organization_id = message_templates.organization_id
        AND role IN ('admin', 'patron')
    ))
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_templates;
