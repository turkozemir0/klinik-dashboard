-- Migration: Preset template kütüphanesi
-- message_templates tablosuna preset kolonları + hazır şablonlar
-- Çalıştırma: Supabase Dashboard → SQL Editor

-- 1. Kolonları ekle
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS is_preset  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sector     text,   -- dental | hair | aesthetics | general
  ADD COLUMN IF NOT EXISTS purpose    text;   -- followup | reengagement | unsubscribe | appointment_reminder

-- 2. organization_id nullable yap (presetlerin org'u yok)
ALTER TABLE public.message_templates
  ALTER COLUMN organization_id DROP NOT NULL;

-- 3. Unique index'i güncelle (presetler için org_id null olabilir)
DROP INDEX IF EXISTS message_templates_org_name_idx;
CREATE UNIQUE INDEX message_templates_org_name_idx
  ON public.message_templates (organization_id, name)
  WHERE organization_id IS NOT NULL;

-- 4. RLS: presetleri herkes okuyabilsin
DROP POLICY IF EXISTS "templates_select" ON public.message_templates;
CREATE POLICY "templates_select" ON public.message_templates
  FOR SELECT USING (
    is_preset = true  -- hazır şablonlar herkese açık
    OR (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
    OR (
      organization_id IS NOT NULL AND
      (SELECT EXISTS (
        SELECT 1 FROM public.org_users
        WHERE user_id = auth.uid() AND organization_id = message_templates.organization_id
      ))
    )
  );

-- preset insert/update/delete: sadece super admin
DROP POLICY IF EXISTS "templates_insert" ON public.message_templates;
CREATE POLICY "templates_insert" ON public.message_templates
  FOR INSERT WITH CHECK (
    CASE
      WHEN is_preset = true THEN
        (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
      ELSE
        (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
        OR (
          organization_id IS NOT NULL AND
          (SELECT EXISTS (
            SELECT 1 FROM public.org_users
            WHERE user_id = auth.uid() AND organization_id = message_templates.organization_id
          ))
        )
    END
  );

DROP POLICY IF EXISTS "templates_update" ON public.message_templates;
CREATE POLICY "templates_update" ON public.message_templates
  FOR UPDATE USING (
    CASE
      WHEN is_preset = true THEN
        (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
      ELSE
        (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
        OR (
          organization_id IS NOT NULL AND
          (SELECT EXISTS (
            SELECT 1 FROM public.org_users
            WHERE user_id = auth.uid() AND organization_id = message_templates.organization_id
          ))
        )
    END
  );

DROP POLICY IF EXISTS "templates_delete" ON public.message_templates;
CREATE POLICY "templates_delete" ON public.message_templates
  FOR DELETE USING (
    CASE
      WHEN is_preset = true THEN
        (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
      ELSE
        (SELECT EXISTS (SELECT 1 FROM public.super_admin_users WHERE user_id = auth.uid()))
        OR (
          organization_id IS NOT NULL AND
          (SELECT EXISTS (
            SELECT 1 FROM public.org_users
            WHERE user_id = auth.uid()
              AND organization_id = message_templates.organization_id
              AND role IN ('admin', 'patron')
          ))
        )
    END
  );

-- ─── 5. Hazır Template Seed Data ──────────────────────────────────────────────

INSERT INTO public.message_templates
  (organization_id, name, language, category, components, status, is_preset, sector, purpose)
VALUES

-- ── DENTAL (Diş Kliniği) ──────────────────────────────────────────────────────
(NULL, 'dental_followup_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, geçen hafta kliniğimizle iletişime geçmiştiniz. Diş tedaviniz hakkında sorularınızı yanıtlamak için buradayız. Size nasıl yardımcı olabiliriz?"}]',
  'draft', true, 'dental', 'followup'),

(NULL, 'dental_reengagement_v1', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, bir süredir haber alamadık. Diş sağlığınız için hâlâ yardımcı olmamızı ister misiniz? Randevu almak için EVET yazın."}]',
  'draft', true, 'dental', 'reengagement'),

(NULL, 'dental_unsubscribe_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, artık mesaj almak istemiyorsanız DUR yazmanız yeterli. Sizi listemizden çıkaralım ve bir daha rahatsız etmeyelim."}]',
  'draft', true, 'dental', 'unsubscribe'),

(NULL, 'dental_appointment_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, {{2}} tarihinde saat {{3}}te kliniğimizde randevunuz bulunmaktadır. Onaylamak için EVET, iptal için HAYIR yazın."}]',
  'draft', true, 'dental', 'appointment_reminder'),

-- ── HAIR (Saç Ekimi) ──────────────────────────────────────────────────────────
(NULL, 'hair_followup_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, saç ekimi hakkında bilgi almıştınız. Uzman ekibimiz tüm sorularınızı yanıtlamak için hazır. Size nasıl yardımcı olabiliriz?"}]',
  'draft', true, 'hair', 'followup'),

(NULL, 'hair_reengagement_v1', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, saç ekimi yolculuğunuzda yanınızda olmak isteriz. Hâlâ ilgileniyor musunuz? EVET yazarsanız uzmanımız sizi arasın."}]',
  'draft', true, 'hair', 'reengagement'),

(NULL, 'hair_unsubscribe_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, artık mesaj almak istemiyorsanız DUR yazmanız yeterli. Sizi listemizden çıkaralım."}]',
  'draft', true, 'hair', 'unsubscribe'),

(NULL, 'hair_appointment_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, {{2}} tarihinde saat {{3}}te ücretsiz saç analizi ve konsültasyon randevunuz bulunmaktadır. Onaylamak için EVET yazın."}]',
  'draft', true, 'hair', 'appointment_reminder'),

-- ── AESTHETICS (Estetik Klinik) ───────────────────────────────────────────────
(NULL, 'aesthetics_followup_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, estetik prosedürlerimiz hakkında bilgi almıştınız. Doktorlarımız tüm sorularınızı yanıtlamak için hazır. Nasıl yardımcı olabiliriz?"}]',
  'draft', true, 'aesthetics', 'followup'),

(NULL, 'aesthetics_reengagement_v1', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, bir süredir görüşemedik. Estetik hedeflerinize ulaşmak için hâlâ yardımcı olmamızı ister misiniz? EVET yazarsanız danışmanımız sizi arasın."}]',
  'draft', true, 'aesthetics', 'reengagement'),

(NULL, 'aesthetics_unsubscribe_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, artık mesaj almak istemiyorsanız DUR yazın. Sizi listemizden çıkaralım ve bir daha rahatsız etmeyelim."}]',
  'draft', true, 'aesthetics', 'unsubscribe'),

(NULL, 'aesthetics_appointment_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, {{2}} tarihinde saat {{3}}te ücretsiz konsültasyon randevunuz bulunmaktadır. Onaylamak için EVET, iptal için HAYIR yazın."}]',
  'draft', true, 'aesthetics', 'appointment_reminder'),

-- ── GENERAL (Genel) ───────────────────────────────────────────────────────────
(NULL, 'general_followup_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, geçen hafta bizimle iletişime geçmiştiniz. Sorularınızı yanıtlamak için buradayız. Size nasıl yardımcı olabiliriz?"}]',
  'draft', true, 'general', 'followup'),

(NULL, 'general_reengagement_v1', 'tr', 'MARKETING',
  '[{"type":"BODY","text":"Merhaba {{1}}, bir süredir haber alamadık. Hâlâ yardımcı olmamızı ister misiniz? EVET yazarsanız ekibimiz sizi arasın."}]',
  'draft', true, 'general', 'reengagement'),

(NULL, 'general_unsubscribe_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, artık mesaj almak istemiyorsanız DUR yazmanız yeterli. Sizi listemizden çıkaralım."}]',
  'draft', true, 'general', 'unsubscribe'),

(NULL, 'general_appointment_v1', 'tr', 'UTILITY',
  '[{"type":"BODY","text":"Merhaba {{1}}, {{2}} tarihinde saat {{3}}te randevunuz bulunmaktadır. Onaylamak için EVET, iptal için HAYIR yazın."}]',
  'draft', true, 'general', 'appointment_reminder')

ON CONFLICT DO NOTHING;
