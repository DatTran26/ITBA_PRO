# Code Review: Phase 3 — Persons Page Redesign

**Reviewer:** code-reviewer
**Date:** 2026-04-01
**Branch:** feat/crm-upgrade/phase-02-shared-components
**Focus:** HIGH and CRITICAL issues only

---

## Scope

- **Modified:** 6 files (management-types.ts, persons/[id]/route.ts, persons/page.tsx, persons-list-client.tsx, persons/[id]/page.tsx, person-detail-client.tsx)
- **New:** 10 files (3 view components, 6 tab components, 1 profile header)
- **LOC reviewed:** ~850
- **Scout findings:** Authorization patterns, data enrichment logic, Supabase query shapes, prop type flows

---

## Overall Assessment

Solid implementation with clean component decomposition, good use of parallel `Promise.all` fetches, and consistent design token usage. RLS policies protect against IDOR at the database level. However, there are several HIGH-priority issues around authorization inconsistency, missing input validation, stale pagination state, and unused code paths.

---

## CRITICAL Issues

### None found

RLS policies on `persons`, `person_skills`, `notes`, `entity_tags`, `activity_logs`, `crm_tasks`, and `tags` all enforce owner-scoped access via `auth.uid()`. No data leak path was identified.

---

## HIGH Priority Issues

### H1. PATCH route accepts arbitrary `status` values without validation

**File:** `src/app/api/persons/[id]/route.ts` line 4

The `status` field was added to `PATCH_WHITELIST` but no server-side validation ensures the value is one of the valid `PersonStatus` enum values. The database `CHECK` constraint on `persons.status` will reject invalid values, but the API returns a generic 500 error instead of a meaningful 400 validation error.

**Impact:** Poor developer experience; the client gets "Failed to update person" instead of knowing it sent an invalid status. Also, relying solely on DB constraints for validation is fragile if the constraint ever changes.

**Fix:**
```typescript
const VALID_PERSON_STATUSES = new Set(["active", "in_review", "training_needed", "skill_gap", "ready_for_promotion", "on_hold", "inactive"]);

// Inside PATCH handler, after building updateFields:
if ("status" in updateFields && !VALID_PERSON_STATUSES.has(updateFields.status as string)) {
  return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
}
```

---

### H2. Admin bypass in GET is inconsistent with RLS — admins see empty results silently

**File:** `src/app/api/persons/[id]/route.ts` lines 16-17

```typescript
if (!isAdmin) query = query.eq("created_by", userId);
```

The code skips the `created_by` filter for admins, intending admins to see all persons. However, the `persons` table RLS policy (`persons_select_own`) only allows `SELECT` where `created_by` matches the authenticated user — there is **no admin bypass policy**. Result: admins querying for another user's person get a silent 404 instead of the data they expect.

**Impact:** Admins cannot view other users' persons despite the code intending them to. This is a logic bug, not a security vulnerability. Same pattern applies to the PATCH and DELETE handlers which hard-filter on `created_by`.

**Fix:** Either:
1. Add an admin bypass RLS policy: `OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')` to the `persons_select_own` policy (and update/delete equivalents).
2. Or remove the `isAdmin` conditional in the route handler so it's consistent with the actual RLS behavior.

---

### H3. Pagination does not reset to page 1 when filters or search change

**File:** `src/app/dashboard/persons/persons-table-view.tsx` lines 37-41

`page` state is internal to `PersonsTableView`. When the parent component applies filters (search, status, type), the `data` prop changes but `page` stays on whatever value it was (e.g., page 3). If the filtered set has fewer rows, the user sees an empty page.

**Impact:** Users filtering a large list land on a blank page when the filtered results don't fill previous pages.

**Fix:** Reset page when `data.length` changes:
```typescript
useEffect(() => { setPage(1); }, [data.length]);
```
Or lift `page` state to the parent and reset on filter change.

---

### H4. Detail page uses `as any[]` casts, bypassing type safety

**File:** `src/app/dashboard/persons/[id]/page.tsx` lines 38-39

```typescript
results={(resultsRes.data ?? []) as any[]}
memberships={(membershipsRes.data ?? []) as any[]}
```

These `as any[]` casts suppress all TypeScript checking for `results` and `memberships` props. If the Supabase query shape changes (e.g., column rename), no compile-time error would catch the mismatch.

**Impact:** Type-safety hole. Bugs from schema changes would only surface at runtime.

**Fix:** Replace with proper type assertions:
```typescript
results={(resultsRes.data ?? []) as ResultRow[]}
memberships={(membershipsRes.data ?? []) as MembershipRow[]}
```
Import `ResultRow` and `MembershipRow` from `person-detail-client.tsx` or move them to `management-types.ts`.

---

### H5. Notes API POST does not validate `note_type` against allowed values

**File:** `src/app/api/notes/route.ts` line 54

```typescript
note_type: note_type || "general"
```

The `note_type` field is accepted from the client without validation against the valid set (`general`, `warning`, `feedback`, `development`, `recruitment`). The database `CHECK` constraint will reject invalid values, but the API returns a generic 500 instead of 400.

**Impact:** Same as H1 — poor error UX, DB-only validation is fragile.

**Fix:**
```typescript
const VALID_NOTE_TYPES = new Set(["general", "warning", "feedback", "development", "recruitment"]);
if (note_type && !VALID_NOTE_TYPES.has(note_type)) {
  return NextResponse.json({ error: "Invalid note_type" }, { status: 400 });
}
```

---

### H6. Notes content has no length validation — potential oversized payload

**File:** `src/app/api/notes/route.ts` line 50

`content` is checked for presence (`if (!content)`) but has no maximum length validation. A malicious or buggy client could send multi-megabyte note content.

**Impact:** Potential DB bloat and performance degradation. The `text` column type has no inherent limit.

**Fix:**
```typescript
if (!content || typeof content !== "string") return NextResponse.json({ error: "content is required" }, { status: 400 });
if (content.length > 10000) return NextResponse.json({ error: "content exceeds maximum length" }, { status: 400 });
```

---

### H7. Skills tab fetches position data client-side without error handling

**File:** `src/app/dashboard/persons/[id]/person-skills-tab.tsx` lines 18-28

```typescript
useEffect(() => {
  if (!positionId) return;
  fetch(`/api/positions/${positionId}`)
    .then((r) => r.ok ? r.json() : null)
    .then((data) => { ... })
    .catch(() => {});
}, [positionId]);
```

Issues:
1. Errors are silently swallowed (`.catch(() => {})`).
2. No loading state — the gap analysis section shows nothing during the fetch, which could be confused with "no requirements".
3. This is a waterfall: the position data could have been fetched in the server component's `Promise.all` alongside skills, results, etc.

**Impact:** Silent failures; confusing empty states; unnecessary client-side request that could be a server-side parallel fetch.

**Fix:** Move this fetch to the server component `page.tsx` and pass `requirements` as a prop. Add it to the existing `Promise.all`:
```typescript
// In page.tsx Promise.all:
positionId
  ? supabase.from("position_skill_requirements").select("*, skills(name, category)").eq("position_id", positionId)
  : Promise.resolve({ data: [] }),
```

---

## MEDIUM Priority Issues (noted for context, not the review focus)

- **M1.** `TagPickerPopover` imported in `person-detail-client.tsx` but never used in JSX (dead import).
- **M2.** `StickyNote` imported in `person-profile-header.tsx` but never used (dead import).
- **M3.** `persons/page.tsx` fetches ALL `entity_tags` for type=person and ALL `group_members` and ALL `person_skills` without filtering by the user's persons. RLS protects the data, but these queries scan more rows than necessary. For larger datasets, filter by person IDs from the first query.
- **M4.** Hardcoded color hex values throughout all components (e.g., `#030305`, `#0C1220`, `#7C8FFF`) instead of using CSS variables or Tailwind design tokens. Makes theming changes painful.
- **M5.** `persons-card-view.tsx` does not paginate — renders all filtered cards at once. Could cause performance issues with hundreds of persons.

---

## Edge Cases Found by Scouting

1. **Empty `positions` join:** When a person has a `position_id` that references a deleted position (cascade not configured on FK), the join returns `null`. The code handles this with `?.title ?? null` — safe.
2. **`memberships.map` null groups:** The kanban and relationships views handle `m.groups && (...)` checks. Memberships with null groups (from deleted groups) are silently filtered — acceptable.
3. **Bulk actions are no-ops:** `persons-list-client.tsx` lines 65-66 have `TODO` comments for bulk tag and bulk delete. `selectedIds` accumulate but actions do nothing. Not a bug, but should be documented as incomplete.
4. **`person.status` default in enrichment:** `persons/page.tsx` line 63 defaults `p.status ?? "active"`. If an older person record predates the status column migration, it would show as "active" even though the DB default handles this. Harmless double-default.

---

## Positive Observations

- Clean component decomposition — each tab is its own file under 100 lines
- Effective use of `Promise.all` for parallel data fetching in the detail page
- RLS policies are comprehensive and correctly scoped on all CRM tables
- API PATCH whitelist pattern prevents mass-assignment vulnerabilities
- Consistent empty states across all tabs and views
- Good use of `useMemo` for filter logic and KPI computation to avoid unnecessary re-renders

---

## Recommended Actions (Priority Order)

1. **H2** — Decide on admin access model for persons: add admin RLS bypass or remove the misleading `isAdmin` conditional in the route handler
2. **H7** — Move position requirements fetch to server component's `Promise.all`
3. **H3** — Fix pagination reset on filter change
4. **H1, H5** — Add server-side enum validation for `status` and `note_type` fields
5. **H6** — Add content length validation to notes API
6. **H4** — Replace `as any[]` casts with proper types
7. **M1, M2** — Remove dead imports
8. **M3** — Add person ID filtering to bulk queries in list page for performance at scale

---

## Metrics

| Metric | Value |
|--------|-------|
| Critical issues | 0 |
| High issues | 7 |
| Medium issues | 5 |
| Dead code (imports) | 2 |
| `as any` casts | 2 |
| XSS vectors | 0 (no `dangerouslySetInnerHTML`) |
| IDOR risk | None (RLS enforced) |

---

## Unresolved Questions

1. Should admins be able to see all persons across users? The API handler says yes, but RLS says no. This needs a product decision.
2. Are bulk actions (tag, delete) planned for this phase or deferred? If deferred, consider removing the `BulkActionBar` component to avoid user confusion.
3. The `persons/page.tsx` fetches ALL person_skills rows just to count them. At scale (1000+ persons, 10+ skills each), this becomes a performance concern. Consider using a Supabase aggregate or a `count` query instead.
