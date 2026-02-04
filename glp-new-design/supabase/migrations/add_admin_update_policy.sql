-- RLS Policy for Admin to Update Form Submissions
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Drop existing update policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Admins and providers can update form_submissions" ON form_submissions;
DROP POLICY IF EXISTS "Admins can update form_submissions" ON form_submissions;

-- Create a policy that allows users with 'admin' role to update any form_submission
CREATE POLICY "Admins can update form_submissions"
ON form_submissions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Also ensure admins can SELECT (view) all submissions
DROP POLICY IF EXISTS "Admins and providers can view all form_submissions" ON form_submissions;
DROP POLICY IF EXISTS "Admins can view all form_submissions" ON form_submissions;

CREATE POLICY "Admins can view all form_submissions"
ON form_submissions
FOR SELECT
USING (
    -- Users can view their own submissions
    auth.uid() = user_id
    OR
    -- Admins can view all submissions
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Verify the policies were created
-- You can check by running: SELECT * FROM pg_policies WHERE tablename = 'form_submissions';

