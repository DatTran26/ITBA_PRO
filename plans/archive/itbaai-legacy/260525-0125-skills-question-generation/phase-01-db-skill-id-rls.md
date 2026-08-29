---
phase: 1
title: "DB skill_id + RLS"
status: complete
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: DB skill_id + RLS

## Overview
Add nullable `skill_id` scoping to documents + questions so generation/questions can belong to a skill,
while `null` keeps the existing global question-bank behavior.

## Requirements
- Functional: `document_sources.skill_id` and `questions.skill_id` (nullable FK → skills.id). Null = global
  bank (today); set = skill-scoped. Assume one skill per generated question (column, not join) for v1.
- Non-functional: RLS allows reading/writing skill-scoped rows per existing role model; global path unchanged.

## Architecture
- Supabase migration: `ALTER TABLE document_sources ADD COLUMN skill_id uuid REFERENCES skills(id)`,
  same for `questions`; indexes on `skill_id`. Update RLS policies to include skill-scoped access.
- Regenerate types if the project tracks generated Supabase types.

## Related Code Files
- Create: `supabase/migrations/<ts>_add_skill_id.sql`
- Modify: RLS policies; generated DB types (if any); `question-bank-types.ts` if it mirrors columns.

## Implementation Steps
1. `list_tables`/read schema for `questions`, `document_sources`, `skills`.
2. Migration: add nullable `skill_id` FKs + indexes.
3. RLS: extend policies for skill-scoped rows; keep null-skill (global) working.
4. Regenerate types; `npx tsc --noEmit`.

## Success Criteria
- [x] `skill_id` columns + FKs + indexes exist; types updated.
- [x] Global bank queries (skill_id null) unchanged; skill-scoped read/write allowed by RLS.

## Risk Assessment
- Risk: RLS regression exposing/hiding rows. Mitigation: test both scopes (global + skill) explicitly.
