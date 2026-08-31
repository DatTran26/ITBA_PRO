---
title: "Question Bank Generation Config"
description: ""
status: complete
priority: P2
branch: "feat/qb-generation-config"
tags: []
blockedBy: []
blocks: [260525-0125-skills-question-generation]
created: "2026-05-24T18:21:49.281Z"
createdBy: "ck:plan"
source: skill
---

# Question Bank Generation Config

## Overview

Add a generation-config UI at the **topic-review** step of the QB AI pipeline so users set, before
generation: **per-topic question count**, **one global Junior/Middle/Senior level ratio**, and a
**global multi-select of question types**. The `generate-questions` API + edge function honor the
config and post-validate. Backward compatible (config omitted → current behavior). Shared config
atoms (type-picker + level-ratio) are extracted so the PULL flow (`level-config-*`) and this GENERATE
flow reuse them (DRY). Source: [brainstorm report](../reports/brainstorm-260525-0100-qb-generation-config.md).

**Out of scope:** B (skills generation reuse) and C (results table + essay grading) — separate plans.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Shared config atoms](./phase-01-shared-config-atoms.md) | Complete |
| 2 | [Topic-review config UI](./phase-02-topic-review-config-ui.md) | Complete |
| 3 | [Generate API + edge function](./phase-03-generate-api-edge-function.md) | Complete |
| 4 | [Verify](./phase-04-verify.md) | Complete |

## Dependencies

- No blocking cross-plan dependency. `plans/260524-1544-component-consolidation` touched
  `level-config-*` (PULL flow); Phase 1 here extracts atoms from those files — land/merge the
  consolidation PR first to avoid conflicts, but not a hard blocker.

## Open decisions (resolve during implementation)
- Level-ratio control style: 3 number inputs vs dual-handle slider (reuse `level-config-selectors` slider).
- Where per-level shortage shows if AI underproduces: banner at question-review step (reuse `level-config-shortage-banner` pattern).
- Default question-type set + soft cap on total questions (cost guard).
