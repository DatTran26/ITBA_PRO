# Brainstorm Report: Talent Assessment & Workforce Evaluation Platform

**Date**: 2026-03-26
**Status**: Decisions finalized, ready for planning

---

## Problem Statement

ITBA is currently a candidate-only interview test platform (5 tables, 13 API routes, 6 pages). The business needs to expand it into a **Talent Assessment & Workforce Evaluation Platform** that also supports internal employee evaluation, skill tracking, level assessment, and competency checklists.

---

## Key Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Person model | New `persons` table | Clean separation from auth `users`. Supports both candidate + employee types |
| 2 | MVP scope | Full Phase 1 | Person + Position + Skill library + Checklist + Employee tracking + Group entity |
| 3 | Level decision | AI suggests, human confirms | Balance of automation + reviewer control |
| 4 | Architecture | Shared infrastructure | Extend existing tests/questions/results with `target_type`. Reuse AI, scoring, UI. DRY |
| 5 | Senior rule (BR-03) | Soft warning with override | Flags missing mandatory items, reviewer can override with justification |
| 6 | Data migration | Migrate existing candidates to persons | Full consistency. Create person records from result candidate_name/email |
| 7 | Grouping | Full Group entity with CRUD | Dedicated groups table, types (department/batch/campaign), management UI |

---

## Current State → Target State

### Database (Phase 1)
**Current (5 tables)**: users, tests, questions, results, follow_up_sessions
**Target (~12 tables)**: + persons, positions, skills, position_skill_requirements, competency_checklists, checklist_items, skill_evaluations, groups, group_members

### Key Schema Changes
- `results` table: add `person_id` FK → persons table (migrate existing candidate_name/email)
- `tests` table: add `target_type` (candidate/employee), `group_id`, `position_id` fields
- `persons`: id, full_name, email, type (candidate/employee), department, position_id, current_level, joined_date
- `positions`: id, title, department, description, target_level
- `skills`: id, name, category, description
- `position_skill_requirements`: position_id, skill_id, required_level, is_mandatory, checklist_order
- `groups`: id, name, type (department/batch/campaign), description
- `skill_evaluations`: result_id, skill_id, score, status, reviewer_comment, ai_insight

### API Routes (New)
- `/api/persons` — CRUD for persons (candidate + employee)
- `/api/positions` — CRUD for positions
- `/api/skills` — CRUD for skill library
- `/api/positions/[id]/requirements` — Manage skill requirements per position
- `/api/groups` — CRUD for groups
- `/api/evaluations/[id]/skills` — Per-skill evaluation for a result
- `/api/ai/evaluate-level` — AI-powered level suggestion based on checklist coverage

### Dashboard Pages (New/Modified)
- `/dashboard` — Modified: dual mode (Recruitment / Employee Evaluation tabs)
- `/dashboard/persons` — Person management (list, filter by type)
- `/dashboard/positions` — Position management with skill requirements
- `/dashboard/skills` — Skill library management
- `/dashboard/groups` — Group management
- `/dashboard/results/[id]` — Modified: add skill evaluation section, level suggestion

---

## Architecture Approach: Shared Infrastructure

```
┌─────────────────────────────────────────────────┐
│              Shared Test Engine                   │
│  tests → questions → results → follow_up         │
│  (target_type: candidate | employee)             │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐    ┌──────────────────────┐    │
│  │ Recruitment   │    │ Employee Evaluation   │    │
│  │ - candidates  │    │ - employees           │    │
│  │ - hiring flow │    │ - skill checklist     │    │
│  │ - pass/fail   │    │ - level assessment    │    │
│  └──────────────┘    │ - coverage %          │    │
│                       │ - promotion readiness │    │
│                       └──────────────────────┘    │
├─────────────────────────────────────────────────┤
│           New Foundation Layer                    │
│  persons → positions → skills → requirements     │
│  groups → skill_evaluations                      │
└─────────────────────────────────────────────────┘
```

Benefits:
- Reuse existing AI question generation for both types
- Reuse existing result scoring and analysis
- Reuse existing dashboard components (cards, charts)
- Single codebase, single deploy

Risks:
- `tests` table gets more fields → may need careful migration
- UI must clearly separate candidate vs employee context
- RLS policies grow more complex

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large migration scope | Data loss | Run migration in transaction, backup first, test on staging |
| UI confusion (candidate vs employee) | UX | Clear tab separation, different color accents per mode |
| Checklist complexity | Dev time | Start with simple boolean checklist items, extend later |
| AI level suggestion accuracy | Trust | Soft warning approach — AI suggests, human confirms |
| Performance with more tables/joins | Speed | Proper indexes, consider denormalized fields for dashboards |

---

## Phase 1 Deliverables (MVP)

1. **Database**: New tables + migration of existing candidate data
2. **Person Management**: CRUD + list with type filter
3. **Position Management**: CRUD + skill requirements assignment
4. **Skill Library**: CRUD + categories
5. **Competency Checklist**: Per-position checklist linked to skills
6. **Group Management**: CRUD + member assignment
7. **Shared Test Engine**: Extend tests/results with target_type, position_id, group_id
8. **Employee Evaluation Flow**: Assign test → take → score → skill evaluation → level suggestion
9. **Dashboard Updates**: Dual mode tabs, employee metrics
10. **Data Migration**: Existing candidates → persons table

---

## Out of Scope (Phase 2+)

- AI token usage monitoring (Phase 3)
- Pending tool/job monitoring (Phase 3)
- Training recommendation engine (Phase 3)
- Promotion readiness analysis (Phase 3)
- Full level calculation engine with Senior hard-block option (Phase 2)
- Employee-specific dashboard widgets (Phase 2)

---

## Next Steps

Create detailed implementation plan with phased approach:
- Phase 1A: Database schema + migrations + persons/positions/skills CRUD
- Phase 1B: Checklist system + group management
- Phase 1C: Extend test engine + employee evaluation flow
- Phase 1D: Dashboard updates + data migration
