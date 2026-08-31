---
phase: 5
title: "Verify"
status: complete
priority: P2
effort: "0.5d"
dependencies: [4]
---

# Phase 5: Verify

## Overview
Validate skill generation + multi-skill test creation end-to-end; ensure global QB unaffected.

## Implementation Steps
1. `npx tsc --noEmit` → 0 errors; `npm run build` → exit 0.
2. Skill flow: upload doc to a skill → generate (count/level/types) → review/select/edit → saved with skill_id.
3. Skill Questions tab shows only that skill's questions; "tạo thêm" re-runs pipeline.
4. Multi-skill test: select 2 skills → pool → level test AND Random test → both assemble correctly.
5. Regression: global QB pipeline + global bank test creation unchanged (skill_id null path).
6. RLS: verify a user can't read another scope's skill questions improperly.

## Success Criteria
- [x] tsc clean + build exit 0.
- [x] Skill-scoped generation + questions + multi-skill (level & Random) tests work.
- [x] Global QB + bank flows unaffected; RLS correct for both scopes.

## Risk Assessment
- Risk: edge fn + RLS only fully verifiable on live Supabase. Mitigation: staging project test; server-side scope enforcement.
