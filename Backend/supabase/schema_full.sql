-- ==============================================================================
-- TOWN HOWN / ITBAAI - COMPLETE BOOTSTRAP DATABASE SCHEMA
-- This script contains all tables, indexes, RLS policies, RPCs and storage setup.
-- Run this directly in Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. USERS & ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id uuid UNIQUE,
  email varchar UNIQUE NOT NULL,
  name varchar,
  role varchar DEFAULT 'recruiter', -- 'super_admin', 'admin', 'hr', 'interviewer', 'recruiter', 'leader', 'candidate'
  force_password_change boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users FOR INSERT TO public WITH CHECK (auth.uid() = auth_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO public USING (auth.uid() = auth_id OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ------------------------------------------------------------------------------
-- 3. ASSESSMENT: TESTS, QUESTIONS, RESULTS, NOTES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title varchar,
  job_role varchar,
  level varchar,
  share_token varchar UNIQUE,
  status varchar DEFAULT 'active',
  time_limit_minutes int4 DEFAULT 15,
  question_count int4 DEFAULT 10,
  max_participants int4,
  start_time timestamptz,
  job_description text,
  test_description text,
  target_type varchar DEFAULT 'candidate',
  position_id uuid,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tests_insert_own" ON public.tests;
CREATE POLICY "tests_insert_own" ON public.tests FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "tests_select_all" ON public.tests;
CREATE POLICY "tests_select_all" ON public.tests FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "tests_update_own" ON public.tests;
CREATE POLICY "tests_update_own" ON public.tests FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "tests_delete_own" ON public.tests;
CREATE POLICY "tests_delete_own" ON public.tests FOR DELETE TO public USING (true);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type varchar DEFAULT 'multiple_choice',
  options jsonb DEFAULT '[]'::jsonb,
  correct_answer varchar,
  explanation text,
  difficulty_level varchar DEFAULT 'Junior',
  topic_tag varchar,
  skill_id uuid,
  source_reference text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions_select_all" ON public.questions;
CREATE POLICY "questions_select_all" ON public.questions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "questions_insert_all" ON public.questions;
CREATE POLICY "questions_insert_all" ON public.questions FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "questions_update_all" ON public.questions;
CREATE POLICY "questions_update_all" ON public.questions FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "questions_delete_all" ON public.questions;
CREATE POLICY "questions_delete_all" ON public.questions FOR DELETE TO public USING (true);

CREATE TABLE IF NOT EXISTS public.answer_grades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id uuid REFERENCES public.results(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  is_correct boolean NOT NULL,
  feedback text,
  graded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  graded_at timestamptz DEFAULT now(),
  UNIQUE(result_id, question_id)
);

ALTER TABLE public.answer_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answer_grades_all" ON public.answer_grades FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type varchar NOT NULL, -- 'result', 'person', 'candidate', 'job_application', etc.
  entity_id uuid NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_all" ON public.notes FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.follow_up_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id uuid REFERENCES public.results(id) ON DELETE CASCADE,
  interviewer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  questions jsonb DEFAULT '[]'::jsonb,
  evaluation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.follow_up_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_up_sessions_all" ON public.follow_up_sessions FOR ALL TO public USING (true);

-- ------------------------------------------------------------------------------
-- 4. TALENT & CRM: PERSONS, POSITIONS, SKILLS, GROUPS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar NOT NULL,
  department varchar,
  description text,
  level_expectations jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "positions_all" ON public.positions FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.persons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar,
  full_name varchar,
  email varchar UNIQUE,
  phone varchar,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  current_level varchar DEFAULT 'Junior',
  status varchar DEFAULT 'active',
  source text,
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "persons_all" ON public.persons FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  candidate_name varchar,
  candidate_email varchar,
  person_id uuid REFERENCES public.persons(id) ON DELETE SET NULL,
  score int4 DEFAULT 0,
  total_questions int4 DEFAULT 0,
  answers jsonb DEFAULT '[]'::jsonb,
  ai_analysis text,
  recruiter_note text,
  status varchar DEFAULT 'pending',
  grading_status varchar DEFAULT 'graded',
  manual_score int4 DEFAULT 0,
  auto_score int4 DEFAULT 0,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "results_all" ON public.results FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.skill_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL UNIQUE,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_categories_all" ON public.skill_categories FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL UNIQUE,
  category_id uuid REFERENCES public.skill_categories(id) ON DELETE SET NULL,
  category varchar DEFAULT 'Technical',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_all" ON public.skills FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.position_skill_requirements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id uuid REFERENCES public.positions(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
  required_level int4 DEFAULT 1, -- 1..5
  is_mandatory boolean DEFAULT true,
  weight numeric(3, 2) DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(position_id, skill_id)
);

ALTER TABLE public.position_skill_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "position_skill_requirements_all" ON public.position_skill_requirements FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.level_skill_expectations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
  level varchar NOT NULL,
  expected_score numeric(4, 2) NOT NULL DEFAULT 5.0,
  criteria text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(skill_id, level)
);

ALTER TABLE public.level_skill_expectations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_skill_expectations_all" ON public.level_skill_expectations FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.person_skills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid REFERENCES public.persons(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
  assessed_level int4 DEFAULT 1,
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(person_id, skill_id)
);

ALTER TABLE public.person_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "person_skills_all" ON public.person_skills FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL,
  description text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_all" ON public.groups FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  person_id uuid REFERENCES public.persons(id) ON DELETE CASCADE,
  role varchar DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, person_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_members_all" ON public.group_members FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.skill_evaluations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid REFERENCES public.persons(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
  result_id uuid REFERENCES public.results(id) ON DELETE SET NULL,
  score numeric(4, 2) NOT NULL,
  confidence numeric(3, 2) DEFAULT 1.0,
  evaluation_date timestamptz DEFAULT now(),
  source varchar DEFAULT 'test_result',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skill_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_evaluations_all" ON public.skill_evaluations FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type varchar NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action varchar NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_all" ON public.activity_logs FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL UNIQUE,
  color varchar DEFAULT '#7C8FFF',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_all" ON public.tags FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.entity_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type varchar NOT NULL,
  entity_id uuid NOT NULL,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id, tag_id)
);

ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_tags_all" ON public.entity_tags FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type varchar NOT NULL,
  entity_id uuid NOT NULL,
  title varchar NOT NULL,
  description text,
  assignee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status varchar DEFAULT 'pending',
  due_date timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_tasks_all" ON public.crm_tasks FOR ALL TO public USING (true);

-- ------------------------------------------------------------------------------
-- 5. PLATFORM: SYSTEM SETTINGS, VERSIONS, AI USAGE, TEMPLATES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key varchar NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '""'::jsonb,
  category varchar NOT NULL DEFAULT 'general',
  label varchar NOT NULL,
  description text,
  input_type varchar NOT NULL DEFAULT 'text',
  options jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_all" ON public.system_settings FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_number varchar NOT NULL UNIQUE,
  title varchar NOT NULL,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  category varchar DEFAULT 'platform',
  status varchar DEFAULT 'approved' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ui_changes text,
  ux_changes text,
  bug_fixes text,
  is_critical boolean DEFAULT false,
  scheduled_at timestamptz,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versions_all" ON public.versions FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.user_version_reads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.versions(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(user_id, version_id)
);

ALTER TABLE public.user_version_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_version_reads_all" ON public.user_version_reads FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  feature varchar NOT NULL,
  model varchar NOT NULL DEFAULT 'gpt-4o',
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  cost_estimate numeric(10, 6) NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_all" ON public.ai_usage FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.assessment_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL,
  description text,
  job_role varchar NOT NULL,
  level varchar NOT NULL DEFAULT 'Junior',
  question_count integer NOT NULL DEFAULT 10,
  time_limit integer NOT NULL DEFAULT 30,
  target_type varchar NOT NULL DEFAULT 'candidate',
  job_description text,
  test_description text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessment_templates_all" ON public.assessment_templates FOR ALL TO public USING (true);

-- ------------------------------------------------------------------------------
-- 6. RECRUITMENT: JDS, CVS, APPLICATIONS, INTERVIEWS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_descriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar NOT NULL,
  role_key varchar,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  department varchar,
  seniority varchar DEFAULT 'mid',
  experience_level varchar DEFAULT 'Mid',
  location varchar,
  description text,
  full_text text,
  requirements text,
  responsibilities text,
  min_salary numeric(12, 2),
  max_salary numeric(12, 2),
  screening_threshold numeric(4, 1) DEFAULT 60.0,
  auto_reject_threshold int4 DEFAULT 60,
  required_skills jsonb DEFAULT '[]'::jsonb,
  skills jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  status varchar DEFAULT 'open',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_descriptions_all" ON public.job_descriptions FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.candidate_cvs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id uuid REFERENCES public.persons(id) ON DELETE SET NULL,
  file_name varchar,
  original_filename varchar,
  storage_path varchar NOT NULL,
  file_size integer,
  mime_type varchar,
  raw_text text,
  parsed_info jsonb DEFAULT '{}'::jsonb,
  parse_status varchar DEFAULT 'COMPLETED',
  parse_error text,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE public.candidate_cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidate_cvs_all" ON public.candidate_cvs FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.candidate_screenings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cv_id uuid REFERENCES public.candidate_cvs(id) ON DELETE CASCADE,
  jd_id uuid REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
  ai_score numeric(4, 1) DEFAULT 0,
  final_score numeric(4, 1) DEFAULT 0,
  score_breakdown jsonb DEFAULT '{}'::jsonb,
  recommendation varchar DEFAULT 'PENDING',
  summary text,
  strengths text,
  weaknesses text,
  strengths_json jsonb DEFAULT '[]'::jsonb,
  weaknesses_json jsonb DEFAULT '[]'::jsonb,
  is_overridden boolean DEFAULT false,
  hr_override_score numeric(4, 1),
  hr_override_reason text,
  hr_override_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  screened_at timestamptz DEFAULT now()
);

ALTER TABLE public.candidate_screenings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidate_screenings_all" ON public.candidate_screenings FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id uuid REFERENCES public.persons(id) ON DELETE CASCADE,
  job_description_id uuid REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  cv_id uuid REFERENCES public.candidate_cvs(id) ON DELETE SET NULL,
  current_screening_id uuid,
  pipeline_status varchar NOT NULL DEFAULT 'NEW',
  rejection_reason text,
  offer_salary numeric(12, 2),
  offer_start_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_current_screening FOREIGN KEY (current_screening_id) REFERENCES public.candidate_screenings(id) ON DELETE SET NULL
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_applications_all" ON public.job_applications FOR ALL TO public USING (true);
CREATE POLICY "job_applications_all" ON public.job_applications FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.candidate_status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid REFERENCES public.job_applications(id) ON DELETE CASCADE,
  from_status varchar,
  to_status varchar NOT NULL,
  note text,
  changed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.candidate_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidate_status_history_all" ON public.candidate_status_history FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_description_id uuid REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
  round integer NOT NULL DEFAULT 1,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  location_type varchar DEFAULT 'online',
  location_detail text,
  recruiter_note text,
  notification_sent_at timestamptz,
  test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  recording_url text,
  transcript text,
  ai_summary text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interview_sessions_all" ON public.interview_sessions FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.interview_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid REFERENCES public.job_applications(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.interview_sessions(id) ON DELETE SET NULL,
  round integer NOT NULL DEFAULT 1,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  location_type varchar DEFAULT 'online',
  location_detail text,
  interviewer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  candidate_confirmation varchar DEFAULT 'pending',
  interviewer_status varchar DEFAULT 'pending',
  interviewer_note text,
  interviewer_responded_at timestamptz,
  status varchar DEFAULT 'scheduled',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interview_schedules_all" ON public.interview_schedules FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.interview_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id uuid REFERENCES public.interview_schedules(id) ON DELETE CASCADE,
  interviewer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  passed boolean,
  feedback text,
  technical_score int4,
  soft_skills_score int4,
  overall_score int4,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interview_results_all" ON public.interview_results FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.interview_session_interviewers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  note text,
  responded_at timestamptz,
  assigned_by uuid REFERENCES public.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, interviewer_id)
);

ALTER TABLE public.interview_session_interviewers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interview_session_interviewers_all" ON public.interview_session_interviewers FOR ALL TO public USING (true);

-- ------------------------------------------------------------------------------
-- 7. EMAIL SYSTEM
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_provider_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  provider_type varchar NOT NULL DEFAULT 'gmail_smtp'
    CHECK (provider_type IN ('gmail_smtp', 'resend')),
  sender_email varchar NOT NULL DEFAULT '',
  sender_name varchar NOT NULL DEFAULT '',
  smtp_host varchar,
  smtp_port int DEFAULT 465,
  smtp_username varchar,
  smtp_password_encrypted bytea,
  min_interval_seconds int DEFAULT 60,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_provider_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_provider_config_all" ON public.email_provider_config FOR ALL TO public USING (true);

INSERT INTO public.email_provider_config (enabled, provider_type, sender_email, sender_name)
VALUES (false, 'gmail_smtp', '', '')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(plaintext text, master_key text)
RETURNS bytea LANGUAGE sql SECURITY DEFINER AS $$
  SELECT pgp_sym_encrypt(plaintext, master_key);
$$;

CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(master_key text)
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT pgp_sym_decrypt(smtp_password_encrypted, master_key)::text
  FROM public.email_provider_config
  WHERE smtp_password_encrypted IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.encrypt_smtp_password(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.decrypt_smtp_password(text) TO authenticated, anon;

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL UNIQUE,
  subject text NOT NULL,
  body_html text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_all" ON public.email_templates FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body_html text,
  status text NOT NULL DEFAULT 'pending', -- 'sent', 'failed'
  error_message text,
  batch_id uuid,
  sent_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_all" ON public.email_logs FOR ALL TO public USING (true);

-- ------------------------------------------------------------------------------
-- 8. KNOWLEDGE BASE & QUESTION BANK
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_bank (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text text NOT NULL,
  question_type varchar DEFAULT 'multiple_choice',
  options jsonb DEFAULT '[]'::jsonb,
  correct_answer varchar,
  explanation text,
  difficulty_level varchar DEFAULT 'junior',
  topic_tag varchar,
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  source_reference text,
  document_source_id uuid,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_bank_all" ON public.question_bank FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.favourite_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_bank_id uuid NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  organization_id uuid,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_bank_id)
);

ALTER TABLE public.favourite_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favourite_questions_all" ON public.favourite_questions FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.document_sources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar NOT NULL,
  source_type varchar NOT NULL DEFAULT 'file',
  storage_path varchar,
  file_name varchar,
  file_size integer,
  mime_type varchar,
  extracted_text text,
  status varchar DEFAULT 'pending',
  topics_extracted_at timestamptz,
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  document_id uuid,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_sources_all" ON public.document_sources FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.document_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_source_id uuid REFERENCES public.document_sources(id) ON DELETE CASCADE,
  job_type varchar NOT NULL,
  status varchar DEFAULT 'pending',
  progress int4 DEFAULT 0,
  error_message text,
  result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_jobs_all" ON public.document_jobs FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.document_topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_source_id uuid REFERENCES public.document_sources(id) ON DELETE CASCADE,
  topic_name varchar NOT NULL,
  description text,
  question_count int4 DEFAULT 0,
  difficulty_distribution jsonb DEFAULT '{"junior": 40, "middle": 40, "senior": 20}'::jsonb,
  status varchar DEFAULT 'approved',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_topics_all" ON public.document_topics FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar NOT NULL,
  file_type varchar NOT NULL,
  source_type varchar NOT NULL DEFAULT 'upload',
  storage_path varchar,
  drive_file_id varchar,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_all" ON public.documents FOR ALL TO public USING (true);

CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  provider varchar NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_oauth_tokens_all" ON public.user_oauth_tokens FOR ALL TO public USING (true);

-- ------------------------------------------------------------------------------
-- 9. RPC FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recruitment_dashboard(
  from_date timestamptz default now() - interval '30 days',
  to_date   timestamptz default now(),
  p_jd_id   uuid        default null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'totalCvsUploaded',
    (SELECT count(*) FROM candidate_cvs WHERE uploaded_at BETWEEN from_date AND to_date),

    'byStatus',
    (SELECT jsonb_object_agg(pipeline_status, cnt)
     FROM (
       SELECT pipeline_status, count(*) as cnt
       FROM job_applications
       WHERE created_at BETWEEN from_date AND to_date
         AND (p_jd_id IS NULL OR job_description_id = p_jd_id)
       GROUP BY pipeline_status
     ) s),

    'avgAiScore',
    (SELECT coalesce(round(avg(cs.ai_score)::numeric, 1), 0)
     FROM candidate_screenings cs
     JOIN job_applications ja ON ja.current_screening_id = cs.id
     WHERE ja.created_at BETWEEN from_date AND to_date
       AND (p_jd_id IS NULL OR ja.job_description_id = p_jd_id)
       AND cs.ai_score IS NOT NULL),

    'passRate',
    (SELECT case
       WHEN count(*) filter (WHERE pipeline_status IN ('INTERVIEWED','PASSED','FAILED','OFFERED','ACCEPTED','OFFER_REJECTED','ONBOARDED')) = 0 THEN 0
       ELSE round(
         count(*) filter (WHERE pipeline_status IN ('PASSED','OFFERED','ACCEPTED','ONBOARDED'))::numeric /
         count(*) filter (WHERE pipeline_status IN ('INTERVIEWED','PASSED','FAILED','OFFERED','ACCEPTED','OFFER_REJECTED','ONBOARDED')) * 100,
         1)
     END
     FROM job_applications
     WHERE created_at BETWEEN from_date AND to_date
       AND (p_jd_id IS NULL OR job_description_id = p_jd_id)),

    'offerAcceptanceRate',
    (SELECT case
       WHEN count(*) filter (WHERE pipeline_status IN ('OFFERED','ACCEPTED','OFFER_REJECTED')) = 0 THEN 0
       ELSE round(
         count(*) filter (WHERE pipeline_status IN ('ACCEPTED','ONBOARDED'))::numeric /
         count(*) filter (WHERE pipeline_status IN ('OFFERED','ACCEPTED','OFFER_REJECTED')) * 100,
         1)
     END
     FROM job_applications
     WHERE created_at BETWEEN from_date AND to_date
       AND (p_jd_id IS NULL OR job_description_id = p_jd_id)),

    'avgTimeToHireDays',
    (SELECT coalesce(round(avg(extract(epoch from (ja.updated_at - ja.created_at)) / 86400)::numeric, 1), 0)
     FROM job_applications ja
     WHERE ja.pipeline_status = 'ONBOARDED'
       AND ja.updated_at BETWEEN from_date AND to_date
       AND (p_jd_id IS NULL OR ja.job_description_id = p_jd_id))
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. DEFAULT SEED DATA
-- ------------------------------------------------------------------------------
INSERT INTO public.system_settings (key, value, category, label, description, input_type, options) VALUES
  ('ai_model', '"gpt-4o"', 'ai', 'AI Model', 'Default model for question generation', 'select', '["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gemini-2.0-flash"]'),
  ('ai_temperature', '0.7', 'ai', 'Temperature', 'AI creativity level (0-1)', 'number', null),
  ('ai_max_tokens', '4096', 'ai', 'Max Tokens', 'Maximum tokens per AI request', 'number', null),
  ('default_question_count', '10', 'assessment', 'Default Question Count', 'Default number of questions per test', 'number', null),
  ('default_time_limit', '30', 'assessment', 'Default Time Limit (min)', 'Default time limit in minutes', 'number', null),
  ('default_passing_score', '70', 'assessment', 'Passing Score (%)', 'Minimum score to pass', 'number', null)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.versions (version_number, title, description, category, status, features) VALUES
  ('v1.6.4', 'Nexus Architecture Initial Release', 'Enterprise HRMS with AI CV Screening and Assessment Platform.', 'platform', 'approved', '["Autonomous CV Screening", "AI Interview Room", "Question Bank System", "Talent Matrix"]')
ON CONFLICT (version_number) DO NOTHING;
