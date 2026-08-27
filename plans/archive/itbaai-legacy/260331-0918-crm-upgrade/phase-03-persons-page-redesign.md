---
title: "Phase 3 - Persons Page Redesign (People CRM)"
status: completed
priority: P1
effort: 8h
---

## Context Links

- [Upgrade Spec](../../upgrade.md) - Section 5.1, FR-PER-01 through FR-PER-10
- [Current persons-list-client.tsx](../../src/app/dashboard/persons/persons-list-client.tsx) (93 LOC)
- [Current person-detail-client.tsx](../../src/app/dashboard/persons/[id]/person-detail-client.tsx) (128 LOC)
- [Phase 2 Shared Components](./phase-02-shared-crm-components.md)

## Overview

Redesign the Persons list page and detail page into the main People CRM hub. Add KPIs, advanced filters, table/card/kanban views, and transform the detail page into a tabbed CRM profile with overview, skills matrix, assessments, notes/timeline, development, and relationships.

## Key Insights

- Current list page: tab filter (all/candidate/employee), search, card grid only. 93 LOC.
- Current detail page: single profile card + groups list + assessment history. 128 LOC.
- Server component (`page.tsx`) fetches data and passes to client. Keep this pattern.
- Person statuses (active, in_review, training_needed, etc.) enable kanban view columns.
- Match score = compare person_skills.current_level vs position_skill_requirements for assigned position.
- Must keep existing "Add Person" dialog working (PersonFormDialog).

## Requirements

### Functional
- **FR-PER-01**: Searchable, filterable person list with multiple view modes
- **FR-PER-02**: Table, card, kanban views
- **FR-PER-03**: Full profile page with 6 tabs
- **FR-PER-04**: Assign person to group and position (existing)
- **FR-PER-05**: Status management with status badge
- **FR-PER-06**: Notes CRUD on person profile
- **FR-PER-07**: Tag management on persons
- **FR-PER-08**: Match score display per person
- **FR-PER-09**: Missing skills detection
- **FR-PER-10**: Bulk actions (assign group, update status, add tag)

### Non-Functional
- Server component fetches core data; client handles interactivity
- Each file under 200 LOC — split detail page into tab-specific components
- Responsive: desktop-first, functional on tablet

## Architecture

### List Page Structure

```
PersonsPage (Server)
  -> fetches persons with joins (position title, group count, person_skills count, tags)
  -> passes to PersonsListClient

PersonsListClient
  ├── KpiCardGrid (Total, Active, Skill Gaps, Needing Review, No Group, No Position)
  ├── FilterBar (search, group, position, level, status, type)
  ├── ViewSwitcher (table | card | kanban)
  ├── BulkActionBar (when items selected)
  ├── PersonsTableView (data-table with columns)
  ├── PersonsCardView (existing card grid, enhanced)
  └── PersonsKanbanView (kanban-board by status)
```

### Detail Page Structure

```
PersonDetailPage (Server)
  -> fetches person, skills, notes, tags, activity, results, memberships
  -> passes to PersonDetailClient

PersonDetailClient
  ├── PersonProfileHeader (avatar, name, status, tags, match score, quick actions)
  ├── Tabs
  │   ├── PersonOverviewTab (summary, position, group, level, warnings)
  │   ├── PersonSkillsTab (skill matrix: current vs required)
  │   ├── PersonAssessmentsTab (test history, scores)
  │   ├── PersonNotesTab (notes-panel + activity-timeline)
  │   ├── PersonDevelopmentTab (tasks, goals — future, placeholder for now)
  │   └── PersonRelationshipsTab (groups, related persons — simplified)
  └── DetailDrawer (quick edit from list page)
```

## Related Code Files

### Files to Modify
- `src/app/dashboard/persons/page.tsx` — expand query to include joins for KPIs and filters
- `src/app/dashboard/persons/persons-list-client.tsx` — full redesign with new components
- `src/app/dashboard/persons/[id]/page.tsx` — expand query for skills, notes, tags, activity
- `src/app/dashboard/persons/[id]/person-detail-client.tsx` — full redesign with tabs
- `src/app/dashboard/management-types.ts` — extend PersonListItem and PersonDetail

### Files to Create
- `src/app/dashboard/persons/persons-table-view.tsx` (~80 LOC)
- `src/app/dashboard/persons/persons-card-view.tsx` (~70 LOC)
- `src/app/dashboard/persons/persons-kanban-view.tsx` (~60 LOC)
- `src/app/dashboard/persons/[id]/person-profile-header.tsx` (~80 LOC)
- `src/app/dashboard/persons/[id]/person-overview-tab.tsx` (~80 LOC)
- `src/app/dashboard/persons/[id]/person-skills-tab.tsx` (~100 LOC)
- `src/app/dashboard/persons/[id]/person-assessments-tab.tsx` (~70 LOC)
- `src/app/dashboard/persons/[id]/person-notes-tab.tsx` (~50 LOC)
- `src/app/dashboard/persons/[id]/person-development-tab.tsx` (~40 LOC)
- `src/app/dashboard/persons/[id]/person-relationships-tab.tsx` (~50 LOC)

## Implementation Steps

### Part A: List Page Redesign (Steps 1-8)

1. Update `management-types.ts`: extend `PersonListItem` with `status`, `tags` (array), `match_score` (optional number), `group_names` (string[]).
2. Update `persons/page.tsx` server component: expand query to join tags, compute KPI counts (total, active, with skill gaps, needing review, no group, no position).
3. Rewrite `persons-list-client.tsx` as coordinator: import KpiCardGrid, FilterBar, ViewSwitcher, BulkActionBar. Manage view state, filter state, selection state.
4. Create `persons-table-view.tsx`: use DataTable component with columns — name, email, group, position, level, match score, status, last activity.
5. Create `persons-card-view.tsx`: enhanced card grid with status badge, match score ring, tag chips, missing skills count. Reuse existing card layout patterns.
6. Create `persons-kanban-view.tsx`: use KanbanBoard with columns per person status. Each kanban card shows name, position, match score.
7. Add bulk action support: checkbox selection in table view, BulkActionBar with actions (assign group, update status, add tag).
8. Add status update handler: PATCH /api/persons/[id] with new status field.

### Part B: Detail Page Redesign (Steps 9-17)

9. Update `persons/[id]/page.tsx`: fetch additional data — person_skills (with skill names), notes, entity_tags (with tag details), activity_logs, tasks.
10. Create `person-profile-header.tsx`: large avatar, name, position, status badge, tag chips, match score ring, quick action buttons (edit, assign group, add note, add tag).
11. Rewrite `person-detail-client.tsx` as tab coordinator: Tabs component with 6 tabs, each rendering a sub-component.
12. Create `person-overview-tab.tsx`: personal info summary, current position + group, level, joined date, warnings/alerts (no position, skill gap).
13. Create `person-skills-tab.tsx`: two-column layout — current skills (from person_skills) vs required skills (from position_skill_requirements). Show gaps highlighted in red, matches in green. Add/remove person skills via API.
14. Create `person-assessments-tab.tsx`: migrate existing assessment history list from current detail page. Add score badges and status.
15. Create `person-notes-tab.tsx`: render NotesPanel + ActivityTimeline side by side (or stacked on mobile). NotesPanel handles CRUD via /api/notes.
16. Create `person-development-tab.tsx`: placeholder with tasks list from /api/tasks. Shows title, status, due date, assignee.
17. Create `person-relationships-tab.tsx`: groups list (existing) + persons in same position/group. Link to related entities.

### Part C: API Updates (Steps 18-19)

18. Update `src/app/api/persons/[id]/route.ts`: add PATCH handler for status updates. Add status to POST/PUT validation.
19. Ensure PersonFormDialog still works: update it to include status field if editing an existing person.

## Todo

- [x] Extend management-types.ts with new fields
- [x] Update persons page.tsx server query with joins
- [x] Redesign persons-list-client.tsx with KPIs, filters, views
- [x] Create persons-table-view.tsx
- [x] Create persons-card-view.tsx
- [x] Create persons-kanban-view.tsx
- [x] Add bulk action support
- [x] Update person detail page.tsx with expanded queries
- [x] Create person-profile-header.tsx
- [x] Redesign person-detail-client.tsx with tabs
- [x] Create person-overview-tab.tsx
- [x] Create person-skills-tab.tsx with gap analysis
- [x] Create person-assessments-tab.tsx
- [x] Create person-notes-tab.tsx
- [x] Create person-development-tab.tsx
- [x] Create person-relationships-tab.tsx
- [x] Update persons API for status PATCH
- [x] Verify PersonFormDialog compatibility

## Success Criteria

- List page shows KPI cards with real counts from DB
- All 3 views (table/card/kanban) render correctly with person data
- Filters narrow results as expected
- Kanban columns match person status values
- Detail page tabs all render with correct data
- Skills tab shows current vs required comparison
- Notes can be created, pinned, and deleted
- Tags can be added and removed
- Match score displays when person has assigned position + skills
- All files under 200 LOC

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Server query too slow with many joins | Medium | Use selective joins; only fetch counts for list, full data for detail |
| Large persons list performance | Medium | Implement pagination in table view (data-table-pagination) |
| PersonFormDialog breaks after type changes | Low | Test dialog compatibility before full redesign |

## Security Considerations

- Person data scoped to authenticated user via RLS
- Status changes logged in activity_logs via log-activity helper
- Bulk actions check auth for every item (server-side)

## Next Steps

- After completion, Persons page serves as reference implementation for Phases 4-6
- Phase 7 scoring engine provides actual match_score values
