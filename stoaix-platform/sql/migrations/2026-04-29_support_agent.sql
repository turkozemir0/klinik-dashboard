-- ── Support AI Agent ──────────────────────────────────────────────────────
-- Panel içi destek AI asistanı için tablolar, RPC ve RLS
-- Çalıştır: Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1. support_docs ─────────────────────────────────────────────────────
-- Platform-wide dokümantasyon. Org bağımsız, tüm müşteriler aynı KB'yi kullanır.
CREATE TABLE IF NOT EXISTS public.support_docs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text NOT NULL,
  subcategory   text,
  title         text NOT NULL,
  content       text NOT NULL,
  embedding     vector(1536),
  tags          text[] DEFAULT '{}',
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(category, title)
);

CREATE INDEX IF NOT EXISTS idx_support_docs_category ON public.support_docs(category);
CREATE INDEX IF NOT EXISTS idx_support_docs_active   ON public.support_docs(is_active) WHERE is_active = true;

ALTER TABLE public.support_docs ENABLE ROW LEVEL SECURITY;

-- Tüm authenticated kullanıcılar okuyabilir
CREATE POLICY "support_docs_select_authenticated"
  ON public.support_docs FOR SELECT
  TO authenticated
  USING (true);

-- Sadece super_admin yazabilir
CREATE POLICY "support_docs_all_super_admin"
  ON public.support_docs FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.super_admin_users)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.super_admin_users)
  );


-- ── 2. match_support_docs RPC ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.match_support_docs(
  query_vector    vector(1536),
  match_count     int DEFAULT 5,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id         uuid,
  category   text,
  title      text,
  content    text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    sd.id,
    sd.category,
    sd.title,
    sd.content,
    1 - (sd.embedding <=> query_vector) AS similarity
  FROM public.support_docs sd
  WHERE sd.is_active = true
    AND sd.embedding IS NOT NULL
    AND (filter_category IS NULL OR sd.category = filter_category)
  ORDER BY sd.embedding <=> query_vector
  LIMIT match_count;
$$;


-- ── 3. support_chat_logs ────────────────────────────────────────────────
-- Admin insight: hangi sorular soruluyor, hangi KB doc'ları kullanılıyor
CREATE TABLE IF NOT EXISTS public.support_chat_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES public.organizations(id),
  user_id           uuid NOT NULL,
  user_message      text NOT NULL,
  ai_response       text NOT NULL,
  kb_docs_used      uuid[] DEFAULT '{}',
  input_tokens      int DEFAULT 0,
  output_tokens     int DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_chat_logs_org  ON public.support_chat_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_logs_user ON public.support_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_logs_date ON public.support_chat_logs(created_at);

ALTER TABLE public.support_chat_logs ENABLE ROW LEVEL SECURITY;

-- Super admin tüm logları görebilir
CREATE POLICY "support_chat_logs_all_super_admin"
  ON public.support_chat_logs FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.super_admin_users)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.super_admin_users)
  );

-- Org kullanıcıları kendi org'larına INSERT yapabilir
CREATE POLICY "support_chat_logs_insert_org_user"
  ON public.support_chat_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_users WHERE user_id = auth.uid()
    )
  );


-- ── 4. support_chat_rate_limits ─────────────────────────────────────────
-- DB-based rate limiting (Vercel serverless'ta in-memory çalışmaz)
CREATE TABLE IF NOT EXISTS public.support_chat_rate_limits (
  user_id       uuid NOT NULL,
  window_start  timestamptz NOT NULL,
  message_count int DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);

ALTER TABLE public.support_chat_rate_limits ENABLE ROW LEVEL SECURITY;

-- Sadece service role erişir (API route'lar service client kullanır)
-- Authenticated kullanıcılar doğrudan erişmez


-- ── 5. increment_support_rate_limit RPC ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_support_rate_limit(
  p_user_id      uuid,
  p_window_start timestamptz
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.support_chat_rate_limits (user_id, window_start, message_count)
  VALUES (p_user_id, p_window_start, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET message_count = support_chat_rate_limits.message_count + 1
  RETURNING message_count INTO v_count;

  RETURN v_count;
END;
$$;


-- ── 6. Eski rate limit kayıtlarını temizle (opsiyonel) ──────────────────
-- 24 saatten eski rate limit kayıtlarını siler
CREATE OR REPLACE FUNCTION public.cleanup_support_rate_limits()
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM public.support_chat_rate_limits
  WHERE window_start < now() - interval '24 hours';
$$;
