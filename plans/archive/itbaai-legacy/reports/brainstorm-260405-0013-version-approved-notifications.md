# Brainstorm: Version Approved Notifications for Non-Super-Admin Users

**Date:** 2026-04-05  
**Status:** Agreed — ready for implementation plan

---

## Problem Statement

Super_Admin can create/approve/manage versions via `/dashboard/versions`. When a version is approved (published), **no notification reaches other users**. Users must manually navigate to the versions page to discover updates.

---

## Current State (don't break)

| Component | What it does |
|-----------|-------------|
| `NotificationBell` | Dropdown, badge, 30s poll, localStorage persistence |
| `version_pending` type | Notifies Super_Admin of pending versions to approve |
| `candidate_completed` type | Notifies admin when candidate submits test |
| `versions` table | Full CRUD, status flow: draft→pending→approved→archived |
| `/dashboard/versions` page | Role-gated: Super_Admin sees all; others see approved only |

---

## Solution: Extend NotificationBell + DB Read Tracking

### New DB table
```sql
CREATE TABLE user_version_reads (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, version_id)
);
```

### New API: `/api/versions/unread`
- `GET` — returns approved versions not yet in `user_version_reads` for current user
- `POST` — inserts rows to mark version ID(s) as read (body: `{ version_ids: string[] }`)

### Extended `notification-bell.tsx`
- Add `version_approved` notification type
- New poll function: fetch from `/api/versions/unread` (replaces localStorage for version tracking)
- On bell open: call POST to mark all version notifications read in DB
- Existing `version_pending` + `candidate_completed` untouched

### Role-aware behavior
| Role | Notifications shown |
|------|-------------------|
| `super_admin` | `version_pending` (approval alerts) — existing |
| `admin` / others | `version_approved` (published release notes) — new |

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/app/api/versions/unread/route.ts` |
| Modify | `src/components/ui/notification-bell.tsx` |
| Supabase | Migration: `user_version_reads` table + RLS policies |

---

## Risks

| Risk | L | I | Mitigation |
|------|---|---|------------|
| RLS policy blocks read | M | H | Ensure users can select own rows; service role for inserts |
| Bell poll doubles DB reads | L | M | Unread API is lightweight (indexed by user_id + status) |
| Existing notifications broken | L | H | New poll function is additive; existing paths unchanged |

---

## Success Criteria
- Non-super-admin user receives bell badge when a version is approved
- Badge count decrements to 0 after opening bell
- Re-opening bell on different device shows 0 (DB-backed)
- Super_Admin bell behavior unchanged
