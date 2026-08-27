-- Add interviewer acceptance columns to interview_schedules
ALTER TABLE interview_schedules
  ADD COLUMN IF NOT EXISTS interviewer_status text DEFAULT 'accepted'
    CHECK (interviewer_status IN ('pending','accepted','declined','reschedule_requested')),
  ADD COLUMN IF NOT EXISTS interviewer_proposed_at timestamptz,
  ADD COLUMN IF NOT EXISTS interviewer_note text;

-- Index for pending lookup (used in notification polling)
CREATE INDEX IF NOT EXISTS idx_interview_schedules_interviewer_status
  ON interview_schedules(interviewer_id, interviewer_status);

-- RLS: Interviewers can read their own schedules
CREATE POLICY "Interviewers can read own schedules"
  ON interview_schedules FOR SELECT
  USING (interviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
