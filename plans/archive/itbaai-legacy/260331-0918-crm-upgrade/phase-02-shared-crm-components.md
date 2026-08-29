---
title: "Phase 2 - Shared CRM Components"
status: completed
priority: P1
effort: 8h
---

## Context Links

- [Upgrade Spec](../../upgrade.md) - Sections 4.2, 4.3, 8.3
- [Code Standards](../../docs/code-standards.md) - Max 200 LOC, kebab-case
- [Existing UI Components](../../src/components/ui/)
- [Existing Management Components](../../src/components/management/)
- [Entity Empty State](../../src/components/management/entity-empty-state.tsx) - reuse pattern

## Overview

Build reusable CRM components used across all 4 pages. These are the foundation that Phases 3-6 depend on. Each component must be under 200 LOC, use dark theme tokens, and follow existing shadcn/ui patterns.

## Key Insights

- Existing pattern: UI primitives in `src/components/ui/`, domain components in `src/components/management/`
- New CRM components go in `src/components/crm/` — a new directory for CRM-layer shared components
- Existing components to reuse: Card, Badge, Button, Input, Tabs, Select, Progress, Dialog, Avatar
- All pages share identical BG/text/accent colors — extract to shared constants if not already in Tailwind config
- View switcher is purely client-side state; no URL persistence needed for MVP

## Requirements

### Functional
- KPI cards: icon, value, label, optional trend indicator
- Filter bar: search input + multiple Select dropdowns + clear button
- View switcher: toggle between table/card/kanban views
- Data table: sortable columns, pagination, row click handler
- Detail drawer: right-side sliding panel with close, scrollable content
- Status badge: configurable colors per status value
- Notes panel: list, create, pin/unpin notes
- Activity timeline: chronological event list
- Tag chips: display, add, remove tags
- Bulk action toolbar: appears when items selected, action buttons

### Non-Functional
- NFR-03: Reusable, composable components
- UX-06: Loading, empty, error states for each component
- Max 200 LOC per file

## Architecture

### Component Hierarchy

```
src/components/crm/
  kpi-card.tsx                 (~50 LOC) - single KPI metric card
  kpi-card-grid.tsx            (~40 LOC) - grid layout for KPI cards
  filter-bar.tsx               (~80 LOC) - search + multi-select filters
  view-switcher.tsx            (~40 LOC) - table/card/kanban toggle
  data-table.tsx               (~120 LOC) - sortable table with pagination
  data-table-pagination.tsx    (~50 LOC) - pagination controls
  detail-drawer.tsx            (~80 LOC) - right-side sliding drawer
  status-badge.tsx             (~50 LOC) - configurable status badge
  notes-panel.tsx              (~120 LOC) - notes CRUD list
  note-form.tsx                (~60 LOC) - create/edit note form
  activity-timeline.tsx        (~80 LOC) - chronological event list
  tag-chips.tsx                (~60 LOC) - tag display + add/remove
  tag-picker-popover.tsx       (~70 LOC) - popover for selecting/creating tags
  bulk-action-bar.tsx          (~60 LOC) - floating bar for bulk actions
  score-ring.tsx               (~40 LOC) - circular progress for scores
  kanban-column.tsx            (~60 LOC) - kanban column container
  kanban-board.tsx             (~80 LOC) - kanban board layout
```

### API Routes for CRM Data

```
src/app/api/notes/route.ts             GET (list by entity), POST (create)
src/app/api/notes/[id]/route.ts        PATCH (update/pin), DELETE
src/app/api/activity-logs/route.ts     GET (list by entity)
src/app/api/tags/route.ts              GET (list all), POST (create)
src/app/api/entity-tags/route.ts       POST (attach tag), DELETE (detach)
src/app/api/tasks/route.ts             GET (list by entity), POST (create)
src/app/api/tasks/[id]/route.ts        PATCH (update status), DELETE
src/app/api/person-skills/route.ts     GET (list by person), POST (add)
src/app/api/person-skills/[id]/route.ts PATCH (update level), DELETE
```

## Related Code Files

### Files to Create
- `src/components/crm/kpi-card.tsx`
- `src/components/crm/kpi-card-grid.tsx`
- `src/components/crm/filter-bar.tsx`
- `src/components/crm/view-switcher.tsx`
- `src/components/crm/data-table.tsx`
- `src/components/crm/data-table-pagination.tsx`
- `src/components/crm/detail-drawer.tsx`
- `src/components/crm/status-badge.tsx`
- `src/components/crm/notes-panel.tsx`
- `src/components/crm/note-form.tsx`
- `src/components/crm/activity-timeline.tsx`
- `src/components/crm/tag-chips.tsx`
- `src/components/crm/tag-picker-popover.tsx`
- `src/components/crm/bulk-action-bar.tsx`
- `src/components/crm/score-ring.tsx`
- `src/components/crm/kanban-column.tsx`
- `src/components/crm/kanban-board.tsx`
- `src/app/api/notes/route.ts`
- `src/app/api/notes/[id]/route.ts`
- `src/app/api/activity-logs/route.ts`
- `src/app/api/tags/route.ts`
- `src/app/api/entity-tags/route.ts`
- `src/app/api/tasks/route.ts`
- `src/app/api/tasks/[id]/route.ts`
- `src/app/api/person-skills/route.ts`
- `src/app/api/person-skills/[id]/route.ts`
- `src/lib/crm/types.ts` (shared CRM types)
- `src/lib/crm/constants.ts` (status configs, colors, labels)

### Files to Modify
- None (all new files)

## Implementation Steps

### Part A: Types & Constants (Steps 1-2)

1. Create `src/lib/crm/types.ts` with interfaces:
   - `KpiCardData { label, value, icon, trend?, trendLabel? }`
   - `NoteItem { id, content, note_type, is_pinned, author_id, created_at }`
   - `ActivityLogItem { id, action, details, actor_id, created_at }`
   - `TagItem { id, name, color }`
   - `TaskItem { id, title, description, status, assignee_id, due_date }`
   - `PersonSkillItem { id, skill_id, skill_name, current_level }`
   - `EntityRef { entity_type: 'person'|'position'|'group', entity_id: string }`
   - `ColumnDef<T> { key, label, sortable?, render? }`

2. Create `src/lib/crm/constants.ts`:
   - `PERSON_STATUSES` with label + color for each status
   - `POSITION_STATUSES` with label + color
   - `GROUP_STATUSES` with label + color
   - `NOTE_TYPES` with label + color
   - `TASK_STATUSES` with label + color

### Part B: Display Components (Steps 3-9)

3. Create `kpi-card.tsx`: icon + value + label + optional trend arrow. Use Card from shadcn.
4. Create `kpi-card-grid.tsx`: responsive grid (2-col sm, 3-col md, 6-col xl) wrapping KpiCard instances.
5. Create `status-badge.tsx`: receives status string + config map, renders colored Badge.
6. Create `score-ring.tsx`: SVG circular progress indicator (0-100%). Used for match/health/readiness scores.
7. Create `view-switcher.tsx`: TabsList-style toggle (table/card/kanban icons). Controlled component: value + onChange.
8. Create `tag-chips.tsx`: horizontal list of colored tag badges + optional "+" button to trigger tag picker.
9. Create `activity-timeline.tsx`: vertical timeline with dots, action text, actor name, relative timestamp.

### Part C: Interactive Components (Steps 10-15)

10. Create `filter-bar.tsx`: composable bar accepting `filters` prop array of `{ key, label, options[], value, onChange }` + search input. Renders Select dropdowns + search + clear all button.
11. Create `data-table.tsx`: generic sortable table. Props: `columns: ColumnDef[]`, `data: T[]`, `onRowClick?`, `selectedIds?`, `onSelectChange?`. Handles sort state internally. Renders checkbox column when `onSelectChange` provided.
12. Create `data-table-pagination.tsx`: page controls with page size selector (10/25/50).
13. Create `detail-drawer.tsx`: right-side drawer using Dialog/Sheet pattern. Props: `open`, `onClose`, `title`, `children`. Fixed position, overlay, slide-in animation.
14. Create `notes-panel.tsx`: fetches notes for an entity, displays list with pin/unpin, includes NoteForm for creating new notes.
15. Create `note-form.tsx`: textarea + note_type select + submit button. Calls POST /api/notes.

### Part D: Kanban & Bulk Actions (Steps 16-18)

16. Create `kanban-column.tsx`: column header (status label + count) + scrollable card list. No drag-and-drop for MVP.
17. Create `kanban-board.tsx`: horizontal scrollable container of KanbanColumns. Props: `columns`, `items`, `renderCard`.
18. Create `bulk-action-bar.tsx`: fixed-bottom bar showing selected count + action buttons. Props: `selectedCount`, `actions: { label, icon, onClick }[]`, `onClear`.

### Part E: Tag Picker (Step 19)

19. Create `tag-picker-popover.tsx`: popover with existing tags list (checkable) + "Create new tag" input. Calls GET/POST /api/tags and POST/DELETE /api/entity-tags.

### Part F: API Routes (Steps 20-27)

20. Create `src/app/api/notes/route.ts` — GET: query by entity_type + entity_id. POST: create note with author_id.
21. Create `src/app/api/notes/[id]/route.ts` — PATCH: update content/pin. DELETE: remove note.
22. Create `src/app/api/activity-logs/route.ts` — GET: query by entity_type + entity_id, ordered by created_at DESC.
23. Create `src/app/api/tags/route.ts` — GET: list user's tags. POST: create tag.
24. Create `src/app/api/entity-tags/route.ts` — POST: attach tag. DELETE: detach tag. Both require entity_type + entity_id + tag_id.
25. Create `src/app/api/tasks/route.ts` — GET: list by entity. POST: create task.
26. Create `src/app/api/tasks/[id]/route.ts` — PATCH: update status/assignee. DELETE: remove.
27. Create `src/app/api/person-skills/route.ts` — GET: list by person_id. POST: add skill with level.
28. Create `src/app/api/person-skills/[id]/route.ts` — PATCH: update level. DELETE: remove.

### Part G: Activity Log Helper (Step 29)

29. Create `src/lib/crm/log-activity.ts` — fire-and-forget helper (matching existing `logAiUsage` pattern) that inserts activity_log rows. Used by all API routes that modify entities.

## Todo

- [x] Create crm types and constants files
- [x] Build KPI card and grid components
- [x] Build status badge and score ring
- [x] Build view switcher
- [x] Build filter bar
- [x] Build data table with pagination
- [x] Build detail drawer
- [x] Build notes panel + form
- [x] Build activity timeline
- [x] Build tag chips + picker
- [x] Build kanban board + column
- [x] Build bulk action bar
- [x] Create notes API routes
- [x] Create activity-logs API route
- [x] Create tags + entity-tags API routes
- [x] Create tasks API routes
- [x] Create person-skills API routes
- [x] Create log-activity helper utility
- [x] Verify all components render correctly with dark theme

## Success Criteria

- All components render correctly with existing dark theme tokens
- Components are generic/reusable (not page-specific)
- Each file under 200 LOC
- API routes follow existing auth pattern (getAuthContext)
- Notes, tags, tasks CRUD operations work end-to-end
- Activity logging fires without blocking responses

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Component API too rigid for page-specific needs | Medium | Use composition: pass children/render props instead of config objects |
| Data table performance with large datasets | Medium | Implement pagination; defer virtualization to future |
| Drawer conflicts with dialogs | Low | Use different z-index layers |

## Security Considerations

- All API routes use getAuthContext for authentication
- Notes/tags/tasks scoped to authenticated user's data via RLS
- Activity logs are append-only; delete not exposed to client
- Tag creation sanitizes name input (trim, max length)

## Next Steps

- Phases 3-6 import these components to build page-specific layouts
- Phase 7 uses score-ring and KPI components for analytics display
