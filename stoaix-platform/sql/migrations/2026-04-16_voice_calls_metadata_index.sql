-- voice_calls.metadata GIN index — extraction_status monitoring sorguları için
-- Örnek: SELECT metadata->>'extraction_status', COUNT(*) FROM voice_calls GROUP BY 1;
CREATE INDEX IF NOT EXISTS idx_voice_calls_metadata
    ON voice_calls USING GIN (metadata);
