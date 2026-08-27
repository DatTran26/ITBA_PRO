-- Manual (essay/subjective) grading: per-answer grade overlay + result grading status.

-- Grading status on results (distinct from `status`, which is the interviewer pass/fail decision).
-- Default 'graded' so all legacy rows are treated as fully graded with no backfill.
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS grading_status text NOT NULL DEFAULT 'graded'
  CHECK (grading_status IN ('pending_grading', 'graded'));

-- Overlay table: candidate response + manual grade for subjective questions.
-- is_correct: NULL = ungraded, true = Đạt (pass), false = Không đạt (fail).
CREATE TABLE IF NOT EXISTS public.answer_grades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id uuid NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  response_text text,
  is_correct boolean,
  note text,
  graded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  graded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (result_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answer_grades_result_id ON public.answer_grades(result_id);

ALTER TABLE public.answer_grades ENABLE ROW LEVEL SECURITY;

-- Insert is open (candidate submission). Submission API uses the service-role client anyway.
CREATE POLICY "answer_grades_insert_anon" ON public.answer_grades
  FOR INSERT TO public WITH CHECK (true);

-- Select / update limited to owners of the parent test (mirrors results_*_own_tests).
CREATE POLICY "answer_grades_select_own_tests" ON public.answer_grades
  FOR SELECT TO public USING (
    result_id IN (
      SELECT r.id FROM public.results r
      JOIN public.tests t ON t.id = r.test_id
      WHERE t.recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "answer_grades_update_own_tests" ON public.answer_grades
  FOR UPDATE TO public USING (
    result_id IN (
      SELECT r.id FROM public.results r
      JOIN public.tests t ON t.id = r.test_id
      WHERE t.recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );
