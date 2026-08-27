---
title: "Phase 5 - Skills Page Redesign (Skill Intelligence Center)"
status: completed
priority: P2
effort: 6h
---

## Context Links

- [Upgrade Spec](../../upgrade.md) - Section 5.3, FR-SKL-01 through FR-SKL-06
- [Current skills-list-client.tsx](../../src/app/dashboard/skills/skills-list-client.tsx) (171 LOC)
- [Current skills/page.tsx](../../src/app/dashboard/skills/page.tsx)
- [Phase 2 Shared Components](./phase-02-shared-crm-components.md)

## Overview

Transform the Skills page from a simple card grid into a Skill Intelligence Center. Add a skill detail page (currently missing), KPIs, table/category views, skill matrix views (position-skill and person-skill), and demand/shortage analytics.

## Key Insights

- Current page: category dropdown filter, search, card grid with edit/delete inline. 171 LOC. Functional but no detail page.
- Skills have no detail page currently — clicking a skill opens edit. Need to add `/dashboard/skills/[id]` route.
- `skill_categories` table exists with seeded data (Technical, BA, Communication, Soft Skills, Domain Knowledge).
- `position_skill_requirements` links skills to positions. `person_skills` (Phase 1) links skills to persons. Both enable matrix views.
- Demand score = count of positions requiring this skill. Shortage score = count of persons missing this skill among those in positions requiring it.
- CSV export already exists for admin users.

## Requirements

### Functional
- **FR-SKL-01**: Skill listing with category, demand, shortage, mapping data
- **FR-SKL-02**: Skill categories (existing)
- **FR-SKL-03**: Level scales (1-5, already defined in position_skill_requirements)
- **FR-SKL-04**: Skill mapping to positions (existing) and persons (via person_skills)
- **FR-SKL-05**: Matrix views — position-skill matrix, person-skill matrix
- **FR-SKL-06**: Duplicate merge (simplified: merge skill B into skill A, reassign all references)

### Non-Functional
- Add detail page route that was missing
- Keep existing edit/delete/export functionality
- Under 200 LOC per file

## Architecture

### List Page Structure

```
SkillsPage (Server)
  -> fetches skills with position_count, person_count, demand/shortage
  -> passes to SkillsListClient

SkillsListClient
  ├── KpiCardGrid (Total, Most Required, Most Missing, Unmapped to Position, Unmapped to Assessment)
  ├── FilterBar (search, category)
  ├── ViewSwitcher (table | category | matrix)
  ├── SkillsTableView (data-table with demand/shortage columns)
  ├── SkillsCategoryView (grouped cards by category — enhanced existing)
  └── SkillsMatrixView (position-skill matrix or person-skill matrix toggle)
```

### Detail Page Structure (NEW)

```
SkillDetailPage (Server) — NEW ROUTE
  -> fetches skill, linked positions, linked persons, evaluations

SkillDetailClient
  ├── SkillHeader (name, category badge, description, actions)
  ├── Tabs
  │   ├── SkillOverviewTab (description, category, usage frequency)
  │   ├── SkillLevelsTab (level definitions 1-5, visual scale)
  │   ├── SkillPositionsTab (positions requiring this skill + required levels)
  │   ├── SkillPersonsTab (persons with this skill + level distribution)
  │   ├── SkillAssessmentsTab (tests/evaluations involving this skill)
  │   └── SkillAnalyticsTab (coverage rate, shortage rate, demand trend)
```

## Related Code Files

### Files to Modify
- `src/app/dashboard/skills/page.tsx` — expand query with joins
- `src/app/dashboard/skills/skills-list-client.tsx` — redesign with views
- `src/app/dashboard/management-types.ts` — add SkillDetail, extend SkillListItem

### Files to Create
- `src/app/dashboard/skills/skills-table-view.tsx` (~80 LOC)
- `src/app/dashboard/skills/skills-category-view.tsx` (~70 LOC)
- `src/app/dashboard/skills/skills-matrix-view.tsx` (~120 LOC)
- `src/app/dashboard/skills/[id]/page.tsx` (~40 LOC) — NEW server component
- `src/app/dashboard/skills/[id]/skill-detail-client.tsx` (~80 LOC)
- `src/app/dashboard/skills/[id]/skill-header.tsx` (~50 LOC)
- `src/app/dashboard/skills/[id]/skill-overview-tab.tsx` (~50 LOC)
- `src/app/dashboard/skills/[id]/skill-positions-tab.tsx` (~70 LOC)
- `src/app/dashboard/skills/[id]/skill-persons-tab.tsx` (~70 LOC)
- `src/app/dashboard/skills/[id]/skill-assessments-tab.tsx` (~50 LOC)
- `src/app/dashboard/skills/[id]/skill-analytics-tab.tsx` (~60 LOC)

## Implementation Steps

### Part A: Types & Server Query (Steps 1-2)

1. Extend `SkillListItem` in management-types: add `position_count`, `person_count`, `demand_score`, `shortage_score`. Add `SkillDetail` interface with full data.
2. Update `skills/page.tsx`: query skills with position_skill_requirements count (demand), person_skills count, compute KPI values.

### Part B: List Page Redesign (Steps 3-7)

3. Rewrite `skills-list-client.tsx` as coordinator: KpiCardGrid, FilterBar, ViewSwitcher (table/category/matrix). Preserve existing edit/delete/export handlers.
4. Create `skills-table-view.tsx`: data-table with columns — name, category, linked positions, linked persons, demand score, shortage score, actions. Row click navigates to detail.
5. Create `skills-category-view.tsx`: group skills by category in collapsible sections. Each section shows category name + skill count. Skills as compact cards within.
6. Create `skills-matrix-view.tsx`: two sub-views toggled:
   - Position-Skill Matrix: rows = positions, columns = skills, cells = required level (color-coded) or "N/A"
   - Person-Skill Matrix: rows = persons, columns = skills, cells = current level vs required (green/yellow/red)
   - Limit to relevant subset (e.g., skills in current category filter).
7. Preserve existing admin CSV export button in header.

### Part C: Detail Page (Steps 8-14)

8. Create `skills/[id]/page.tsx` server component: fetch skill, related positions (via position_skill_requirements join), related persons (via person_skills join), skill_evaluations.
9. Create `skill-header.tsx`: skill name, category badge, edit button, merge button, actions dropdown.
10. Create `skill-detail-client.tsx` as tab coordinator with 5-6 tabs.
11. Create `skill-overview-tab.tsx`: description, category, type, creation date, usage stats (how many positions require it, how many persons have it).
12. Create `skill-positions-tab.tsx`: list positions requiring this skill. Show position title, department, required level. Link to position detail.
13. Create `skill-persons-tab.tsx`: list persons who have this skill. Show person name, current level, bar chart of level distribution.
14. Create `skill-analytics-tab.tsx`: coverage rate (persons with skill / persons in positions requiring it), shortage rate (inverse), simple bar charts.

### Part D: Skill Merge (Step 15)

15. Add merge endpoint: POST /api/skills/merge — accepts `source_id` and `target_id`. Reassigns all position_skill_requirements, person_skills, skill_evaluations from source to target, then deletes source. Admin only.

## Todo

- [x] Extend skill types in management-types.ts
- [x] Update skills list page.tsx query
- [x] Redesign skills-list-client.tsx with KPIs and views
- [x] Create skills-table-view.tsx
- [x] Create skills-category-view.tsx
- [x] Create skills-matrix-view.tsx
- [x] Create skill detail page route and server component
- [x] Create skill-header.tsx
- [x] Create skill-detail-client.tsx with tabs
- [x] Create skill-overview-tab.tsx
- [x] Create skill-positions-tab.tsx
- [x] Create skill-persons-tab.tsx
- [x] Create skill-analytics-tab.tsx
- [x] Implement skill merge endpoint
- [x] Verify CSV export still works

## Success Criteria

- Skills list shows KPIs (total, most required, most missing, unmapped)
- Table view shows demand/shortage scores per skill
- Category view groups skills visually by category
- Matrix view renders position-skill grid with color-coded levels
- New detail page accessible at /dashboard/skills/[id]
- Detail page shows linked positions and persons
- Analytics tab shows coverage/shortage rates
- Skill merge reassigns all references correctly
- All files under 200 LOC

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Matrix view too large with many skills/positions | Medium | Limit to filtered subset; add category filter |
| Skill merge data integrity | High | Transaction with rollback; admin-only access |
| person_skills table empty initially | Low | Show empty states; data populates over time |

## Security Considerations

- Skill data scoped to user via RLS (skills.created_by)
- Merge endpoint admin-only (check isAdmin)
- Matrix views only show data user owns
- Activity log on merge for audit trail

## Next Steps

- Phase 7 scoring engine computes demand/shortage metrics
- Matrix views feed into group skill coverage (Phase 6)
