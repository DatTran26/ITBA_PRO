-- Create document_topics table
CREATE TABLE document_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES document_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  key_points JSONB DEFAULT '[]'::jsonb NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_topics_document_id ON document_topics(document_id);

-- Add topics_extracted_at to document_sources
ALTER TABLE document_sources ADD COLUMN IF NOT EXISTS topics_extracted_at TIMESTAMPTZ;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_document_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_topics_updated_at
  BEFORE UPDATE ON document_topics
  FOR EACH ROW EXECUTE FUNCTION update_document_topics_updated_at();

-- Enable RLS
ALTER TABLE document_topics ENABLE ROW LEVEL SECURITY;

-- SELECT: owner or leader/admin/super_admin
CREATE POLICY document_topics_select ON document_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_sources ds
      WHERE ds.id = document_topics.document_id
        AND (
          ds.created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid()
              AND role::text = ANY(ARRAY['leader', 'admin', 'super_admin'])
          )
        )
    )
  );

-- INSERT: authenticated users (service role bypasses RLS)
CREATE POLICY document_topics_insert ON document_topics
  FOR INSERT WITH CHECK (true);

-- UPDATE: owner or admin/super_admin
CREATE POLICY document_topics_update ON document_topics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM document_sources ds
      WHERE ds.id = document_topics.document_id
        AND (
          ds.created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid()
              AND role::text = ANY(ARRAY['admin', 'super_admin'])
          )
        )
    )
  );

-- DELETE: owner or admin/super_admin
CREATE POLICY document_topics_delete ON document_topics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM document_sources ds
      WHERE ds.id = document_topics.document_id
        AND (
          ds.created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid()
              AND role::text = ANY(ARRAY['admin', 'super_admin'])
          )
        )
    )
  );
