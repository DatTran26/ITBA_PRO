---
title: "CRM Upgrade - People CRM + Skill Intelligence + Team Management"
description: "Redesign 4 dashboard pages into a connected CRM platform with notes, timeline, tags, scoring, and analytics"
status: in_progress
priority: P1
effort: 40h
branch: main
tags: [crm, redesign, persons, positions, skills, groups, analytics]
created: 2026-03-31
---

# CRM Upgrade Implementation Plan

## Summary

Transform `/dashboard/persons`, `/dashboard/positions`, `/dashboard/skills`, `/dashboard/groups` from simple CRUD listings into a connected People CRM + Skill Intelligence + Team Management platform.

## Current State

- 4 pages with basic card grids, search, and simple detail pages (~1,309 LOC total)
- 10 management components, 20 UI components
- 6 existing DB tables: persons, positions, skills, groups, group_members, position_skill_requirements
- No CRM features (notes, tags, tasks, timeline, statuses)
- No scoring/analytics (match scores, health scores, readiness)
- Skills page has no detail page

## Phases

| # | Phase | Status | Effort | Branch |
|---|-------|--------|--------|--------|
| 1 | [Database Schema & CRM Tables](./phase-01-database-schema.md) | completed | 4h | `feat/crm-upgrade/phase-01-database-schema` |
| 2 | [Shared CRM Components](./phase-02-shared-crm-components.md) | completed | 8h | `feat/crm-upgrade/phase-02-shared-components` |
| 3 | [Persons Page Redesign](./phase-03-persons-page-redesign.md) | completed | 8h | `feat/crm-upgrade/phase-03-persons-redesign` |
| 4 | [Positions Page Redesign](./phase-04-positions-page-redesign.md) | completed | 6h | `feat/crm-upgrade/phase-04-positions-redesign` |
| 5 | [Skills Page Redesign](./phase-05-skills-page-redesign.md) | completed | 6h | `feat/crm-upgrade/phase-05-skills-redesign` |
| 6 | [Groups Page Redesign](./phase-06-groups-page-redesign.md) | completed | 5h | `feat/crm-upgrade/phase-06-groups-redesign` |
| 7 | [Analytics & Scoring Engine](./phase-07-analytics-scoring-engine.md) | completed | 3h | `feat/crm-upgrade/phase-07-analytics-scoring` |

## Key Dependencies

- Phase 1 (DB) must complete before all other phases
- Phase 2 (shared components) must complete before Phases 3-6
- Phase 7 (scoring) depends on Phase 1 (DB) and can run parallel with Phases 3-6
- Phases 3-6 (page redesigns) are independent of each other

## Out of Scope

- Payroll, attendance, full performance review
- External candidate ATS pipeline
- Advanced AI automation beyond basic recommendations
- Saved views persistence (deferred to future iteration)
- Import CSV (deferred; export already exists for skills)

## Design Tokens (Reference)

- BG: `#030305` page, `#0C1220` card, `#1E2840` input
- Text: `#ECF0F7` primary, `#8B99B0` secondary, `#5A6882` muted
- Accent: `#7C8FFF` primary, `#5B6CF0` secondary, `#B48EFF` tertiary
