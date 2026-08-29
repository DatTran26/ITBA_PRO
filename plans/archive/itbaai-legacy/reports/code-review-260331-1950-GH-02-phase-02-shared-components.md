# Code Review: Phase 2 - Shared CRM Components

**Date:** 2026-03-31
**Reviewer:** code-reviewer
**Branch:** feat/crm-upgrade/phase-02-shared-components
**Scope:** All new files in `src/components/crm/`, `src/lib/crm/`, `src/app/api/{notes,activity-logs,tags,entity-tags,tasks,person-skills}/`

---

## Scope

- **Files reviewed:** 29 new files
- **Total LOC:** 1,927
- **Focus:** Full review of all new Phase 2 CRM shared components and API routes
- **Scout findings:** Migration naming conflict, missing server-side validation, no delete confirmation UI

---

## Overall Assessment

**Solid implementation.** The code is well-structured, consistent, and follows established project patterns. All 17 components are under the 200 LOC limit, all 9 API route files use the `getAuthContext` + `isAuthError` auth pattern, and the dark theme token usage is consistent throughout. The TypeScript types are clean, the component APIs are composable, and the fire-and-forget activity logging pattern is well-executed.

There is one **critical** migration issue and several **medium** items that should be addressed before merging.

---

## Critical Issues

### 1. `notes` table naming conflict between migrations

**File:** `supabase/migrations/20260331000000_crm_layer_schema.sql` (line 59)
**Impact:** Database schema corruption or silent failure

The initial schema (`20260310000000_init_schema.sql`, line 105) creates a `notes` table with `id bigint` + `title text`. The CRM migration uses `CREATE TABLE IF NOT EXISTS public.notes` with a completely different schema (uuid PK, entity_type, entity_id, content, note_type, is_pinned, author_id, timestamps).

Because `IF NOT EXISTS` is used, **if the old table exists, the new CRM `notes` table will silently not be created**, leaving the API routes querying columns that do not exist (entity_type, entity_id, content, etc.). All notes-related functionality will fail at runtime.

**Fix:** The CRM migration must either:
- `DROP TABLE IF EXISTS public.notes CASCADE;` before creating the new schema (if the old table is unused/legacy), OR
- `ALTER TABLE` the existing table to add the needed columns, OR
- Use a different table name (e.g., `crm_notes`)

This is a **blocker** for deployment.

---

## High Priority

### 2. No server-side length/size validation on user-submitted text

**Files:** `src/app/api/notes/route.ts` (POST), `src/app/api/tasks/route.ts` (POST)
**Impact:** Denial-of-service via oversized payloads; database bloat

The `notes` POST endpoint accepts `content` without any length check. The `tasks` POST endpoint accepts `title` and `description` without length constraints. A malicious client could submit megabytes of text.

The `tags` route correctly trims the name but has no max-length server-side check (the client-side has `maxLength={30}`, but this is easily bypassed).

**Fix example for notes POST:**
```typescript
if (!content || content.length > 5000) {
  return NextResponse.json({ error: "content is required and must be under 5000 characters" }, { status: 400 });
}
```

**Fix example for tags POST:**
```typescript
if (trimmedName.length > 50) {
  return NextResponse.json({ error: "Tag name must be under 50 characters" }, { status: 400 });
}
```

### 3. No `color` field validation on tag creation

**File:** `src/app/api/tags/route.ts` (line 39)
**Impact:** XSS via style injection if color is rendered in `style` attributes

The `color` field from POST body is stored directly with only a default fallback (`color || "#7C8FFF"`). An attacker could submit `color: "red; background-image: url(evil.com/track)"` which gets rendered via `style={{ backgroundColor: tag.color }}` in multiple components (`tag-chips.tsx` line 19, `tag-picker-popover.tsx` line 99).

While React's inline style handling mitigates most XSS vectors, it is still best practice to validate color format server-side.

**Fix:**
```typescript
const colorRegex = /^#[0-9A-Fa-f]{6}$/;
const validColor = colorRegex.test(color) ? color : "#7C8FFF";
```

### 4. Notes GET leaks admin access without RLS consideration

**File:** `src/app/api/notes/route.ts` (line 27)
**Impact:** Admin users see all notes across all entities regardless of ownership intent

The notes GET handler does `if (!isAdmin) query = query.eq("author_id", userId);`, meaning admins bypass the author filter. While this may be intentional, combined with the RLS policy `notes_select_own` (which restricts to own notes at the DB level), an admin whose Supabase auth maps to a `users.auth_id` will only see their own notes anyway via RLS. The `isAdmin` bypass in the API code is misleading -- it has no effect unless the Supabase client uses a service role key (which it does not appear to).

**Recommendation:** Either remove the `isAdmin` branch (since RLS enforces it anyway) to avoid confusion, or document clearly that admin override requires service-role queries. The same pattern appears in `tasks/route.ts` GET.

---

## Medium Priority

### 5. `entity_type` and `entity_id` are not validated against allowed values

**Files:** All API routes accepting `entity_type` (notes, entity-tags, tasks, activity-logs)
**Impact:** Invalid data stored in DB; CHECK constraint violation returns generic 500 instead of 400

The database has `CHECK (entity_type IN ('person', 'position', 'group'))` constraints. If an invalid entity_type is sent, the DB will reject it, but the API returns a generic 500 error instead of a descriptive 400 validation error.

**Fix:**
```typescript
const VALID_ENTITY_TYPES = ["person", "position", "group"];
if (!VALID_ENTITY_TYPES.includes(entity_type)) {
  return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });
}
```

### 6. `entity_id` format not validated as UUID

**Files:** All API routes accepting `entity_id`
**Impact:** Invalid UUID strings sent to Supabase cause cryptic errors

**Fix:** Add UUID format validation before querying:
```typescript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!UUID_RE.test(entity_id)) {
  return NextResponse.json({ error: "Invalid entity_id format" }, { status: 400 });
}
```

### 7. No delete confirmation in `notes-panel.tsx`

**File:** `src/components/crm/notes-panel.tsx` (line 64)
**Impact:** Accidental data loss from one-click delete

The delete handler calls the API immediately on click with no confirmation dialog. While acceptable for MVP, notes could contain important information.

**Recommendation:** Add a simple confirmation or undo-toast pattern for destructive actions.

### 8. `KpiCardGrid` uses array index as key

**File:** `src/components/crm/kpi-card-grid.tsx` (line 13)
**Impact:** Potential React reconciliation issues if KPI cards are reordered

```tsx
<KpiCard key={index} data={item} />
```

Since KPI card data has a `label` that should be unique, use `item.label` as the key instead.

### 9. `logActivity` swallows errors silently

**File:** `src/lib/crm/log-activity.ts` (line 22)
**Impact:** Activity log failures are only visible in server console, not monitored

The fire-and-forget pattern is correct (not blocking responses), but the error handling only does `console.error`. In production, consider forwarding to a logging service or incrementing an error metric.

### 10. `task` status PATCH has no validation of allowed status values

**File:** `src/app/api/tasks/[id]/route.ts` (line 30)
**Impact:** Invalid status values cause DB constraint violation returning 500

The `status` field from the request body is passed directly to the update without checking against allowed values (`pending`, `in_progress`, `completed`, `cancelled`).

### 11. `person-skills` PATCH accepts `current_level` without range validation

**File:** `src/app/api/person-skills/[id]/route.ts` (line 18)
**Impact:** DB CHECK constraint violation (1-5 range) returns 500 instead of 400

```typescript
if (current_level < 1 || current_level > 5 || !Number.isInteger(current_level)) {
  return NextResponse.json({ error: "current_level must be an integer between 1 and 5" }, { status: 400 });
}
```

---

## Low Priority

### 12. `void request` pattern in tags GET

**File:** `src/app/api/tags/route.ts` (line 10-11)
**Impact:** Code smell

The `void request;` comment says "Suppress unused warning -- request is implicit via URL" but `request` is not used at all. Since the function signature requires it by Next.js convention, this is fine but the comment is misleading. Consider removing the `void` statement.

### 13. Hardcoded color tokens throughout CRM components

**Files:** All 17 component files
**Impact:** Maintainability

Colors like `#0C1220`, `#1E2840`, `#8B99B0`, `#ECF0F7`, `#7C8FFF`, `#5A6882` are used consistently but hardcoded in every file. While this matches the existing project pattern, consider extracting to Tailwind theme variables if further CRM phases add more components.

This is not a blocking issue -- it is consistent with the rest of the codebase.

### 14. `DataTable` sorting is string-only

**File:** `src/components/crm/data-table.tsx` (line 69)
**Impact:** Dates and numbers sort lexicographically via `String(av).localeCompare`

The `{ numeric: true }` option in `localeCompare` handles number sorting correctly, but date strings like ISO timestamps will sort as strings (which happens to work for ISO format). This is acceptable for now but worth noting for future date column additions that might use non-ISO formats.

### 15. `DetailDrawer` has a custom close button AND Sheet's built-in close button

**File:** `src/components/crm/detail-drawer.tsx` vs `src/components/ui/sheet.tsx`

The Sheet component has `showCloseButton = true` by default (line 43 of sheet.tsx) and DetailDrawer adds its own close button in the header. This may result in two close buttons.

**Fix:** Pass `showCloseButton={false}` to SheetContent:
```tsx
<SheetContent side="right" showCloseButton={false} className={...}>
```

---

## Edge Cases Found by Scout

1. **Migration conflict (Critical #1):** Old `notes` table blocks CRM `notes` creation
2. **RLS vs API-level auth bypass:** Admin branch in API code has no effect when Supabase uses per-user auth tokens (High #4)
3. **Unbounded text input:** Notes content, task title/description have no server-side size limits (High #2)
4. **Style injection vector:** Unvalidated `color` field stored and rendered in `style` attributes (High #3)
5. **Dual close button:** DetailDrawer + Sheet default close button overlap (Low #15)

---

## Positive Observations

1. **Consistent auth pattern:** Every API route correctly uses `getAuthContext()` + `isAuthError()`, matching existing project conventions exactly
2. **Clean component API design:** All components are composable with sensible prop interfaces. Generic types on `DataTable<T>` and `KanbanBoard<T>` are well done.
3. **Proper loading/empty states:** Components consistently provide skeleton loaders and empty state UIs
4. **Fire-and-forget activity logging:** The `logActivity` helper is non-blocking, which is the correct pattern for audit logging
5. **Under 200 LOC:** All files comply with the project's file size rule (largest is `data-table.tsx` at 180 LOC)
6. **Type reuse:** Types are centralized in `management-types.ts` and `src/lib/crm/types.ts`, not duplicated
7. **Duplicate detection:** `person-skills` POST correctly handles the Postgres 23505 unique violation with a 409 response
8. **Correct Next.js 15 params pattern:** All `[id]` routes correctly use `params: Promise<{ id: string }>` with `await params`
9. **Dark theme consistency:** All components use the same color palette tokens throughout
10. **Accessibility:** ARIA labels on interactive elements (checkboxes, buttons) in data-table and notes-panel

---

## Recommended Actions

**Before merge (blockers):**
1. **Fix the `notes` table migration conflict** -- either DROP the old table or ALTER it (Critical #1)

**Before merge (strongly recommended):**
2. Add server-side max-length validation to notes content, task title/description, tag name (High #2)
3. Add hex color format validation for tag `color` field (High #3)
4. Add `entity_type` enum validation in API routes to return 400 instead of 500 on invalid values (Medium #5)
5. Pass `showCloseButton={false}` to SheetContent in DetailDrawer (Low #15)

**Post-merge (nice to have):**
6. Add `entity_id` UUID format validation (Medium #6)
7. Add `current_level` range validation in person-skills PATCH (Medium #11)
8. Add `status` enum validation in tasks PATCH (Medium #10)
9. Consider delete confirmation for notes (Medium #7)
10. Replace array index key in KpiCardGrid (Low #8)

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 29 |
| Total LOC | 1,927 |
| Max file LOC | 180 (data-table.tsx) |
| Files over 200 LOC | 0 |
| Auth pattern compliance | 9/9 API routes |
| Loading states | Present in data-table, notes-panel, activity-timeline |
| Empty states | Present in data-table, notes-panel, activity-timeline, kanban-board, kanban-column |
| XSS vectors | 0 (no dangerouslySetInnerHTML, no innerHTML, no eval) |
| Hardcoded secrets | 0 |
| TypeScript errors reported | 0 |

---

## Unresolved Questions

1. **Is the old `notes` table (from init_schema.sql) still in use?** If not, it should be dropped in the CRM migration. If it is used by the legacy interview platform, the CRM notes table needs a different name.
2. **Should admins see all notes/tasks across users?** The current API code suggests yes, but RLS prevents it. Needs product decision on whether to use service-role for admin queries.
3. **Is the `void request` pattern in tags GET intentional?** The `request` param is required by Next.js route handler signature but unused -- the `void` is unnecessary since Next.js does not warn on unused route handler params.
