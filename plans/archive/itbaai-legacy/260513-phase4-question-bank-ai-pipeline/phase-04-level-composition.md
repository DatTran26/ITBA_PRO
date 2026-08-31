---
phase: 4
title: "Level Composition: Wizard, Auto-Pull, Swap, Send"
status: pending
priority: P2
effort: "3–4d"
dependencies: [1, 2]
---

# Phase 4: Level Composition

## Context Links
- Brainstorm: `plans/reports/brainstorm-260513-phase4-question-bank.md`
- Foundation: `plans/260513-phase4-question-bank-ai-pipeline/phase-01-foundation.md`
- Manual Input: `plans/260513-phase4-question-bank-ai-pipeline/phase-02-manual-input.md`
- Test workbench: `src/components/tests/create-test-workbench.tsx`
- Code standards: `docs/code-standards.md`

## Overview
Extend the existing test creation wizard (`create-test-workbench.tsx`) with a "Question Bank" source option. When selected, leader configures level composition (single level or mixed ratio), optionally filters by topic, and the system auto-pulls questions from `question_bank`. Leader can swap individual questions before saving. Finished test can be sent to an individual or a team.

## Requirements
- Functional:
  - API: `POST /api/question-bank/pull` — pull N questions by level config + topic filter
  - API: `POST /api/question-bank/swap` — replace one question with another from bank (same level)
  - Extend test creation wizard: add "Từ ngân hàng câu hỏi" (From Question Bank) as source option
  - Level Config step:
    - Mode A — Single level: select Junior | Middle | Senior; input total question count
    - Mode B — Mixed ratio: input % per level (default 30/50/20); input total count; percentages must sum to 100
    - Optional topic filter: multi-select from distinct `topic_tag` values in bank
  - Auto-pull step: system fetches questions matching config; shows preview table
  - Swap step: each question row has "Đổi câu" (Swap) button → replaces with random different question of same level from bank (excludes already-pulled IDs)
  - Send step: existing flow — send to individual candidate OR send to entire team group
- Non-functional:
  - Pull query must be efficient (indexed on `level`, `topic_tag`)
  - If bank has fewer questions than requested for a level, return what's available + warning
  - Swap must exclude already-shown questions (track pulled IDs client-side)

## Architecture

### API Layer
```
src/app/api/question-bank/
  pull/route.ts               -- POST: pull questions by level config
  swap/route.ts               -- POST: get replacement question
```

### UI Layer — wizard extension
```
src/components/tests/
  create-test-workbench.tsx   -- Add "Question Bank" source option + new wizard steps
src/components/question-bank/
  level-config-step.tsx       -- Mode A/B selector + ratio inputs + topic filter
  question-pull-preview.tsx   -- Table of auto-pulled questions with swap button
```

### Wizard Step Flow (new path)
```
Existing steps:
  1. Basic Info (name, position, deadline)
  2. Target (individual / group)
  [NEW] 2b. Source: "Tạo thủ công" | "Từ ngân hàng câu hỏi"
       ↓ if Question Bank selected
  3. Level Config (mode A or B + topic filter)
  4. Auto-Pull Preview (review + swap questions)
  5. Review & Send (existing send flow)
```

### Pull Query Logic
```sql
-- Mode A (single level):
SELECT * FROM question_bank
WHERE level = :level
  AND (:topic IS NULL OR topic_tag = ANY(:topics))
ORDER BY random()
LIMIT :count

-- Mode B (mixed ratio):
-- Run 3 queries, one per level, using computed counts:
-- junior_count = ROUND(total * junior_pct / 100)
-- middle_count = ROUND(total * middle_pct / 100)
-- senior_count = total - junior_count - middle_count  (absorb rounding remainder)
SELECT * FROM question_bank
WHERE level = :level AND id NOT IN (:excluded_ids)
  AND (:topic IS NULL OR topic_tag = ANY(:topics))
ORDER BY random()
LIMIT :count
```

## Related Code Files
- Create:
  - `src/app/api/question-bank/pull/route.ts`
  - `src/app/api/question-bank/swap/route.ts`
  - `src/components/question-bank/level-config-step.tsx`
  - `src/components/question-bank/question-pull-preview.tsx`
- Modify:
  - `src/components/tests/create-test-workbench.tsx` — add Question Bank source + new steps

## Implementation Steps

1. **API — pull** (`question-bank/pull/route.ts`):
   - POST body: `{ mode: 'single'|'mixed', level?: string, ratios?: {junior,middle,senior}, total: number, topics?: string[] }`
   - Auth: `isLeader || isAdmin`
   - Mode single: one query for `level` with `LIMIT total`
   - Mode mixed: compute counts, run 3 queries (junior/middle/senior), merge + shuffle
   - If a level returns fewer rows than requested: include `warnings: { level, requested, available }`
   - Return `{ questions: QuestionBankRow[], warnings?: Warning[] }`

2. **API — swap** (`question-bank/swap/route.ts`):
   - POST body: `{ level: string, excludeIds: string[], topics?: string[] }`
   - Auth: `isLeader || isAdmin`
   - SELECT 1 random question matching level, NOT IN excludeIds, optional topic filter
   - Return `{ question: QuestionBankRow | null }` (null if no more available)

3. **API — topics list** (add to `question-bank/route.ts` GET):
   - Add `?distinct=topics` query param → `SELECT DISTINCT topic_tag FROM question_bank WHERE topic_tag IS NOT NULL ORDER BY topic_tag`
   - Used by level-config-step for multi-select dropdown

4. **`level-config-step.tsx`** component:
   - Toggle: "Một mức độ" (Mode A) / "Trộn nhiều mức độ" (Mode B)
   - Mode A: `<Select>` for level (Junior/Middle/Senior) + number input for count
   - Mode B: three percentage inputs (Junior/Middle/Senior), validate sum = 100, number input for total; show computed counts preview (e.g. "30 Junior, 50 Middle, 20 Senior")
   - Topic filter: multi-select combobox populated from `GET /api/question-bank?distinct=topics`
   - "Bốc câu hỏi" (Pull) button → calls parent handler → POST `/api/question-bank/pull`

5. **`question-pull-preview.tsx`** component:
   - Table columns: #, question_text (truncated to 80 chars), level badge, topic_tag, correct_answer, actions
   - "Đổi câu" button per row → POST `/api/question-bank/swap` with `excludeIds = all current pulled IDs`
     → on success: replace that row in local state
     → on null response: disable swap button with tooltip "Không còn câu hỏi phù hợp"
   - Warning banner if any level returned fewer than requested
   - "Xác nhận danh sách" (Confirm) button → advance to Review & Send step

6. **Extend `create-test-workbench.tsx`**:
   - After "Target" step: add source selection toggle — "Tạo thủ công" (existing flow) | "Từ ngân hàng câu hỏi" (new flow)
   - If Question Bank selected: inject `level-config-step` then `question-pull-preview` before Review step
   - On confirm: map pulled `question_bank` rows → test `questions` array format (map fields: `question_text` → `content`, `option_a..d` → answers array, etc. — check existing question schema)
   - Existing Review & Send step handles the rest unchanged

## Todo List
- [ ] API: pull endpoint (single + mixed mode)
- [ ] API: swap endpoint
- [ ] API: distinct topics query (extend GET route)
- [ ] Component: level-config-step (mode toggle + inputs + topic filter)
- [ ] Component: question-pull-preview (table + swap + warning)
- [ ] Modify create-test-workbench: source toggle + inject new steps
- [ ] Map question_bank fields → test question format on confirm

## Success Criteria
- [ ] Leader selects "Mixed" mode, total 20, ratios 30/50/20 → gets 6 Junior, 10 Middle, 4 Senior
- [ ] Swap replaces the question with a different one of the same level (not already in list)
- [ ] Warning shown when bank has 3 Senior questions but 5 were requested
- [ ] After confirming question list, existing Review & Send step works unchanged
- [ ] "Tạo thủ công" path still works — no regression in existing wizard flow
- [ ] Topic filter narrows pull to only questions with matching topic_tag

## Risk Assessment
- **Regression in existing wizard**: Modifying `create-test-workbench.tsx` risks breaking the manual creation flow. Mitigation: source toggle is additive — `if source === 'question_bank'` guards all new steps; existing path untouched
- **Random() performance**: `ORDER BY random()` is fine for ≤10k rows. If bank grows larger, switch to `tablesample` or offset-based random. Not a concern at MVP.
- **Ratio rounding**: 30/50/20 of 7 total → 2.1/3.5/1.4 → rounding may not sum to 7. Fix: senior gets remainder (`total - junior_count - middle_count`). Document this in UI.
- **Question field mapping**: `question_bank` columns may differ slightly from existing `questions` table format. Must read the current `questions` schema before implementing the field mapper.

## Security Considerations
- Pull and swap endpoints: `isLeader || isAdmin` guard — recruiters/HR can view bank but cannot pull for test creation
- `excludeIds` array in swap body: validate as UUID array server-side (prevent injection via non-UUID strings)
- Topic filter: use parameterized query with `= ANY($1::text[])` — never interpolate into SQL

## Next Steps
- After Phase 4: review `docs/development-roadmap.md` and `docs/project-changelog.md` for update
- Consider adding question usage analytics to bank (how many times a question has been used in tests) — deferred post-MVP
