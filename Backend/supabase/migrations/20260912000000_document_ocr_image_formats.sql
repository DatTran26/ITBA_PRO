-- Phase 1 OCR packaging: allow image uploads to reuse document_sources/jobs.
ALTER TABLE document_sources
  DROP CONSTRAINT IF EXISTS document_sources_format_check;

ALTER TABLE document_sources
  ADD CONSTRAINT document_sources_format_check
    CHECK (format IN ('pdf','docx','txt','url','png','jpg','jpeg','webp'));

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]
WHERE id = 'document-sources';
