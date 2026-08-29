-- -----------------------------------------------------
-- TABLE: follow_up_sessions
-- Stores AI-generated follow-up interview questions
-- linked to a specific candidate result.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_up_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id uuid REFERENCES public.results(id) ON DELETE CASCADE,
  test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.follow_up_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: only the recruiter who owns the test can CRUD
CREATE POLICY "followup_insert_own" ON public.follow_up_sessions
  FOR INSERT TO public
  WITH CHECK (
    test_id IN (
      SELECT id FROM public.tests
      WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "followup_select_own" ON public.follow_up_sessions
  FOR SELECT TO public
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "followup_update_own" ON public.follow_up_sessions
  FOR UPDATE TO public
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "followup_delete_own" ON public.follow_up_sessions
  FOR DELETE TO public
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_followup_result_id ON public.follow_up_sessions(result_id);
CREATE INDEX IF NOT EXISTS idx_followup_test_id ON public.follow_up_sessions(test_id);
