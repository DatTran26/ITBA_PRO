---
phase: 4
title: "Verify"
status: pending
priority: P2
effort: "0.5d"
dependencies: [3]
---

# Phase 4: Verify

## Overview
Validate the full generation-config flow end-to-end and guard against regressions.

## Requirements
- Functional: full pipeline works (upload → extract → topic-review WITH config → generate → review → save);
  generated questions reflect per-topic count, level ratio, and selected types.
- Non-functional: `npx tsc --noEmit` clean; `npm run build` exit 0.

## Implementation Steps
1. `npx tsc --noEmit` → 0 errors.
2. `npm run build` → exit 0, all pages generated.
3. Manual: upload a doc, reach topic-review, set per-topic counts + ratio + types, Generate.
   - Verify generated count per topic, level spread, types restricted.
   - Verify Generate disabled states (no topics / bad ratio / no types / over cap).
4. Backward-compat check: trigger generation path without config (or via existing entry) → still works.
5. (If shortage UI added) confirm shortage surfaces in question-review.

## Success Criteria
- [ ] tsc clean + build exit 0.
- [ ] Config respected in generated output (count/level/type) within tolerance.
- [ ] No regression to topic edit/approve/remove or existing generation default.

## Risk Assessment
- Risk: edge fn behavior only verifiable against live Supabase. Mitigation: test in staging project;
  document expected vs actual; keep server post-validation as the safety net.
