---
title: Dashboard Unified Shell — HR & Interviewer
status: completed
created: 2026-04-24
branch: dev
---

# Dashboard Unified Shell

## Goal
All roles (Admin, HR, Interviewer) share the same dashboard shell: header + tab navigation. Content panels differ per role. Eliminates the early-return branching in `page.tsx` that bypasses the shell for HR and Interviewer.

## Current State
| Role | Route | Shell |
|------|-------|-------|
| Admin/Recruiter | page.tsx → DashboardModeTabs → DashboardClient | ✅ Has shell |
| HR | page.tsx → HrDashboardClient (early return) | ❌ No shell |
| Interviewer | page.tsx → InterviewerDashboardClient (early return) | ❌ No shell |

## Target State
All roles go through a unified `DashboardShell` → role-specific tabs → content panels.

### Tab sets by role
| Role | Tab 1 | Tab 2 | Tab 3 |
|------|-------|-------|-------|
| Admin/Super Admin | RECRUITMENT | EMPLOYEE EVALUATION | ADMIN |
| HR | RECRUITMENT | SCHEDULE | — |
| Recruiter | RECRUITMENT | EMPLOYEE EVALUATION | — |
| Interviewer | MY INTERVIEWS | OPEN SLOTS | CANDIDATES |

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Extract DashboardShell + extend tab config | completed | 0.5d | [phase-01](phase-01-shell-and-tabs.md) |
| 2 | HR content panels | completed | 1d | [phase-02](phase-02-hr-panels.md) |
| 3 | Interviewer content panels | completed | 0.5d | [phase-03](phase-03-interviewer-panels.md) |
| 4 | Update page.tsx routing | completed | 0.5d | [phase-04](phase-04-routing.md) |

## Key Files
- `src/app/dashboard/page.tsx` — remove early returns for HR/Interviewer
- `src/components/dashboard/dashboard-mode-tabs.tsx` — extend tab config
- `src/app/dashboard/dashboard-client.tsx` — add HR/Interviewer mode branches
- `src/app/dashboard/hr-dashboard-client.tsx` — refactor into panels
- `src/app/dashboard/interviewer-dashboard-client.tsx` — refactor into panels

## Dependencies
Phase 1 → Phase 2, Phase 3 (parallel) → Phase 4
