# Phase 5: Extend Test Engine — target_type, Position, Group Integration

## Context Links
- [Phase 1: Database Schema](./phase-01-database-schema.md)
- [Phase 2: API Foundation](./phase-02-api-foundation.md)
- [Existing test creation page](../../src/app/dashboard/create/page.tsx)
- [Existing tests API](../../src/app/api/tests/route.ts)
- [Existing results API](../../src/app/api/results/route.ts)
- [Existing test-taking page](../../src/app/test/[token]/page.tsx)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 3h
- **Dependencies**: Phase 1 (DB columns), Phase 2 (persons/positions APIs)
- **Description**: Modify test creation and result submission to support target_type, position linking, group assignment, and person_id on results

## Key Insights
- `tests.target_type` defaults to `'candidate'` — existing tests unaffected
- `tests.position_id` and `tests.group_id` are nullable — optional enrichment
- `results.person_id` nullable — set during result submission when person is identified
- Test creation page is 796 LOC (already flagged for refactoring) — changes should be surgical
- The AI generate prompt can be enhanced with position context when available
- Result submission (public route) needs to auto-lookup or auto-create person record

## Requirements

### Functional
- F1: Test creation form adds target_type selector (Candidate / Employee)
- F2: Test creation optionally links to a position (fetched from positions API)
- F3: Test creation optionally assigns to a group (fetched from groups API)
- F4: Tests API POST accepts `target_type`, `position_id`, `group_id`
- F5: Tests API GET returns the new fields
- F6: Result submission resolves or creates `person_id` from candidate_name + candidate_email
- F7: AI question generation uses position context when `position_id` is set

### Non-Functional
- NF1: Backward compatible — existing test creation works without new fields
- NF2: Position/group selectors only show when data exists (graceful empty state)
- NF3: Person auto-creation is idempotent (match on email first)

## Architecture

### Test Creation Flow (updated)
```
Recruiter fills form:
  - target_type: candidate | employee  (NEW — default candidate)
  - position_id: optional select       (NEW)
  - group_id: optional select           (NEW)
  - job_role, level, question_count, etc. (existing)
        |
        v
POST /api/tests
  - Stores target_type, position_id, group_id in tests table
  - If position_id set, fetch position for AI context
        |
        v
POST /api/ai/generate
  - Enhanced prompt includes position title + required skills (if available)
```

### Result Submission Flow (updated)
```
Candidate submits test:
  - candidate_name, candidate_email, answers (existing)
        |
        v
POST /api/results
  - Check if person exists (email match + created_by = test recruiter)
  - If not, auto-create person with type based on test.target_type
  - Set result.person_id = resolved person.id
  - Rest of scoring logic unchanged
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/app/api/tests/route.ts` | MODIFY | Accept target_type, position_id, group_id in POST |
| `src/app/api/tests/[id]/route.ts` | MODIFY | Return new fields in GET, accept in PATCH |
| `src/app/api/results/route.ts` | MODIFY | Auto-resolve/create person_id on submission |
| `src/app/api/ai/generate/route.ts` | MODIFY | Use position context in prompt |
| `src/app/dashboard/create/page.tsx` | MODIFY | Add target_type, position, group selectors |
| `src/app/dashboard/tests/[id]/test-detail-client.tsx` | MODIFY | Display target_type, position, group info |
| `src/app/dashboard/types.ts` | MODIFY | Add new fields to DashboardTest |

## Implementation Steps

### Step 1: Update tests API POST

**`src/app/api/tests/route.ts`** — add to POST handler:
```typescript
// In the destructured body, add:
const { ..., target_type = 'candidate', position_id = null, group_id = null } = body;

// In the insert object, add:
target_type,
position_id,
group_id,
```

No new validation needed — CHECK constraint on DB enforces valid target_type. FK constraints enforce valid position_id/group_id.

### Step 2: Update tests API GET and PATCH

**`src/app/api/tests/[id]/route.ts`**:
- GET already uses `select("*")` — new columns returned automatically
- PATCH: add `target_type`, `position_id`, `group_id` to allowed update fields

### Step 3: Update result submission with person resolution

**`src/app/api/results/route.ts`** — add person resolution after test fetch:
```typescript
// After fetching test, resolve person
let personId: string | null = null;

if (candidate_email) {
  // Try to find existing person by email, owned by test recruiter
  const { data: existingPerson } = await supabase
    .from("persons")
    .select("id")
    .eq("email", candidate_email)
    .eq("created_by", test.recruiter_id)
    .single();

  if (existingPerson) {
    personId = existingPerson.id;
  } else {
    // Auto-create person record
    const personType = test.target_type || 'candidate';
    const { data: newPerson } = await supabase
      .from("persons")
      .insert({
        full_name: candidate_name,
        email: candidate_email,
        type: personType,
        position_id: test.position_id || null,
        created_by: test.recruiter_id,
      })
      .select("id")
      .single();

    if (newPerson) personId = newPerson.id;
  }
}

// Add to insert:
// person_id: personId,
```

**Important**: This insert uses `test.recruiter_id` as `created_by`, not the anonymous candidate's auth. The RLS insert policy on `persons` requires `created_by` to match `auth.uid()` — but the result submission is anonymous. Two options:
1. Use a service-role client for person creation in result submission
2. Create a separate RLS policy for anonymous person creation triggered by test submission

**Recommended**: Use a Supabase admin/service client for the person auto-creation step only, since this is a server-side operation triggered by valid test submission.

### Step 4: Enhance AI generation with position context

**`src/app/api/ai/generate/route.ts`** — add position context to prompt:
```typescript
// After validating input, if position_id is provided:
let positionContext = '';
if (body.position_id) {
  const { data: position } = await supabase
    .from("positions")
    .select("title, department, description, target_level, position_skill_requirements(skills(name), required_level, is_mandatory)")
    .eq("id", body.position_id)
    .single();

  if (position) {
    const skills = position.position_skill_requirements
      ?.map((r: any) => `${r.skills.name} (level ${r.required_level}${r.is_mandatory ? ', mandatory' : ''})`)
      .join(', ');
    positionContext = `\nTarget Position: ${position.title}${position.department ? ` (${position.department})` : ''}
Target Level: ${position.target_level || level}
Required Skills: ${skills || 'None specified'}\n`;
  }
}

// Inject positionContext into the system prompt after job_description block
```

### Step 5: Update test creation form

**`src/app/dashboard/create/page.tsx`** — surgical additions:
1. Add `target_type` radio/select at the top of the form (Candidate Assessment / Employee Evaluation)
2. Add optional `position_id` Select populated from `/api/positions` GET
3. Add optional `group_id` Select populated from `/api/groups` GET
4. Pass new fields to POST body

Given this file is already 796 LOC, consider extracting the new selectors into:
- `src/components/management/target-type-selector.tsx` (~40 LOC)
- `src/components/management/position-selector.tsx` (~60 LOC) — fetches + renders select
- `src/components/management/group-selector.tsx` (~60 LOC) — fetches + renders select

### Step 6: Update test detail display

**`src/app/dashboard/tests/[id]/test-detail-client.tsx`**:
- Show target_type as Badge (Candidate/Employee)
- Show linked position name (if set)
- Show linked group name (if set)

**`src/app/dashboard/types.ts`** — add to DashboardTest:
```typescript
target_type?: string;
position_id?: string | null;
group_id?: string | null;
```

### Step 7: Verify compilation and backward compatibility
- `npm run build`
- Test creating a test WITHOUT new fields (defaults should apply)
- Test creating a test WITH position + group
- Test result submission creates person record

## Todo List
- [ ] Modify `src/app/api/tests/route.ts` — POST accepts new fields
- [ ] Modify `src/app/api/tests/[id]/route.ts` — PATCH accepts new fields
- [ ] Modify `src/app/api/results/route.ts` — person auto-resolution
- [ ] Modify `src/app/api/ai/generate/route.ts` — position context in prompt
- [ ] Create `src/components/management/target-type-selector.tsx`
- [ ] Create `src/components/management/position-selector.tsx`
- [ ] Create `src/components/management/group-selector.tsx`
- [ ] Modify test creation page — add new selectors
- [ ] Modify `src/app/dashboard/types.ts` — add new fields
- [ ] Modify test detail client — display new fields
- [ ] Verify compilation (`npm run build`)
- [ ] Test backward compatibility (create test without new fields)
- [ ] Test full flow (create test with position -> submit result -> person created)

## Success Criteria
- Tests can be created with target_type = 'employee' and linked position/group
- Tests created without new fields work exactly as before (default candidate)
- Result submission auto-creates person record when email provided
- Duplicate person email for same recruiter reuses existing person
- AI generation includes position context in prompt when available
- Test detail page shows new metadata
- All files compile without errors

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Person auto-creation fails on RLS | HIGH | Use admin/service client for server-side creation |
| Create page 796 LOC grows further | MEDIUM | Extract new selectors into separate components |
| Position context makes AI prompt too long | LOW | Truncate description; skills are short names |
| Existing tests show "Candidate" badge when target_type was null | LOW | Default to 'candidate' in UI display |

## Security Considerations
- Person auto-creation uses service-role client (not anonymous auth)
- Person created with `created_by = test.recruiter_id` — scoped to recruiter
- Position/group selectors only show entities owned by current user (RLS)
- target_type validated by DB CHECK constraint
- No new public endpoints; changes are to existing authenticated routes

## Next Steps
- Phase 6: Employee evaluation flow using position + skill evaluations
- Phase 7: Dashboard dual mode using target_type filtering
