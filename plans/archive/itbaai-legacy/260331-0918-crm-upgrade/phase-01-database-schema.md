---
title: "Phase 1 - Database Schema & CRM Tables"
status: completed
priority: P1
effort: 4h
---

## Context Links

- [Upgrade Spec](../../upgrade.md) - Sections 6, 8
- [Existing Schema Migration](../../supabase/migrations/20260326000000_talent_assessment_schema.sql)
- [Skill Framework Migration](../../supabase/migrations/20260329000001_skill_framework.sql)
- [System Architecture](../../docs/system-architecture.md)

## Overview

Add new tables for the CRM layer: person_skills, notes, activity_logs, tags, entity_tags, tasks. Add status columns to persons, positions, groups. All tables need RLS policies following existing `created_by`-based ownership pattern.

## Key Insights

- Existing RLS pattern: ownership via `created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())`
- Notes/tags/activity_logs are polymorphic (entity_type + entity_id) rather than per-table FKs. This keeps schema DRY.
- `person_skills` table bridges person-to-skill with `current_level` (1-5 scale), matching `position_skill_requirements.required_level` for match score calculations.
- Status columns use VARCHAR with CHECK constraints, matching existing patterns (e.g., persons.type CHECK).

## Requirements

### Functional
- FR-CRM-01: Notes on persons, positions, groups
- FR-CRM-02: Activity timeline for key actions
- FR-CRM-03: Tags on persons, positions, groups
- FR-CRM-04: Tasks linked to entities
- FR-CRM-05: Configurable statuses per entity type
- FR-PER-08/09: Person-to-position skill match requires `person_skills` table

### Non-Functional
- NFR-04: RLS on all new tables
- NFR-05: Activity logs for auditability
- NFR-06: Data integrity via foreign keys and constraints

## Architecture

### New Tables

```
person_skills (person_id, skill_id, current_level 1-5)
  -> enables match score: compare person_skills.current_level vs position_skill_requirements.required_level

notes (id, entity_type, entity_id, content, note_type, is_pinned, author_id)
  -> polymorphic: entity_type IN ('person','position','group')

activity_logs (id, entity_type, entity_id, action, details JSONB, actor_id)
  -> automatic audit trail for CRM actions

tags (id, name, color, created_by)
  -> reusable tag definitions

entity_tags (id, tag_id, entity_type, entity_id)
  -> junction: link tags to any entity

tasks (id, entity_type, entity_id, title, description, status, assignee_id, due_date, created_by)
  -> follow-up tasks on entities
```

### Schema Changes to Existing Tables

```
persons: ADD COLUMN status VARCHAR DEFAULT 'active'
  CHECK (status IN ('active','in_review','training_needed','skill_gap','ready_for_promotion','on_hold','inactive'))

positions: ADD COLUMN status VARCHAR DEFAULT 'active'
  CHECK (status IN ('active','draft','review_needed','deprecated','archived'))

groups: ADD COLUMN status VARCHAR DEFAULT 'healthy'
  CHECK (status IN ('healthy','needs_attention','understaffed','skill_risk','inactive'))
```

## Related Code Files

### Files to Create
- `supabase/migrations/20260331000000_crm_layer_schema.sql`

### Files to Modify
- `src/app/dashboard/management-types.ts` (add new type interfaces)

## Implementation Steps

1. Create migration file `20260331000000_crm_layer_schema.sql`
2. Add `status` column to `persons` table with CHECK constraint and default 'active'
3. Add `status` column to `positions` table with CHECK constraint and default 'active'
4. Add `status` column to `groups` table with CHECK constraint and default 'healthy'
5. Create `person_skills` table (id, person_id FK, skill_id FK, current_level 1-5, created_at, UNIQUE(person_id, skill_id))
6. Create `notes` table (id, entity_type, entity_id, content TEXT NOT NULL, note_type VARCHAR DEFAULT 'general', is_pinned BOOLEAN DEFAULT false, author_id FK users, created_at, updated_at)
7. Create `activity_logs` table (id, entity_type, entity_id, action VARCHAR NOT NULL, details JSONB, actor_id FK users, created_at)
8. Create `tags` table (id, name VARCHAR NOT NULL, color VARCHAR DEFAULT '#7C8FFF', created_by FK users, created_at, UNIQUE(name, created_by))
9. Create `entity_tags` table (id, tag_id FK tags, entity_type, entity_id, created_at, UNIQUE(tag_id, entity_type, entity_id))
10. Create `tasks` table (id, entity_type, entity_id, title VARCHAR NOT NULL, description TEXT, status VARCHAR DEFAULT 'pending' CHECK IN ('pending','in_progress','completed','cancelled'), assignee_id FK users, due_date DATE, created_by FK users, created_at, updated_at)
11. Add RLS policies for all new tables following ownership pattern
12. Add indexes on entity_type+entity_id for polymorphic lookups, person_id/skill_id for person_skills
13. Update `management-types.ts` with new TypeScript interfaces

### RLS Policy Pattern for Polymorphic Tables (notes, activity_logs, entity_tags, tasks)

For tables that reference entities by `entity_type` + `entity_id`, RLS uses author/creator ownership:
- SELECT: `author_id/actor_id/created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())`
- INSERT: same WITH CHECK
- UPDATE/DELETE: same USING

For `person_skills`:
- Inherit from persons table: `person_id IN (SELECT id FROM persons WHERE created_by IN (SELECT id FROM users WHERE auth_id = auth.uid()))`

## Todo

- [x] Create migration SQL file
- [x] Add status columns to persons, positions, groups
- [x] Create person_skills table
- [x] Create notes table
- [x] Create activity_logs table
- [x] Create tags + entity_tags tables
- [x] Create tasks table
- [x] Add RLS policies for all new tables
- [x] Add performance indexes
- [x] Update management-types.ts with new interfaces
- [x] Run migration against Supabase
- [x] Verify RLS policies work correctly

## Success Criteria

- All new tables created with proper constraints and defaults
- RLS policies enforce data isolation per user
- Indexes on frequently queried columns (entity_type+entity_id, person_id, skill_id)
- TypeScript interfaces match database schema
- Migration runs without errors on clean and existing databases

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration fails on production | High | Test on Supabase staging first; use IF NOT EXISTS |
| RLS policies too restrictive | Medium | Admin role should bypass; test with both admin and recruiter |
| Polymorphic FK integrity | Low | App-level validation since DB can't enforce FK on entity_id generically |

## Security Considerations

- RLS enforces row-level access: users can only see/edit their own data
- Admin users bypass write restrictions via role check
- Activity logs are insert-only (no update/delete for audit integrity)
- Notes support is_pinned but not visibility levels (all notes visible to owner)

## Next Steps

- Phase 2 depends on these tables for CRM component data
- Phase 7 depends on person_skills for match score calculations
