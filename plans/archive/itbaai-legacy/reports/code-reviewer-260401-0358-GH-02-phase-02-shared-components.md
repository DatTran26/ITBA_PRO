# Code Review: Phase 2 - Shared CRM Components

**Branch:** `feat/crm-upgrade/phase-02-shared-components`
**Date:** 2026-03-31
**Reviewer:** code-reviewer agent

---

## Scope

- **Files:** 29 new files (17 React components, 3 lib modules, 9 API route files, 3 shadcn primitives)
- **LOC:** 1,217 total
- **Focus:** Full review of all Phase 2 additions
- **Max file:** `data-table.tsx` at 180 LOC (all files under 200 limit)

## Overall Assessment

**PASS with 2 HIGH items.** The implementation is clean, consistent, and well-structured. All API routes use the correct `getAuthContext` + `isAuthError` auth pattern. No XSS vectors, no hardcoded secrets, no `dangerouslySetInnerHTML`. RLS policies are correctly defined at the database layer. Components are composable with consistent dark theme tokens.

---

## Critical Issues

None.

---

## High Priority

### H1. IDOR Risk: Notes PATCH/DELETE and Tasks PATCH/DELETE lack app-level ownership checks

**Files:**
- `src/app/api/notes/[id]/route.ts` (lines 19-26, 68-74)
- `src/app/api/tasks/[id]/route.ts` (lines 19-26, 66-73)

**Problem:** The PATCH and DELETE handlers fetch the record by `id` only (`.eq("id", id).single()`), without scoping to the current user. Any authenticated user could modify or delete another user's note/task by guessing the UUID.

**Mitigation:** RLS policies at the database level DO restrict access (`notes_update_own`, `notes_delete_own`, `ct_update_own`, `ct_delete_own`), so Supabase will return an error if the row doesn't belong to the user. However, the error is a generic RLS-triggered error, not a clean 403/404. The existing pattern in other routes (e.g., `persons/[id]/route.ts` line 17) adds `.eq("created_by", userId)` for non-admin users.

**Impact:** Medium-low because RLS prevents actual data breach. But:
1. Error messages are misleading (generic 500 instead of 404)
2. Inconsistent with existing route patterns
3. Admin bypass logic (`isAdmin` check) is missing

**Fix example for notes PATCH:**
```typescript
// After: const { data: existing, error: fetchError } = await supabase
let noteQuery = supabase.from("notes").select("entity_type, entity_id, is_pinned").eq("id", id);
if (!isAdmin) noteQuery = noteQuery.eq("author_id", userId);
const { data: existing, error: fetchError } = await noteQuery.single();
```

Apply the same pattern to: notes DELETE, tasks PATCH, tasks DELETE.

### H2. Missing `entity_type` validation in API routes

**Files:** All API routes accepting `entity_type` from request body/params:
- `src/app/api/notes/route.ts` POST
- `src/app/api/entity-tags/route.ts` POST/DELETE
- `src/app/api/tasks/route.ts` POST

**Problem:** The `entity_type` field from user input is passed directly to Supabase without validating against the allowed set (`person`, `position`, `group`). While the database CHECK constraint will reject invalid values, the API returns a generic "Failed to create ..." 500 error instead of a clear 400 validation error.

**Fix example:**
```typescript
const ALLOWED_ENTITY_TYPES = ["person", "position", "group"] as const;
if (!ALLOWED_ENTITY_TYPES.includes(entity_type)) {
  return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });
}
```

---

## Medium Priority

### M1. `logActivity` fire-and-forget silently swallows failures

**File:** `src/lib/crm/log-activity.ts`

The function returns `void` and only `console.error`s on failure. If the Supabase insert fails (e.g., RLS policy mismatch, network error), the caller has no feedback. This is acceptable for audit logging, but the `console.error` won't surface in structured logging. Consider using `console.warn` or a structured logger if one is added later.

**Verdict:** Acceptable as-is for MVP. Low risk.

### M2. `NotesPanel` and `TagPickerPopover` lack error feedback to user

**Files:**
- `src/components/crm/notes-panel.tsx` (lines 23-30, 35-44, 47-59, 62-64)
- `src/components/crm/tag-picker-popover.tsx` (lines 48-57, 59-77)

**Problem:** All fetch/mutate calls silently fail if `res.ok` is false. No toast notification or error state is surfaced to the user.

**Fix:** Add Sonner toast on error, consistent with the rest of the codebase. Example:
```typescript
import { toast } from "sonner";
// After failed fetch:
if (!res.ok) toast.error("Failed to create note");
```

### M3. `KpiCardGrid` uses array index as React key

**File:** `src/components/crm/kpi-card-grid.tsx` line 13

```tsx
<KpiCard key={index} data={item} />
```

If the KPI items array gets reordered or filtered, index-based keys cause incorrect reconciliation. Use `item.label` as key since labels should be unique per grid.

### M4. `data-table.tsx` sorting compares everything as strings

**File:** `src/components/crm/data-table.tsx` lines 62-71

Numeric values and dates are compared via `String(av).localeCompare(String(bv), undefined, { numeric: true })`. The `{ numeric: true }` option handles simple numbers, but ISO date strings (e.g., `2026-03-31`) already sort correctly as strings. Acceptable for current use cases.

**Verdict:** Acceptable. Note if date/number sorting issues arise later.

---

## Low Priority

### L1. `tags/route.ts` GET suppresses `request` with `void request`

**File:** `src/app/api/tags/route.ts` line 10

The `void request` is a workaround for unused parameter lint warnings. This is fine but could instead use `_request` prefix convention matching the pattern in `persons/[id]/route.ts`.

### L2. Hardcoded color hex strings across components

Multiple components use hex color literals like `#7C8FFF`, `#0C1220`, `#1E2840`, etc. These are consistent with the design tokens listed in the review criteria but could be extracted to CSS custom properties or a theme constants file for easier theme changes. Not blocking for Phase 2.

---

## Edge Cases Found by Scout

1. **Notes ordering after pin toggle:** `notes-panel.tsx` re-sorts locally after toggling pin, which may diverge from the server's sort order if there are concurrent edits. Acceptable for single-user MVP.

2. **Tag name uniqueness:** The DB has `UNIQUE(name, created_by)` but the frontend doesn't check for duplicate names before POST. The 500 error will be returned without a friendly message. Consider catching error code `23505` (like `person-skills/route.ts` does) in `tags/route.ts` POST.

3. **`activity-logs` GET has no pagination:** Returns up to 50 items (hardcoded limit). Sufficient for now but may need cursor pagination for entities with high activity.

4. **`entity-tags/route.ts` DELETE uses request body:** HTTP DELETE with a JSON body is technically allowed but uncommon. Some proxies/CDNs may strip the body from DELETE requests. The existing pattern works with the current Vercel deployment but should be noted.

---

## Positive Observations

- All 9 API route files use the correct `getAuthContext` + `isAuthError` pattern consistently
- All files under 200 LOC (max: 180 in `data-table.tsx`)
- Dark theme tokens are consistent across all 17 components
- Good TypeScript typing: generic `DataTable<T>`, proper `ColumnDef<T>`, typed props everywhere
- `person-skills/route.ts` POST correctly handles duplicate constraint (error code `23505`) with a 409 response
- Components are composable: `KanbanBoard` uses `KanbanColumn`, `NotesPanel` uses `NoteForm`, etc.
- shadcn/ui primitives (`checkbox`, `popover`, `sheet`) use Base UI, consistent with project convention
- No `dangerouslySetInnerHTML`, `eval`, or other XSS vectors
- Activity logging is consistently applied across all mutation endpoints
- Next.js 15 async `params` pattern used correctly (`{ params }: { params: Promise<{ id: string }> }`)

---

## Recommended Actions

1. **[HIGH]** Add ownership scoping (`.eq("author_id"/"created_by", userId)` for non-admin) to PATCH/DELETE handlers in `notes/[id]/route.ts` and `tasks/[id]/route.ts`
2. **[HIGH]** Add `entity_type` validation against allowed values in POST routes for notes, entity-tags, and tasks
3. **[MEDIUM]** Add toast error feedback in `NotesPanel` and `TagPickerPopover` for failed API calls
4. **[MEDIUM]** Handle duplicate tag name (23505) in `tags/route.ts` POST like person-skills does
5. **[LOW]** Replace index key with `item.label` in `KpiCardGrid`

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 29 |
| Total LOC | 1,217 |
| TypeScript errors | 0 (pre-verified) |
| Max file size | 180 LOC |
| Auth pattern coverage | 100% (all routes) |
| XSS vectors | 0 |
| Hardcoded secrets | 0 |
| Critical issues | 0 |
| High issues | 2 |
| Medium issues | 4 |
| Low issues | 2 |

---

## Unresolved Questions

1. Should admin users be able to see ALL notes/tasks across all users, or only their own? The GET handlers scope non-admin reads, but PATCH/DELETE don't check admin status at all.
2. Should the `entity-tags` DELETE switch from body-based to query-param-based to avoid proxy body-stripping issues?
