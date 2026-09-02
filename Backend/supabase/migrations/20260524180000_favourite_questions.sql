-- Live itba-ai favourite_questions (dashboard). Curated copies from question_bank.

CREATE TABLE IF NOT EXISTS public.favourite_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_bank_id uuid REFERENCES public.question_bank(id) ON DELETE SET NULL,
  department varchar,
  level varchar NOT NULL CHECK (level IN ('junior', 'middle', 'senior')),
  question_text text NOT NULL,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer char CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation text,
  points integer NOT NULL DEFAULT 1,
  time_limit integer NOT NULL DEFAULT 60,
  question_type varchar NOT NULL DEFAULT 'mcq',
  answer_payload jsonb,
  metadata jsonb,
  grading_mode varchar NOT NULL DEFAULT 'auto',
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.favourite_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS favourite_questions_select ON public.favourite_questions;
CREATE POLICY favourite_questions_select ON public.favourite_questions
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS favourite_questions_insert ON public.favourite_questions;
CREATE POLICY favourite_questions_insert ON public.favourite_questions
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role IN ('leader', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS favourite_questions_update ON public.favourite_questions;
CREATE POLICY favourite_questions_update ON public.favourite_questions
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role IN ('leader', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS favourite_questions_delete ON public.favourite_questions;
CREATE POLICY favourite_questions_delete ON public.favourite_questions
  FOR DELETE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role IN ('leader', 'admin', 'super_admin')
    )
  );
