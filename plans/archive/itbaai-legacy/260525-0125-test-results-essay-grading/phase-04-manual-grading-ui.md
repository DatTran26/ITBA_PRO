---
phase: 4
title: "Manual grading UI"
status: pending
priority: P1
effort: "1d"
dependencies: [1, 3]
---

# Phase 4: Manual grading UI

## Overview
Admin grades subjective answers with a **Đạt / Không đạt** control per manual question; % recomputes,
result flips to `graded` when none remain ungraded.

## Requirements
- In `results/[id]` breakdown: for manual questions show question + candidate `response_text`
  + expected_answer/rubric (from `answer_payload`) + Đạt/Không đạt control (+ optional note).
  Save → grade endpoint (Phase 1) → server-recomputed score + grading_status. "cần chấm N câu"
  indicator + provisional % banner until done. Auto-graded MCQ display unchanged.

## Architecture
- Loader: `results/[id]` page must also fetch `answer_grades` for the result and pass to the client.
- `src/app/dashboard/results/[id]/result-detail-client.tsx`: extend `Answer`/types; in the breakdown,
  branch on `question.grading_mode === 'manual'` → render response + `ui/segmented` (Đạt/Không đạt) bound
  to grade endpoint; optimistic update, reconcile with server response (final score/grading_status).
  Reuse `ui/status-chip`/`ui/score-bar`. Score ring/percentage uses server `grading_status` for provisional label.
- Keep extraction in mind if file grows — consider `manual-grade-item.tsx`.

## Related Code Files
- Modify: `src/app/dashboard/results/[id]/result-detail-client.tsx`, its server `page.tsx` loader.
- Create (if needed): `src/components/dashboard/manual-grade-item.tsx`.
- Use: grade endpoint, `ui/segmented`, `ui/status-chip`, `ui/score-bar`, `ui/textarea`.

## Implementation Steps
1. Fetch answer_grades in loader; pass to client; extend types.
2. Render manual questions (response + expected/rubric + pass/fail control + note).
3. On toggle → PATCH grade endpoint → reconcile server score + grading_status.
4. Provisional %/"cần chấm" indicator; flip to graded on last grade. `npx tsc --noEmit`.

## Success Criteria
- [ ] Admin sets Đạt/Không đạt per subjective answer; % recomputes; grading_status → graded when done.
- [ ] MCQ display unchanged; provisional % shown while pending; candidate response + rubric visible.

## Risk Assessment
- Optimistic UI vs server recompute mismatch → trust server response for final %/status.
