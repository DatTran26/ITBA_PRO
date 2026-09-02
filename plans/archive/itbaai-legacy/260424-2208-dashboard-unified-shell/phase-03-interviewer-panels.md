---
phase: 3
title: Interviewer Content Panels
status: pending
effort: 0.5d
blockedBy: phase-01
---

# Phase 3 — Interviewer Content Panels

## Overview
Refactor `InterviewerDashboardClient` (334 lines) into three focused panels inside `DashboardShell`. Current component is standalone full-page; decompose into tab-driven panels.

## Related Code Files
- `src/app/dashboard/interviewer-dashboard-client.tsx` — source to decompose
- **New:** `src/app/dashboard/panels/interviewer-interviews-panel.tsx`
- **New:** `src/app/dashboard/panels/interviewer-open-slots-panel.tsx`
- **New:** `src/app/dashboard/panels/interviewer-candidates-panel.tsx`
- `src/app/dashboard/dashboard-client.tsx` — add interviewer mode routing

## Panel Split

### `InterviewerInterviewsPanel` (mode: `"interviews"`)
From current `InterviewerDashboardClient`:
- Stats row (upcoming, completed, pending, total)
- Pending acceptance banner + quick accept/decline
- Upcoming interviews list with relative time badges

### `InterviewerOpenSlotsPanel` (mode: `"open-slots"`)
From current `InterviewerDashboardClient`:
- "Slot trống — Nhận ngay" section (unassigned schedules)
- One-click claim button → `PATCH /respond { action: "accept" }`
- Empty state when no open slots

### `InterviewerCandidatesPanel` (mode: `"candidates"`)
New lightweight panel:
- List of candidates the interviewer has/had interviews with
- Link to full candidate profile `/dashboard/recruitment/[id]`
- Shows: name, JD, interview date, result (pass/fail/pending)

## Implementation Steps

### 1. Extract `InterviewerInterviewsPanel`
Move stats + pending banner + upcoming list from `interviewer-dashboard-client.tsx`.
Shared data fetch: single `GET /api/recruitment/interviews` call at panel level.

### 2. Extract `InterviewerOpenSlotsPanel`
Move open-slots section. Since panels share the same page, consider lifting fetch to parent or use SWR-style deduplication. Simplest: each panel fetches independently (interviews API is cheap).

### 3. Create `InterviewerCandidatesPanel`
New panel — derive candidates from interviews list (no extra API needed):
```typescript
const candidates = interviews
  .filter(i => i.interviewer_id === userId)
  .map(i => i.job_applications)
  .filter(Boolean);
```

### 4. Slim `InterviewerDashboardClient` to router
```typescript
// ~20 lines
export default function InterviewerDashboardClient({ user, mode }) {
  if (mode === "open-slots") return <InterviewerOpenSlotsPanel user={user} />;
  if (mode === "candidates") return <InterviewerCandidatesPanel user={user} />;
  return <InterviewerInterviewsPanel user={user} />;
}
```

### 5. Remove standalone page wrapper
Current `InterviewerDashboardClient` has `<PageTransition>` + `<AppNavbar>` + `<BackgroundOrbs>` — remove these (shell provides them).

## File Size Rule
Each panel ≤ 200 LOC.

## Todo
- [ ] Extract `interviewer-interviews-panel.tsx`
- [ ] Extract `interviewer-open-slots-panel.tsx`
- [ ] Create `interviewer-candidates-panel.tsx`
- [ ] Slim `interviewer-dashboard-client.tsx` to routing-only
- [ ] Remove `AppNavbar` + `BackgroundOrbs` from interviewer client (shell provides)
- [ ] Wire into `DashboardClient` mode branches

## Success Criteria
- Interviewer sees same shell as admin
- MY INTERVIEWS tab: stats + upcoming + pending accept
- OPEN SLOTS tab: claimable slots with one-click accept
- CANDIDATES tab: list of past/upcoming interviewees
