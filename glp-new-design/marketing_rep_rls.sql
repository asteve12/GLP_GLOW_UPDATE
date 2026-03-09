-- CLEANUP FIRST (to avoid conflicts)
DROP POLICY IF EXISTS "Marketing reps can view roles they added" ON public.user_roles;
DROP POLICY IF EXISTS "Marketing reps can view submissions for their doctors" ON public.form_submissions;
DROP POLICY IF EXISTS "Marketing reps can view orders for their doctors" ON public.orders;
DROP POLICY IF EXISTS "Marketing reps can view profiles of their doctors" ON public.profiles;

-- 1. USER ROLES POLICY
-- Allow users to see their OWN role (required for login)
-- Allow marketing reps to see roles of users (doctors) they added
-- Allow admins to see everything
CREATE POLICY "Marketing reps can view roles they added" ON public.user_roles
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.uid() = added_by OR 
  EXISTS (
    SELECT 1 FROM public.user_roles AS ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 2. PROFILES POLICY
-- Allow marketing reps to see names/profiles of doctors they added
CREATE POLICY "Marketing reps can view profiles of their doctors" ON public.profiles
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = public.profiles.id 
    AND added_by = auth.uid()
  ) OR 
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 3. FORM SUBMISSIONS POLICY
-- Allow marketing reps to see form submissions assigned to doctors they added
CREATE POLICY "Marketing reps can view submissions for their doctors" ON public.form_submissions
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = public.form_submissions.assigned_provider_id 
    AND added_by = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. ORDERS POLICY
-- Allow marketing reps to see orders for their doctors (via submission ID or Provider ID)
CREATE POLICY "Marketing reps can view orders for their doctors" ON public.orders
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.form_submissions
    JOIN public.user_roles ON public.form_submissions.assigned_provider_id = public.user_roles.user_id
    WHERE public.form_submissions.id = public.orders.form_submission_id
    AND public.user_roles.added_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE public.user_roles.user_id = public.orders.approving_provider_id
    AND public.user_roles.added_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

