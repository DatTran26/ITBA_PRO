# Phase 1 — Database + Auth Foundation

## Context Links
- Spec: `docs/ai_cv_screening_recruitment_feature_spec.md`
- Existing migrations: `supabase/migrations/`
- Auth helpers: `src/lib/api/auth-helpers.ts`
- Supabase clients: `src/lib/supabase/{server,client,admin}.ts`

## Overview
- **Priority:** P1 (blocker for all other phases)
- **Status:** pending
- **Description:** Create schema, enums, RLS policies, storage bucket, and extend auth helpers with `hr` / `interviewer` roles.

## Key Insights
- `persons` already polymorphic via `type` — extend with `source` rather than branching
- `activity_logs` + `notes` are already polymorphic; reuse for `entity_type='job_application'`
- RLS must allow `hr` to read/write only their uploaded rows; `interviewer` only sees their `interview_schedules`
- `job_descriptions` RLS: SELECT for `hr` (picker only); INSERT/UPDATE/DELETE for `interviewer | admin | super_admin`; `recruiter` has NO policy on this table
- `job_descriptions.auto_reject_threshold` nullable int — null means use global `system_settings` value (40)
- `super_admin` must NEVER lose privileges — all policies include `role IN ('admin','super_admin')` escape
- `job_applications.current_screening_id` = pointer to active screening; supports future rescoring without losing history
- `candidate_cvs.parse_status` uses UPPERCASE: `PENDING | PROCESSING | COMPLETED | FAILED`
- `candidate_cvs` tracks failure: `retry_count`, `last_error`, `processing_started_at`, `processing_finished_at`
- `candidate_screenings` logs AI audit: `ai_provider`, `ai_model`, `prompt_version`

## Requirements
**Functional**
- New enum `pipeline_status` with 12 values
- New tables: `job_applications`, `candidate_cvs`, `candidate_screenings`, `candidate_status_history`, `job_descriptions`, `interview_schedules`, `interview_results`
- `candidate_cvs`: parse_status UPPERCASE (PENDING/PROCESSING/COMPLETED/FAILED), retry_count, last_error, processing_started_at, processing_finished_at
- `job_applications`: `current_screening_id` FK → latest active screening
- `candidate_screenings`: ai_provider, ai_model, prompt_version audit fields
- Extend `users.role` enum with `hr`, `interviewer`
- Add `persons.source` (text, nullable)
- Private Storage bucket `candidate-cvs`

**Non-functional**
- Migration is idempotent (uses `IF NOT EXISTS` where possible)
- All timestamps `timestamptz DEFAULT now()`
- Indexes on FKs + `pipeline_status` + `job_application_id`

## Architecture — Key SQL

```sql
-- role extension
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'interviewer';

-- persons.source
ALTER TABLE persons ADD COLUMN IF NOT EXISTS source text
  CHECK (source IN ('test','recruitment','both'));
UPDATE persons SET source='test' WHERE type='candidate' AND source IS NULL;

-- pipeline enum
CREATE TYPE pipeline_status AS ENUM (
  'NEW','SCREENED','REJECTED','SHORTLISTED',
  'INTERVIEW_SCHEDULED','INTERVIEWED','PASSED','FAILED',
  'OFFERED','ACCEPTED','OFFER_REJECTED','ONBOARDED'
);

CREATE TABLE job_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  role_key text,
  department text,
  seniority text,
  required_skills jsonb DEFAULT '[]'::jsonb,
  full_text text NOT NULL,
  auto_reject_threshold int,   -- null = use global system_settings value
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE candidate_cvs (
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

CREATE TABLE job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  job_description_id uuid REFERENCES job_descriptions(id),
  cv_id uuid REFERENCES candidate_cvs(id),
  current_screening_id uuid,              -- FK set after INSERT on candidate_screenings
  pipeline_status pipeline_status NOT NULL DEFAULT 'NEW',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
-- current_screening_id FK added after candidate_screenings table exists:
-- ALTER TABLE job_applications ADD CONSTRAINT fk_current_screening
--   FOREIGN KEY (current_screening_id) REFERENCES candidate_screenings(id);
CREATE INDEX idx_job_apps_status ON job_applications(pipeline_status);
CREATE INDEX idx_job_apps_jd ON job_applications(job_description_id);

CREATE TABLE candidate_screenings (
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
  ai_provider text,                        -- e.g. 'openai'
  ai_model text,                           -- e.g. 'gpt-4o'
  prompt_version text,                     -- e.g. 'v1'
  screened_at timestamptz DEFAULT now()
);

CREATE TABLE candidate_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  from_status pipeline_status,
  to_status pipeline_status NOT NULL,
  changed_by uuid REFERENCES users(id),
  changed_at timestamptz DEFAULT now(),
  note text
);

CREATE TABLE interview_schedules (
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

CREATE TABLE interview_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_schedule_id uuid NOT NULL REFERENCES interview_schedules(id) ON DELETE CASCADE,
  result text NOT NULL CHECK (result IN ('pass','fail')),
  note text,
  submitted_at timestamptz DEFAULT now(),
  submitted_by uuid REFERENCES users(id)
);
```

## Related Code Files
**Create**
- `supabase/migrations/<NN>_recruitment_schema.sql`
- `supabase/migrations/<NN+1>_recruitment_rls.sql`
- `supabase/migrations/<NN+2>_recruitment_storage.sql`

**Modify**
- `src/lib/api/auth-helpers.ts` — add `isHr`, `isInterviewer` to `AuthContext`
- Any file matching `isAdmin &&` where `hr`/`interviewer` should also pass (Grep-driven)

## Implementation Steps
1. Write migration 1 (schema + enum + persons.source backfill)
2. Write migration 2 (RLS policies — enable RLS on all 7 new tables)
3. Write migration 3 (Storage bucket `candidate-cvs` private + policy)
4. Extend `AuthContext` type + `getAuthContext()` to compute `isHr`, `isInterviewer`
5. Grep `isAdmin` usages in `src/app/api/**` and `src/components/**`; update role guards where `hr`/`interviewer` need access
6. Regenerate Supabase TS types (`supabase gen types`)
7. Smoke-test: seed one `hr` user, one `interviewer` user via SQL

## Todo
- [ ] Migration: schema
- [ ] Migration: RLS
- [ ] Migration: storage bucket + policy
- [ ] AuthContext extension
- [ ] Role-check audit & updates
- [ ] Regenerated types committed
- [ ] Manual role smoke test

## Success Criteria
- `supabase db reset` runs all migrations clean
- `select unnest(enum_range(NULL::user_role))` returns hr + interviewer
- RLS: hr user cannot read another hr user's applications (except admin escape)
- Bucket `candidate-cvs` exists and is private

## Risk Assessment
- **Risk:** Adding to existing enum requires committed transaction before use — split migration if needed.
- **Risk:** Broken role checks elsewhere. **Mitigation:** grep audit step.
- **Risk:** Backfill `source` on large `persons` table. **Mitigation:** filter by `type='candidate'`.

## Security Considerations
- RLS mandatory on all new tables
- `super_admin` escape clause in every policy
- Storage bucket private; access only via signed URLs issued by server-side API
- Never expose service-role key to client

## Next Steps
- Phase 2: Edge Function + upload API consumes schema
