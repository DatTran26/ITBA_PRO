---
phase: 4
title: "Multi-skill test creation"
status: complete
priority: P1
effort: "1d"
dependencies: [1, 3]
---

# Phase 4: Multi-skill test creation

## Overview
Create a test from **1+ skills**: pool the selected skills' questions, then choose level (J/M/S) or **Random**.

## Requirements
- Functional: a skill multi-select → pool = `questions WHERE skill_id IN (selected)`. Choose level
  (single J/M/S or mixed ratio) or **Random** (ignore level, shuffle pool). Assemble + create the test.
- Non-functional: reuse PULL assembly (`question-bank/pull` + `level-config-*`) scoped to the skill set; no fork.

## Architecture
- Add a "from skills" source path. Two placement options (decide in impl):
  (a) extend `create-test-workbench` with a third source (alongside ai/bank) = "skills", OR
  (b) a focused builder in the skills area. Lean to (a) for DRY (reuses existing assembly + advanced settings).
- Pull API (`/api/question-bank/pull`) gains a `skillIds` filter + a `random` mode (shuffle, ignore level).

## Related Code Files
- Modify: `src/app/api/question-bank/pull/route.ts` (skillIds filter + random mode)
- Modify: `create-test-workbench` source selector (add "skills") OR new skill test builder
- Reuse: `level-config-*` (level/ratio), `question-pull-preview`

## Implementation Steps
1. Pull API: accept `skillIds` + `random`; pool from skill-scoped questions.
2. UI: skill multi-select + level/Random choice; preview pulled questions; create test.
3. Random mode: shuffle pool to `total`, ignore level filter.
4. `npx tsc --noEmit`.

## Success Criteria
- [x] Create a test from 1+ skills by level or Random; questions scoped to selected skills.
- [x] Existing AI/bank test creation paths unchanged.

## Risk Assessment
- Risk: pool too small for requested total. Mitigation: reuse shortage banner; cap to available.
- Risk: bloating create-test-workbench. Mitigation: add source as a small component, not inline.
