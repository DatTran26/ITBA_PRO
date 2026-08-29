---
phase: 4
title: Update page.tsx Routing
status: pending
effort: 0.5d
blockedBy: phase-02, phase-03
---

# Phase 4 — Update page.tsx Routing

## Overview
Remove the early-return role branching in `page.tsx` that bypasses the shell for HR and Interviewer. All roles now flow through `DashboardShell` → `DashboardClient`.

## Related Code Files
- `src/app/dashboard/page.tsx` — remove early returns, add default mode per role
- `src/app/dashboard/dashboard-client.tsx` — add HR/Interviewer mode branches
- `src/components/dashboard/dashboard-mode-tabs.tsx` — receives `role` prop

## Current Routing (to remove)
```typescript
// page.tsx — REMOVE THESE EARLY RETURNS
if (role === "hr") return <HrDashboardClient user={...} />;
if (role === "interviewer") return <InterviewerDashboardClient user={...} />;
```

## Target Routing

### `page.tsx` changes
1. Remove HR and Interviewer early returns
2. Add default mode resolution per role:
```typescript
const roleDefaultMode: Record<string, string> = {
  super_admin: "recruitment", admin: "recruitment",
  hr: "recruitment", recruiter: "recruitment",
  interviewer: "interviews",
};
const mode = searchParams.mode ?? roleDefaultMode[role] ?? "recruitment";
```
3. Pass `mode` and `role` to `DashboardClient` (already done for admin)

### `DashboardClient` changes
Add role branches in the mode renderer:
```typescript
// Existing admin/recruiter branch unchanged
// New HR branch
if (role === "hr") return <HrDashboardClient user={user} mode={mode} />;
// New Interviewer branch
if (role === "interviewer") return <InterviewerDashboardClient user={user} mode={mode} />;
```

### `DashboardModeTabs` changes
Accepts `role` prop, maps to correct tab set (defined in Phase 1).

### `DashboardShell` integration
`DashboardClient` wraps all content in `DashboardShell`:
```tsx
<DashboardShell user={user} role={role} mode={mode}>
  {/* role-specific panel renders here */}
</DashboardShell>
```
Shell renders: header + tabs. Children = content panel.

## URL Behaviour
- `/dashboard` → default tab for role (e.g. HR → `?mode=recruitment`)
- `/dashboard?mode=schedule` → HR schedule tab
- `/dashboard?mode=interviews` → Interviewer interviews tab
- Invalid mode for role → silently fall back to default tab

## Todo
- [ ] Remove HR/Interviewer early returns from `page.tsx`
- [ ] Add `roleDefaultMode` resolver
- [ ] Add HR + Interviewer branches in `DashboardClient`
- [ ] Pass `role` prop to `DashboardModeTabs`
- [ ] Smoke test: all 4 roles reach correct default tab
- [ ] Verify browser back/forward with `?mode=` param works

## Success Criteria
- No role bypasses the shell
- Each role lands on correct default tab on `/dashboard`
- Tab switching updates URL and re-renders content panel
- Admin dashboard visually unchanged
