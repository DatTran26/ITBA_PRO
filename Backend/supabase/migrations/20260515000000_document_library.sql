-- Document Library: documents table, oauth tokens, and document_sources extensions
-- Phase 1 of QB Document Pipeline Expansion

-- ============================================================
-- documents (canonical library record)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_type varchar NOT NULL CHECK (file_type IN ('pdf','docx','txt','md')),
  storage_path text,
  drive_file_id text,
  drive_modified_time timestamptz,
  source_type varchar NOT NULL CHECK (source_type IN ('upload','google_drive')),
  extracted_text text,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_source_type ON documents(source_type);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read non-deleted documents
DROP POLICY IF EXISTS documents_select ON documents;
CREATE POLICY documents_select ON documents
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid())
  );

-- Leader/admin can insert; uploaded_by must match current user
DROP POLICY IF EXISTS documents_insert ON documents;
CREATE POLICY documents_insert ON documents
  FOR INSERT WITH CHECK (
    uploaded_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    AND EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
  );

-- Owner or admin/super_admin can update
DROP POLICY IF EXISTS documents_update ON documents;
CREATE POLICY documents_update ON documents
  FOR UPDATE USING (
    uploaded_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- Hard delete only for admin/super_admin (soft delete via UPDATE deleted_at)
DROP POLICY IF EXISTS documents_delete ON documents;
CREATE POLICY documents_delete ON documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_documents_updated_at();

-- ============================================================
-- document_sources extensions
-- ============================================================

-- Link to canonical document library entry (nullable for backward compat)
ALTER TABLE document_sources
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES documents(id) ON DELETE SET NULL;

-- Track which pipeline version this run is
ALTER TABLE document_sources
  ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;

-- Point to the previous run for diff/merge flow
ALTER TABLE document_sources
  ADD COLUMN IF NOT EXISTS parent_run_id uuid REFERENCES document_sources(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_document_sources_document_id ON document_sources(document_id);

-- Extend status CHECK to include 2-phase pipeline values
-- Drop and recreate the constraint (idempotent via DROP/ADD)
ALTER TABLE document_sources
  DROP CONSTRAINT IF EXISTS document_sources_status_check;

ALTER TABLE document_sources
  ADD CONSTRAINT document_sources_status_check
    CHECK (status IN ('pending','extracting_topics','topics_ready','generating_questions','processing','done','failed'));

-- ============================================================
-- user_oauth_tokens (per-user per-provider OAuth storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider varchar NOT NULL DEFAULT 'google',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
DROP POLICY IF EXISTS oauth_tokens_select ON user_oauth_tokens;
CREATE POLICY oauth_tokens_select ON user_oauth_tokens
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS oauth_tokens_insert ON user_oauth_tokens;
CREATE POLICY oauth_tokens_insert ON user_oauth_tokens
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS oauth_tokens_update ON user_oauth_tokens;
CREATE POLICY oauth_tokens_update ON user_oauth_tokens
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS oauth_tokens_delete ON user_oauth_tokens;
CREATE POLICY oauth_tokens_delete ON user_oauth_tokens
  FOR DELETE USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_user_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_oauth_tokens_updated_at ON user_oauth_tokens;
CREATE TRIGGER user_oauth_tokens_updated_at
  BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_user_oauth_tokens_updated_at();
