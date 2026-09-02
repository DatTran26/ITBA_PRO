---
phase: 1
title: "Foundation: Leader Role, DB Schema, Storage"
status: pending
priority: P1
effort: "1–2d"
dependencies: []
---

# Phase 1: Foundation

## Context Links
- Brainstorm: `plans/reports/brainstorm-260513-phase4-question-bank.md`
- Role plan: `plans/260421-1241-role-permissions/`
- Auth helpers: `src/lib/api/auth-helpers.ts`
- Latest migration: `supabase/migrations/20260508012639_session_level_test_interview_room.sql`

## Overview
Create all DB infrastructure and role configuration that every subsequent phase depends on. No UI work — pure backend foundation.

## Requirements
- Functional:
  - Add `leader` role to `users` table (varchar, no enum change needed)
  - Create `question_bank`, `document_sources`, `document_jobs` tables
  - Create Supabase Storage bucket `document-sources` for file uploads
  - RLS: leader/admin write on `question_bank`; recruiter/hr read-only
  - `isLeader` flag in `AuthContext`
- Non-functional:
  - Migration must be backward-compatible (no changes to existing tables)
  - RLS must not break existing recruiter/hr/admin queries

## Architecture
```
users.role VARCHAR — add 'leader' as valid value (no constraint change needed)

question_bank
  id uuid PK
  question_text text NOT NULL
  question_hash varchar(64) NOT NULL UNIQUE  -- SHA-256 of question_text
  option_a text NOT NULL
  option_b text NOT NULL
  option_c text NOT NULL
  option_d text NOT NULL
  correct_answer char(1) CHECK (correct_answer IN ('a','b','c','d'))
  explanation text
  points integer DEFAULT 1
  time_limit integer DEFAULT 60  -- seconds
  level varchar CHECK (level IN ('junior','middle','senior'))
  topic_tag varchar
  created_by uuid REFERENCES users(id)
  created_at timestamptz DEFAULT now()

document_sources
  id uuid PK
  file_name varchar
  file_url text            -- Supabase Storage URL
  format varchar CHECK (format IN ('pdf','docx','txt','url'))
  source_url text          -- original URL if format='url'
  status varchar DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed'))
  created_by uuid REFERENCES users(id)
  created_at timestamptz DEFAULT now()

document_jobs
  id uuid PK
  document_source_id uuid REFERENCES document_sources(id) ON DELETE CASCADE
  job_type varchar DEFAULT 'ai_generate'
  status varchar DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed'))
  result_json jsonb         -- AI-generated questions array
  error_message text
  created_at timestamptz DEFAULT now()
  updated_at timestamptz DEFAULT now()
```

## Related Code Files
- Create: `supabase/migrations/20260513000000_question_bank_foundation.sql`
- Modify: `src/lib/api/auth-helpers.ts` — add `isLeader` flag

## Implementation Steps

1. **Write migration** `supabase/migrations/20260513000000_question_bank_foundation.sql`:
   - Create `question_bank` table with all columns + indexes
   - Create `document_sources` table
   - Create `document_jobs` table with `updated_at` trigger
   - Enable RLS on all three tables
   - RLS `question_bank`:
     - SELECT: all authenticated users
     - INSERT/UPDATE/DELETE: `role IN ('leader','admin','super_admin')`
   - RLS `document_sources`:
     - SELECT: `created_by = auth_user_id OR role IN ('admin','super_admin','leader')`
     - INSERT: `role IN ('leader','admin','super_admin')`
     - DELETE: `created_by = auth_user_id OR role IN ('admin','super_admin')`
   - RLS `document_jobs`:
     - SELECT/UPDATE: match `document_sources.created_by` or admin/leader
   - Storage bucket `document-sources` (private, 50MB limit per file)

2. **Apply migration** via Supabase MCP or CLI

3. **Update `src/lib/api/auth-helpers.ts`**:
   - Add `isLeader: boolean` to `AuthContext` interface
   - Add `isLeader: role === "leader"` in `getAuthContext()` return

4. **Verify** with a quick SQL check that tables exist and RLS is active

## Todo List
- [ ] Write migration SQL file
- [ ] Apply migration to Supabase
- [ ] Add `isLeader` to `AuthContext` + `getAuthContext()`
- [ ] Verify tables and RLS with `supabase/mcp list_tables`

## Success Criteria
- [ ] All 3 tables exist in Supabase with correct columns
- [ ] RLS enabled — leader/admin can insert to `question_bank`, recruiter cannot
- [ ] `auth-helpers.ts` compiles; `isLeader` available in all API routes
- [ ] Storage bucket `document-sources` created

## Risk Assessment
- **Role constraint**: `users.role` is `varchar` with no CHECK constraint — adding `leader` requires no migration change to the column itself, only RLS policies use the value
- **Migration order**: Must run before Phase 2/3/4 migrations

## Security Considerations
- RLS on all 3 new tables — never expose unprotected
- Storage bucket must be private; signed URLs for upload/download
- `question_hash` uniqueness enforced at DB level to prevent duplicate injection

## Next Steps
- After Phase 1: Phase 2 (Manual Input) and Phase 3 (AI Pipeline) can start in parallel
