-- Add recording and transcript columns to interview_sessions
ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS recording_url text,
  ADD COLUMN IF NOT EXISTS transcript text,
  ADD COLUMN IF NOT EXISTS ai_summary text;

-- Create private storage bucket for interview recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interview-recordings',
  'interview-recordings',
  false,
  104857600, -- 100 MB in bytes
  ARRAY['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/x-m4a', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for interview-recordings bucket
DROP POLICY IF EXISTS "interview_recordings_bucket_insert" ON storage.objects;
CREATE POLICY "interview_recordings_bucket_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'interview-recordings'
  AND (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('hr', 'recruiter', 'interviewer', 'admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "interview_recordings_bucket_select" ON storage.objects;
CREATE POLICY "interview_recordings_bucket_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'interview-recordings'
  AND (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('hr', 'recruiter', 'interviewer', 'admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "interview_recordings_bucket_delete" ON storage.objects;
CREATE POLICY "interview_recordings_bucket_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'interview-recordings'
  AND (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  )
);
