---
title: "Version Approved Notifications"
description: "Notify non-super-admin users via bell dropdown when a version is approved, with DB-backed read state"
status: completed
priority: P2
effort: 3h
branch: dev
tags: [notifications, versions, supabase, ui]
created: 2026-04-05
---

# Version Approved Notifications

## Summary

When Super_Admin approves a version, non-super-admin users see a notification in the existing `NotificationBell` dropdown. Read state is persisted in a new `user_version_reads` DB table (not localStorage). Super_Admin bell behavior is unchanged.

## Brainstorm Report

- [brainstorm-260405-0013-version-approved-notifications.md](../reports/brainstorm-260405-0013-version-approved-notifications.md)

## Phases

| # | Phase | File | Status | Effort |
|---|-------|------|--------|--------|
| 1 | Supabase migration — `user_version_reads` table + RLS | [phase-01](phase-01-supabase-migration.md) | completed | 30m |
| 2 | `/api/versions/unread` GET + POST route | [phase-02](phase-02-unread-api.md) | completed | 1h |
| 3 | Extend `notification-bell.tsx` — role-aware polling + DB mark-read | [phase-03](phase-03-extend-notification-bell.md) | completed | 1.5h |

## Key Dependencies

- Supabase project access for migration (Phase 1 must complete before 2-3)
- `getAuthContext()` from `@/lib/api/auth-helpers` — reused as-is
- `createClient` (client-side) already available in `notification-bell.tsx`

## Files Changed

| Action | File |
|--------|------|
| Create | `src/app/api/versions/unread/route.ts` |
| Modify | `src/components/ui/notification-bell.tsx` |
| Create | Supabase migration SQL |

## Out of Scope

- Push notifications / WebSocket real-time
- Email notifications on version approval
- Migrating existing `candidate_completed` or `version_pending` localStorage to DB
- Changing the `version_pending` notification flow for Super_Admin

## Success Criteria

- Non-super-admin sees badge increment when a version is approved
- Opening bell marks all version_approved notifications as read (DB-persisted)
- Different device/browser shows correct read state (DB-backed)
- Super_Admin bell behavior identical to current (only `version_pending`)
- No regression on `candidate_completed` notifications
