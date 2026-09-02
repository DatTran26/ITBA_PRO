-- Keep generated questions grounded in the same extracted text used for topic review.
ALTER TABLE document_sources
  ADD COLUMN IF NOT EXISTS extracted_text text;
