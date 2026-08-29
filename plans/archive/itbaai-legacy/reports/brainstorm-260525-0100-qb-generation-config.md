# Brainstorm — Question Bank Generation Config (Sub-project A)

**Date:** 2026-05-25 · **Status:** Agreed · **Scope:** A only (B, C separate sessions)

## Problem
QB AI pipeline (`/question-bank` → AI Pipeline tab) flow:
`upload → polling_topics → topic-review → generating → question-review → done`.
Generate trigger (`question-bank-ai-pipeline-tab.tsx` → `handleGenerateQuestions`) currently
POSTs only `{ approvedTopicIds }` to `/api/document-sources/{id}/generate-questions` → edge fn
`generate-questions-from-doc`. **Missing:** user can't set how many questions, per-topic counts,
Junior/Middle/Senior coverage, or which question types AI produces.

## Decision (agreed)
- **Placement:** config lives at the **topic-review step** (after extract), enhancing `TopicReviewPanel`.
- **Count:** per-topic count input (one number per approved topic); total = Σ counts (live).
- **Level:** one **global J/M/S ratio** applied to every topic (live per-level breakdown). NOT per-topic×per-level (combinatorial → over-engineered, rejected).
- **Question types:** **global multi-select** of the 14 types (AI distributes within chosen types). NOT per-type counts (rejected — simpler is enough here).

## Approaches considered
1. Global total only + AI auto-splits per topic — too little control; rejected.
2. **Per-topic count + global level ratio + global types** — chosen (KISS, matches ask).
3. Full per-topic×per-level matrix + per-type counts — max control, complex UI; rejected (YAGNI).

## Design
**UI (topic-review step):** keep topic list (edit/approve/remove). Add per row: count input (default e.g. 5). Add a config bar: J/M/S ratio control (3 inputs or slider, sums shown), question-type chips (multi-select, sensible default), and a summary (total questions, per-level breakdown). "Generate" disabled until ≥1 topic approved + ratio valid + ≥1 type.

**Payload (new):**
```
POST /api/document-sources/{id}/generate-questions
{ approvedTopicIds, perTopicCounts: {topicId:n}, levelRatio:{junior,middle,senior}, questionTypes:[...] }
```
Edge fn `generate-questions-from-doc`: consume config — generate `perTopicCounts[topic]` questions per topic, split by `levelRatio`, restricted to `questionTypes`. Validate sum + ratio server-side.

**Reuse (DRY):** extract shared atoms from the PULL flow (`level-config-*`): `question-type-picker` (chips) + `level-ratio` control, so both PULL (test assembly) and GENERATE (this) share them. Don't fork.

## Risks
- Edge fn prompt must honor per-topic count + level split reliably (AI may under/over-produce) → server-side post-validate + trim/pad or surface shortage in review step.
- Backward compat: API must still work if config omitted (default behavior) to avoid breaking existing callers.
- Token/cost: large per-topic counts × topics → cost. Add a soft cap + total warning.

## Success criteria
- User sets per-topic counts, J/M/S ratio, types at topic-review; Generate respects them.
- Generated set's level/type distribution matches config within tolerance; shortages surfaced.
- Existing pipeline unaffected when config not provided.

## Related (separate sessions)
- **B (Skills generation):** RECOMMEND reuse this engine via `context: {scope:"bank"} | {scope:"skill", skillId}`; save associates `skill_id`. Needs nullable `skill_id` on questions/document_sources. Brainstorm separately.
- **C (results table + essay grading):** independent; separate brainstorm.

## Unresolved
- Exact J/M/S ratio control (3 number inputs vs dual-handle slider like level-config) — pick during plan.
- Where per-level shortage is shown if AI underproduces (review step banner?) — confirm in plan.
- Default question-type set + soft cap value — confirm in plan.
