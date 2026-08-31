# Phase 6: Employee Evaluation Flow — Skill Eval UI + Level Suggestion

## Context Links
- [Phase 3: Skill Evaluations API](./phase-03-api-groups-evaluations.md)
- [Phase 4: UI Management Pages](./phase-04-ui-management-pages.md)
- [Phase 5: Test Engine Extension](./phase-05-extend-test-engine.md)
- [Existing result detail page](../../src/app/dashboard/results/[id]/page.tsx)
- [Existing result detail client](../../src/app/dashboard/results/[id]/result-detail-client.tsx)

## Overview
- **Priority**: P1
- **Status**: Completed
- **Effort**: 4h
- **Dependencies**: Phase 3 (skill evaluations + AI level API), Phase 4 (management UI), Phase 5 (test engine)
- **Description**: Build the employee evaluation workflow UI — skill checklist evaluation, AI level suggestion display, and reviewer confirmation flow

## Key Insights
- Result detail page already shows: candidate info, score, AI analysis, follow-up questions
- Employee evaluation adds: skill evaluation checklist, AI level suggestion, reviewer confirmation
- Show skill evaluation section only when `test.target_type === 'employee'` AND `test.position_id` is set
- Skills auto-populated from position's skill requirements when evaluation first opened
- BR-03: Senior level suggestion shows warning banner; recruiter must explicitly confirm
- Existing result detail client will need significant modification — split into sub-components

## Requirements

### Functional
- F1: Skill evaluation panel on result detail page (when employee + position linked)
- F2: Each required skill shows: name, required level, score slider (0-5), pass/fail toggle, comment field
- F3: Mandatory skills highlighted with badge/indicator
- F4: "Request AI Level Suggestion" button triggers `/api/ai/evaluate-level`
- F5: AI suggestion displayed: suggested level, confidence %, reasoning, skill gaps
- F6: BR-03 warning banner for senior suggestions with explicit confirm checkbox
- F7: Save evaluations persists all skill scores via `/api/skill-evaluations/[resultId]`
- F8: Evaluation summary card: X/Y skills passed, overall readiness indicator

### Non-Functional
- NF1: Skill evaluation panel loads without blocking existing result content
- NF2: Individual skill scores save independently (no "save all" required — but batch save available)
- NF3: AI suggestion is optional — evaluation works fully without it
- NF4: All new component files under 200 LOC

## Architecture

### Component Tree (Result Detail Page — Employee Mode)
```
result-detail-client.tsx (existing, modified)
├── [existing content: score, answers, AI analysis, follow-up]
│
└── {if test.target_type === 'employee' && test.position_id}
    └── skill-evaluation-panel.tsx (NEW — container)
        ├── skill-evaluation-header.tsx (NEW — title + save button + summary)
        ├── skill-evaluation-list.tsx (NEW — scrollable list of skills)
        │   └── skill-evaluation-item.tsx (NEW — single skill row, repeated)
        └── level-suggestion-card.tsx (NEW — AI suggestion + BR-03 warning)
```

### Data Flow
```
Page Load:
  1. Server fetches result + test (with position_id)
  2. Server fetches position_skill_requirements for position
  3. Server fetches existing skill_evaluations for this result
  4. All passed to client as props

Skill Evaluation:
  User adjusts score/status → local state update
  "Save" → POST /api/skill-evaluations/[resultId] per skill (batch)
  Toast confirmation

AI Level Suggestion:
  "Request AI Suggestion" click
  → POST /api/ai/evaluate-level { result_id, position_id }
  → Display response in level-suggestion-card
  → If senior: show BR-03 warning
  → Recruiter confirms or adjusts
```

### Types

```typescript
// src/app/dashboard/results/[id]/evaluation-types.ts

export interface SkillEvalFormItem {
  skill_id: string;
  skill_name: string;
  skill_category: string | null;
  required_level: number;
  is_mandatory: boolean;
  checklist_order: number;
  // Evaluation state (from DB or defaults)
  score: number;
  status: 'not_evaluated' | 'pass' | 'fail';
  reviewer_comment: string;
  ai_insight: string | null;
  evaluation_id: string | null; // null if not yet saved
  isDirty: boolean;
}

export interface LevelSuggestion {
  suggested_level: string;
  confidence: number;
  reasoning: string;
  skill_gaps: Array<{ skill: string; current: number; required: number }>;
  warnings: string[];
}
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/app/dashboard/results/[id]/page.tsx` | MODIFY | Fetch position requirements + evaluations |
| `src/app/dashboard/results/[id]/result-detail-client.tsx` | MODIFY | Conditionally render evaluation panel |
| `src/app/dashboard/results/[id]/evaluation-types.ts` | CREATE | Types for evaluation UI |
| `src/components/evaluation/skill-evaluation-panel.tsx` | CREATE | Container for skill eval section |
| `src/components/evaluation/skill-evaluation-header.tsx` | CREATE | Header with summary + save button |
| `src/components/evaluation/skill-evaluation-list.tsx` | CREATE | Scrollable list of skill items |
| `src/components/evaluation/skill-evaluation-item.tsx` | CREATE | Single skill evaluation row |
| `src/components/evaluation/level-suggestion-card.tsx` | CREATE | AI level suggestion display + BR-03 |

## Implementation Steps

### Step 1: Create evaluation types
**`src/app/dashboard/results/[id]/evaluation-types.ts`** (~35 LOC)

### Step 2: Update result detail server page

**`src/app/dashboard/results/[id]/page.tsx`** — add after existing fetches:
```typescript
// Fetch position skill requirements (if employee test with position)
let skillRequirements: any[] = [];
let existingEvaluations: any[] = [];

if (test.target_type === 'employee' && test.position_id) {
  const { data: reqs } = await supabase
    .from("position_skill_requirements")
    .select("*, skills(id, name, category)")
    .eq("position_id", test.position_id)
    .order("checklist_order");

  skillRequirements = reqs || [];

  const { data: evals } = await supabase
    .from("skill_evaluations")
    .select("*")
    .eq("result_id", id);

  existingEvaluations = evals || [];
}

// Pass to client:
<ResultDetailClient
  result={result}
  test={test}
  followUpSession={followUpSession}
  skillRequirements={skillRequirements}      // NEW
  existingEvaluations={existingEvaluations}  // NEW
/>
```

### Step 3: Create skill evaluation components

**`src/components/evaluation/skill-evaluation-item.tsx`** (~120 LOC)
```
Props: SkillEvalFormItem + onChange callback

Layout:
┌─────────────────────────────────────────────────────────┐
│ [Mandatory Badge?] Skill Name          Category         │
│ Required Level: ★★★☆☆ (3/5)                            │
│                                                          │
│ Score: [1] [2] [3] [4] [5]  Status: [Pass ○] [Fail ○]  │
│                                                          │
│ Comment: [textarea ___________________________]          │
│ AI Insight: "italic text from AI if available"           │
└─────────────────────────────────────────────────────────┘

- Score buttons: highlight selected, color-coded (red < required, green >= required)
- Mandatory skills: orange badge + subtle border highlight
- Auto-set status: score >= required_level → pass, else fail (user can override)
```

**`src/components/evaluation/skill-evaluation-list.tsx`** (~60 LOC)
- Maps `SkillEvalFormItem[]` to `skill-evaluation-item` components
- Sorted by `checklist_order`
- Mandatory skills grouped first (optional)
- Scrollable container with max-height

**`src/components/evaluation/skill-evaluation-header.tsx`** (~80 LOC)
- Title: "Skill Evaluation" with position name
- Summary badges: "X/Y Passed" | "Z Mandatory Remaining"
- Readiness indicator: progress bar or percentage
- "Save All" button (disabled when no dirty items)
- "Save All" triggers batch POST to `/api/skill-evaluations/[resultId]`

**`src/components/evaluation/skill-evaluation-panel.tsx`** (~100 LOC)
- Container that manages evaluation state (array of `SkillEvalFormItem`)
- Initializes from `skillRequirements` + `existingEvaluations` (merge on skill_id)
- Skills in requirements but not yet evaluated → defaults (score 0, not_evaluated)
- Handles save: iterate dirty items, POST each to API
- Manages loading/saving states
- Renders header + list + level suggestion card

**`src/components/evaluation/level-suggestion-card.tsx`** (~130 LOC)
```
Layout:
┌─────────────────────────────────────────────────────────┐
│ AI Level Suggestion                    [Request] button  │
│                                                          │
│ {loading state: AI loader spinner}                       │
│                                                          │
│ Suggested Level: [SENIOR]  Confidence: 82%               │
│                                                          │
│ Reasoning: "Based on the evaluation scores..."           │
│                                                          │
│ Skill Gaps:                                              │
│   • React: current 3, required 4                         │
│   • System Design: current 2, required 4                 │
│                                                          │
│ ⚠️ WARNING (BR-03): Senior level requires human          │
│ confirmation. [ ] I confirm this senior designation       │
│                                                          │
└─────────────────────────────────────────────────────────┘

- "Request" button calls POST /api/ai/evaluate-level
- Warning card (yellow/amber) shown only when suggested_level includes 'senior'
- Confirm checkbox required before level can be accepted
- "Accept Level" button updates person.current_level via PATCH /api/persons/[id]
```

### Step 4: Integrate into result detail client

**`src/app/dashboard/results/[id]/result-detail-client.tsx`** — modify:
1. Accept new props: `skillRequirements`, `existingEvaluations`
2. Add conditional section after existing content:
```tsx
{test.target_type === 'employee' && test.position_id && skillRequirements.length > 0 && (
  <SkillEvaluationPanel
    resultId={result.id}
    positionName={test.position_title || test.job_role}
    positionId={test.position_id}
    personId={result.person_id}
    skillRequirements={skillRequirements}
    existingEvaluations={existingEvaluations}
  />
)}
```

### Step 5: Verify compilation and flow
- `npm run build`
- Test with an employee-type test linked to a position with skill requirements
- Test without position (panel should not appear)
- Test AI suggestion request and BR-03 warning

## Todo List
- [ ] Create `src/app/dashboard/results/[id]/evaluation-types.ts`
- [ ] Create `src/components/evaluation/skill-evaluation-item.tsx`
- [ ] Create `src/components/evaluation/skill-evaluation-list.tsx`
- [ ] Create `src/components/evaluation/skill-evaluation-header.tsx`
- [ ] Create `src/components/evaluation/skill-evaluation-panel.tsx`
- [ ] Create `src/components/evaluation/level-suggestion-card.tsx`
- [ ] Modify `src/app/dashboard/results/[id]/page.tsx` — fetch requirements + evaluations
- [ ] Modify `src/app/dashboard/results/[id]/result-detail-client.tsx` — render panel
- [ ] Verify compilation (`npm run build`)
- [ ] Test evaluation save flow (create + update)
- [ ] Test AI level suggestion with mock data
- [ ] Test BR-03 warning appears for senior suggestion
- [ ] Test panel hidden for candidate-type tests

## Success Criteria
- Skill evaluation panel appears on employee results with linked position
- Panel hidden for candidate-type results
- Each skill shows required level vs current score with visual indicator
- Mandatory skills visually distinguished
- Save persists all dirty evaluations to DB
- AI level suggestion returns and displays structured result
- BR-03 warning shown for senior suggestions with confirm checkbox
- "Accept Level" updates person's current_level
- All component files under 200 LOC
- No regressions on existing result detail functionality

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Result detail client already complex | HIGH | New UI is entirely in separate components; only 5 lines added to existing client |
| Batch save could hit rate limits | LOW | Sequential POST calls with small delay; consider batch API endpoint if needed |
| AI suggestion takes too long | MEDIUM | Loading state with AI loader; 120s timeout; show partial results |
| Person current_level update requires person_id on result | MEDIUM | person_id set during submission (Phase 5); graceful fallback if null |

## Security Considerations
- Skill evaluations require auth; evaluated_by set server-side (not from client)
- AI level suggestion only accessible to test owner
- person.current_level update requires ownership of the person record
- BR-03 confirmation is UI-only enforcement (not DB constraint) — acceptable for soft warning
- No PII sent to OpenAI (only scores, skill names, levels)

## Next Steps
- Phase 7: Dashboard dual mode with employee metrics
