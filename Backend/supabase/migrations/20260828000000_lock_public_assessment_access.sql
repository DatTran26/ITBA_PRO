-- Lock public assessment access: tests, answer keys, and candidate PII
-- are no longer readable (or insertable) by anon via PostgREST.
-- Public take-test / submit flows go through the Next.js BFF with the
-- service role after share_token, window, unique-attempt, and size checks.

-- -----------------------------------------------------
-- Helpers
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role(), '') IN (
    'admin', 'super_admin', 'hr', 'interviewer', 'recruiter', 'leader'
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_internal_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_internal_user() TO authenticated;

-- -----------------------------------------------------
-- tests: drop public-read; staff/owner only
-- -----------------------------------------------------
DROP POLICY IF EXISTS "tests_select_by_token" ON public.tests;
DROP POLICY IF EXISTS "tests_select_own" ON public.tests;

CREATE POLICY "tests_select_internal" ON public.tests
  FOR SELECT TO authenticated
  USING (public.is_internal_user());

CREATE POLICY "tests_update_internal" ON public.tests
  FOR UPDATE TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

CREATE POLICY "tests_delete_internal" ON public.tests
  FOR DELETE TO authenticated
  USING (public.is_internal_user());

-- -----------------------------------------------------
-- questions: drop public-read (this leaked correct_answer)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "questions_select" ON public.questions;

CREATE POLICY "questions_select_internal" ON public.questions
  FOR SELECT TO authenticated
  USING (public.is_internal_user());

-- -----------------------------------------------------
-- results: drop public-read/insert (PII + scores)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "results_insert_anon" ON public.results;
DROP POLICY IF EXISTS "results_select_own" ON public.results;
DROP POLICY IF EXISTS "results_select_own_tests" ON public.results;
DROP POLICY IF EXISTS "results_update_own_tests" ON public.results;

CREATE POLICY "results_select_internal" ON public.results
  FOR SELECT TO authenticated
  USING (public.is_internal_user());

CREATE POLICY "results_update_internal" ON public.results
  FOR UPDATE TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- -----------------------------------------------------
-- answer_grades: no public insert
-- -----------------------------------------------------
DROP POLICY IF EXISTS "answer_grades_insert_anon" ON public.answer_grades;

CREATE POLICY "answer_grades_select_internal" ON public.answer_grades
  FOR SELECT TO authenticated
  USING (public.is_internal_user());

DROP POLICY IF EXISTS "answer_grades_select_own_tests" ON public.answer_grades;
DROP POLICY IF EXISTS "answer_grades_update_own_tests" ON public.answer_grades;

CREATE POLICY "answer_grades_update_internal" ON public.answer_grades
  FOR UPDATE TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- -----------------------------------------------------
-- notes: drop anon read-all
-- -----------------------------------------------------
DROP POLICY IF EXISTS "public can read notes" ON public.notes;

CREATE POLICY "notes_select_internal" ON public.notes
  FOR SELECT TO authenticated
  USING (public.is_internal_user());

-- -----------------------------------------------------
-- system_settings: hide secrets from PostgREST
-- openai_api_key is only readable via service role.
-- -----------------------------------------------------
DROP POLICY IF EXISTS "settings_select_all" ON public.system_settings;

CREATE POLICY "settings_select_internal" ON public.system_settings
  FOR SELECT TO authenticated
  USING (
    public.is_internal_user()
    AND key <> 'openai_api_key'
  );

-- -----------------------------------------------------
-- One attempt per email per test (replay protection)
-- -----------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS results_one_attempt_per_email
  ON public.results (test_id, (lower(btrim(candidate_email))))
  WHERE candidate_email IS NOT NULL AND btrim(candidate_email) <> '';

-- -----------------------------------------------------
-- Enforce window + capacity before insert (even for service role)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_result_submission_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  t public.tests%ROWTYPE;
  cnt integer;
BEGIN
  SELECT * INTO t FROM public.tests WHERE id = NEW.test_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'test_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF COALESCE(t.status, '') IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'test_closed' USING ERRCODE = 'P0001';
  END IF;

  IF t.start_time IS NOT NULL AND now() < t.start_time THEN
    RAISE EXCEPTION 'test_not_started' USING ERRCODE = 'P0001';
  END IF;

  IF t.expires_at IS NOT NULL AND now() > t.expires_at THEN
    RAISE EXCEPTION 'test_expired' USING ERRCODE = 'P0001';
  END IF;

  IF t.max_participants IS NOT NULL THEN
    SELECT count(*) INTO cnt FROM public.results WHERE test_id = NEW.test_id;
    IF cnt >= t.max_participants THEN
      RAISE EXCEPTION 'test_full' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_result_submission_rules ON public.results;
CREATE TRIGGER trg_enforce_result_submission_rules
  BEFORE INSERT ON public.results
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_result_submission_rules();
