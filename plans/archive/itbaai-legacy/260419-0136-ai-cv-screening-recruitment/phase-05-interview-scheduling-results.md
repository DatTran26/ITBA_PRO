# Phase 5 — Interview Scheduling + Result Submission

## Context Links
- Phase 3 state machine
- `users.role='interviewer'` (Phase 1)
- `interview_schedules`, `interview_results` (Phase 1)

## Overview
- **Priority:** P2
- **Status:** completed
- **Description:** Recruiter schedules an interview with an `interviewer` user; interviewer submits pass/fail from their dashboard.

## Key Insights
- No tokenized external links — all in-app
- Scheduling transitions application SHORTLISTED → INTERVIEW_SCHEDULED
- Result submission transitions INTERVIEW_SCHEDULED → INTERVIEWED, then recruiter moves to PASSED/FAILED (or auto-derived from result)
- Decision: result=pass auto-sets application to PASSED; result=fail auto-sets to FAILED (cheaper UX, still auditable)

## Requirements
**Functional**
- POST schedule-interview: pick interviewer_id, scheduled_at, note. Validates interviewer role.
- GET interviews: interviewer's own upcoming + past interviews
- POST interview result (interviewer only, for own schedule): pass/fail + note → updates schedule status, inserts result, transitions application
- Activity log on both actions

## Architecture
```ts
// POST /api/recruitment/applications/[id]/schedule-interview
interface ScheduleBody {
  interviewer_id: string;
  scheduled_at: string;  // ISO
  timezone?: string;
  recruiter_note?: string;
}
```

## Related Code Files
**Create**
- `src/app/api/recruitment/applications/[id]/schedule-interview/route.ts` (POST)
- `src/app/api/recruitment/interviews/route.ts` (GET for current user)
- `src/app/api/recruitment/interviews/[id]/result/route.ts` (POST)
- `src/app/dashboard/interviews/page.tsx` (interviewer dashboard)
- `src/app/dashboard/interviews/interviews-client.tsx`
- `src/components/recruitment/schedule-interview-dialog.tsx`
- `src/components/recruitment/interview-result-dialog.tsx`
- `src/lib/recruitment/list-interviewers.ts` (util to query users with role=interviewer)

## Implementation Steps
1. Query helper to list interviewer users (admin client, role='interviewer', is_active)
2. Schedule endpoint: validate interviewer role; ensure application in SHORTLISTED; insert schedule; transition status; log
3. Schedule dialog on application detail page
4. Interviewer dashboard page: list own interviews grouped by status
5. Result endpoint: only owner interviewer or admin; inserts result; auto-transitions application
6. Result dialog on interviewer dashboard
7. Navigation: add `/dashboard/interviews` link visible only when `isInterviewer || isAdmin`

## Todo
- [x] Interviewer list util
- [x] Schedule endpoint
- [x] Schedule dialog
- [x] Interviewer dashboard
- [x] Result endpoint
- [x] Result dialog
- [x] Nav link role-gated

## Success Criteria
- Recruiter schedules interview → application moves to INTERVIEW_SCHEDULED
- Interviewer sees only their own interviews
- Submitting pass → application = PASSED with history
- Unauthorized interviewer cannot submit another's result (403)

## Risk Assessment
- **Risk:** Timezone bugs → store timestamptz (UTC) + timezone string; render in user TZ
- **Risk:** Interviewer with no schedules sees empty state — ensure friendly UI
- **Risk:** Double-submission → unique index on `interview_results.interview_schedule_id`

## Security Considerations
- Ownership check on result submission
- RLS on `interview_schedules` (interviewer sees own rows)
- Cannot schedule interviews for inactive users

## Next Steps
- Phase 6 handles offer flow post-PASSED
