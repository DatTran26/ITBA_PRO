---
phase: 3
title: "Skill questions tab"
status: complete
priority: P2
effort: "0.5d"
dependencies: [2]
---

# Phase 3: Skill questions tab

## Overview
List a skill's questions with select/edit/delete + "request more", reusing the QB questions table.

## Requirements
- Functional: a "Questions" tab on `skills/[id]` listing `questions WHERE skill_id = id`; edit
  (`question-form-dialog`), delete, and a "Tạo thêm" button → opens the skill generation pipeline (Phase 2).
- Non-functional: reuse `question-bank-table` + `question-form-dialog` filtered by skill_id; no fork.

## Architecture
- Reuse `question-bank-table` with a `skillId` filter (add an optional filter prop or a scoped fetch).
- "Tạo thêm" links/opens the Knowledge tab pipeline.

## Related Code Files
- Create: `src/app/dashboard/skills/[id]/skill-questions-tab.tsx`
- Modify: `skill-detail-client.tsx` (add tab); reuse `question-bank-table`, `question-form-dialog`
- Possibly: `/api/question-bank` accept `skillId` filter

## Implementation Steps
1. Add API/query filter by `skill_id`.
2. Build the Questions tab reusing the QB table + form dialog, scoped to the skill.
3. "Tạo thêm" → Knowledge tab pipeline.
4. `npx tsc --noEmit`.

## Success Criteria
- [x] Skill Questions tab lists only that skill's questions; edit/delete/request-more work.
- [x] Reuses QB table/dialog (DRY).

## Risk Assessment
- Risk: QB table assumes global scope. Mitigation: add optional skillId filter, default global (no change).
