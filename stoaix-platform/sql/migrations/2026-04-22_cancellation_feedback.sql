-- cancellation_feedback — iptal nedeni + retention sonucu
CREATE TABLE cancellation_feedback (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id),
  cancel_reason     text NOT NULL,       -- too_expensive | not_using | missing_features | switching_competitor | temporary_pause | other
  cancel_reason_text text,
  satisfaction      int,                 -- 1-5
  satisfaction_note text,
  retention_offered  boolean DEFAULT false,
  retention_accepted boolean DEFAULT false,
  retention_coupon_id text,
  final_action      text NOT NULL DEFAULT 'pending',  -- pending | canceled | retained_with_discount
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all" ON cancellation_feedback
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE INDEX idx_cancel_feedback_org ON cancellation_feedback(organization_id);
