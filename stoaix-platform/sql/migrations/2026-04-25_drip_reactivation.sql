-- Drip Reactivation Campaign — index'ler
-- Yeni tablo yok, mevcut workflow_runs + leads üzerine index

-- Dedup index: "bu contact'a bu workflow'dan son N günde gönderildi mi?"
CREATE INDEX IF NOT EXISTS idx_workflow_runs_dedup
  ON public.workflow_runs (org_workflow_id, contact_id, status, created_at DESC)
  WHERE status = 'success';

-- Lead tarama: sadece partial index (hafif sorgu)
CREATE INDEX IF NOT EXISTS idx_leads_reactivation_scan
  ON public.leads (organization_id, status, updated_at)
  WHERE status IN ('new', 'in_progress', 'qualified', 'lost');
