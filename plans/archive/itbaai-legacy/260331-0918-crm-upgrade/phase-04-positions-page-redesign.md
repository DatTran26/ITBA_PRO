---
title: "Phase 4 - Positions Page Redesign (Role Intelligence Center)"
status: completed
priority: P2
effort: 6h
---

## Context Links

- [Upgrade Spec](../../upgrade.md) - Section 5.2, FR-POS-01 through FR-POS-06
- [Current positions-list-client.tsx](../../src/app/dashboard/positions/positions-list-client.tsx) (81 LOC)
- [Current position-detail-client.tsx](../../src/app/dashboard/positions/[id]/position-detail-client.tsx) (175 LOC)
- [Phase 2 Shared Components](./phase-02-shared-crm-components.md)

## Overview

Redesign positions from a simple card list into a Role Intelligence Center. Add KPIs, analytics cards, readiness scores, and transform the detail page into a tabbed view with overview, skills, assigned persons, gap analysis, assessments, and career path.

## Key Insights

- Current list: search + card grid showing title/department/level/req count. 81 LOC.
- Current detail: profile card + skill requirements management (add/remove/toggle). 175 LOC. This is the most complex existing detail page.
- Skill requirements management must be preserved — it's core functionality.
- Readiness score = average match_score of all persons assigned to this position.
- Position comparison is a nice-to-have; implement as a simple side-by-side drawer.

## Requirements

### Functional
- **FR-POS-01**: Position listing with summary metrics (assigned persons count, readiness score, skill req count)
- **FR-POS-02**: Skill templates (existing — preserve and enhance)
- **FR-POS-03**: Detail page with 6 tabs
- **FR-POS-04**: Readiness score based on assigned persons' match
- **FR-POS-05**: Position comparison (simplified: side-by-side skills)
- **FR-POS-06**: Position cloning

### Non-Functional
- Preserve existing skill requirement CRUD
- Under 200 LOC per file
- Desktop-first responsive

## Architecture

### List Page Structure

```
PositionsPage (Server)
  -> fetches positions with counts (skill_reqs, assigned_persons, readiness_score)
  -> passes to PositionsListClient

PositionsListClient
  ├── KpiCardGrid (Total, Active, Missing Templates, Low Readiness, No Assigned Persons)
  ├── FilterBar (search, department, level, status)
  ├── ViewSwitcher (card | table)
  ├── PositionsCardView (enhanced cards with readiness + person count)
  └── PositionsTableView (data-table)
```

### Detail Page Structure

```
PositionDetailPage (Server)
  -> fetches position, requirements, assigned persons, notes, tags, activity

PositionDetailClient
  ├── PositionHeader (title, department, level, status, quick actions)
  ├── Tabs
  │   ├── PositionOverviewTab (description, status, created date, tags)
  │   ├── PositionSkillsTab (existing requirements management, enhanced)
  │   ├── PositionPersonsTab (assigned persons with match scores)
  │   ├── PositionGapAnalysisTab (most common missing skills across assigned persons)
  │   ├── PositionAssessmentsTab (linked assessment templates)
  │   └── PositionNotesTab (notes + timeline)
  └── Clone action, Compare action
```

## Related Code Files

### Files to Modify
- `src/app/dashboard/positions/page.tsx` — expand query with joins
- `src/app/dashboard/positions/positions-list-client.tsx` — full redesign
- `src/app/dashboard/positions/[id]/page.tsx` — expand query
- `src/app/dashboard/positions/[id]/position-detail-client.tsx` — redesign into tabs
- `src/app/dashboard/management-types.ts` — extend PositionListItem, PositionDetail

### Files to Create
- `src/app/dashboard/positions/positions-table-view.tsx` (~80 LOC)
- `src/app/dashboard/positions/positions-card-view.tsx` (~70 LOC)
- `src/app/dashboard/positions/[id]/position-header.tsx` (~60 LOC)
- `src/app/dashboard/positions/[id]/position-overview-tab.tsx` (~60 LOC)
- `src/app/dashboard/positions/[id]/position-skills-tab.tsx` (~120 LOC) — refactored from existing req management
- `src/app/dashboard/positions/[id]/position-persons-tab.tsx` (~80 LOC)
- `src/app/dashboard/positions/[id]/position-gap-analysis-tab.tsx` (~80 LOC)
- `src/app/dashboard/positions/[id]/position-assessments-tab.tsx` (~50 LOC)
- `src/app/dashboard/positions/[id]/position-notes-tab.tsx` (~50 LOC)

## Implementation Steps

### Part A: List Page (Steps 1-5)

1. Extend `PositionListItem` in management-types: add `status`, `assigned_persons_count`, `readiness_score`.
2. Update `positions/page.tsx`: query positions with person count (persons where position_id = this), skill_reqs count. Compute KPI values.
3. Rewrite `positions-list-client.tsx`: KpiCardGrid, FilterBar (search, department, level, status), ViewSwitcher (card/table).
4. Create `positions-card-view.tsx`: enhanced cards with readiness score ring, assigned persons count, gap indicators.
5. Create `positions-table-view.tsx`: data-table columns — title, department, level, skill reqs, assigned persons, readiness, status, actions.

### Part B: Detail Page (Steps 6-13)

6. Update `positions/[id]/page.tsx`: fetch additional data — assigned persons with match scores, notes, tags, activity_logs.
7. Create `position-header.tsx`: title, department badge, level badge, status badge, clone button, edit button.
8. Rewrite `position-detail-client.tsx` as tab coordinator with 6 tabs.
9. Create `position-overview-tab.tsx`: description, status, department, target level, tags, created date.
10. Create `position-skills-tab.tsx`: refactor existing skill requirement management from current detail page. Keep add/remove/toggle/level change functionality. Enhance with visual level bars.
11. Create `position-persons-tab.tsx`: list persons assigned to this position. Show each person's match score, missing skills count. Link to person detail.
12. Create `position-gap-analysis-tab.tsx`: aggregate missing skills across all assigned persons. Show most common gaps, recommended training priorities.
13. Create `position-assessments-tab.tsx`: list linked assessment templates (from assessment_templates table where job_role matches).
14. Create `position-notes-tab.tsx`: NotesPanel + ActivityTimeline for this position.

### Part C: Actions (Steps 15-16)

15. Add clone handler: POST /api/positions with cloned data (title + " (Copy)") and copy skill requirements.
16. Add status update: PATCH /api/positions/[id] with status field.

## Todo

- [x] Extend position types in management-types.ts
- [x] Update positions list page.tsx query
- [x] Redesign positions-list-client.tsx with KPIs and filters
- [x] Create positions-table-view.tsx
- [x] Create positions-card-view.tsx with readiness scores
- [x] Update position detail page.tsx with expanded queries
- [x] Create position-header.tsx
- [x] Redesign position-detail-client.tsx with tabs
- [x] Create position-overview-tab.tsx
- [x] Create position-skills-tab.tsx (refactor from existing)
- [x] Create position-persons-tab.tsx
- [x] Create position-gap-analysis-tab.tsx
- [x] Create position-assessments-tab.tsx
- [x] Create position-notes-tab.tsx
- [x] Implement position cloning
- [x] Add status management

## Success Criteria

- KPIs show real metrics (total, active, missing templates, low readiness, unassigned)
- Card and table views render with readiness scores
- Detail page preserves existing skill requirement management
- Assigned persons tab shows match scores per person
- Gap analysis identifies common missing skills
- Position can be cloned with skill requirements
- Status can be updated via badge click or header action
- All files under 200 LOC

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Refactoring skill requirements breaks existing functionality | High | Extract to separate tab file; keep same API calls |
| Readiness score calculation slow with many persons | Medium | Compute in Phase 7 scoring engine; cache in DB column |
| Gap analysis query complexity | Low | Aggregate in server component query |

## Security Considerations

- Position data scoped to user via RLS
- Clone creates new record owned by current user
- Status changes logged to activity_logs

## Next Steps

- Phase 7 provides readiness_score calculation logic
- Gap analysis data feeds into Skills page analytics (Phase 5)
