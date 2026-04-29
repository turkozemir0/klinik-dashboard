-- Leads & follow_up_tasks index optimizations
-- Her statement'ı ayrı ayrı çalıştır (CONCURRENTLY transaction içinde çalışmaz)

-- 1. Leads kanban sort (top IO query — qualification_score + updated_at sıralaması)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_kanban_sort
  ON public.leads(organization_id, qualification_score DESC, updated_at DESC);

-- 2. Leads created_at sort (leads list page pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_org_created
  ON public.leads(organization_id, created_at DESC);

-- 3. follow_up_tasks genel amaçlı (partial index'lerin kaçırdığı sorgular)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_org_status_scheduled
  ON public.follow_up_tasks(organization_id, status, scheduled_at DESC);
