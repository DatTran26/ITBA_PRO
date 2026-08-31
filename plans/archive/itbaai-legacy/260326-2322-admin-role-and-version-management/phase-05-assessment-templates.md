# Phase 5: Assessment Templates

## Context Links

- [Brainstorm Report](../reports/brainstorm-260326-2322-admin-role-and-version-management.md)
- [Phase 1 — DB Schema](./phase-01-database-schema.md) (`assessment_templates` table)
- [Test Creation Page](../../src/app/dashboard/create/page.tsx)
- [Dashboard Client](../../src/app/dashboard/dashboard-client.tsx)

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 5h

Save assessment configurations as reusable templates. Templates store job_role, level, question_count, time_limit, descriptions — all the fields needed to pre-fill a new test. Any authenticated user can create/use templates; admin can manage all.

## Key Insights

- Test creation page (`create/page.tsx`) is a client component with: job_role, level, question_count, time_limit, target_type, job_description, test_description, position_id, group_id
- Templates should save the "configuration" part (not position/group references, those are context-specific)
- Template fields: name, description, job_role, level, question_count, time_limit, target_type, job_description, test_description
- Two entry points: "Save as Template" on test creation, "Create from Template" on templates list
- `assessment_templates` RLS: all can read, owner + admin can write

## Requirements

### Functional
- Templates API: GET list, POST create, GET/PATCH/DELETE by id
- Templates list page at `/dashboard/templates`
- "Save as Template" button on test creation page (saves current config)
- "Use Template" action on templates list (navigates to create page with prefilled params)
- Template cards show: name, job_role, level, question_count, created date
- Admin can delete any template; users can only delete own

### Non-functional
- Template creation is instant (small payload, no AI)
- Template list loads via server component
- Prefilling create page uses URL search params

## Architecture

### Data Flow

```
Test Creation Page
├── Fill form → "Save as Template" → POST /api/templates
└── Loads from template → redirected with ?template_id=xxx → prefills form

Templates List Page
├── Server: fetch all templates
├── Client: search, filter by role
└── "Use Template" → /dashboard/create?template_id=xxx
```

### Interfaces

```typescript
interface AssessmentTemplate {
  id: string;
  name: string;
  description: string | null;
  job_role: string;
  level: string;
  question_count: number;
  time_limit: number | null;
  target_type: string;
  job_description: string | null;
  test_description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// For creation
type CreateTemplateBody = Omit<AssessmentTemplate, "id" | "created_by" | "created_at" | "updated_at">;
```

## Related Code Files

### Files to Create
- `D:\Projects\Git Private\ITBAAI\src\app\api\templates\route.ts` — GET (list) + POST (create)
- `D:\Projects\Git Private\ITBAAI\src\app\api\templates\[id]\route.ts` — GET + PATCH + DELETE
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\templates\page.tsx` — server component
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\templates\templates-client.tsx` — list + actions

### Files to Modify
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\create\page.tsx` — add "Save as Template" button + template prefill logic via searchParams

## Implementation Steps

### Step 1: Templates API (list + create)

**`src/app/api/templates/route.ts`**:

```typescript
// GET — list all templates (any authenticated user)
//   getAuthContext() → query assessment_templates, order by created_at desc

// POST — create template
//   getAuthContext() → validate body → insert with created_by = userId
```

### Step 2: Templates API (by id)

**`src/app/api/templates/[id]/route.ts`**:

```typescript
// GET — single template by id (any authenticated)
// PATCH — update template (owner or admin)
//   getAuthContext() → check ownership or isAdmin → update
// DELETE — delete template (owner or admin)
//   getAuthContext() → check ownership or isAdmin → delete
```

### Step 3: Templates list page

**`src/app/dashboard/templates/page.tsx`** (Server Component):
- Auth check (redirect if not logged in)
- Fetch all templates from Supabase
- Pass to `<TemplatesClient templates={templates} />`

**`src/app/dashboard/templates/templates-client.tsx`** (Client Component):
- Search by name
- Filter by job_role dropdown
- Template cards in grid layout:
  - Name, description preview
  - Job role badge, level badge
  - Question count, time limit
  - Created date
  - Actions: "Use Template" button, Edit (owner/admin), Delete (owner/admin)
- "Use Template" → `router.push('/dashboard/create?template_id=' + id)`

### Step 4: Save as Template on create page

Modify `src/app/dashboard/create/page.tsx`:

1. Add "Save as Template" button (visible when form has job_role + level filled)
2. On click: open dialog asking for template name + optional description
3. POST to `/api/templates` with current form values
4. Toast success: "Template saved"

### Step 5: Template prefill on create page

Modify `src/app/dashboard/create/page.tsx`:

1. Read `searchParams.template_id`
2. If present, GET `/api/templates/[id]`
3. Prefill form fields: job_role, level, question_count, time_limit, target_type, job_description, test_description
4. Show banner: "Pre-filled from template: {name}"

## Todo List

- [ ] Create `src/app/api/templates/route.ts` (GET + POST)
- [ ] Create `src/app/api/templates/[id]/route.ts` (GET + PATCH + DELETE)
- [ ] Create `src/app/dashboard/templates/page.tsx` (server component)
- [ ] Create `src/app/dashboard/templates/templates-client.tsx` (list with search/filter)
- [ ] Add "Save as Template" button + dialog on create page
- [ ] Add template prefill logic on create page (via searchParams)
- [ ] Test: create template from test config
- [ ] Test: use template to prefill new test
- [ ] Test: admin can delete any template
- [ ] Test: non-owner recruiter cannot delete others' templates

## Success Criteria

- User can save current test configuration as a named template
- Templates list page shows all templates with search and filter
- "Use Template" prefills the test creation form
- Owner and admin can edit/delete; others can only read
- API enforces ownership/admin checks on write operations

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Create page is large (~200 lines) | Low | Minimal changes — add one button + one useEffect for prefill |
| Template data becomes stale (e.g., role options change) | Low | Templates store raw strings, not FK references — always valid |

## Security Considerations

- API write ops check ownership OR admin role
- RLS enforces same rules at database level
- Template content is non-sensitive (just test config)
- `created_by` set server-side, not from client body

## Next Steps

- Phase 9 (Navigation) adds Templates link to admin navbar
- Templates can be used by any authenticated user (not admin-only read)
