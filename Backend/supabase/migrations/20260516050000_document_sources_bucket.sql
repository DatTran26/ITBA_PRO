-- Live itba-ai storage bucket used by document pipeline.
-- candidate-cvs and interview-recordings are created in earlier migrations.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-sources',
  'document-sources',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS document_sources_insert ON storage.objects;
CREATE POLICY document_sources_insert ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'document-sources');

DROP POLICY IF EXISTS document_sources_select ON storage.objects;
CREATE POLICY document_sources_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'document-sources');

DROP POLICY IF EXISTS document_sources_delete ON storage.objects;
CREATE POLICY document_sources_delete ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'document-sources');
