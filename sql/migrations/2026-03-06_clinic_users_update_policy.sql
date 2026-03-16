-- Allow users to update their own row in clinic_users (e.g. language preference)
DROP POLICY IF EXISTS "users can update own clinic_user row" ON public.clinic_users;
CREATE POLICY "users can update own clinic_user row"
  ON public.clinic_users FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
