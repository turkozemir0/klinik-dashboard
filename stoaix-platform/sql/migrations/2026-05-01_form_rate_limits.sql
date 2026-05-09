-- DB-backed rate limiting for public form-submit endpoint
CREATE TABLE IF NOT EXISTS form_submit_rate_limits (
  api_key_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (api_key_hash, window_start)
);

ALTER TABLE form_submit_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "form_rate_limits_service_only" ON form_submit_rate_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RPC to atomically increment and check rate limit
CREATE OR REPLACE FUNCTION check_form_rate_limit(
  p_api_key_hash TEXT,
  p_window_start TIMESTAMPTZ,
  p_max_requests INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO form_submit_rate_limits (api_key_hash, window_start, request_count)
  VALUES (p_api_key_hash, p_window_start, 1)
  ON CONFLICT (api_key_hash, window_start) DO UPDATE
    SET request_count = form_submit_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$;

-- Cleanup old entries (run periodically or via pg_cron)
CREATE OR REPLACE FUNCTION cleanup_form_rate_limits()
RETURNS VOID
LANGUAGE sql
AS $$
  DELETE FROM form_submit_rate_limits WHERE window_start < NOW() - INTERVAL '2 hours';
$$;
