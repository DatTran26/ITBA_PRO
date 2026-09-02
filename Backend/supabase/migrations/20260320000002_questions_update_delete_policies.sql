-- Add missing UPDATE and DELETE RLS policies for questions table.
-- These are required for the regenerate API route:
--   - Single-question regeneration: UPDATE questions WHERE id = ?
--   - Full-test regeneration: DELETE questions WHERE test_id = ?
-- Without these policies the anon-key server client gets blocked by RLS → 500.

CREATE POLICY "questions_update_own"
  ON public.questions
  FOR UPDATE
  TO public
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE recruiter_id IN (
        SELECT id FROM public.users WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "questions_delete_own"
  ON public.questions
  FOR DELETE
  TO public
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE recruiter_id IN (
        SELECT id FROM public.users WHERE auth_id = auth.uid()
      )
    )
  );
