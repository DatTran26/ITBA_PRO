-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- TABLE: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id uuid UNIQUE,
  email varchar UNIQUE NOT NULL,
  name varchar,
  role varchar DEFAULT 'recruiter',
  force_password_change boolean DEFAULT false, -- Added for security flow
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "users_insert_own" ON public.users FOR INSERT TO public WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "users_select_own" ON public.users FOR SELECT TO public USING (auth.uid() = auth_id);

-- -----------------------------------------------------
-- TABLE: tests
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  job_role varchar,
  level varchar,
  share_token varchar UNIQUE,
  status varchar DEFAULT 'active',
  time_limit_minutes int4 DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  question_count int4 DEFAULT 10,
  max_participants int4,
  start_time timestamptz,
  job_description text,
  test_description text
);

-- Enable RLS
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Policies for tests
CREATE POLICY "tests_insert_own" ON public.tests FOR INSERT TO public WITH CHECK (recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "tests_select_by_token" ON public.tests FOR SELECT TO public USING (true);
CREATE POLICY "tests_select_own" ON public.tests FOR SELECT TO public USING (recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- -----------------------------------------------------
-- TABLE: questions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text text,
  options jsonb,
  correct_answer int4,
  topic varchar,
  difficulty varchar,
  explanation text,
  order_num int4 DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policies for questions
CREATE POLICY "questions_insert" ON public.questions FOR INSERT TO public WITH CHECK (test_id IN (SELECT id FROM public.tests WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));
CREATE POLICY "questions_select" ON public.questions FOR SELECT TO public USING (true);

-- -----------------------------------------------------
-- TABLE: results
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  candidate_name varchar,
  candidate_email varchar,
  answers jsonb,
  score int4 DEFAULT 0,
  total_questions int4 DEFAULT 0,
  time_taken int4,
  ai_analysis jsonb,
  suggested_questions jsonb,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Policies for results
CREATE POLICY "results_insert_anon" ON public.results FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "results_select_own" ON public.results FOR SELECT TO public USING (true);
CREATE POLICY "results_select_own_tests" ON public.results FOR SELECT TO public USING (test_id IN (SELECT id FROM public.tests WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));
CREATE POLICY "results_update_own_tests" ON public.results FOR UPDATE TO public USING (test_id IN (SELECT id FROM public.tests WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

-- -----------------------------------------------------
-- TABLE: notes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policies for notes
CREATE POLICY "public can read notes" ON public.notes FOR SELECT TO anon USING (true);

-- -----------------------------------------------------
-- INDEXES for Performance
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_tests_recruiter_id ON public.tests(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_tests_share_token ON public.tests(share_token);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON public.questions(test_id);
CREATE INDEX IF NOT EXISTS idx_results_test_id ON public.results(test_id);
