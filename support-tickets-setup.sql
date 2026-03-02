-- ═══════════════════════════════════════════════════════════════
-- SUPPORT TICKETS TABLOSU
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS support_tickets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  submitted_by    UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ticket içeriği
  category        TEXT NOT NULL CHECK (category IN ('technical', 'kb_urgent', 'general')),
  subject         TEXT NOT NULL,
  description     TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Durum
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  
  -- Admin yanıtı
  admin_reply     TEXT,
  replied_by      UUID REFERENCES auth.users(id),
  replied_at      TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_clinic  ON support_tickets(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status  ON support_tickets(status, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_ticket_updated_at();

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Klinik kendi ticketlarını görebilir
CREATE POLICY "clinic can see own tickets"
  ON support_tickets FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR is_super_admin());

-- Klinik kendi adına ticket açabilir
CREATE POLICY "clinic can create ticket"
  ON support_tickets FOR INSERT
  WITH CHECK (clinic_id = get_my_clinic_id() AND submitted_by = auth.uid());

-- Sadece super admin güncelleyebilir (yanıt, durum)
CREATE POLICY "admin can update tickets"
  ON support_tickets FOR UPDATE
  USING (is_super_admin());

-- Admin yanıt fonksiyonu
CREATE OR REPLACE FUNCTION reply_support_ticket(
  ticket_id UUID,
  reply_text TEXT,
  new_status TEXT DEFAULT 'in_progress'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  END IF;

  UPDATE support_tickets SET
    admin_reply  = reply_text,
    replied_by   = auth.uid(),
    replied_at   = now(),
    status       = new_status,
    resolved_at  = CASE WHEN new_status = 'resolved' THEN now() ELSE NULL END
  WHERE id = ticket_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket bulunamadı');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;

SELECT 'Support tickets sistemi hazır ✅' as durum;
