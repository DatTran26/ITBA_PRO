-- Allow interview slots to be created without an assigned interviewer
-- Enables self-select flow: HR posts open slot, interviewer claims it
ALTER TABLE interview_schedules ALTER COLUMN interviewer_id DROP NOT NULL;

-- Index for unassigned slot lookup (used by interviewer self-select)
CREATE INDEX IF NOT EXISTS idx_interview_schedules_unassigned
  ON interview_schedules(status, interviewer_id)
  WHERE interviewer_id IS NULL;
