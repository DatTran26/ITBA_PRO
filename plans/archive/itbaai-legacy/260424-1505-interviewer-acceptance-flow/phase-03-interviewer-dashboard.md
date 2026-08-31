---
phase: 3
title: Interviewer Dashboard
status: pending
effort: 1d
priority: high
depends: phase-01, phase-02
---

# Phase 3 — Interviewer Dashboard

## Overview
Tạo dedicated home dashboard cho interviewer role. Khi login vào `/dashboard`, interviewer thấy context phù hợp thay vì recruiter dashboard.

## Files to Modify
- `src/app/dashboard/page.tsx` — thêm `isInterviewer` branch

## Files to Create
- `src/app/dashboard/interviewer-dashboard-client.tsx` — new client component

---

## 1. Modify `dashboard/page.tsx`

Sau block `if (isHr)`, thêm block mới:

```typescript
const isInterviewer = userData?.role === "interviewer";

// Interviewer gets dedicated dashboard
if (isInterviewer) {
  return (
    <InterviewerDashboardClient
      user={{ name: userData.name, email: userData.email, role: userData.role }}
    />
  );
}
```

Import thêm:
```typescript
import InterviewerDashboardClient from "./interviewer-dashboard-client";
```

---

## 2. Create `interviewer-dashboard-client.tsx`

### Layout & Content
Component này fetch `/api/recruitment/interviews` và render:

**Section A — Pending Acceptance Banner**
- Chỉ hiện khi có items `interviewer_status === 'pending'`
- Amber warning card liệt kê các lịch chờ confirm
- CTA button → `/dashboard/interviews`

**Section B — Upcoming Interviews (7 ngày tới)**
- Cards với: candidate name, JD title, date/time, location_type badge
- Quick action: "Submit Result" nếu đã qua giờ phỏng vấn

**Section C — Stats row**
- Tổng lịch sắp tới | Hoàn thành tháng này | Pending acceptance count

### Interface
```typescript
interface InterviewerDashboardProps {
  user: { name: string; email: string; role: string };
}
```

### Fetch Logic
```typescript
// Re-use existing GET /api/recruitment/interviews
// No new API needed — filter client-side
const pending = interviews.filter(i => i.interviewer_status === 'pending');
const upcoming = interviews.filter(i =>
  i.status === 'scheduled' &&
  i.interviewer_status === 'accepted' &&
  new Date(i.scheduled_at) > now
).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
```

### Skeleton Structure
```tsx
export default function InterviewerDashboardClient({ user }: InterviewerDashboardProps) {
  // fetch state
  return (
    <div className="min-h-dvh bg-[#0A0F1D] text-[#ECF0F7]">
      <AppNavbar user={user} />
      <BackgroundOrbs />
      <PageTransition>
        <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
          {/* Header */}
          {/* Pending banner — conditional */}
          {/* Stats row */}
          {/* Upcoming interviews */}
        </main>
      </PageTransition>
    </div>
  );
}
```

### Style Guide
Dùng cùng design tokens với `hr-dashboard-client.tsx` và `schedule-page-client.tsx`:
- Background: `#0A0F1D`
- Card: `bg-[#111629]/80 backdrop-blur-md border border-white/10 rounded-3xl`
- Pending amber: `border-amber-500/25 bg-amber-500/8`
- Accepted indigo: `border-[#7C8FFF]/20 bg-[#7C8FFF]/8`

### File Size
Keep under 200 lines. Nếu interview card phức tạp → extract `InterviewerUpcomingCard` vào file riêng.

## Validation
- [ ] Role `interviewer` vào `/dashboard` → thấy `InterviewerDashboardClient`, không phải recruiter dashboard
- [ ] Role `hr` vào `/dashboard` → vẫn thấy `HrDashboardClient` (không bị ảnh hưởng)
- [ ] Pending section ẩn khi không có pending items
- [ ] Upcoming sort đúng thứ tự thời gian
- [ ] TypeScript compile clean
