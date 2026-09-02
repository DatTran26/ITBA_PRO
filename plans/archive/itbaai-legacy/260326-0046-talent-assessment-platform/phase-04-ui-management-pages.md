# Phase 4: UI Management Pages — Persons, Positions, Skills, Groups

## Context Links
- [Phase 2: API Foundation](./phase-02-api-foundation.md)
- [Phase 3: Groups & Evaluations API](./phase-03-api-groups-evaluations.md)
- [Existing dashboard page pattern](../../src/app/dashboard/page.tsx)
- [Existing dashboard-client pattern](../../src/app/dashboard/dashboard-client.tsx)
- [Dashboard component split](../../src/components/dashboard/)
- [Existing types file](../../src/app/dashboard/types.ts)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 5h
- **Dependencies**: Phase 2 (persons/positions/skills API), Phase 3 (groups API)
- **Description**: Create 4 new dashboard sections with list + detail pages following existing Server/Client component split

## Key Insights
- Existing pattern: Server Component page (data fetch + auth) -> Client Component (interactivity)
- Dashboard components extracted into `src/components/dashboard/` directory
- Navigation: `app-navbar.tsx` has links; need to add new sections
- Forms use `react-hook-form` + `Zod`; toasts via `sonner`
- Existing UI components available: Card, Button, Dialog, Select, Badge, Input, Tabs, Textarea
- All files must stay under 200 LOC — split into focused component files

## Requirements

### Functional
- F1: Persons page — list, filter by type, create dialog, link to detail
- F2: Person detail page — profile info, edit, assessment history, group memberships
- F3: Positions page — list, create dialog, link to detail
- F4: Position detail page — info, edit, skill requirements management
- F5: Skills page — library list, filter by category, create/edit inline or dialog
- F6: Groups page — list by type, create dialog, member management

### Non-Functional
- NF1: Server Components for data fetch; Client Components for interactivity
- NF2: All component files under 200 LOC
- NF3: Consistent UI with existing dashboard styling (Cards, Badges, PageContainer)
- NF4: Loading states and error handling on all fetch operations
- NF5: Mobile-responsive layouts using Tailwind grid/flex

## Architecture

### Page Structure
```
src/app/dashboard/
├── persons/
│   ├── page.tsx                    (Server: fetch persons list)
│   ├── persons-list-client.tsx     (Client: list + filters + create dialog)
│   └── [id]/
│       ├── page.tsx                (Server: fetch person detail)
│       └── person-detail-client.tsx (Client: edit form + history)
├── positions/
│   ├── page.tsx                    (Server: fetch positions list)
│   ├── positions-list-client.tsx   (Client: list + create dialog)
│   └── [id]/
│       ├── page.tsx                (Server: fetch position + requirements)
│       └── position-detail-client.tsx (Client: edit + requirements mgmt)
├── skills/
│   ├── page.tsx                    (Server: fetch skills list)
│   └── skills-list-client.tsx      (Client: list + CRUD + category filter)
└── groups/
    ├── page.tsx                    (Server: fetch groups list)
    ├── groups-list-client.tsx      (Client: list + create dialog)
    └── [id]/
        ├── page.tsx                (Server: fetch group + members)
        └── group-detail-client.tsx (Client: edit + member management)
```

### Shared Components (new)
```
src/components/management/
├── person-form-dialog.tsx       (Create/edit person dialog)
├── position-form-dialog.tsx     (Create/edit position dialog)
├── skill-form-dialog.tsx        (Create/edit skill dialog)
├── group-form-dialog.tsx        (Create/edit group dialog)
├── member-picker-dialog.tsx     (Add person to group dialog)
├── skill-requirement-row.tsx    (Single requirement with level selector)
└── entity-empty-state.tsx       (Reusable empty state component)
```

### Types File
```typescript
// src/app/dashboard/management-types.ts

export interface PersonListItem {
  id: string;
  full_name: string;
  email: string | null;
  type: 'candidate' | 'employee';
  department: string | null;
  current_level: string | null;
  position_id: string | null;
  created_at: string;
}

export interface PersonDetail extends PersonListItem {
  phone: string | null;
  notes: string | null;
  joined_date: string | null;
  positions: { title: string; department: string | null } | null;
  updated_at: string;
}

export interface PositionListItem {
  id: string;
  title: string;
  department: string | null;
  target_level: string | null;
  position_skill_requirements: { count: number }[] | { count: number };
  created_at: string;
}

export interface PositionDetail extends PositionListItem {
  description: string | null;
  position_skill_requirements: SkillRequirement[];
}

export interface SkillRequirement {
  id: string;
  skill_id: string;
  required_level: number;
  is_mandatory: boolean;
  checklist_order: number;
  skills: { name: string; category: string | null };
}

export interface SkillListItem {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
}

export interface GroupListItem {
  id: string;
  name: string;
  type: 'department' | 'batch' | 'campaign' | 'other';
  description: string | null;
  group_members: { count: number }[] | { count: number };
  created_at: string;
}

export interface GroupMemberItem {
  id: string;
  person_id: string;
  added_at: string;
  persons: { id: string; full_name: string; email: string | null; type: string; department: string | null };
}
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/app/dashboard/management-types.ts` | CREATE | Shared types for management pages |
| `src/app/dashboard/persons/page.tsx` | CREATE | Server: fetch persons |
| `src/app/dashboard/persons/persons-list-client.tsx` | CREATE | Client: persons list UI |
| `src/app/dashboard/persons/[id]/page.tsx` | CREATE | Server: fetch person detail |
| `src/app/dashboard/persons/[id]/person-detail-client.tsx` | CREATE | Client: person detail UI |
| `src/app/dashboard/positions/page.tsx` | CREATE | Server: fetch positions |
| `src/app/dashboard/positions/positions-list-client.tsx` | CREATE | Client: positions list UI |
| `src/app/dashboard/positions/[id]/page.tsx` | CREATE | Server: fetch position |
| `src/app/dashboard/positions/[id]/position-detail-client.tsx` | CREATE | Client: position detail UI |
| `src/app/dashboard/skills/page.tsx` | CREATE | Server: fetch skills |
| `src/app/dashboard/skills/skills-list-client.tsx` | CREATE | Client: skills library UI |
| `src/app/dashboard/groups/page.tsx` | CREATE | Server: fetch groups |
| `src/app/dashboard/groups/groups-list-client.tsx` | CREATE | Client: groups list UI |
| `src/app/dashboard/groups/[id]/page.tsx` | CREATE | Server: fetch group detail |
| `src/app/dashboard/groups/[id]/group-detail-client.tsx` | CREATE | Client: group detail UI |
| `src/components/management/person-form-dialog.tsx` | CREATE | Reusable person form dialog |
| `src/components/management/position-form-dialog.tsx` | CREATE | Reusable position form dialog |
| `src/components/management/skill-form-dialog.tsx` | CREATE | Reusable skill form dialog |
| `src/components/management/group-form-dialog.tsx` | CREATE | Reusable group form dialog |
| `src/components/management/member-picker-dialog.tsx` | CREATE | Add person to group picker |
| `src/components/management/skill-requirement-row.tsx` | CREATE | Skill requirement editor row |
| `src/components/management/entity-empty-state.tsx` | CREATE | Reusable empty state |
| `src/components/ui/app-navbar.tsx` | MODIFY | Add navigation links for new sections |

## Implementation Steps

### Step 1: Create shared types
Create `src/app/dashboard/management-types.ts` with the interfaces above (~70 LOC).

### Step 2: Create reusable management components

**`src/components/management/entity-empty-state.tsx`** (~30 LOC)
- Props: `title`, `description`, `actionLabel`, `onAction`
- Renders centered card with icon + text + action button
- Reused across all 4 list pages

**`src/components/management/person-form-dialog.tsx`** (~120 LOC)
- Dialog with react-hook-form + Zod validation
- Fields: full_name (required), email, type (select), department, phone, current_level, notes
- Supports both create and edit mode (pre-populate values)
- Calls POST `/api/persons` or PATCH `/api/persons/[id]`
- Toast on success/failure

**`src/components/management/position-form-dialog.tsx`** (~100 LOC)
- Fields: title (required), department, description (textarea), target_level (select)
- Same create/edit pattern

**`src/components/management/skill-form-dialog.tsx`** (~80 LOC)
- Fields: name (required), category, description
- Simpler form; same pattern

**`src/components/management/group-form-dialog.tsx`** (~90 LOC)
- Fields: name (required), type (select: department/batch/campaign/other), description
- Same pattern

**`src/components/management/member-picker-dialog.tsx`** (~100 LOC)
- Search/filter persons list (fetched on open)
- Filter out already-added members
- Click to add; calls POST `/api/groups/[id]/members`
- Toast confirmation

**`src/components/management/skill-requirement-row.tsx`** (~80 LOC)
- Single row: skill name | required_level (1-5 select) | mandatory toggle | delete button
- Used in position detail requirements list

### Step 3: Persons pages

**`src/app/dashboard/persons/page.tsx`** (~40 LOC)
- Server Component: auth check, fetch persons from Supabase, pass to client
- Same pattern as `dashboard/page.tsx`

**`src/app/dashboard/persons/persons-list-client.tsx`** (~150 LOC)
- AppNavbar + PageContainer wrapper
- Type filter tabs: All | Candidates | Employees
- Search by name/email
- Grid of Cards showing person info with Badge for type
- Create button -> PersonFormDialog
- Click card -> navigate to `/dashboard/persons/[id]`

**`src/app/dashboard/persons/[id]/page.tsx`** (~45 LOC)
- Fetch person with position join, fetch results where person_id matches

**`src/app/dashboard/persons/[id]/person-detail-client.tsx`** (~180 LOC)
- Profile card (name, email, type, department, level, phone, joined_date)
- Edit button -> PersonFormDialog in edit mode
- Assessment history: list of results linked to this person (score, date, test name)
- Group memberships section (read-only, links to group pages)

### Step 4: Positions pages

**`src/app/dashboard/positions/page.tsx`** (~35 LOC)

**`src/app/dashboard/positions/positions-list-client.tsx`** (~130 LOC)
- Grid of Cards: title, department, target_level, requirement count badge
- Create button -> PositionFormDialog
- Click -> `/dashboard/positions/[id]`

**`src/app/dashboard/positions/[id]/page.tsx`** (~40 LOC)
- Fetch position with skill requirements + skill details

**`src/app/dashboard/positions/[id]/position-detail-client.tsx`** (~180 LOC)
- Position info card with edit button
- Skill Requirements section:
  - List of SkillRequirementRow components
  - "Add Skill" button -> select from skills library + set level/mandatory
  - Reorder (checklist_order) via up/down buttons
  - Save changes via POST/DELETE `/api/positions/[id]/requirements`

### Step 5: Skills page

**`src/app/dashboard/skills/page.tsx`** (~35 LOC)

**`src/app/dashboard/skills/skills-list-client.tsx`** (~150 LOC)
- Category filter (tabs or select from distinct categories)
- Searchable list/grid of skills
- Create button -> SkillFormDialog
- Inline edit on click or edit button -> SkillFormDialog in edit mode
- Delete with confirmation dialog
- No detail page needed (skills are simple entities)

### Step 6: Groups pages

**`src/app/dashboard/groups/page.tsx`** (~35 LOC)

**`src/app/dashboard/groups/groups-list-client.tsx`** (~130 LOC)
- Type filter tabs: All | Department | Batch | Campaign | Other
- Cards showing name, type badge, member count, description snippet
- Create -> GroupFormDialog
- Click -> `/dashboard/groups/[id]`

**`src/app/dashboard/groups/[id]/page.tsx`** (~40 LOC)

**`src/app/dashboard/groups/[id]/group-detail-client.tsx`** (~170 LOC)
- Group info card with edit button
- Members list: name, email, type badge, remove button
- "Add Member" button -> MemberPickerDialog
- Remove member with confirmation

### Step 7: Update navigation
Add links to `src/components/ui/app-navbar.tsx`:
- Persons (icon: Users)
- Positions (icon: Briefcase)
- Skills (icon: Zap)
- Groups (icon: FolderKanban)

Consider grouping under a "Management" dropdown if navbar gets crowded.

### Step 8: Verify compilation
`npm run build` — all new pages and components must compile.

## Todo List
- [ ] Create `management-types.ts`
- [ ] Create `entity-empty-state.tsx`
- [ ] Create `person-form-dialog.tsx`
- [ ] Create `position-form-dialog.tsx`
- [ ] Create `skill-form-dialog.tsx`
- [ ] Create `group-form-dialog.tsx`
- [ ] Create `member-picker-dialog.tsx`
- [ ] Create `skill-requirement-row.tsx`
- [ ] Create persons list page + client
- [ ] Create person detail page + client
- [ ] Create positions list page + client
- [ ] Create position detail page + client
- [ ] Create skills list page + client
- [ ] Create groups list page + client
- [ ] Create group detail page + client
- [ ] Update app-navbar.tsx with new links
- [ ] Verify all files compile (`npm run build`)
- [ ] Visual QA: verify all pages render correctly in dark/light mode

## Success Criteria
- All 4 management sections accessible from navbar
- CRUD operations work end-to-end for each entity
- Person type filter (candidate/employee) works
- Position skill requirements can be added, reordered, removed
- Group members can be added/removed
- All form dialogs validate input with Zod
- Toast notifications on success/error
- Empty states shown when no data
- All component files under 200 LOC
- Dark mode renders correctly

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Too many new files (22 files) | MEDIUM | Follow existing patterns strictly; reuse shared components |
| Navbar gets crowded with 4 new links | LOW | Group under "Management" dropdown |
| Person detail assessment history empty before Phase 5 | LOW | Show "No assessments yet" empty state |
| LOC limit hard to hit for detail pages | MEDIUM | Extract sub-sections into separate components |

## Security Considerations
- All server component pages check auth, redirect to /login if unauthenticated
- Data fetched via Supabase server client (RLS applies)
- Client components use fetch to API routes (auth via cookies)
- No sensitive data exposed in client-side state
- Dialog forms sanitize input before submission

## Next Steps
- Phase 5: Extend test creation flow to use persons/positions/groups
- Phase 6: Employee evaluation UI using skill evaluations + level suggestion
