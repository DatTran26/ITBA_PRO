---
phase: 2
title: "Candidate subjective answer input"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1]
---

# Phase 2: Candidate subjective answer input

## Overview
The candidate test page is currently MCQ-only (`answers: Record<string, number>`). Add free-text/code
input for manual-type questions so subjective answers can actually be submitted (prerequisite for grading).

## Architecture
- `src/app/test/[token]/page.tsx`:
  - Extend `Question` interface with `question_type`, `grading_mode`, `answer_payload` (query already `select(questions(*))`).
  - Change answer state to hold both shapes: `answers: Record<string, number>` (MCQ) +
    `responses: Record<string, string>` (manual). Keep two maps to minimize churn to existing MCQ logic.
  - Render branch in the question card: `grading_mode === 'manual'` → `ui/textarea` (mono font for sql_logic_code);
    else existing options buttons. "Answered" = MCQ selected OR non-empty response.
  - Submit: build `answerArray` with `{ question_id, selected_answer }` for auto and
    `{ question_id, response_text }` for manual. Persist `responses` in the localStorage resume blob.
  - Submitted-phase local score calc must skip manual questions (only auto count).

## Related Code Files
- Modify: `src/app/test/[token]/page.tsx`. Use: `ui/textarea`.

## Implementation Steps
1. Extend Question type + answer/response state + localStorage persistence.
2. Branch question render (textarea for manual). Update answered-count + matrix "answered" checks.
3. Update submit payload mapping; update submitted-phase score to auto-only.
4. `npx tsc --noEmit`.

## Success Criteria
- [ ] Manual question shows a text/code input; MCQ unchanged.
- [ ] Submission sends `response_text` for manual, `selected_answer` for auto.
- [ ] Progress/resume (localStorage) handles both answer shapes.

## Risk Assessment
- File is large/animated — keep edits surgical to the question-render + submit/state areas only.
