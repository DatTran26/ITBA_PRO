---
phase: 1
title: Extract DashboardShell + Extend Tab Config
status: pending
effort: 0.5d
blocks: phase-02, phase-03
---

# Phase 1 — DashboardShell + Tab Config

## Overview
Extract the shared dashboard header into a `DashboardShell` component and extend `DashboardModeTabs` to support HR and Interviewer tab sets.

## Key Insight
The admin shell header (title, badge, subtitle, CTA, tabs) is currently embedded inside `DashboardClient`. Extract it to a wrapper so all roles share it.

## Related Code Files
- `src/components/dashboard/dashboard-mode-tabs.tsx` — modify tab config
- `src/app/dashboard/dashboard-client.tsx` — extract shell header
- **New:** `src/components/dashboard/dashboard-shell.tsx`

## Implementation Steps

### 1. Extend tab config in `dashboard-mode-tabs.tsx`

Current tab config only handles admin/recruiter modes. Extend to a role-aware map:

```typescript
// Tab definitions per role group
const TAB_CONFIG: Record<string, TabDef[]> = {
  admin: [
    { mode: "recruitment", label: "RECRUITMENT", icon: Briefcase },
    { mode: "employee",    label: "EMPLOYEE EVALUATION", icon: Users },
    { mode: "admin",       label: "ADMIN", icon: ShieldCheck },
  ],
  hr: [
    { mode: "recruitment", label: "RECRUITMENT", icon: Briefcase },
    { mode: "schedule",    label: "SCHEDULE", icon: CalendarClock },
  ],
  interviewer: [
    { mode: "interviews",  label: "MY INTERVIEWS", icon: Calendar },
    { mode: "open-slots",  label: "OPEN SLOTS", icon: Zap },
    { mode: "candidates",  label: "CANDIDATES", icon: Users },
  ],
  recruiter: [
    { mode: "recruitment", label: "RECRUITMENT", icon: Briefcase },
    { mode: "employee",    label: "EMPLOYEE EVALUATION", icon: Users },
  ],
};
```

`DashboardModeTabs` receives `role` prop and picks the correct tab set. Default mode = first tab of the role's set.

### 2. Create `DashboardShell` component

```typescript
// src/components/dashboard/dashboard-shell.tsx
interface DashboardShellProps {
  user: { name: string; role: string };
  children: React.ReactNode;
  cta?: React.ReactNode;          // optional CTA button slot
  subtitle?: string;
}
```

Shell renders:
- Icon + "Dashboard" title + status badge
- Subtitle text
- Optional CTA slot (right side)
- `DashboardModeTabs` with `role` prop
- `{children}` below tabs (content panel)

### 3. Default mode per role
In `page.tsx`, resolve default `mode` based on role if `searchParams.mode` is absent:
```typescript
const defaultMode: Record<string, string> = {
  admin: "recruitment", super_admin: "recruitment",
  hr: "recruitment", recruiter: "recruitment",
  interviewer: "interviews",
};
```

## Todo
- [ ] Add `role` prop to `DashboardModeTabs`
- [ ] Build tab set map + default mode logic
- [ ] Create `DashboardShell` component (~60 LOC)
- [ ] Export from `src/components/dashboard/index.ts` (create if needed)

## Success Criteria
- `DashboardShell` renders consistently across roles
- Tab set changes based on `role` prop
- No visual regression on admin dashboard
