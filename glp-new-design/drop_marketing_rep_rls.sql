-- Drop policies for marketing reps
DROP POLICY IF EXISTS "Marketing reps can view roles they added" ON public.user_roles;
DROP POLICY IF EXISTS "Marketing reps can view submissions for their doctors" ON public.form_submissions;
DROP POLICY IF EXISTS "Marketing reps can view orders for their doctors" ON public.orders;
