---
phase: 5
title: "Verify"
status: pending
priority: P2
effort: "0.5d"
dependencies: [4]
---

# Phase 5: Verify

## Overview
Validate the end-to-end candidate-input → results-table → manual-grading flow and guard regressions.

## Implementation Steps
1. `npx tsc --noEmit` → 0 errors; `npm run build` → exit 0.
2. Manual: create a test from the bank with mixed MCQ + manual questions.
   - Candidate answers MCQ + types subjective responses; submits.
   - Result shows `pending_grading`, provisional %, "cần chấm N".
   - Results table lists it under "cần chấm"; open it; grade each subjective Đạt/Không đạt.
   - % recomputes; grading_status → `graded`; table updates (realtime).
3. Pure-MCQ test → auto-scored, no pending grading (unchanged behavior).
4. Legacy result (pre-migration) → displays as graded, no errors.

## Success Criteria
- [ ] tsc clean + build exit 0.
- [ ] Mixed test: candidate submits text → pending → graded; % correct after admin pass/fail.
- [ ] MCQ-only + legacy results unaffected.

## Risk Assessment
- Fully verifiable only against live Supabase → staging test; server recompute as safety net.
