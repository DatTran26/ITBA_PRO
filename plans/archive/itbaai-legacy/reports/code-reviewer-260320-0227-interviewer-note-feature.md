# Code Review: Interviewer Note Feature

**Date:** 2026-03-20
**Reviewer:** code-reviewer agent
**Scope:** 3 files (migration, API route, client component)
**Focus:** Bugs, security, logic, code quality

---

## Overall Assessment

The feature is functional and follows existing codebase patterns. The migration is idempotent, the PATCH handler has auth + type validation, and the client manages state correctly. However, there are several issues ranging from medium to high priority that should be addressed before merging.

---

## Critical Issues

None found.

---

## High Priority

### H1. PATCH handler missing try-catch — unhandled `request.json()` crash
**File:** `src/app/api/results/[id]/route.ts` (PATCH, line 14)
**Severity:** HIGH

If the request body is not valid JSON (e.g., empty body, malformed payload), `request.json()` throws an unhandled exception. This results in a 500 error with a stack trace potentially leaking in dev mode. The codebase's own `code-standards.md` mandates wrapping API routes in try-catch.

**Current:**
```typescript
const body = await request.json();
```

**Recommended:**
```typescript
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { note } = body;

        if (typeof note !== "string") {
            return NextResponse.json({ error: "Invalid note value" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("results")
            .update({ note })
            .eq("id", id)
            .select("note")
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true, note: data.note });
    } catch (error) {
        console.error("[Results PATCH] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
```

**Note:** The existing GET handler in the same file also lacks try-catch. Same pattern inconsistency.

### H2. No note length limit — potential abuse / DB bloat
**File:** `src/app/api/results/[id]/route.ts` (line 17)
**Severity:** HIGH

The PATCH handler validates `typeof note === "string"` but does not enforce a maximum length. A malicious or buggy client could send megabytes of text. The DB column is `text` (unbounded). This can cause:
- Storage abuse
- Slow queries if notes are inadvertently selected in list views
- Payload size issues

**Recommended:** Add a server-side length check:
```typescript
const MAX_NOTE_LENGTH = 5000;
if (typeof note !== "string" || note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: "Invalid note value" }, { status: 400 });
}
```

And add a `maxLength` attribute to the client `<Textarea>` for UX parity.

### H3. GET handler lacks auth — any user can read any result by ID
**File:** `src/app/api/results/[id]/route.ts` (GET, lines 33-56)
**Severity:** HIGH

The GET handler has **no authentication check**. While the results table has RLS with `results_select_own` set to `USING (true)` (which means any authenticated user can read it), the handler does not even call `supabase.auth.getUser()`. Since the Supabase client is initialized with `NEXT_PUBLIC_SUPABASE_ANON_KEY`, an unauthenticated request will still go through with the anon role. The RLS policy `results_select_own` uses `USING (true)` which allows anon access.

**Impact:** Candidate data (name, email, scores, AI analysis) is accessible to anyone who guesses or enumerates a UUID. This is a data exposure risk.

**Note:** This is a pre-existing issue, not introduced by this PR. However, the note data now rides on this same unauthenticated GET path, so the note content is also exposed.

**Recommended:** Add auth check to GET, consistent with the PATCH handler. Also consider tightening the RLS policy `results_select_own` from `USING (true)` to scoped ownership.

---

## Medium Priority

### M1. Supabase error on PATCH leaks internal error messages
**File:** `src/app/api/results/[id]/route.ts` (line 28)
**Severity:** MEDIUM

```typescript
if (error) return NextResponse.json({ error: error.message }, { status: 500 });
```

`error.message` from Supabase can contain internal details (table names, constraint names, etc.). Return a generic message to the client and log the detail server-side:

```typescript
if (error) {
    console.error("[Results PATCH] Supabase error:", error.message);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
}
```

### M2. File size violation: result-detail-client.tsx is 722 LOC
**File:** `src/app/dashboard/results/[id]/result-detail-client.tsx`
**Severity:** MEDIUM

The project standard (`code-standards.md`) mandates max 200 LOC per file. This file is 722 lines. The note feature adds ~35 lines (state + UI), which is modest, but the file was already far over budget.

**Recommended:** Extract into focused sub-components:
- `note-card.tsx` (~40 LOC) — the interviewer note textarea + save
- `follow-up-tab.tsx` (~120 LOC) — follow-up questions tab
- `question-breakdown-tab.tsx` (~60 LOC) — question breakdown tab
- `result-sidebar.tsx` (~80 LOC) — AI analysis + suggested questions

This is not a blocker for this PR, but should be tracked.

### M3. Duplicate `Result` interface across 3 files
**File:** `result-detail-client.tsx`, `test-detail-client.tsx`, `result-client.tsx`
**Severity:** MEDIUM

The `Result` interface is defined independently in 3 files. The new `note` field was added to `result-detail-client.tsx` but not to the other two (which is correct since they don't need it), but the duplication invites future drift.

**Recommended:** Extract shared types to `src/types/` or `src/lib/types.ts` and extend where needed.

### M4. `noteSaved` state tracks "saved" but doesn't re-sync with server
**File:** `result-detail-client.tsx` (line 187-188)
**Severity:** MEDIUM

The `noteSaved` state is initialized from `!!result.note` and set to `true` after a successful save. However, if the user clears the textarea and saves an empty string, `noteSaved` is set to `true` and the status shows "Saved" -- this is fine. But the disabled condition on the save button:

```typescript
disabled={isSavingNote || (noteSaved && noteText === (result.note || ""))}
```

Uses `result.note` which is the **initial prop value** and never updates after a save. After saving "hello", then typing "hello" again, the button remains enabled because `result.note` is still the original value (e.g., `null`).

**Impact:** Minor UX glitch -- the save button may be incorrectly enabled/disabled after the first save.

**Recommended:** Track the last-saved note value in a ref or state:
```typescript
const [lastSavedNote, setLastSavedNote] = useState(result.note || "");
// In handleSaveNote success:
setLastSavedNote(noteText);
// Button disabled:
disabled={isSavingNote || noteText === lastSavedNote}
```

---

## Low Priority

### L1. No debounce on save — rapid clicks can fire multiple requests
**File:** `result-detail-client.tsx` (line 189)
**Severity:** LOW

The save button is disabled during `isSavingNote`, which prevents exact double-clicks. However, very fast clicks before the state update propagates could theoretically fire twice. Not a real bug given React's batched updates, but a debounce or request-abort pattern would be more robust.

### L2. `id` parameter not validated as UUID format
**File:** `src/app/api/results/[id]/route.ts`
**Severity:** LOW

The `id` from the URL path is passed directly to `.eq("id", id)`. If the column is UUID, Postgres will reject invalid formats with a clear error. No crash risk, but a 400 response for invalid format is friendlier than a 500 from Postgres.

**Note:** This is consistent with other API routes in the project (none validate UUID format), so not a regression.

### L3. Migration lacks a COMMENT or CHANGELOG entry
**File:** `supabase/migrations/20260320000000_add_note_to_results.sql`
**Severity:** LOW

The migration is a clean single-line `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Idempotent and safe. Minor suggestion: add a SQL comment with the ticket/PR reference for traceability.

---

## Positive Observations

1. **Migration is idempotent** -- `ADD COLUMN IF NOT EXISTS` ensures re-runs are safe
2. **Auth check on PATCH** -- correctly uses `supabase.auth.getUser()` before allowing writes
3. **RLS UPDATE policy exists** -- `results_update_own_tests` scopes updates to the recruiter's own test results, so even if a user bypasses the API auth, RLS protects cross-user writes
4. **Type validation** -- `typeof note !== "string"` rejects non-string payloads
5. **Consistent UI** -- Note card follows the existing sidebar card pattern (same Card, CardHeader, CardContent structure)
6. **Good UX feedback** -- toast notifications, "Saved" indicator, loading spinner on button
7. **`useCallback` usage** -- `handleSaveNote` is memoized with correct dependencies

---

## Recommended Actions (Priority Order)

1. **[HIGH]** Wrap PATCH (and GET) handler in try-catch per project standards
2. **[HIGH]** Add server-side note length limit (e.g., 5000 chars)
3. **[HIGH]** Add auth to GET handler (pre-existing but now exposes note data too)
4. **[MEDIUM]** Replace `error.message` in 500 responses with generic message + server-side log
5. **[MEDIUM]** Fix `noteSaved` / disabled-button logic to track last-saved value
6. **[MEDIUM]** Track file-size debt: plan extraction of sub-components from the 722-LOC file
7. **[LOW]** Consider extracting shared `Result` interface to a types module

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 3 |
| LOC added (est.) | ~45 |
| Type Coverage | Adequate (no `any` in new code) |
| Test Coverage | Not applicable (no tests added) |
| Linting Issues | 0 new (existing eslint-disable on line 290 is pre-existing) |
| RLS Coverage | UPDATE policy exists and correctly scoped |

---

## Unresolved Questions

1. Should the `note` field be visible to candidates on their result page (`/test/[token]/result`)? Currently it is exposed via the unauthenticated GET handler and the `select("*")` query.
2. Is there a desired max length for notes? 5000 chars is a reasonable default but product should confirm.
3. Should note edits be audited (who changed what, when)?
