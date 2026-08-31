-- 1. Extend user_role enum with 'hr' and 'interviewer'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'interviewer';

-- 2. Add persons.source column + backfill
ALTER TABLE persons ADD COLUMN IF NOT EXISTS source text
  CHECK (source IN ('test','recruitment','both'));
UPDATE persons SET source = 'test' WHERE type = 'candidate' AND source IS NULL;

-- 3. Create pipeline_status enum
CREATE TYPE pipeline_status AS ENUM (
  'NEW','SCREENED','REJECTED','SHORTLISTED',
  'INTERVIEW_SCHEDULED','INTERVIEWED','PASSED','FAILED',
  'OFFERED','ACCEPTED','OFFER_REJECTED','ONBOARDED'
);

-- 4. Create job_descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  role_key text,
  department text,
  seniority text,
  required_skills jsonb DEFAULT '[]'::jsonb,
  full_text text NOT NULL,
  auto_reject_threshold int CHECK (auto_reject_threshold BETWEEN 0 AND 100),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- 5. Create candidate_cvs table
CREATE TABLE IF NOT EXISTS candidate_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  parse_status text NOT NULL DEFAULT 'PENDING'
    CHECK (parse_status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
  detected_language text,
  retry_count int NOT NULL DEFAULT 0,
  last_error text,
  processing_started_at timestamptz,
  processing_finished_at timestamptz,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now()
);

-- 6. Create job_applications table (current_screening_id FK added later)
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  job_description_id uuid REFERENCES job_descriptions(id),
  cv_id uuid REFERENCES candidate_cvs(id),
  current_screening_id uuid, -- FK constraint added after candidate_screenings
  pipeline_status pipeline_status NOT NULL DEFAULT 'NEW',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_apps_status ON job_applications(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_job_apps_jd ON job_applications(job_description_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_person ON job_applications(person_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_created ON job_applications(created_at DESC);

-- 7. Create candidate_screenings table
CREATE TABLE IF NOT EXISTS candidate_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  ai_score numeric(5,2),
  final_score numeric(5,2),
  skill_match_score numeric(5,2),
  experience_match_score numeric(5,2),
  domain_match_score numeric(5,2),
  strengths_json jsonb,
  weaknesses_json jsonb,
  parsed_cv_json jsonb,
  is_overridden boolean DEFAULT false,
  override_reason text,
  overridden_by uuid REFERENCES users(id),
  overridden_at timestamptz,
  ai_provider text,
  ai_model text,
  prompt_version text,
  screened_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_screenings_application ON candidate_screenings(job_application_id);

-- 8. Add FK from job_applications.current_screening_id → candidate_screenings
ALTER TABLE job_applications
  ADD CONSTRAINT fk_current_screening
  FOREIGN KEY (current_screening_id) REFERENCES candidate_screenings(id);

-- 9. Create candidate_status_history table
CREATE TABLE IF NOT EXISTS candidate_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  from_status pipeline_status,
  to_status pipeline_status NOT NULL,
  changed_by uuid REFERENCES users(id),
  changed_at timestamptz DEFAULT now(),
  note text
);
CREATE INDEX IF NOT EXISTS idx_status_history_application ON candidate_status_history(job_application_id);

-- 10. Create interview_schedules table
CREATE TABLE IF NOT EXISTS interview_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  interviewer_id uuid NOT NULL REFERENCES users(id),
  scheduled_at timestamptz NOT NULL,
  timezone text DEFAULT 'Asia/Ho_Chi_Minh',
  recruiter_note text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application ON interview_schedules(job_application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_interviewer ON interview_schedules(interviewer_id);

-- 11. Create interview_results table (unique per schedule)
CREATE TABLE IF NOT EXISTS interview_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_schedule_id uuid NOT NULL REFERENCES interview_schedules(id) ON DELETE CASCADE,
  result text NOT NULL CHECK (result IN ('pass','fail')),
  note text,
  submitted_at timestamptz DEFAULT now(),
  submitted_by uuid REFERENCES users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_interview_result ON interview_results(interview_schedule_id);
