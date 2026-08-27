---
phase: 1
title: "Scoring model + migration + grading API"
status: pending
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Scoring model + migration + grading API

## Overview
Server-owned tri-state scoring. Manual answers (response + grade) live in a new `answer_grades` table;
results gain `grading_status`. One server recompute used by submission + grading.

## Architecture
- **Migration** `supabase/migrations/20260525000000_manual_grading.sql`:
  - `results` ADD `grading_status text NOT NULL DEFAULT 'graded' CHECK (grading_status IN ('pending_grading','graded'))`.
    Default 'graded' → legacy rows correct automatically.
  - New table `answer_grades`:
    `id uuid pk`, `result_id uuid → results(id) on delete cascade`, `question_id uuid → questions(id) on delete cascade`,
    `response_text text` (candidate answer), `is_correct boolean` (null=ungraded, true=Đạt, false=Không đạt),
    `note text`, `graded_by uuid → users(id)`, `graded_at timestamptz`, `created_at timestamptz default now()`,
    `unique(result_id, question_id)`. Index on `result_id`.
  - RLS: enable; select/update for owners of the parent test (mirror `results_*_own_tests`); insert open
    (submission uses service-role admin client which bypasses RLS anyway).
- **Submission** (`POST /api/results`, `src/app/api/results/route.ts`): per answer, look up its question.
  - `grading_mode === 'manual'` → manual: insert `answer_grades` row (response_text from payload, is_correct=null);
    do NOT count toward score; keep a minimal `{question_id, requires_manual:true}` in `answers` JSONB.
  - else → auto: `is_correct = selected_answer === correct_answer` (today), store in `answers` JSONB, count score.
  - `grading_status = 'pending_grading'` if any manual answers else `'graded'`. `score`=auto-correct count, `total_questions`=all.
- **Grading API** new route `src/app/api/results/[id]/grade/route.ts` `PATCH { question_id, is_correct, note? }`:
  auth required; update the `answer_grades` row (set is_correct, note, graded_by, graded_at); recompute on `results`:
  `score = autoCorrect + count(answer_grades.is_correct=true)`; `grading_status='graded'` iff no answer_grades row with
  `is_correct IS NULL`. Return `{ score, total_questions, grading_status }`. revalidate results/test paths.
- **Recompute helper** `src/lib/grading/recompute-result-score.ts` (shared by submission + grading) — keep <200 LOC.

## Related Code Files
- Read: `src/app/api/results/route.ts`, `src/app/api/results/[id]/route.ts`, init + multi_type migrations.
- Create: migration, `grade/route.ts`, recompute helper.
- Modify: `src/app/api/results/route.ts` (manual-aware submission).

## Success Criteria
- [ ] Migration applies; `answer_grades` + `grading_status` exist with RLS.
- [ ] Submission: manual answers → ungraded answer_grades rows + `pending_grading`; auto unchanged.
- [ ] Grade endpoint flips Đạt/Không đạt + recomputes score + grading_status server-side.
- [ ] Legacy results unaffected (`grading_status` default 'graded').

## Risk Assessment
- Score drift → server is single source of truth; client never computes final %.
- Live migration → additive only; default handles backfill.
