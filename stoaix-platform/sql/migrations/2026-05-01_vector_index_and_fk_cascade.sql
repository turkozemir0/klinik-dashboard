-- C1: HNSW vector index for knowledge_items.embedding
-- Dramatically speeds up match_knowledge_items() RPC
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON knowledge_items
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- C2: FK cascade for workflow cleanup
-- workflow_runs.org_workflow_id → allows deleting org_workflows
ALTER TABLE workflow_runs
  DROP CONSTRAINT IF EXISTS workflow_runs_org_workflow_id_fkey;
ALTER TABLE workflow_runs
  ADD CONSTRAINT workflow_runs_org_workflow_id_fkey
  FOREIGN KEY (org_workflow_id)
  REFERENCES org_workflows(id)
  ON DELETE CASCADE;

-- call_queue.run_id → allows deleting workflow_runs
ALTER TABLE call_queue
  DROP CONSTRAINT IF EXISTS call_queue_run_id_fkey;
ALTER TABLE call_queue
  ADD CONSTRAINT call_queue_run_id_fkey
  FOREIGN KEY (run_id)
  REFERENCES workflow_runs(id)
  ON DELETE CASCADE;
