---
title: "Skills Question Generation + Skill Tests"
description: ""
status: pending
priority: P2
branch: "feat/skills-question-generation"
tags: []
blockedBy: [260525-0100-qb-generation-config]
blocks: []
created: "2026-05-24T18:33:47.747Z"
createdBy: "ck:plan"
source: skill
---

# Skills Question Generation + Skill Tests

## Overview

A skill (belongs to a position) holds 1+ documents → reuse the QB AI generation engine scoped via
`context:{scope:"skill",skillId}` to produce **skill-scoped** questions; manager selects/edits/requests-more.
Create tests from **1+ skills** (pooled questions) by level (J/M/S) or **Random**. Reuses A's pipeline +
shared atoms + PULL flow (DRY). Source:
[brainstorm report](../reports/brainstorm-260525-0125-skills-question-generation.md).

**Depends on A** (`260525-0100-qb-generation-config`) — skill generation reuses A's count/level/type config.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [DB skill_id + RLS](./phase-01-db-skill-id-rls.md) | Complete |
| 2 | [Skill documents + generation](./phase-02-skill-documents-generation.md) | Complete |
| 3 | [Skill questions tab](./phase-03-skill-questions-tab.md) | Complete |
| 4 | [Multi-skill test creation](./phase-04-multi-skill-test-creation.md) | Complete |
| 5 | [Verify](./phase-05-verify.md) | Complete |

## Dependencies
- **blockedBy:** `260525-0100-qb-generation-config` (A) — reuses A's generation config + shared atoms.

## Open decisions (resolve during implementation)
- `skill_id` columns on `questions`/`document_sources` vs join table (lean: nullable columns; one skill per generated question).
- Multi-skill test creation location: extend `create-test-workbench` with a "from skills" source vs a skill-area builder.
- RLS for skill-scoped vs global (null skill_id) questions.
