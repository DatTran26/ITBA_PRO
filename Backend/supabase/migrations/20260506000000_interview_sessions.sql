-- Parent table referenced by 20260508012639_session_level_test_interview_room.
-- Matches live itba-ai (dashboard + later ALTER columns).

CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description_id uuid REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
  round smallint NOT NULL CHECK (round = ANY (ARRAY[1, 2, 3])),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  location_type text NOT NULL DEFAULT 'online'
    CHECK (location_type = ANY (ARRAY['online'::text, 'office'::text, 'phone'::text])),
  location_detail text,
  recruiter_note text,
  notification_sent_at timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  recording_url text,
  transcript text,
  ai_summary text
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hr_admin_manage_sessions ON public.interview_sessions;
CREATE POLICY hr_admin_manage_sessions ON public.interview_sessions
  FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid()
        AND u.role IN ('hr', 'admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_interview_sessions_jd
  ON public.interview_sessions(job_description_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_test
  ON public.interview_sessions(test_id);

ALTER TABLE public.interview_schedules
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.interview_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_interview_schedules_session
  ON public.interview_schedules(session_id);
