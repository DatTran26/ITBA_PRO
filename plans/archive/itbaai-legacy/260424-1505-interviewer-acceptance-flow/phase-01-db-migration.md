---
phase: 1
title: DB Migration
status: pending
effort: 0.5d
priority: critical
blocks: phase-02, phase-03, phase-04, phase-05, phase-06
---

# Phase 1 — DB Migration

## Overview
Thêm 3 columns vào `interview_schedules` để track interviewer response.

## Migration File
**Path:** `supabase/migrations/20260424000000_interview_acceptance_flow.sql`

```sql
-- Add interviewer acceptance columns to interview_schedules
ALTER TABLE interview_schedules
  ADD COLUMN IF NOT EXISTS interviewer_status text DEFAULT 'accepted'
    CHECK (interviewer_status IN ('pending','accepted','declined','reschedule_requested')),
  ADD COLUMN IF NOT EXISTS interviewer_proposed_at timestamptz,
  ADD COLUMN IF NOT EXISTS interviewer_note text;

-- Index for pending lookup (used in notification polling)
CREATE INDEX IF NOT EXISTS idx_interview_schedules_interviewer_status
  ON interview_schedules(interviewer_id, interviewer_status);

-- Backfill: existing rows already get DEFAULT 'accepted' — no extra UPDATE needed
```

## Behavior After Migration
| Scenario | `interviewer_status` value |
|---|---|
| Records cũ (backfill) | `accepted` (DEFAULT) |
| HR tạo lịch mới | `pending` (set trong schedule-interview route) |
| Interviewer accept | `accepted` |
| Interviewer decline | `declined` |
| Interviewer propose slot | `reschedule_requested` |

## Related Code Changes
**File:** `src/app/api/recruitment/applications/[id]/schedule-interview/route.ts`

Trong INSERT block, thêm field:
```typescript
interviewer_status: 'pending',   // add this line
```
Thay vì dùng DEFAULT, explicit set để rõ intent khi đọc code.

## Also Update — Interviews GET API
**File:** `src/app/api/recruitment/interviews/route.ts`

Thêm `interviewer_status, interviewer_proposed_at, interviewer_note` vào SELECT query để frontend có thể dùng.

```typescript
// Change select string to include new fields:
.select(`
  id,
  job_application_id,
  interviewer_id,
  scheduled_at,
  timezone,
  recruiter_note,
  status,
  interviewer_status,
  interviewer_proposed_at,
  interviewer_note,
  created_at,
  job_applications (...),
  interview_results (...)
`)
```

## Also Update — Type Definitions
**File:** `src/types/recruitment.ts` (nếu có InterviewSchedule type) hoặc trong `interviews-client.tsx`:

```typescript
interface InterviewItem {
  // ...existing fields...
  interviewer_status: 'pending' | 'accepted' | 'declined' | 'reschedule_requested';
  interviewer_proposed_at: string | null;
  interviewer_note: string | null;
}
```

## Validation
- [ ] Migration runs without error: `supabase db push` hoặc apply locally
- [ ] Existing records có `interviewer_status = 'accepted'`
- [ ] New schedule creation sets `interviewer_status = 'pending'`
- [ ] GET API trả về 3 fields mới
- [ ] TypeScript compile clean: `npx tsc --noEmit`
