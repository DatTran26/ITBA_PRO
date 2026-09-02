# Brainstorm Report: Interviewer Acceptance Flow

## Problem Statement
Interviewer role cần màn hình riêng để xem lịch phỏng vấn được assign, chấp nhận/từ chối/đề xuất đổi slot, và nhận notification. Hiện tại hệ thống thiếu toàn bộ acceptance flow + dedicated dashboard cho interviewer.

## Current State (đã có)
| Item | Status |
|---|---|
| `/dashboard/interviews` — xem lịch, submit pass/fail result | ✅ |
| API filter `interviewer_id = userId` | ✅ |
| `isInterviewer` auth context | ✅ |
| Notification system (`use-notifications.ts`, polling 15s) | ✅ |
| `/dashboard/recruitment/[id]` — full candidate profile | ✅ |

## Gaps (cần thêm)
| Gap | Impact |
|---|---|
| `interview_schedules` thiếu `interviewer_status`, `interviewer_proposed_at`, `interviewer_note` | DB migration |
| Không có API để interviewer respond (accept/decline/reschedule) | API endpoint |
| Interviewer vào `/dashboard` → rơi vào recruiter dashboard sai context | Dedicated dashboard |
| Notification khi được assign lịch | Extend notification hook |
| HR không thấy interviewer response status | HR-side badge |

## Agreed Solution

### DB Migration
```sql
ALTER TABLE interview_schedules
  ADD COLUMN interviewer_status text DEFAULT 'accepted'
    CHECK (interviewer_status IN ('pending','accepted','declined','reschedule_requested')),
  ADD COLUMN interviewer_proposed_at timestamptz,
  ADD COLUMN interviewer_note text;
-- Backfill: existing records = 'accepted' (already covered by DEFAULT 'accepted')
```
New records từ HR → `interviewer_status = 'pending'`, trigger notification poll.

### API
- `PATCH /api/recruitment/interviews/[id]/respond`
  - Body: `{ action: 'accept' | 'decline' | 'reschedule', proposed_at?, note? }`
  - Guard: `isInterviewer && schedule.interviewer_id === userId`

### Screens

**A. Interviewer Dashboard** (`/dashboard` khi role = `interviewer`)
- Nhánh mới trong `dashboard/page.tsx`: `isInterviewer` → `InterviewerDashboardClient`
- Nội dung: Pending acceptance cards (amber banner), Upcoming tuần này, Quick stats

**B. Acceptance UI trên `/dashboard/interviews`**
- Pending items: banner amber + 3 buttons: Accept / Decline / Propose slot
- Propose slot: inline datetime picker → submit `reschedule_requested` + `interviewer_proposed_at`

**C. HR-side visibility**
- `/dashboard/interviews` (admin/HR): `interviewer_status` badge trên mỗi card
- `reschedule_requested`: show proposed slot + nút "Reschedule" cho HR

**D. Candidate profile access**
- Interviewer được xem full `/dashboard/recruitment/[id]` như HR (không giới hạn)

### Notifications
Extend `use-notifications.ts`:
- New type: `interview_assigned`
- Poll: `interview_schedules` WHERE `interviewer_id = userId AND interviewer_status = 'pending' AND created_at > lastCheck`
- href → `/dashboard/interviews`

## Implementation Phases
| Phase | Scope | Effort |
|---|---|---|
| 1 | DB migration + backfill | 0.5 ngày |
| 2 | API endpoint `respond` | 0.5 ngày |
| 3 | Interviewer Dashboard client | 1 ngày |
| 4 | Acceptance UI trên `/dashboard/interviews` | 1 ngày |
| 5 | HR-side badge + reschedule UI | 0.5 ngày |
| 6 | Extend notification hook | 0.5 ngày |
| **Total** | | **~4 ngày** |

## Decisions Made
1. Notification khi assign → **có** (extend polling hook)
2. Backfill existing records → **accepted** (default value handles it)
3. Candidate profile access → **full như HR** (no extra restriction)

## Risks
| Risk | Mitigation |
|---|---|
| Interviewer decline → lịch bị treo | HR nhận notification, reschedule manually |
| Poll 15s có thể chậm | Acceptable — real-time không cần thiết cho interview scheduling |
| `/dashboard/recruitment/[id]` cần kiểm tra auth cho interviewer role | Verify hiện tại page có block `interviewer` không |
