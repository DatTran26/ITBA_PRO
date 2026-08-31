# Brainstorm — Skills Question Generation + Skill Tests (Sub-project B)

**Date:** 2026-05-25 · **Status:** Agreed · **Depends on:** A (QB generation config)

## Problem / current state
- `/skills` + `skills/[id]` have tabs (overview/analytics/persons/positions); **no documents, no questions**.
- `questions` table has **no `skill_id`**; QB generation engine (upload→extract→config→generate→review)
  exists but writes to the global bank.
- Need: skill (belongs to a position) holds 1+ documents → AI generates skill-related questions →
  manager selects/edits/requests-more → create tests from 1+ skills by level (J/M/S) or Random.

## Decision (agreed)
- **Reuse the QB generation engine** via a `context: {scope:"bank"} | {scope:"skill", skillId}` param
  (DRY) — do not fork the pipeline.
- **Skill test** = pick **1+ skills** → pooled questions → choose level (J/M/S) or **Random**.

## Design
**DB:**
- Add nullable `skill_id` to `document_sources` and `questions` (simpler than join tables for v1).
  `skill_id` null → global bank (today); set → skill-scoped. RLS scoped accordingly.

**Skill documents + generation (reuse A engine):**
- New "Knowledge / Documents" section on `skills/[id]`: upload 1+ docs (reuse `DocumentSourceSelector`).
- Run the same AI pipeline with `scope:"skill", skillId`; generated questions saved with `skill_id`.
- Manager reviews/selects/edits (reuse `ai-questions-review`); "Tạo thêm" re-runs the pipeline.
- A "Questions" tab on the skill lists its `skill_id` questions (reuse `question-bank-table` filtered).

**Skill test creation (multi-skill):**
- Pick 1+ skills → pool = `questions WHERE skill_id IN (selected)`. Choose **level (J/M/S)** or **Random**.
- Reuse the PULL/assembly flow (`level-config-*`, `question-bank/pull`) but scoped to the skill_id set
  instead of the whole bank. Random = ignore level filter, shuffle pool.

## Reuse map (DRY)
- A's shared atoms (`question-type-picker`, `level-ratio`) + pipeline + `ai-questions-review` + PULL flow.
- The only new surfaces: skill documents/questions tabs, skill-scoped save, multi-skill test picker.

## Risks
- DB migration + RLS for `skill_id` (nullable, back-compat with global bank). Test both scopes.
- Coupling the pipeline to two scopes — keep the `context` discriminator narrow (scope + skillId only).
- Multi-skill pool with level/Random must guarantee enough questions; surface shortage (reuse banner).
- **Hard dependency on A**: skill generation reuses A's count/level/type config — A must land first.

## Success criteria
- Skill holds docs; AI generates skill-scoped questions; manager selects/edits/requests-more.
- Create a test from 1+ skills by level or Random; questions correctly scoped.
- Global QB flow unaffected (skill_id null path).

## Unresolved
- `skill_id` columns vs join table (lean columns) — confirm in plan.
- Where multi-skill test creation lives: extend create-test-workbench (add "from skills" source) vs a
  skill-area builder — confirm in plan.
- Whether a question may belong to multiple skills (join table needed) or exactly one (column ok) —
  current assumption: one skill per generated question (column).
