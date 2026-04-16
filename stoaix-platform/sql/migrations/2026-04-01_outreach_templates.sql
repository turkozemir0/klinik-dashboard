-- ─── outreach_templates ────────────────────────────────────────────────────
-- Cold outreach + follow-up sequence mesaj şablonları.
-- channel: 'whatsapp' → mesaj metni ({{name}} placeholder destekli)
--          'voice'    → voice agent konuşma scripti
--          'sms'      → SMS mesaj metni
-- sequence_stage: hangi dokunuşta kullanılacağı
-- n8n workflow bu tablodan organization_id + channel + sequence_stage ile çeker.

CREATE TABLE IF NOT EXISTS public.outreach_templates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  name            text        NOT NULL,
  -- Açıklayıcı isim: "Estelife - Cold Touch 1 (DE)"

  sequence_stage  text        NOT NULL,
  -- 'touch_1' | 'touch_2' | 'touch_3'
  -- Workflow'da hangi adımda kullanılacağı

  channel         text        NOT NULL DEFAULT 'whatsapp',
  -- 'whatsapp' | 'voice' | 'sms'

  message         text        NOT NULL,
  -- WhatsApp/SMS: "Hallo {{name}}, ..."
  -- Voice: konuşma açılış scripti / anahtar mesajlar

  language        text        NOT NULL DEFAULT 'de',
  -- 'de' | 'tr' | 'en' | 'ar' | 'ru'

  active          boolean     NOT NULL DEFAULT true,
  -- false → workflow bu template'i atlar

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index: workflow sorguları için
CREATE INDEX idx_outreach_templates_org
  ON public.outreach_templates(organization_id, channel, sequence_stage, active);

-- RLS
ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage own templates"
  ON public.outreach_templates
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_users WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()
    )
  );

-- updated_at otomatik güncelle
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_outreach_templates_updated_at
  BEFORE UPDATE ON public.outreach_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.outreach_templates;

-- ─── Estelife seed ──────────────────────────────────────────────────────────
-- organization_id'yi Estelife'ın gerçek ID'siyle değiştir.

INSERT INTO public.outreach_templates
  (organization_id, name, sequence_stage, channel, message, language)
VALUES
  (
    'YOUR_ESTELIFE_ORG_ID',
    'Estelife - Cold Touch 1 (DE)',
    'touch_1',
    'whatsapp',
    'Hallo {{name}}, hier ist {{agent_name}} von Estelife Haarklinik 👋 Wir sehen, dass Sie sich für Haartransplantation interessieren. Haben Sie noch offene Fragen? Ich helfe Ihnen gerne weiter 😊',
    'de'
  ),
  (
    'YOUR_ESTELIFE_ORG_ID',
    'Estelife - Cold Touch 2 (DE)',
    'touch_2',
    'whatsapp',
    'Hallo {{name}}, ich wollte nur kurz nachfragen — interessieren Sie sich noch für eine Haartransplantation? Wir haben aktuell freie Beratungstermine in Köln und Düsseldorf. Falls Sie Fragen haben, bin ich gerne für Sie da 🙏',
    'de'
  );
