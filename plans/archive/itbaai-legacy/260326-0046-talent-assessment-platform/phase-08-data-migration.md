# Phase 8: Data Migration — Existing Candidates to Persons Table

## Context Links
- [Phase 1: Database Schema](./phase-01-database-schema.md)
- [Existing init schema](../../supabase/migrations/20260310000000_init_schema.sql)
- [Existing results API](../../src/app/api/results/route.ts)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 2h
- **Dependencies**: Phase 1 (persons table + results.person_id column)
- **Description**: Migrate existing `candidate_name`/`candidate_email` from results into persons table and backfill `results.person_id`

## Key Insights
- Existing results store candidate info as flat strings: `candidate_name`, `candidate_email`
- After migration, each unique candidate becomes a `persons` record with `type = 'candidate'`
- `results.person_id` gets backfilled to link to the new persons record
- One candidate may have multiple results (same email) — should map to single person
- `persons.created_by` must reference the test's `recruiter_id` (owner of the data)
- Migration must be idempotent — safe to run multiple times
- Original `candidate_name`/`candidate_email` columns stay on results (no data loss)

## Requirements

### Functional
- F1: Create person record for each unique (candidate_email, recruiter_id) pair
- F2: Set person.full_name from candidate_name (use most recent result's name if multiple)
- F3: Set person.type = 'candidate' for all migrated records
- F4: Backfill results.person_id for all existing results
- F5: Handle results with no email gracefully (use name as fallback key)
- F6: Migration is idempotent and can be re-run safely

### Non-Functional
- NF1: Migration runs as SQL script (Supabase migration file)
- NF2: No downtime required — additive changes only
- NF3: Original columns preserved (candidate_name, candidate_email remain on results)
- NF4: Performance: handle thousands of results efficiently (batch operations)

## Architecture

### Migration Strategy
```
Step 1: Insert distinct persons from results
  - GROUP BY (candidate_email, recruiter_id) for email-based dedup
  - GROUP BY (candidate_name, recruiter_id) for email-null fallback
  - Use most recent candidate_name per group

Step 2: Backfill results.person_id
  - JOIN results -> tests -> match persons on email + recruiter
  - Fallback JOIN on name for null-email results

Step 3: Verification
  - Count results with person_id IS NULL (should be 0 or only edge cases)
  - Count persons created matches expected unique candidates
```

### Edge Cases
| Case | Handling |
|------|---------|
| Same email, different recruiters | Separate person records (scoped by created_by) |
| Same email, different names | Use most recent name; person record can be updated later |
| No email provided | Create person with name only; dedup by (name, recruiter_id) |
| Both name and email null | Skip — do not create person record |
| Result already has person_id | Skip — idempotency guard |

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260326000002_migrate_candidates_to_persons.sql` | CREATE | Migration SQL |

## Implementation Steps

### Step 1: Write migration SQL

**File**: `supabase/migrations/20260326000002_migrate_candidates_to_persons.sql`

```sql
-- =============================================================
-- MIGRATION: Backfill persons from existing results
-- Idempotent: safe to run multiple times
-- =============================================================

-- Step 1: Create person records from results with email
-- Uses DISTINCT ON to pick the most recent name per (email, recruiter)
INSERT INTO public.persons (full_name, email, type, created_by, created_at)
SELECT DISTINCT ON (r.candidate_email, t.recruiter_id)
  COALESCE(r.candidate_name, r.candidate_email, 'Unknown') AS full_name,
  r.candidate_email AS email,
  'candidate' AS type,
  t.recruiter_id AS created_by,
  MIN(r.created_at) OVER (PARTITION BY r.candidate_email, t.recruiter_id) AS created_at
FROM public.results r
JOIN public.tests t ON t.id = r.test_id
WHERE r.candidate_email IS NOT NULL
  AND r.candidate_email != ''
  AND r.person_id IS NULL
  -- Skip if person already exists for this email + recruiter
  AND NOT EXISTS (
    SELECT 1 FROM public.persons p
    WHERE p.email = r.candidate_email
      AND p.created_by = t.recruiter_id
  )
ORDER BY r.candidate_email, t.recruiter_id, r.submitted_at DESC;

-- Step 2: Create person records from results without email (name-only fallback)
INSERT INTO public.persons (full_name, type, created_by, created_at)
SELECT DISTINCT ON (r.candidate_name, t.recruiter_id)
  r.candidate_name AS full_name,
  'candidate' AS type,
  t.recruiter_id AS created_by,
  MIN(r.created_at) OVER (PARTITION BY r.candidate_name, t.recruiter_id) AS created_at
FROM public.results r
JOIN public.tests t ON t.id = r.test_id
WHERE (r.candidate_email IS NULL OR r.candidate_email = '')
  AND r.candidate_name IS NOT NULL
  AND r.candidate_name != ''
  AND r.person_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.persons p
    WHERE p.full_name = r.candidate_name
      AND p.email IS NULL
      AND p.created_by = t.recruiter_id
  )
ORDER BY r.candidate_name, t.recruiter_id, r.submitted_at DESC;

-- Step 3: Backfill results.person_id using email match
UPDATE public.results r
SET person_id = p.id
FROM public.persons p
JOIN public.tests t ON t.id = r.test_id
WHERE r.candidate_email IS NOT NULL
  AND r.candidate_email != ''
  AND r.person_id IS NULL
  AND p.email = r.candidate_email
  AND p.created_by = t.recruiter_id;

-- Step 4: Backfill results.person_id using name match (no email)
UPDATE public.results r
SET person_id = p.id
FROM public.persons p
JOIN public.tests t ON t.id = r.test_id
WHERE (r.candidate_email IS NULL OR r.candidate_email = '')
  AND r.candidate_name IS NOT NULL
  AND r.candidate_name != ''
  AND r.person_id IS NULL
  AND p.full_name = r.candidate_name
  AND p.email IS NULL
  AND p.created_by = t.recruiter_id;
```

### Step 2: Validate migration locally

Run verification queries after migration:
```sql
-- Count results still without person_id (should be 0 or minimal)
SELECT COUNT(*) AS orphaned_results
FROM public.results
WHERE person_id IS NULL
  AND (candidate_name IS NOT NULL OR candidate_email IS NOT NULL);

-- Count created persons
SELECT type, COUNT(*) FROM public.persons GROUP BY type;

-- Verify person linkage
SELECT
  r.id AS result_id,
  r.candidate_name,
  r.candidate_email,
  r.person_id,
  p.full_name AS person_name,
  p.email AS person_email
FROM public.results r
LEFT JOIN public.persons p ON p.id = r.person_id
LIMIT 20;
```

### Step 3: Handle RLS for migration

The migration SQL runs with superuser/service-role privileges (Supabase migrations bypass RLS). No special handling needed.

If running manually via API or application code, use the admin client:
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
const admin = createAdminClient();
// admin client bypasses RLS
```

### Step 4: Optional — API endpoint for manual re-run

If the migration needs to be triggered on-demand (e.g., after importing historical data), consider creating a one-off admin endpoint. However, for Phase 1 the SQL migration is sufficient.

## Todo List
- [ ] Write migration file `20260326000002_migrate_candidates_to_persons.sql`
- [ ] Test migration on local DB with sample data
- [ ] Verify no orphaned results (all get person_id)
- [ ] Verify idempotency (run migration twice, no duplicates)
- [ ] Verify persons have correct created_by (matches test recruiter)
- [ ] Verify edge cases: no-email, no-name, duplicate emails
- [ ] Run validation queries and document results

## Success Criteria
- Every existing result with candidate_name or candidate_email has a person_id
- No duplicate persons for same (email, recruiter) pair
- Persons created with type = 'candidate' and correct created_by
- Migration is idempotent — second run creates no new records
- Original candidate_name/candidate_email columns unchanged on results
- Existing application continues to work (no breaking changes)
- Verification queries show 0 orphaned results

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Name collisions (same name, different people) | MEDIUM | Name-only matching is fallback; email match is primary. Recruiters can merge/split later |
| Migration slow on large datasets | LOW | Uses batch INSERT/UPDATE; indexed columns. Expected <10k results in early stage |
| Window function in INSERT causes issues | LOW | Test on Supabase PostgreSQL version; standard SQL:2003 syntax |
| Duplicate persons from race condition | LOW | NOT EXISTS guard + UNIQUE constraint on persons prevents duplicates |

## Security Considerations
- Migration runs with superuser privileges (standard for Supabase migrations)
- No PII exposed externally — data stays within same database
- `created_by` correctly assigned to test recruiter (maintains data ownership)
- RLS policies on persons table protect migrated data going forward
- Original columns preserved as audit trail — no data deletion

## Next Steps
- After migration: verify Phase 5 person auto-creation works for new results
- After migration: verify Phase 4 persons list shows migrated candidates
- After migration: verify Phase 6 evaluation flow can link to migrated persons
