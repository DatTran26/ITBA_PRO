---
title: "Phase 6 - Groups Page Redesign (Team Workspace)"
status: completed
priority: P2
effort: 5h
---

## Context Links

- [Upgrade Spec](../../upgrade.md) - Section 5.4, FR-GRP-01 through FR-GRP-05
- [Current groups-list-client.tsx](../../src/app/dashboard/groups/groups-list-client.tsx) (89 LOC)
- [Current group-detail-client.tsx](../../src/app/dashboard/groups/[id]/group-detail-client.tsx) (127 LOC)
- [Phase 2 Shared Components](./phase-02-shared-crm-components.md)

## Overview

Transform Groups from a simple member list into a Team Workspace with health scores, skill coverage analysis, and team metrics. Redesign the detail page with tabs for overview, members, positions, skill coverage, assessments, and notes.

## Key Insights

- Current list: tab filter by type (department/batch/campaign/other), card grid showing name/type/member count. 89 LOC.
- Current detail: group info card + member list with add/remove. 127 LOC.
- Group health score = composite of role coverage + skill coverage + assessment completion.
- Groups don't directly link to positions — relationship is through members' position_id. Need to derive.
- Skill coverage heatmap = for each skill required by members' positions, show how many members have it vs need it.
- MemberPickerDialog already exists and works — preserve it.

## Requirements

### Functional
- **FR-GRP-01**: Group listing with team metrics (member count, health score, skill coverage %)
- **FR-GRP-02**: Detail page with 6 tabs
- **FR-GRP-03**: Group health score calculation and display
- **FR-GRP-04**: Member assignment (existing, preserve)
- **FR-GRP-05**: Skill and role coverage visibility

### Non-Functional
- Preserve existing MemberPickerDialog
- Under 200 LOC per file
- Desktop-first responsive

## Architecture

### List Page Structure

```
GroupsPage (Server)
  -> fetches groups with member_count, health_score, position_count
  -> passes to GroupsListClient

GroupsListClient
  ├── KpiCardGrid (Total, Total Members, Under Capacity, High Skill Risk, Avg Health)
  ├── FilterBar (search, type, status)
  ├── ViewSwitcher (card | table)
  ├── GroupsCardView (enhanced cards with health score, member count, alerts)
  └── GroupsTableView (data-table)
```

### Detail Page Structure

```
GroupDetailPage (Server)
  -> fetches group, members with positions/skills, notes, tags, activity

GroupDetailClient
  ├── GroupHeader (name, type badge, status badge, health score ring, actions)
  ├── Tabs
  │   ├── GroupOverviewTab (summary, lead, member count, active positions, status)
  │   ├── GroupMembersTab (existing member list, enhanced with roles + readiness)
  │   ├── GroupPositionsTab (positions held by members, filled vs unfilled)
  │   ├── GroupSkillCoverageTab (skill heatmap: strongest, weakest, critical gaps)
  │   ├── GroupAssessmentsTab (completion rate, pending, pass/fail)
  │   └── GroupNotesTab (notes + timeline)
```

## Related Code Files

### Files to Modify
- `src/app/dashboard/groups/page.tsx` — expand query
- `src/app/dashboard/groups/groups-list-client.tsx` — redesign
- `src/app/dashboard/groups/[id]/page.tsx` — expand query
- `src/app/dashboard/groups/[id]/group-detail-client.tsx` — redesign with tabs
- `src/app/dashboard/management-types.ts` — extend GroupListItem

### Files to Create
- `src/app/dashboard/groups/groups-table-view.tsx` (~70 LOC)
- `src/app/dashboard/groups/groups-card-view.tsx` (~70 LOC)
- `src/app/dashboard/groups/[id]/group-header.tsx` (~60 LOC)
- `src/app/dashboard/groups/[id]/group-overview-tab.tsx` (~60 LOC)
- `src/app/dashboard/groups/[id]/group-members-tab.tsx` (~100 LOC) — refactored from existing
- `src/app/dashboard/groups/[id]/group-positions-tab.tsx` (~70 LOC)
- `src/app/dashboard/groups/[id]/group-skill-coverage-tab.tsx` (~100 LOC)
- `src/app/dashboard/groups/[id]/group-assessments-tab.tsx` (~60 LOC)
- `src/app/dashboard/groups/[id]/group-notes-tab.tsx` (~50 LOC)

## Implementation Steps

### Part A: List Page (Steps 1-5)

1. Extend `GroupListItem` in management-types: add `status`, `health_score`, `position_count`, `alert_count`.
2. Update `groups/page.tsx`: query groups with member_count, derive position_count from members' positions, compute KPI aggregates.
3. Rewrite `groups-list-client.tsx`: KpiCardGrid, FilterBar (search, type, status), ViewSwitcher (card/table).
4. Create `groups-card-view.tsx`: enhanced cards with health score ring, member count, active positions count, alert indicators. Reuse existing card patterns.
5. Create `groups-table-view.tsx`: data-table with columns — name, type, members, positions, health score, status, alerts, actions.

### Part B: Detail Page (Steps 6-14)

6. Update `groups/[id]/page.tsx`: fetch members with their positions and person_skills, notes, tags, activity_logs. Derive unique positions from members.
7. Create `group-header.tsx`: group name, type badge, status badge, health score ring, edit + add member buttons.
8. Rewrite `group-detail-client.tsx` as tab coordinator with 6 tabs.
9. Create `group-overview-tab.tsx`: group description, type, status, member count, active positions count, created date, tags.
10. Create `group-members-tab.tsx`: refactor existing member list. Enhance with position name per member, match score badge, readiness indicator. Keep add/remove member functionality (MemberPickerDialog).
11. Create `group-positions-tab.tsx`: list unique positions held by group members. Show for each: position title, filled count vs total members, average readiness.
12. Create `group-skill-coverage-tab.tsx`: identify all skills required by members' positions. For each skill: how many members have it (at adequate level) vs how many need it. Display as heatmap grid or bar chart. Highlight critical gaps (required but no one has it).
13. Create `group-assessments-tab.tsx`: aggregate assessment results across group members. Show completion rate, pending count, pass/fail distribution.
14. Create `group-notes-tab.tsx`: NotesPanel + ActivityTimeline for this group.

### Part C: Status & Health (Steps 15-16)

15. Add status update: PATCH /api/groups/[id] with status field. Update group status CHECK constraint.
16. Health score display: use score-ring component from Phase 2. Actual calculation happens in Phase 7.

## Todo

- [x] Extend group types in management-types.ts
- [x] Update groups list page.tsx query
- [x] Redesign groups-list-client.tsx with KPIs and filters
- [x] Create groups-table-view.tsx
- [x] Create groups-card-view.tsx with health scores
- [x] Update group detail page.tsx with expanded queries
- [x] Create group-header.tsx
- [x] Redesign group-detail-client.tsx with tabs
- [x] Create group-overview-tab.tsx
- [x] Create group-members-tab.tsx (refactor from existing)
- [x] Create group-positions-tab.tsx
- [x] Create group-skill-coverage-tab.tsx
- [x] Create group-assessments-tab.tsx
- [x] Create group-notes-tab.tsx
- [x] Add status management to groups
- [x] Verify MemberPickerDialog compatibility

## Success Criteria

- KPIs show real group metrics
- Card and table views render with health scores
- Detail page preserves member add/remove functionality
- Members tab shows position and readiness per member
- Positions tab shows filled vs needed count
- Skill coverage tab identifies team strengths and gaps
- Notes can be added to groups
- Status can be updated
- All files under 200 LOC

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Deriving positions from members' position_id is indirect | Low | Simple query: SELECT DISTINCT position_id FROM persons WHERE id IN (member person_ids) |
| Skill coverage query complex with many joins | Medium | Compute in server component; cache results if slow |
| MemberPickerDialog breaks during refactor | Low | Don't modify dialog; only change where it's imported |

## Security Considerations

- Group data scoped via RLS (groups.created_by)
- Member operations inherit group ownership check
- Health score is read-only derived data

## Next Steps

- Phase 7 provides health_score calculation
- Skill coverage data can feed back into Skills analytics (Phase 5)
