# Brainstorm — Test Results Page + Manual (Essay) Grading (Sub-project C)

**Date:** 2026-05-25 · **Status:** Agreed · **Scope:** C only

## Problem / current state
- `tests/[id]/test-detail-client.tsx` ALREADY lists submissions (realtime cards → `results/[id]`).
- Scoring model is **binary `is_correct: boolean` per answer** (`results/[id]/result-detail-client.tsx`).
- **Gap:** subjective questions (short_answer, sql_logic_code, communication_response, short_case_study,
  scenario, …) are forced binary with no admin input. No "needs grading" queue, no per-test results
  **table**, no manual-grade action.

## Decision (agreed)
- **Results overview:** a **dedicated Results tab/page** (table) — not just the current cards.
- **Manual grading model:** admin marks each subjective answer **Đạt / Không đạt (pass/fail)**; system
  derives score % from correct count (auto + admin-graded). NOT 0..max points (simpler, agreed).
- Auto-gradable types scored by system as today; manual types start **ungraded** until admin sets pass/fail.

## Design
**Data model:**
- Per-answer state becomes tri-state for manual types: `correct | incorrect | ungraded`. Implement via a
  `requires_manual` flag + nullable grade (keep `is_correct` but allow null/“pending” for manual), or a
  small `answer_grades` overlay. Result gains `status: pending_grading | graded` (+ graded_by/at).
- Score % = correctCount / totalQuestions, recomputed when admin grades. Until all manual answers graded
  → result is `pending_grading` (partial % shown as provisional).

**Results page (table):** columns: candidate, submitted-at, auto-score, manual status (graded N/M or
"cần chấm"), total %, status chip, action → open grading. Filter by status (cần chấm / đã chấm). Reuse
`ui/data-table` + `ui/status-chip` + `ui/score-bar`. Realtime insert/update (reuse channel pattern).

**Grading UI** (in `results/[id]` or a focused grade view): list manual questions only → show question +
candidate answer + **Đạt/Không đạt** toggle (+ optional note) → on save, set is_correct, recompute %,
flip result to `graded` when none pending.

**Auto vs manual type split (confirm in plan):** auto = single_choice, multiple_choice, true_false,
matching, ordering, fill_blank (deterministic). manual = short_answer, sql_logic_code,
communication_response, short_case_study, scenario, reading_comprehension(?), image_diagram(?),
priority_severity(?). Confirm exact set.

## Risks
- Existing results created under pure-binary model: migration/back-compat — treat legacy as graded.
- Recompute correctness across auto+manual must be single source of truth (server) to avoid drift.
- Realtime + grading concurrency (two admins) — last-write-wins acceptable for v1.

## Success criteria
- Results table per test with grading status + filter; "cần chấm" surfaced.
- Admin sets Đạt/Không đạt per subjective answer; % recomputes; status → graded.
- Auto-graded MCQ unaffected; legacy results still viewable.

## Unresolved
- Exact auto-vs-manual type set.
- Results page location: new route `tests/[id]/results` tab vs standalone — lean to a tab on tests/[id].
- Whether provisional % shows before grading complete (recommend yes, labeled provisional).
