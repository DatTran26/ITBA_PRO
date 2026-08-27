-- Add source tracking to question_bank
-- document_source_id: FK to document_sources for AI-generated questions
-- source_ref: optional text reference for manually-entered questions

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS document_source_id uuid REFERENCES document_sources(id) ON DELETE SET NULL;

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS source_ref text;

CREATE INDEX IF NOT EXISTS idx_question_bank_document_source ON question_bank(document_source_id);
