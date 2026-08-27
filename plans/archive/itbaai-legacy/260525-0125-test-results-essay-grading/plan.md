---
title: "Test Results Page + Essay Grading"
description: ""
status: completed
priority: P2
branch: "feat/test-results-grading"
tags: []
blockedBy: []
blocks: []
created: "2026-05-24T18:33:35.097Z"
createdBy: "ck:plan"
source: skill
---

# Test Results Page + Essay Grading

## Overview

Add a per-test **Results table** + **manual grading** flow for subjective questions, end-to-end.
Auto MCQ scored by system as today. Manual questions (`grading_mode='manual'`: short_answer,
sql_logic_code, short_case_study) now (a) let the **candidate submit a free-text/code answer**, and
(b) start **ungraded**; admin marks each **Đạt/Không đạt** → server recomputes score %.
Result carries a new `grading_status` (`pending_grading | graded`). Grade + candidate response stored
in a **separate `answer_grades` table** (decision confirmed). Reuse `ui/data-table`, `ui/status-chip`,
`ui/score-bar`, `ui/segmented`. Source: [brainstorm](../reports/brainstorm-260525-0125-results-essay-grading.md).

## Resolved decisions (this session)
- **Scope: full end-to-end** — includes candidate subjective-answer input (was missing from original plan).
- **Manual vs auto** = `questions.grading_mode` (data-driven, no hardcoded type list).
- **Storage** = new `answer_grades` table (single source of truth for manual answers + grades).
  Auto answers stay in `results.answers` JSONB. No double-storing → no client/server drift.
- **Status column** = NEW `results.grading_status` (existing `results.status` is the pass/fail decision — do NOT reuse).
- **Legacy** = `grading_status` defaults to `'graded'`; old rows auto-correct, no backfill needed.
- **Provisional %** shown while `pending_grading`, labeled provisional.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Scoring model + migration + grading API](./phase-01-scoring-model-api.md) | Done |
| 2 | [Candidate subjective input](./phase-02-candidate-subjective-input.md) | Done |
| 3 | [Results table page](./phase-03-results-table-page.md) | Done |
| 4 | [Manual grading UI](./phase-04-manual-grading-ui.md) | Done |
| 5 | [Verify](./phase-05-verify.md) | Done |

## Dependencies
- Touches `test/[token]` (candidate), `tests/[id]`, `results/[id]`, results/scoring + grading API, DB migration.
- Independent of plans A/B.
