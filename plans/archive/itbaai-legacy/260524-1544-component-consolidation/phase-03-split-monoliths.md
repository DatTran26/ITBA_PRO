# Phase 3 — Split Monolith Files

**Priority:** After Phase 2 · **Risk:** Medium-High · **Status:** Pending

## Overview
Break files far over the 200-LOC rule. These hide inline re-implementations; splitting surfaces more reuse and improves LLM context. Extract reused pieces into the canonical layer (phase 1) where applicable.

## Targets (by size)
| File | Size | Likely contents to extract |
|---|---|---|
| `tests/create-test-workbench.tsx` | 80KB | step sections, question editors, preview panels → sub-components |
| `recruitment/cv-upload-dialog.tsx` | 37KB | dropzone, parse/preview, mapping form |
| `dashboard/assessment-grid.tsx` | 35.6KB | grid row/card, filters, bulk actions → `ui/data-table` + cells |
| `management/level-config-step.tsx` | 26.6KB | per-level config row, skill matrix |
| `dashboard/assessment-card.tsx` | 19.5KB | header, score block, action menu |

## Approach (per file)
1. Open file; map logical sections (functions/JSX blocks/concerns).
2. Identify blocks that duplicate canonical components → replace with them.
3. Extract remaining cohesive sections into co-located `*-section.tsx` / `*-row.tsx` (kebab-case, ≤200 LOC).
4. Parent keeps orchestration/state; children are presentational where possible.
5. `npx tsc --noEmit` + `npm run build` + run app for the affected page.

## create-test-workbench — extraction map (for a DEDICATED session)
Done: pure matrix logic → `create-test-matrix.ts`. Remaining (1133-line component, AI test-creation flow — high risk, do with fresh context). Proposed co-located sub-components (parent keeps state, pass props):
- `create-test-jd-input.tsx` — "Input Job Description" column (textarea + Auto-Detect button). Props: `jobDescription`, `setJobDescription`, `isAnalyzing`, `onAnalyze`.
- `create-test-role-grid.tsx` — Step 01 role selection (JOB_ROLES grid + legend + custom/slide roles + "Other" custom input). Props: `selectedRole`, `setSelectedRole`, `slideRoles`, `customSlideRoles`, `customRole`, `setCustomRole`.
- `create-test-level-grid.tsx` — Step 02 level selection (LEVELS + levelThemeMap + "Other" custom). Props: `selectedLevel`, `setSelectedLevel`, `customLevel`, `setCustomLevel`.
- `create-test-advanced-settings.tsx` — the Advanced Settings Dialog (title/count/time/participants/schedule + Format-Weights matrix editor + presets). Largest block; many props (testTitle/questionCount/timeLimit/maxParticipants/testDescription/startTime/expiresAt/matrix/activePreset + setters + handleApplyPreset/handleQuestionCountChange + isModalReady/onCreate).
- `create-test-bank-panel.tsx` — Question Bank flow (LevelConfigStep + QuestionPullPreview, config/preview steps). Props: bankStep, levelConfig, pulledQuestions, shortageProposal, syncedBankTypeCounts, handlers.
- Keep `EmbeddedPremiumBackground` + JOB_ROLES/LEVELS in parent or a `create-test-constants.tsx`.
Parent target: orchestration + state + the 5 handlers (handleAnalyzeJD/handleCreate*/handlePullFromBank/...) ~ <300 LOC.

## Todo
- [x] create-test-workbench: matrix logic extracted (create-test-matrix.ts)
- [ ] create-test-workbench: JSX decomposition per map above (dedicated session)
- [ ] cv-upload-dialog split
- [ ] assessment-grid split (+ adopt ui/data-table)
- [ ] level-config-step split
- [ ] assessment-card split
- [ ] Each: build green + page works

## Success criteria
- No component file >300 LOC (target ≤200; allow headroom for dense forms).
- Extracted children reuse canonical components; no new duplicate KPI/chip/table/empty-state.

## Risk
- Medium-High — these are stateful, high-traffic flows (test creation, CV upload). Mitigate:
  - One file per PR; never split two monoliths together.
  - Pure structural extraction — no logic change. Diff state/prop wiring carefully.
  - Manual run of the actual flow after each split (create test, upload CV).
