---
phase: 3
title: "Compile & Verify"
status: pending
priority: P1
effort: "30m"
dependencies: ["phase-02"]
---

# Phase 3: Compile & Verify

## Overview

Run TypeScript compile check and Next.js build to confirm zero errors after the cleanup and redesign. Verify no broken imports reference the deleted sub-pages.

## Implementation Steps

1. **Check for stale imports** — grep for any remaining references to deleted routes:
   ```bash
   grep -r "question-bank/add\|question-bank/import\|question-bank/ai-pipeline" src/ --include="*.ts" --include="*.tsx"
   ```
   Expected: zero matches (only the deleted page files themselves, which are gone).

2. **Run TypeScript compile check**:
   ```bash
   rtk tsc
   ```
   Fix any type errors before proceeding.

3. **Run Next.js build**:
   ```bash
   rtk next build
   ```
   Expected: build succeeds with no errors. Warnings about unused vars are acceptable if pre-existing.

4. **Manual smoke test** (dev server):
   ```bash
   npm run dev
   ```
   - Navigate to `/dashboard/question-bank` — confirm unified tabbed page renders
   - Click each of the 4 tabs — confirm content renders without errors
   - Confirm sidebar shows "Question Bank" as flat item (no chevron, no sub-items)
   - Confirm clicking sidebar item navigates to `/dashboard/question-bank`
   - Confirm collapsed sidebar shows the Database icon

## Success Criteria

- [ ] `tsc --noEmit` exits with 0 errors
- [ ] `next build` succeeds
- [ ] No references to `/dashboard/question-bank/add`, `/import`, `/ai-pipeline` exist in `src/`
- [ ] Dev server renders tabs correctly at `/dashboard/question-bank`
- [ ] Sidebar "Question Bank" item is flat (no accordion, no chevron)

## Risk Assessment

Low. This phase is purely verification. If errors appear, they will be TypeScript import errors from the deleted sub-pages — fix by ensuring all router.push calls to sub-pages were removed in Phase 2.
