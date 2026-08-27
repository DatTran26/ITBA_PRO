---
title: Interviewer Acceptance Flow
status: completed
created: 2026-04-24
branch: dev
brainstorm: plans/reports/brainstorm-260424-1505-interviewer-acceptance-flow.md
---

# Interviewer Acceptance Flow

## Overview
Thêm acceptance flow đầy đủ cho interviewer: nhận notification khi được assign, accept/decline/propose slot, dedicated dashboard, và HR thấy response status.

## Phases

| # | Phase | Status | Effort | File |
|---|---|---|---|---|
| 1 | DB Migration | completed | 0.5d | [phase-01](phase-01-db-migration.md) |
| 2 | API Respond Endpoint | completed | 0.5d | [phase-02](phase-02-api-respond-endpoint.md) |
| 3 | Interviewer Dashboard | completed | 1d | [phase-03](phase-03-interviewer-dashboard.md) |
| 4 | Acceptance UI | completed | 1d | [phase-04](phase-04-acceptance-ui.md) |
| 5 | HR-side Visibility | completed | 0.5d | [phase-05](phase-05-hr-side-visibility.md) |
| 6 | Notifications | completed | 0.5d | [phase-06](phase-06-notifications.md) |

**Total:** ~4 ngày

## Dependencies
```
Phase 1 → Phase 2 → Phase 3
                  → Phase 4 → Phase 5
         Phase 2 → Phase 6
```

## Key Files
- `supabase/migrations/` — DB migration (Phase 1)
- `src/app/api/recruitment/interviews/[id]/respond/route.ts` — new API (Phase 2)
- `src/app/dashboard/page.tsx` — add interviewer branch (Phase 3)
- `src/app/dashboard/interviewer-dashboard-client.tsx` — new file (Phase 3)
- `src/app/dashboard/interviews/interviews-client.tsx` — acceptance UI (Phase 4)
- `src/hooks/use-notifications.ts` — extend notification types (Phase 6)

## Decisions
- Backfill existing records: `interviewer_status = 'accepted'` (DEFAULT handles it)
- Interviewer có full access to `/dashboard/recruitment/[id]` (no extra gate needed)
- Notification: polling-based (15s), extend existing `use-notifications.ts`
