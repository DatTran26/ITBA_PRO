-- Create private storage bucket for candidate CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-cvs',
  'candidate-cvs',
  false,
  10485760, -- 10 MB in bytes
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow authenticated hr/interviewer/admin/super_admin to upload (INSERT)
DROP POLICY IF EXISTS "candidate_cvs_bucket_insert" ON storage.objects;
CREATE POLICY "candidate_cvs_bucket_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate-cvs'
  AND (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('hr', 'interviewer', 'admin', 'super_admin')
  )
);

-- Storage policy: allow authenticated users to read their own uploads + admin/recruiter/interviewer see all
DROP POLICY IF EXISTS "candidate_cvs_bucket_select" ON storage.objects;
CREATE POLICY "candidate_cvs_bucket_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-cvs'
  AND (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'interviewer', 'admin', 'super_admin')
    OR (
      (SELECT role FROM users WHERE auth_id = auth.uid()) = 'hr'
      AND owner = auth.uid()
    )
  )
);

-- Storage policy: only admin/super_admin can delete
DROP POLICY IF EXISTS "candidate_cvs_bucket_delete" ON storage.objects;
CREATE POLICY "candidate_cvs_bucket_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-cvs'
  AND (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
);
