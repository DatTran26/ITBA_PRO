---
phase: 1
title: "Shared config atoms"
status: pending
priority: P2
effort: "0.5d"
dependencies: []
---

# Phase 1: Shared config atoms

## Overview
Extract two reusable, presentational config atoms so the PULL flow (`level-config-*`) and the new
GENERATE flow share them instead of forking: a question-type multi-select and a J/M/S level-ratio control.

## Requirements
- Functional: a `QuestionTypePicker` (multi-select chips over the 14 types) and a `LevelRatio` control
  (junior/middle/senior summing to 100, live values). Both controlled (value + onChange).
- Non-functional: token-based (design-guidelines), ≤200 LOC each, no behavior change to existing PULL UI.

## Architecture
- Source of the 14 types + labels: `src/components/question-bank/question-bank-types.ts`
  (`QUESTION_TYPE_OPTIONS`, `QuestionType`). Reuse — do not redefine.
- `level-config-type-picker.tsx` (PULL) currently renders per-type COUNT inputs. The GENERATE flow needs
  only type SELECTION (no per-type count). So create a **selection-only** `question-type-picker.tsx`
  primitive; keep the PULL count-picker composing on top (or leave PULL as-is if refactor risk too high
  — DRY where clean, don't force).
- `LevelRatio`: mirror the dual-handle slider in `level-config-selectors.tsx` (junior/middle/senior),
  but as a standalone controlled component returning `{junior, middle, senior}` (percentages, sum 100).

## Related Code Files
- Create: `src/components/question-bank/question-type-picker.tsx` (selection-only multi-select)
- Create: `src/components/question-bank/level-ratio.tsx` (J/M/S ratio control)
- Reference (reuse, avoid forking): `question-bank-types.ts`, `level-config-selectors.tsx`, `level-config-type-picker.tsx`
- Modify (only if low-risk): `level-config-selectors.tsx` to consume `level-ratio.tsx` (optional; skip if risky)

## Implementation Steps
1. Read `question-bank-types.ts` for `QUESTION_TYPE_OPTIONS`/`QuestionType`.
2. Create `question-type-picker.tsx`: props `{ value: QuestionType[]; onChange; className? }`; chip toggles; default-none.
3. Create `level-ratio.tsx`: props `{ value: {junior,middle,senior}; onChange; className? }`; dual-handle slider (port from level-config-selectors) + 3 readouts; clamp + keep sum 100.
4. `npx tsc --noEmit`.

## Success Criteria
- [ ] Both atoms compile, ≤200 LOC, token-based.
- [ ] `level-ratio` always yields sum=100; `question-type-picker` yields a `QuestionType[]`.
- [ ] No change to existing PULL flow visuals/behavior.

## Risk Assessment
- Risk: over-refactoring PULL components introduces regressions. Mitigation: new atoms are additive;
  only refactor PULL to consume them if trivially safe, else leave PULL untouched (still DRY for new flow).
