-- Question Bank & AI Document Pipeline Foundation
-- Creates: question_bank, document_sources, document_jobs tables + RLS

-- ============================================================
-- question_bank
-- ============================================================
CREATE TABLE IF NOT EXISTS question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_hash varchar(64) NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  explanation text,
  points integer NOT NULL DEFAULT 1,
  time_limit integer NOT NULL DEFAULT 60,
  level varchar NOT NULL CHECK (level IN ('junior','middle','senior')),
  topic_tag varchar,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_bank_hash_unique UNIQUE (question_hash)
);

CREATE INDEX IF NOT EXISTS idx_question_bank_level ON question_bank(level);
CREATE INDEX IF NOT EXISTS idx_question_bank_topic ON question_bank(topic_tag);
CREATE INDEX IF NOT EXISTS idx_question_bank_created_by ON question_bank(created_by);

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS question_bank_select ON question_bank;
CREATE POLICY question_bank_select ON question_bank
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS question_bank_insert ON question_bank;
CREATE POLICY question_bank_insert ON question_bank
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
  );

DROP POLICY IF EXISTS question_bank_update ON question_bank;
CREATE POLICY question_bank_update ON question_bank
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
  );

DROP POLICY IF EXISTS question_bank_delete ON question_bank;
CREATE POLICY question_bank_delete ON question_bank
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
  );

-- ============================================================
-- document_sources
-- ============================================================
CREATE TABLE IF NOT EXISTS document_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name varchar,
  file_url text,
  format varchar NOT NULL CHECK (format IN ('pdf','docx','txt','url')),
  source_url text,
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_sources_status ON document_sources(status);
CREATE INDEX IF NOT EXISTS idx_document_sources_created_by ON document_sources(created_by);

ALTER TABLE document_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_sources_select ON document_sources;
CREATE POLICY document_sources_select ON document_sources
  FOR SELECT USING (
    created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
  );

DROP POLICY IF EXISTS document_sources_insert ON document_sources;
CREATE POLICY document_sources_insert ON document_sources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
  );

DROP POLICY IF EXISTS document_sources_delete ON document_sources;
CREATE POLICY document_sources_delete ON document_sources
  FOR DELETE USING (
    created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- ============================================================
-- document_jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS document_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_source_id uuid NOT NULL REFERENCES document_sources(id) ON DELETE CASCADE,
  job_type varchar NOT NULL DEFAULT 'ai_generate',
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  result_json jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_jobs_source ON document_jobs(document_source_id);
CREATE INDEX IF NOT EXISTS idx_document_jobs_status ON document_jobs(status);

-- updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_document_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_jobs_updated_at ON document_jobs;
CREATE TRIGGER trg_document_jobs_updated_at
  BEFORE UPDATE ON document_jobs
  FOR EACH ROW EXECUTE FUNCTION update_document_jobs_updated_at();

ALTER TABLE document_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_jobs_select ON document_jobs;
CREATE POLICY document_jobs_select ON document_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_sources ds
      WHERE ds.id = document_jobs.document_source_id
        AND (
          ds.created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
          OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
        )
    )
  );

DROP POLICY IF EXISTS document_jobs_insert ON document_jobs;
CREATE POLICY document_jobs_insert ON document_jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
  );

DROP POLICY IF EXISTS document_jobs_update ON document_jobs;
CREATE POLICY document_jobs_update ON document_jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM document_sources ds
      WHERE ds.id = document_jobs.document_source_id
        AND (
          ds.created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
          OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('leader','admin','super_admin'))
        )
    )
  );
