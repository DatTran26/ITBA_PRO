---
title: "Phase 02 — /api/versions/unread Route"
status: pending
effort: 1h
---

# Phase 02 — Unread Versions API

## Context Links

- [Phase 01 — DB migration](phase-01-supabase-migration.md) (dependency)
- [plan.md](plan.md)
- [Existing versions API](../../src/app/api/versions/route.ts) — pattern reference
- [Auth helpers](../../src/lib/api/auth-helpers.ts) — `getAuthContext()`

## Overview

**Priority:** High (blocking Phase 3)
**Status:** Pending
**Depends on:** Phase 01

Create `src/app/api/versions/unread/route.ts` with two handlers:
- `GET` — returns approved versions not yet read by current user
- `POST` — marks specified version IDs as read

## Key Insights

- Follow the exact same auth pattern as `src/app/api/versions/route.ts`: `getAuthContext()` + `isAuthError()` guard
- The GET query is a LEFT JOIN anti-pattern (versions WHERE NOT EXISTS in user_version_reads) — Supabase client supports this via `.not()` filter or raw RPC; simplest approach is a two-step query
- POST should be idempotent (upsert behavior) — re-marking an already-read version is a no-op
- This API is for ALL authenticated users, not just admin/super_admin

## Requirements

### Functional
- `GET /api/versions/unread` — returns `{ versions: VersionUnread[] }` where `VersionUnread` has: `id`, `version_number`, `title`, `description`, `approved_at`
- `POST /api/versions/unread` — accepts `{ version_ids: string[] }`, inserts rows into `user_version_reads`, returns `{ success: true }`
- Both endpoints require authentication (401 if unauthenticated)
- GET excludes super_admin users (return empty array) — super_admin has `version_pending`, not `version_approved`

### Non-functional
- GET response should be lightweight (only fields needed for notification display)
- POST must handle concurrent calls gracefully (upsert, not insert-or-fail)

## Architecture

```
GET /api/versions/unread
  1. getAuthContext() → userId, isSuperAdmin
  2. if isSuperAdmin → return { versions: [] }
  3. Query: SELECT from versions WHERE status='approved'
     AND id NOT IN (SELECT version_id FROM user_version_reads WHERE user_id=userId)
  4. Return { versions }

POST /api/versions/unread
  1. getAuthContext() → userId
  2. Parse body { version_ids: string[] }
  3. Validate version_ids is non-empty array of strings
  4. UPSERT into user_version_reads for each (userId, version_id)
  5. Return { success: true }
```

## Related Code Files

| Action | File |
|--------|------|
| Create | `src/app/api/versions/unread/route.ts` |
| Read | `src/lib/api/auth-helpers.ts` — reuse `getAuthContext`, `isAuthError` |
| Read | `src/app/api/versions/route.ts` — pattern reference |

## Implementation Steps

### 1. Create route file

Create `src/app/api/versions/unread/route.ts`.

### 2. Implement GET handler

```typescript
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  // Super_Admin uses version_pending, not version_approved
  if (ctx.isSuperAdmin) {
    return NextResponse.json({ versions: [] });
  }

  // Get IDs the user has already read
  const { data: readRows } = await ctx.supabase
    .from("user_version_reads")
    .select("version_id")
    .eq("user_id", ctx.userId);

  const readIds = (readRows ?? []).map((r) => r.version_id);

  // Fetch approved versions not yet read
  let query = ctx.supabase
    .from("versions")
    .select("id, version_number, title, description, approved_at")
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(20);

  if (readIds.length > 0) {
    // Supabase .not().in() for exclusion
    query = query.not("id", "in", `(${readIds.join(",")})`);
  }

  const { data: versions, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ versions: versions ?? [] });
}
```

### 3. Implement POST handler

```typescript
export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { version_ids } = body;

  if (!Array.isArray(version_ids) || version_ids.length === 0) {
    return NextResponse.json({ error: "version_ids must be a non-empty array" }, { status: 400 });
  }

  // Upsert — ON CONFLICT DO NOTHING (idempotent)
  const rows = version_ids.map((vid: string) => ({
    user_id: ctx.userId,
    version_id: vid,
  }));

  const { error } = await ctx.supabase
    .from("user_version_reads")
    .upsert(rows, { onConflict: "user_id,version_id", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

### 4. Verify compilation

Run `npx next build` or typecheck to ensure no TS errors.

## Todo List

- [ ] Create `src/app/api/versions/unread/route.ts`
- [ ] Implement GET handler with auth guard
- [ ] Implement POST handler with upsert
- [ ] Verify GET returns empty array for super_admin
- [ ] Verify GET returns unread approved versions for non-super-admin
- [ ] Verify POST marks versions as read (idempotent)
- [ ] Verify 401 response when unauthenticated
- [ ] Verify compilation passes

## Success Criteria

- `GET /api/versions/unread` returns only approved versions the user hasn't read
- `GET` returns `[]` for super_admin users
- `POST` with `version_ids` inserts read records; subsequent GET excludes those versions
- Calling POST twice with the same IDs does not error (idempotent)
- Both endpoints return 401 for unauthenticated requests

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Supabase `.not().in()` syntax wrong | Medium | Low | Test with small dataset; fall back to RPC if needed |
| Upsert `onConflict` naming | Low | Medium | Supabase JS v2 uses column names as string; verify in docs |
| Large number of approved versions | Low | Low | Limited to 20 in GET; read rows grow slowly |

## Security Considerations

- Auth required on both endpoints via `getAuthContext()`
- Users can only mark versions as read for themselves (RLS + `ctx.userId`)
- No data exposure — GET returns only version metadata, not user data
- POST validates input (array, non-empty)

## Next Steps

- Phase 03 will call these endpoints from `notification-bell.tsx`
