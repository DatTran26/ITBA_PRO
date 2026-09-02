---
title: "Talent Assessment & Workforce Evaluation Platform - Phase 1"
description: "Extend ITBA from recruitment-only to dual-mode platform with persons, positions, skills, groups, and employee evaluation"
status: completed
priority: P1
effort: 32h
branch: feat/talent-assessment-platform
tags: [database, api, ui, employee-evaluation, migration]
created: 2026-03-26
---

# Phase 1: Talent Assessment & Workforce Evaluation Platform

## Goal
Evolve ITBA from a candidate-only interview tool into a dual-mode platform supporting both **recruitment** and **employee evaluation** workflows, with person tracking, position management, skill libraries, group organization, and AI-assisted level suggestions.

## Phase Summary

| # | Phase | Status | Effort | Dependencies |
|---|-------|--------|--------|-------------|
| 1 | [Database Schema](./phase-01-database-schema.md) | **completed** | 4h | None |
| 2 | [API Foundation](./phase-02-api-foundation.md) | **completed** | 6h | Phase 1 |
| 3 | [Groups & Evaluations API](./phase-03-api-groups-evaluations.md) | **completed** | 5h | Phase 1, 2 |
| 4 | [UI Management Pages](./phase-04-ui-management-pages.md) | **completed** | 5h | Phase 2, 3 |
| 5 | [Extend Test Engine](./phase-05-extend-test-engine.md) | **completed** | 3h | Phase 1, 2 |
| 6 | [Employee Evaluation Flow](./phase-06-employee-evaluation-flow.md) | **completed** | 4h | Phase 3, 4, 5 |
| 7 | [Dashboard Dual Mode](./phase-07-dashboard-dual-mode.md) | **completed** | 3h | Phase 4, 5, 6 |
| 8 | [Data Migration](./phase-08-data-migration.md) | **completed** | 2h | Phase 1 |

## Key Decisions
- New `persons` table (candidate + employee types), migrate existing candidate data
- `tests` extended with `target_type`, `position_id`, `group_id`
- `results` linked to persons via `person_id` FK
- AI suggests level (soft warning BR-03 for Senior), human confirms
- Full Group entity with CRUD (department/batch/campaign/other)
- Skill evaluations per result, linked to skill library

## Risk Summary
- **Migration**: Existing results must remain functional during/after `persons` migration
- **RLS complexity**: New tables need ownership-based policies matching existing pattern
- **UI scope**: 4 new dashboard sections; split into focused <200 LOC components
- **Backward compat**: All existing test/result flows must continue working unchanged

## Branch Strategy
- Feature branch: `feat/talent-assessment-platform`
- DB migrations run sequentially with timestamp ordering
- Deploy phases incrementally; Phase 1 (DB) + Phase 8 (migration) can ship together
