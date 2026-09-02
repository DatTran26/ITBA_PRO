---
phase: 6
title: Notifications
status: pending
effort: 0.5d
priority: medium
depends: phase-01, phase-02
---

# Phase 6 — Extend Notification System

## Overview
Extend `use-notifications.ts` để interviewer nhận in-app notification khi được assign lịch phỏng vấn mới (`interviewer_status = 'pending'`).

## File to Modify
- `src/hooks/use-notifications.ts`

---

## 1. Add New Notification Type

```typescript
export interface Notification {
  id: string;
  type: "candidate_completed" | "version_pending" | "version_approved" | "interview_assigned"; // add
  // ...rest unchanged
}
```

---

## 2. New Polling Function

Thêm vào hook, sau `checkForApprovedVersions`:

```typescript
const LAST_INTERVIEW_CHECK_KEY = "itba_last_interview_check";

const checkForNewInterviewAssignments = useCallback(async () => {
  // Only run for interviewer role
  if (userRole !== 'interviewer') return;

  try {
    const lastCheck = localStorage.getItem(LAST_INTERVIEW_CHECK_KEY)
      || new Date(Date.now() - 60_000).toISOString();

    const supabase = createClient();

    const { data: newSchedules } = await supabase
      .from("interview_schedules")
      .select(`
        id,
        scheduled_at,
        job_applications (
          persons ( full_name ),
          job_descriptions ( title )
        )
      `)
      .eq("interviewer_status", "pending")
      .gt("created_at", lastCheck)
      .order("created_at", { ascending: false })
      .limit(5);

    if (newSchedules && newSchedules.length > 0) {
      const newNotifs: Notification[] = newSchedules.map((s) => {
        const app = Array.isArray(s.job_applications) ? s.job_applications[0] : s.job_applications;
        const candidateName = app?.persons?.full_name ?? "Ứng viên";
        const jdTitle = app?.job_descriptions?.title ?? "Vị trí chưa xác định";
        return {
          id: `interview-${s.id}`,
          type: "interview_assigned" as const,
          title: `Lịch phỏng vấn mới: ${candidateName}`,
          description: `${jdTitle} · ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(s.scheduled_at))}`,
          href: "/dashboard/interviews",
          timestamp: s.scheduled_at,
          read: false,
        };
      });
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const unique = newNotifs.filter((n) => !existingIds.has(n.id));
        return [...unique, ...prev].slice(0, MAX_NOTIFICATIONS);
      });
    }
    localStorage.setItem(LAST_INTERVIEW_CHECK_KEY, new Date().toISOString());
  } catch { /* silent fail */ }
}, [userRole]);
```

---

## 3. Add to Polling Effect

```typescript
useEffect(() => {
  if (userRole === undefined) return;
  checkForNewResults();
  checkForPendingVersions();
  checkForApprovedVersions();
  checkForNewInterviewAssignments(); // add
  const interval = setInterval(() => {
    checkForNewResults();
    checkForPendingVersions();
    checkForApprovedVersions();
    checkForNewInterviewAssignments(); // add
  }, POLL_INTERVAL);
  return () => clearInterval(interval);
}, [userRole, checkForNewResults, checkForPendingVersions, checkForApprovedVersions, checkForNewInterviewAssignments]);
```

---

## 4. Persist `interview_assigned` notifications

Trong localStorage persistence effect, `interview_assigned` nên được persist (khác với `version_approved`). Không cần thay đổi gì vì filter chỉ exclude `version_approved`:

```typescript
// Line ~43 — existing filter excludes version_approved only → interview_assigned tự động được persist ✓
const persistable = notifications.filter((n) => n.type !== "version_approved");
```

---

## RLS Note
Polling dùng Supabase client-side (`createClient()`), nên phụ thuộc RLS policies. Verify rằng:
- `interview_schedules` RLS cho phép interviewer SELECT chính record của mình
- Field `interviewer_status` và `created_at` accessible

Nếu RLS chưa có policy cho interviewer SELECT → thêm vào `20260419000001_recruitment_rls.sql` hoặc new migration:
```sql
CREATE POLICY "Interviewers can read own schedules"
  ON interview_schedules FOR SELECT
  USING (interviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
```

## Validation
- [ ] Interviewer role: nhận notification khi HR tạo lịch mới
- [ ] Non-interviewer roles: `checkForNewInterviewAssignments` không chạy (guard `userRole !== 'interviewer'`)
- [ ] Notification bell hiển thị unread count
- [ ] Click notification → navigate đến `/dashboard/interviews`
- [ ] Duplicate notifications không xuất hiện (existingIds check)
- [ ] TypeScript compile clean
