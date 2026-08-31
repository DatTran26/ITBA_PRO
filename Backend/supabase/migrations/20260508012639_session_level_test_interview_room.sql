-- Session-level test and interviewer acceptance for Interview Room

ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_interview_sessions_test
  ON interview_sessions(test_id);

CREATE TABLE IF NOT EXISTS interview_session_interviewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  interviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined')),
  note text,
  responded_at timestamptz,
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, interviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_interview_session_interviewers_session
  ON interview_session_interviewers(session_id);

CREATE INDEX IF NOT EXISTS idx_interview_session_interviewers_interviewer_status
  ON interview_session_interviewers(interviewer_id, status);

ALTER TABLE interview_session_interviewers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interview_session_interviewers_select ON interview_session_interviewers;
CREATE POLICY interview_session_interviewers_select ON interview_session_interviewers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('hr','admin','super_admin'))
    OR interviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS interview_session_interviewers_insert ON interview_session_interviewers;
CREATE POLICY interview_session_interviewers_insert ON interview_session_interviewers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('hr','admin','super_admin'))
  );

DROP POLICY IF EXISTS interview_session_interviewers_update ON interview_session_interviewers;
CREATE POLICY interview_session_interviewers_update ON interview_session_interviewers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('hr','admin','super_admin'))
    OR interviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

INSERT INTO interview_session_interviewers (session_id, interviewer_id, status, responded_at, assigned_by, assigned_at)
SELECT DISTINCT
  session_id,
  interviewer_id,
  CASE WHEN interviewer_status = 'accepted' THEN 'accepted'
       WHEN interviewer_status = 'declined' THEN 'declined'
       ELSE 'pending'
  END,
  CASE WHEN interviewer_status IN ('accepted','declined') THEN now() ELSE NULL END,
  created_by,
  COALESCE(created_at, now())
FROM interview_schedules
WHERE session_id IS NOT NULL
  AND interviewer_id IS NOT NULL
ON CONFLICT (session_id, interviewer_id) DO NOTHING;
