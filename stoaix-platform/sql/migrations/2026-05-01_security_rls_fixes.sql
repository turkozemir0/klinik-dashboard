-- A3: call_queue RLS
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_queue_select_org" ON call_queue
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM org_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "call_queue_service_insert" ON call_queue
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "call_queue_service_update" ON call_queue
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "call_queue_service_delete" ON call_queue
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- A5: Billing tables — block non-service-role INSERT
-- features table
CREATE POLICY "features_insert_service_only" ON features
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "features_update_service_only" ON features
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "features_delete_service_only" ON features
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- plans table
CREATE POLICY "plans_insert_service_only" ON plans
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "plans_update_service_only" ON plans
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "plans_delete_service_only" ON plans
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- plan_entitlements table
CREATE POLICY "plan_entitlements_insert_service_only" ON plan_entitlements
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "plan_entitlements_update_service_only" ON plan_entitlements
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "plan_entitlements_delete_service_only" ON plan_entitlements
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');
