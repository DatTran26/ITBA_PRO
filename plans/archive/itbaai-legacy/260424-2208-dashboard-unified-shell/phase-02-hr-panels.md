---
phase: 2
title: HR Content Panels
status: pending
effort: 1d
blockedBy: phase-01
---

# Phase 2 — HR Content Panels

## Overview
Refactor `HrDashboardClient` (618 lines) from a standalone full-page component into two focused content panels: `HrRecruitmentPanel` and `HrSchedulePanel`. These panels render inside `DashboardShell`.

## Related Code Files
- `src/app/dashboard/hr-dashboard-client.tsx` — source to decompose
- **New:** `src/app/dashboard/panels/hr-recruitment-panel.tsx`
- **New:** `src/app/dashboard/panels/hr-schedule-panel.tsx`
- `src/app/dashboard/dashboard-client.tsx` — add HR mode routing

## Panel Split

### `HrRecruitmentPanel` (mode: `"recruitment"`)
Extract from current `HrDashboardClient`:
- KPI stats row (total applications, shortlisted, scheduled, hired)
- Stage funnel chart
- Recent candidates table with pipeline status
- CV upload shortcut / quick actions

### `HrSchedulePanel` (mode: `"schedule"`)
Extract from current `HrDashboardClient`:
- Upcoming interviews list
- Pending confirmation items
- Quick "Lên lịch mới" action → opens `ScheduleInterviewDialog`
- Interview history mini-table

## Implementation Steps

### 1. Create panel directory
```
src/app/dashboard/panels/
  hr-recruitment-panel.tsx
  hr-schedule-panel.tsx
  interviewer-interviews-panel.tsx   ← Phase 3
  interviewer-open-slots-panel.tsx   ← Phase 3
  interviewer-candidates-panel.tsx   ← Phase 3
```

### 2. Extract `HrRecruitmentPanel`
- Move stat cards + funnel + candidate table from `hr-dashboard-client.tsx`
- Accepts `user` prop only — fetches own data
- Keep existing fetch logic, just relocate

### 3. Extract `HrSchedulePanel`
- Move interview scheduling section from `hr-dashboard-client.tsx`
- Integrate `ScheduleInterviewDialog` trigger
- Show pending + upcoming list

### 4. Update `HrDashboardClient` → becomes thin router
```typescript
// hr-dashboard-client.tsx becomes ~20 lines
export default function HrDashboardClient({ user, mode }) {
  if (mode === "schedule") return <HrSchedulePanel user={user} />;
  return <HrRecruitmentPanel user={user} />;
}
```

### 5. Wire into `DashboardShell`
`DashboardClient` adds HR branch:
```typescript
if (role === "hr") return <HrDashboardClient user={user} mode={mode} />;
```

## File Size Rule
Each panel file must stay under 200 LOC. Split further if needed.

## Todo
- [ ] Create `src/app/dashboard/panels/` directory
- [ ] Extract `hr-recruitment-panel.tsx` from current HR client
- [ ] Extract `hr-schedule-panel.tsx` from current HR client
- [ ] Slim `hr-dashboard-client.tsx` to routing-only (~20 LOC)
- [ ] Wire into `DashboardClient` mode branches
- [ ] Verify no data fetch duplication between panels

## Success Criteria
- HR sees same shell/tabs as admin
- RECRUITMENT tab shows pipeline stats + candidates
- SCHEDULE tab shows interview management
- No functionality lost from current `HrDashboardClient`
