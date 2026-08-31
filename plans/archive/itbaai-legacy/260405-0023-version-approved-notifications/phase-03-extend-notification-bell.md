---
title: "Phase 03 — Extend NotificationBell with version_approved"
status: pending
effort: 1.5h
---

# Phase 03 — Extend NotificationBell

## Context Links

- [Phase 02 — Unread API](phase-02-unread-api.md) (dependency)
- [plan.md](plan.md)
- [Current notification-bell.tsx](../../src/components/ui/notification-bell.tsx)
- [app-navbar.tsx](../../src/components/ui/app-navbar.tsx) — renders `<NotificationBell />`

## Overview

**Priority:** High
**Status:** Pending
**Depends on:** Phase 02

Extend the existing `NotificationBell` component to show `version_approved` notifications for non-super-admin users. Super_Admin continues to see only `version_pending`. Read state for the new type is DB-backed via the Phase 02 API.

## Key Insights

- The bell already imports `Sparkles` from lucide but doesn't use it — perfect for `version_approved` icon
- The bell has no knowledge of user role currently. Two approaches:
  - **(A) Prop from parent**: `app-navbar.tsx` already fetches `user.role` — pass it as prop to `NotificationBell`
  - **(B) Fetch inside bell**: bell fetches role itself via `createClient()`
  - **Decision: (A)** — avoids duplicate Supabase call; navbar already has role. Add optional `userRole` prop.
- Existing `version_pending` polling uses direct Supabase client queries; new `version_approved` uses the `/api/versions/unread` fetch API — intentional separation (DB read tracking is server-side)
- The `markAllRead` flow currently only toggles local state. For `version_approved`, it must also POST to `/api/versions/unread`
- Keep `candidate_completed` and `version_pending` flows untouched

## Requirements

### Functional
- Add `version_approved` to Notification type union
- Non-super-admin: poll `GET /api/versions/unread` every 30s alongside existing checks
- Non-super-admin: skip `version_pending` polling (they can't approve versions)
- Super_admin: skip `version_approved` polling (they see pending, not approved)
- On bell open: POST to `/api/versions/unread` with unread version_approved IDs
- Display: Sparkles icon, `#7C8FFF` color, link to `/dashboard/versions`

### Non-functional
- No additional Supabase auth calls (reuse role from prop)
- Backward compatible — bell works without `userRole` prop (defaults to showing both, for safety)

## Architecture

```
app-navbar.tsx
  └─ <NotificationBell userRole={user?.role} />

notification-bell.tsx
  ├── Poll A: checkForNewResults()       [existing — candidate_completed]
  ├── Poll B: checkForPendingVersions()  [extracted from current code — super_admin only]
  ├── Poll C: checkForApprovedVersions() [NEW — non-super-admin only, calls /api/versions/unread]
  └── markAllRead()
      ├── Local state toggle              [existing]
      └── POST /api/versions/unread       [NEW — for version_approved items]
```

## Related Code Files

| Action | File |
|--------|------|
| Modify | `src/components/ui/notification-bell.tsx` |
| Modify | `src/components/ui/app-navbar.tsx` (pass `userRole` prop) |
| Read | `src/app/api/versions/unread/route.ts` (Phase 02 output) |

## Implementation Steps

### 1. Update Notification type

In `notification-bell.tsx`, add `version_approved` to the type union:

```typescript
interface Notification {
  id: string;
  type: "candidate_completed" | "version_pending" | "version_approved";
  title: string;
  description: string;
  href?: string;
  timestamp: string;
  read: boolean;
}
```

### 2. Add `userRole` prop

```typescript
interface NotificationBellProps {
  userRole?: string;
}

export default function NotificationBell({ userRole }: NotificationBellProps) {
```

Derive flags inside the component:
```typescript
const isSuperAdmin = userRole === "super_admin";
```

### 3. Extract pending version check

Refactor `checkForNewResults` — extract the pending-version block into a separate `checkForPendingVersions` function. Guard it with `if (!isSuperAdmin) return;` so non-super-admins skip it.

The existing candidate_completed check stays in `checkForNewResults` (runs for all roles — admins see test completions).

### 4. Add `checkForApprovedVersions`

New callback, runs only when `!isSuperAdmin`:

```typescript
const checkForApprovedVersions = useCallback(async () => {
  if (isSuperAdmin) return;
  try {
    const res = await fetch("/api/versions/unread");
    if (!res.ok) return;
    const { versions } = await res.json();

    if (versions && versions.length > 0) {
      const newNotifs: Notification[] = versions.map((v: any) => ({
        id: `version-approved-${v.id}`,
        type: "version_approved" as const,
        title: `v${v.version_number} — ${v.title}`,
        description: v.description
          ? v.description.slice(0, 80) + (v.description.length > 80 ? "..." : "")
          : "A new version has been approved",
        href: "/dashboard/versions",
        timestamp: v.approved_at,
        read: false,
      }));

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const unique = newNotifs.filter((n) => !existingIds.has(n.id));
        return [...unique, ...prev].slice(0, MAX_NOTIFICATIONS);
      });
    }
  } catch { /* silent */ }
}, [isSuperAdmin]);
```

### 5. Update polling useEffect

```typescript
useEffect(() => {
  checkForNewResults();       // candidate_completed (all roles)
  checkForPendingVersions();  // version_pending (super_admin only)
  checkForApprovedVersions(); // version_approved (non-super-admin only)

  const interval = setInterval(() => {
    checkForNewResults();
    checkForPendingVersions();
    checkForApprovedVersions();
  }, POLL_INTERVAL);

  return () => clearInterval(interval);
}, [checkForNewResults, checkForPendingVersions, checkForApprovedVersions]);
```

### 6. Update `markAllRead` for DB persistence

When the bell opens, also POST version_approved IDs to the API:

```typescript
const markAllRead = useCallback(() => {
  // Collect unread version_approved notification IDs (extract version UUID)
  const unreadVersionIds = notifications
    .filter((n) => !n.read && n.type === "version_approved")
    .map((n) => n.id.replace("version-approved-", ""));

  // Mark locally
  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // Persist version_approved read state to DB
  if (unreadVersionIds.length > 0) {
    fetch("/api/versions/unread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version_ids: unreadVersionIds }),
    }).catch(() => { /* silent — local state already updated */ });
  }
}, [notifications]);
```

### 7. Update `iconForType`

```typescript
const iconForType = (type: Notification["type"]) => {
  switch (type) {
    case "candidate_completed": return <UserCheck className="w-4 h-4 text-[#36DDAB]" />;
    case "version_pending":     return <GitBranch className="w-4 h-4 text-[#B48EFF]" />;
    case "version_approved":    return <Sparkles className="w-4 h-4 text-[#7C8FFF]" />;
  }
};
```

### 8. Pass `userRole` from app-navbar

In `src/components/ui/app-navbar.tsx`, change line ~214:

```diff
- {showNotifications && <NotificationBell />}
+ {showNotifications && <NotificationBell userRole={user?.role} />}
```

### 9. Remove version_approved items from localStorage persistence

The existing `STORAGE_KEY` localStorage stores ALL notification types. When `version_approved` items are loaded from the API on each poll, they should NOT also be replayed from localStorage (would cause duplicates). Two options:
- **(A)** Filter out `version_approved` before saving to localStorage
- **(B)** On mount, filter out `version_approved` from stored data (API is source of truth)

**Decision: (A)** — cleaner. When persisting to localStorage, exclude `version_approved`:

```typescript
useEffect(() => {
  const persistable = notifications.filter((n) => n.type !== "version_approved");
  if (persistable.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}, [notifications]);
```

### 10. Verify compilation and test

- Run `npx next build` or typecheck
- Manual test: approve a version as super_admin, then check bell as a regular admin/user

## Todo List

- [ ] Add `version_approved` to Notification type union
- [ ] Add `userRole` prop to `NotificationBell`
- [ ] Extract `checkForPendingVersions` from `checkForNewResults`, guard with `isSuperAdmin`
- [ ] Implement `checkForApprovedVersions` (fetches `/api/versions/unread`)
- [ ] Update polling useEffect to call all three functions
- [ ] Update `markAllRead` to POST version_approved IDs to API
- [ ] Add `version_approved` case to `iconForType` (Sparkles, #7C8FFF)
- [ ] Exclude `version_approved` from localStorage persistence
- [ ] Pass `userRole` prop in `app-navbar.tsx`
- [ ] Verify compilation
- [ ] Manual end-to-end test

## Success Criteria

- Non-super-admin sees badge when approved versions exist
- Opening bell clears badge AND persists read state to DB
- Refreshing page / different browser: previously read versions don't reappear
- Super_Admin sees only `version_pending` notifications (no change)
- `candidate_completed` notifications unaffected for all roles
- No TypeScript compilation errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `userRole` prop is undefined on first render | Medium | Low | Guard `isSuperAdmin` defaults to false; both checks run initially, API returns empty for super_admin anyway |
| Stale `notifications` ref in `markAllRead` | Low | Medium | `markAllRead` depends on `[notifications]`, re-created on change |
| Race between poll and markAllRead | Low | Low | markAllRead is fire-and-forget POST; next poll will reflect DB state |
| Breaking existing notification-bell tests | Low | Medium | No tests exist currently; manual QA sufficient |

## Security Considerations

- API calls go through authenticated endpoints (cookie-based auth via Supabase)
- No sensitive data exposed — version metadata is already visible on `/dashboard/versions`
- Role check is defensive: even if `userRole` is spoofed client-side, the API returns `[]` for super_admin and RLS prevents cross-user reads

## Next Steps

- After all 3 phases: full end-to-end QA
- Future: consider migrating `candidate_completed` and `version_pending` to DB-backed read state as well
