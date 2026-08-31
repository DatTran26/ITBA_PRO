# Phase 1: Database Schema & Migrations

## Context Links
- [Existing init schema](../../supabase/migrations/20260310000000_init_schema.sql)
- [Follow-up sessions migration](../../supabase/migrations/20260319000000_follow_up_sessions.sql)
- [Code Standards](../../docs/code-standards.md)

## Overview
- **Priority**: P1 (foundation for all other phases)
- **Status**: Pending
- **Effort**: 4h
- **Description**: Create 7 new tables, alter 2 existing tables, add RLS policies and indexes

## Key Insights
- Existing RLS pattern: ownership verified via `recruiter_id IN (SELECT id FROM users WHERE auth_id = auth.uid())`
- All PKs use `uuid_generate_v4()`; timestamps use `timestamptz DEFAULT now()`
- `persons` table must support both candidate and employee types
- `results.person_id` is nullable initially to support migration from `candidate_name`/`candidate_email`
- `tests.target_type` defaults to `'candidate'` for backward compatibility

## Requirements

### Functional
- F1: Create `persons` table with type discrimination (candidate/employee)
- F2: Create `positions` table with target level
- F3: Create `skills` table as shared library
- F4: Create `position_skill_requirements` junction table with level/mandatory/order
- F5: Create `groups` table with type enum
- F6: Create `group_members` junction table
- F7: Create `skill_evaluations` table linked to results + skills
- F8: Add `target_type`, `position_id`, `group_id` to `tests`
- F9: Add `person_id` to `results`

### Non-Functional
- NF1: All tables have RLS enabled with ownership-based policies
- NF2: Appropriate indexes on FK columns and common query paths
- NF3: CHECK constraints for enum-like columns
- NF4: ON DELETE CASCADE for dependent FKs where appropriate

## Architecture

### Entity Relationship
```
users (recruiter) --< tests --< questions
                  |        |--< results --< skill_evaluations --> skills
                  |        |       |
                  |        |       +--> persons
                  |        |
                  |        +--> positions --< position_skill_requirements --> skills
                  |        +--> groups --< group_members --> persons
                  |
                  +--< positions
                  +--< skills
                  +--< groups
```

### New Tables TypeScript Interfaces
```typescript
interface Person {
  id: string;
  full_name: string;
  email: string;
  type: 'candidate' | 'employee';
  department: string | null;
  position_id: string | null;
  current_level: string | null;
  joined_date: string | null;
  phone: string | null;
  notes: string | null;
  created_by: string; // FK users.id
  created_at: string;
  updated_at: string;
}

interface Position {
  id: string;
  title: string;
  department: string | null;
  description: string | null;
  target_level: string | null;
  created_by: string; // FK users.id
  created_at: string;
  updated_at: string;
}

interface Skill {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_by: string; // FK users.id
  created_at: string;
}

interface PositionSkillRequirement {
  id: string;
  position_id: string;
  skill_id: string;
  required_level: number; // 1-5
  is_mandatory: boolean;
  checklist_order: number;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  type: 'department' | 'batch' | 'campaign' | 'other';
  description: string | null;
  created_by: string; // FK users.id
  created_at: string;
  updated_at: string;
}

interface GroupMember {
  id: string;
  group_id: string;
  person_id: string;
  added_at: string;
}

interface SkillEvaluation {
  id: string;
  result_id: string;
  skill_id: string;
  score: number; // 1-5
  status: 'not_evaluated' | 'pass' | 'fail';
  reviewer_comment: string | null;
  ai_insight: string | null;
  evaluated_by: string; // FK users.id
  created_at: string;
}
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260326000000_talent_assessment_schema.sql` | CREATE | New tables + RLS + indexes |
| `supabase/migrations/20260326000001_extend_tests_results.sql` | CREATE | ALTER tests + results |

## Implementation Steps

### Step 1: Create migration file for new tables

**File**: `supabase/migrations/20260326000000_talent_assessment_schema.sql`

```sql
-- =============================================================
-- MIGRATION: Talent Assessment & Workforce Evaluation - New Tables
-- =============================================================

-- -----------------------------------------------------
-- TABLE: persons
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.persons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name varchar NOT NULL,
  email varchar,
  type varchar NOT NULL DEFAULT 'candidate' CHECK (type IN ('candidate', 'employee')),
  department varchar,
  position_id uuid,
  current_level varchar,
  joined_date date,
  phone varchar,
  notes text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persons_insert_own" ON public.persons
  FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "persons_select_own" ON public.persons
  FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "persons_update_own" ON public.persons
  FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "persons_delete_own" ON public.persons
  FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_persons_created_by ON public.persons(created_by);
CREATE INDEX idx_persons_type ON public.persons(type);
CREATE INDEX idx_persons_email ON public.persons(email);
CREATE INDEX idx_persons_position_id ON public.persons(position_id);

-- -----------------------------------------------------
-- TABLE: positions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar NOT NULL,
  department varchar,
  description text,
  target_level varchar,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "positions_insert_own" ON public.positions
  FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "positions_select_own" ON public.positions
  FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "positions_update_own" ON public.positions
  FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "positions_delete_own" ON public.positions
  FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_positions_created_by ON public.positions(created_by);

-- Add FK from persons.position_id to positions after positions table exists
ALTER TABLE public.persons
  ADD CONSTRAINT fk_persons_position
  FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE SET NULL;

-- -----------------------------------------------------
-- TABLE: skills
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL,
  category varchar,
  description text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_insert_own" ON public.skills
  FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "skills_select_own" ON public.skills
  FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "skills_update_own" ON public.skills
  FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "skills_delete_own" ON public.skills
  FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_skills_created_by ON public.skills(created_by);
CREATE INDEX idx_skills_category ON public.skills(category);

-- -----------------------------------------------------
-- TABLE: position_skill_requirements
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.position_skill_requirements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required_level int4 NOT NULL DEFAULT 3 CHECK (required_level BETWEEN 1 AND 5),
  is_mandatory boolean NOT NULL DEFAULT false,
  checklist_order int4 NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(position_id, skill_id)
);

ALTER TABLE public.position_skill_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psr_insert_own" ON public.position_skill_requirements
  FOR INSERT TO public
  WITH CHECK (position_id IN (SELECT id FROM public.positions WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "psr_select_own" ON public.position_skill_requirements
  FOR SELECT TO public
  USING (position_id IN (SELECT id FROM public.positions WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "psr_update_own" ON public.position_skill_requirements
  FOR UPDATE TO public
  USING (position_id IN (SELECT id FROM public.positions WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "psr_delete_own" ON public.position_skill_requirements
  FOR DELETE TO public
  USING (position_id IN (SELECT id FROM public.positions WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE INDEX idx_psr_position_id ON public.position_skill_requirements(position_id);
CREATE INDEX idx_psr_skill_id ON public.position_skill_requirements(skill_id);

-- -----------------------------------------------------
-- TABLE: groups
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL,
  type varchar NOT NULL DEFAULT 'other' CHECK (type IN ('department', 'batch', 'campaign', 'other')),
  description text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_insert_own" ON public.groups
  FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "groups_select_own" ON public.groups
  FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "groups_update_own" ON public.groups
  FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "groups_delete_own" ON public.groups
  FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_groups_type ON public.groups(type);

-- -----------------------------------------------------
-- TABLE: group_members
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(group_id, person_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gm_insert_own" ON public.group_members
  FOR INSERT TO public
  WITH CHECK (group_id IN (SELECT id FROM public.groups WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "gm_select_own" ON public.group_members
  FOR SELECT TO public
  USING (group_id IN (SELECT id FROM public.groups WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "gm_delete_own" ON public.group_members
  FOR DELETE TO public
  USING (group_id IN (SELECT id FROM public.groups WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE INDEX idx_gm_group_id ON public.group_members(group_id);
CREATE INDEX idx_gm_person_id ON public.group_members(person_id);

-- -----------------------------------------------------
-- TABLE: skill_evaluations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_evaluations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id uuid NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  score int4 NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 5),
  status varchar NOT NULL DEFAULT 'not_evaluated' CHECK (status IN ('not_evaluated', 'pass', 'fail')),
  reviewer_comment text,
  ai_insight text,
  evaluated_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(result_id, skill_id)
);

ALTER TABLE public.skill_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "se_insert_own" ON public.skill_evaluations
  FOR INSERT TO public
  WITH CHECK (evaluated_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "se_select_own" ON public.skill_evaluations
  FOR SELECT TO public
  USING (evaluated_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "se_update_own" ON public.skill_evaluations
  FOR UPDATE TO public
  USING (evaluated_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "se_delete_own" ON public.skill_evaluations
  FOR DELETE TO public
  USING (evaluated_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_se_result_id ON public.skill_evaluations(result_id);
CREATE INDEX idx_se_skill_id ON public.skill_evaluations(skill_id);
CREATE INDEX idx_se_evaluated_by ON public.skill_evaluations(evaluated_by);
```

### Step 2: Create migration for extending tests and results

**File**: `supabase/migrations/20260326000001_extend_tests_results.sql`

```sql
-- =============================================================
-- MIGRATION: Extend tests and results for talent assessment
-- =============================================================

-- Add target_type to tests (candidate vs employee evaluation)
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS target_type varchar NOT NULL DEFAULT 'candidate'
  CHECK (target_type IN ('candidate', 'employee'));

-- Add position reference to tests
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL;

-- Add group reference to tests
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- Add person reference to results (nullable for migration)
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.persons(id) ON DELETE SET NULL;

-- Indexes for new FK columns
CREATE INDEX IF NOT EXISTS idx_tests_target_type ON public.tests(target_type);
CREATE INDEX IF NOT EXISTS idx_tests_position_id ON public.tests(position_id);
CREATE INDEX IF NOT EXISTS idx_tests_group_id ON public.tests(group_id);
CREATE INDEX IF NOT EXISTS idx_results_person_id ON public.results(person_id);
```

### Step 3: Verify migration locally
1. Run `npx supabase db push` or apply via Supabase dashboard
2. Verify all tables created with correct columns
3. Verify RLS policies active on all tables
4. Verify indexes exist on all FK columns
5. Test INSERT/SELECT with authenticated user

## Todo List
- [ ] Write migration file `20260326000000_talent_assessment_schema.sql`
- [ ] Write migration file `20260326000001_extend_tests_results.sql`
- [ ] Run migrations against local/dev Supabase
- [ ] Verify RLS policies work for authenticated user
- [ ] Verify RLS blocks cross-user access
- [ ] Verify CASCADE deletes work correctly
- [ ] Verify CHECK constraints reject invalid values
- [ ] Test that existing tests/results still work unchanged

## Success Criteria
- All 7 new tables exist with correct columns, types, defaults
- `tests` has `target_type`, `position_id`, `group_id` columns
- `results` has `person_id` column
- RLS active on all new tables; CRUD only for owner
- Existing test/result flows unaffected (backward compatible)
- All indexes created for FK columns

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration breaks existing data | HIGH | `ADD COLUMN IF NOT EXISTS` + defaults ensure no data loss |
| RLS policies too restrictive | MEDIUM | Test with real auth; admin bypass patterns documented |
| `persons.position_id` FK added before `positions` table | LOW | Create positions first, then add FK constraint |

## Security Considerations
- All new tables have RLS enabled
- Ownership verification through `created_by` -> `users.auth_id = auth.uid()` chain
- `skill_evaluations` uses `evaluated_by` for ownership (not test ownership)
- `group_members` and `position_skill_requirements` inherit ownership from parent
- `persons` data scoped per recruiter; no cross-tenant visibility
- CHECK constraints prevent invalid enum values at DB level

## Next Steps
- Phase 2: Build CRUD API routes for persons, positions, skills
- Phase 8: Migrate existing `candidate_name`/`candidate_email` into `persons`
