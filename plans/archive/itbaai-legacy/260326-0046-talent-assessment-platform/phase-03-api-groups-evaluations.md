# Phase 3: API — Groups, Skill Evaluations, AI Level Suggestion

## Context Links
- [Phase 1: Database Schema](./phase-01-database-schema.md)
- [Phase 2: API Foundation](./phase-02-api-foundation.md)
- [Existing AI generate route](../../src/app/api/ai/generate/route.ts)
- [Auth helpers (created in Phase 2)](../../src/lib/api/auth-helpers.ts)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 5h
- **Dependencies**: Phase 1 (DB), Phase 2 (auth helpers, skills/positions APIs)
- **Description**: Build group management, skill evaluation, and AI level suggestion endpoints

## Key Insights
- Groups are standalone entities with members; ownership via `created_by`
- Skill evaluations are per-result, per-skill; reviewer is the current user
- AI level suggestion uses OpenAI to compare test results against position requirements
- Business rule BR-03: Senior level suggestions get a soft warning (human confirms)
- Existing AI pattern: direct OpenAI SDK call with `response_format: { type: "json_object" }`

## Requirements

### Functional
- F1: Group CRUD (list with type filter, create, get by id with members, update, delete)
- F2: Group member management (list, add, remove by person_id)
- F3: Skill evaluations CRUD per result (list, create/upsert, update)
- F4: AI level suggestion endpoint (analyze result vs position requirements)

### Non-Functional
- NF1: Auth + ownership on all endpoints
- NF2: Group member operations validate both group and person ownership
- NF3: AI endpoint graceful fallback when OpenAI unavailable
- NF4: Each route file under 200 LOC

## Architecture

### Route Map

| Route | Methods | File |
|-------|---------|------|
| `/api/groups` | GET, POST | `src/app/api/groups/route.ts` |
| `/api/groups/[id]` | GET, PATCH, DELETE | `src/app/api/groups/[id]/route.ts` |
| `/api/groups/[id]/members` | GET, POST, DELETE | `src/app/api/groups/[id]/members/route.ts` |
| `/api/skill-evaluations/[resultId]` | GET, POST, PATCH | `src/app/api/skill-evaluations/[resultId]/route.ts` |
| `/api/ai/evaluate-level` | POST | `src/app/api/ai/evaluate-level/route.ts` |

### AI Level Suggestion Flow
```
Client sends: { result_id, position_id }
    |
    v
Server fetches: result (score, answers, ai_analysis)
    + position (target_level)
    + position_skill_requirements (required skills + levels)
    + skill_evaluations (existing scores if any)
    |
    v
OpenAI prompt: "Given these results and requirements, suggest a level"
    |
    v
Response: { suggested_level, confidence, reasoning, warnings[] }
    - warning if suggested_level >= 'senior' (BR-03)
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/app/api/groups/route.ts` | CREATE | List + create groups |
| `src/app/api/groups/[id]/route.ts` | CREATE | Get, update, delete group |
| `src/app/api/groups/[id]/members/route.ts` | CREATE | Manage group members |
| `src/app/api/skill-evaluations/[resultId]/route.ts` | CREATE | CRUD skill evaluations per result |
| `src/app/api/ai/evaluate-level/route.ts` | CREATE | AI level suggestion |

## Implementation Steps

### Step 1: Groups API routes

**`src/app/api/groups/route.ts`** (~75 LOC)
```typescript
// GET: List groups for authenticated user
// Query params: ?type=department|batch|campaign|other (optional)
// Select: "*, group_members(count)"
// Returns: { groups: Group[] }

// POST: Create a new group
// Body: { name, type, description? }
// Validation: name required, type must be valid enum
// Sets created_by = userId
// Returns: { group: Group } (201)
```

**`src/app/api/groups/[id]/route.ts`** (~85 LOC)
```typescript
// GET: Get group by id with members
// Select: "*, group_members(*, persons(id, full_name, email, type, department))"
// Ownership check
// Returns: { group: Group }

// PATCH: Update group fields
// Whitelist: name, type, description
// Returns: { group: Group }

// DELETE: Remove group (cascades to group_members)
// Returns: { success: true }
```

**`src/app/api/groups/[id]/members/route.ts`** (~90 LOC)
```typescript
// GET: List members of a group
// Select from group_members: "*, persons(id, full_name, email, type, department, current_level)"
// Returns: { members: GroupMember[] }

// POST: Add a person to a group
// Body: { person_id }
// Validation: person_id required, verify person exists and is owned by user
// Handles unique constraint violation gracefully (409 Conflict)
// Returns: { member: GroupMember } (201)

// DELETE: Remove a person from a group
// Body: { person_id }
// Deletes from group_members where group_id + person_id match
// Returns: { success: true }
```

### Step 2: Skill Evaluations API

**`src/app/api/skill-evaluations/[resultId]/route.ts`** (~120 LOC)
```typescript
// GET: List skill evaluations for a result
// Select: "*, skills(name, category)"
// Returns: { evaluations: SkillEvaluation[] }

// POST: Create or upsert a skill evaluation
// Body: { skill_id, score, status?, reviewer_comment?, ai_insight? }
// Validation:
//   - skill_id required
//   - score: integer 0-5
//   - status: 'not_evaluated' | 'pass' | 'fail'
// Sets evaluated_by = userId
// Uses upsert on (result_id, skill_id) unique constraint
// Returns: { evaluation: SkillEvaluation } (201)

// PATCH: Update an existing evaluation
// Body: { evaluation_id, score?, status?, reviewer_comment?, ai_insight? }
// Whitelist fields, ownership check via evaluated_by
// Returns: { evaluation: SkillEvaluation }
```

**Ownership validation**: Verify the result belongs to a test owned by the current user before allowing evaluation CRUD:
```typescript
// Verify result ownership through test chain
const { data: result } = await supabase
  .from("results")
  .select("test_id")
  .eq("id", resultId)
  .single();

const { data: test } = await supabase
  .from("tests")
  .select("recruiter_id")
  .eq("id", result.test_id)
  .single();

if (test.recruiter_id !== userId && !isAdmin) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Step 3: AI Level Suggestion endpoint

**`src/app/api/ai/evaluate-level/route.ts`** (~130 LOC)
```typescript
export const maxDuration = 120;

// POST: AI-powered level suggestion
// Body: { result_id, position_id }
// Validation: both IDs required
//
// Data gathering:
//   1. Fetch result (score, total_questions, ai_analysis, answers)
//   2. Fetch position (title, target_level)
//   3. Fetch position_skill_requirements with skill names
//   4. Fetch existing skill_evaluations for this result
//
// OpenAI prompt context:
//   - Position title + target level
//   - Required skills with levels + mandatory flags
//   - Test score percentage
//   - AI analysis summary (if available)
//   - Existing skill evaluation scores
//
// Response shape:
// {
//   suggested_level: "junior" | "mid" | "senior",
//   confidence: number (0-100),
//   reasoning: string,
//   skill_gaps: Array<{ skill: string, current: number, required: number }>,
//   warnings: string[]  // includes BR-03 warning for senior
// }
//
// Fallback: If OpenAI unavailable, return rule-based suggestion:
//   - score >= 80% of target = same level
//   - score 60-79% = one level below
//   - score < 60% = two levels below or "needs improvement"

// BR-03 soft warning injection:
const warnings: string[] = [];
if (suggestedLevel === "senior") {
  warnings.push(
    "Senior level suggested. Please verify with additional evaluation — " +
    "senior designations require human confirmation per policy BR-03."
  );
}
```

### Step 4: Compilation verification
Run `npm run build` after creating all route files.

## Todo List
- [ ] Create `src/app/api/groups/route.ts` (GET, POST)
- [ ] Create `src/app/api/groups/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Create `src/app/api/groups/[id]/members/route.ts` (GET, POST, DELETE)
- [ ] Create `src/app/api/skill-evaluations/[resultId]/route.ts` (GET, POST, PATCH)
- [ ] Create `src/app/api/ai/evaluate-level/route.ts` (POST)
- [ ] Verify compilation (`npm run build`)
- [ ] Test group CRUD with auth
- [ ] Test member add/remove with ownership validation
- [ ] Test skill evaluation upsert behavior
- [ ] Test AI level suggestion with and without OpenAI key

## Success Criteria
- All 5 route files compile without errors
- Group CRUD works with type filtering
- Group member add validates both group and person ownership
- Duplicate member add returns 409 (not 500)
- Skill evaluations correctly upsert on (result_id, skill_id)
- AI level suggestion returns structured response with warnings
- Fallback works when OpenAI key is missing
- All files under 200 LOC

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Skill evaluation ownership chain is 3 tables deep | MEDIUM | Cache the ownership check; RLS also enforces |
| AI level suggestion inconsistent results | LOW | Structured JSON output + fallback heuristic |
| Group member double-add causes DB error | LOW | Catch unique constraint violation, return 409 |

## Security Considerations
- Group member operations require ownership of BOTH the group AND the person
- Skill evaluation ownership verified through result -> test -> recruiter chain
- AI endpoint requires auth; no anonymous access to OpenAI calls
- Field whitelisting prevents injection of `evaluated_by` or `created_by` overrides
- AI prompt does not include PII (only scores, skill names, levels)

## Next Steps
- Phase 4: UI management pages consuming these APIs
- Phase 6: Employee evaluation flow integrating skill evaluations + level suggestion
