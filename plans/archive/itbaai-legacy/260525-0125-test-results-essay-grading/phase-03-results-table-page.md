---
phase: 3
title: "Results table page"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1]
---

# Phase 3: Results table page

## Overview
A per-test results **table** (tab on `tests/[id]`) with grading status + filter, augmenting current cards.

## Requirements
- Table of submissions: candidate, submitted-at, score, grading status (đã chấm / cần chấm), total %
  (provisional if pending), status chip, row → open grading (`results/[id]`). Filter by grading_status
  (all / cần chấm / đã chấm). Keep realtime insert/update.
- Token-based; reuse canonical components (no raw table).

## Architecture
- Extract `src/components/dashboard/test-results-table.tsx` (keeps `test-detail-client.tsx` <300 LOC delta):
  `ui/data-table` columns + `ui/status-chip` (grading_status) + `ui/score-bar` (%). `ui/segmented` for the filter.
- Add a "Results" tab/section to `src/app/dashboard/tests/[id]/test-detail-client.tsx` rendering it.
  Consume `grading_status` + `score` from Phase 1. Reuse existing realtime channel (read current impl first).

## Related Code Files
- Modify: `src/app/dashboard/tests/[id]/test-detail-client.tsx`.
- Create: `src/components/dashboard/test-results-table.tsx`.
- Use: `ui/data-table`, `ui/status-chip`, `ui/score-bar`, `ui/segmented`.

## Implementation Steps
1. Read current submissions list + realtime channel in test-detail-client.
2. Build table component (columns + filter + row link).
3. Wire realtime updates to refresh rows/status.
4. `npx tsc --noEmit`.

## Success Criteria
- [ ] Per-test results table with grading status + filter; "cần chấm" surfaced.
- [ ] Realtime new/updated submissions reflected.
- [ ] Canonical ui components (no raw table).

## Risk Assessment
- test-detail-client large (~1089 LOC) → extract table into its own component.
