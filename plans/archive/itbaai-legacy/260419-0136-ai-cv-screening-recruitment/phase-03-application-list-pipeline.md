# Phase 3 — Application List + Pipeline Management

## Context Links
- CRM components: `src/components/crm/{data-table,kanban-board,filter-bar,bulk-action-bar}.tsx`
- Dashboard layout: `src/app/dashboard/layout.tsx`
- Phase 1 schema, Phase 2 upload flow

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Recruitment list / kanban page with filters, bulk actions, status transitions enforced by a state machine.

## Key Insights
- Reuse existing `data-table`, `kanban-board`, `filter-bar`, `bulk-action-bar` — no new primitives
- State machine must be server-enforced (client UI is hint only)
- Bulk reject is the heaviest write; keep batched inside one transaction

## Requirements
**Functional**
- List endpoint with pagination, filter by pipeline_status, score range, jd_id, text search on person name/email
- PATCH status: validate transition; write `candidate_status_history`; log `activity_logs`
- Bulk reject: array of ids
- Restore: REJECTED → SHORTLISTED only
- Page `/dashboard/recruitment` with toggle list/kanban views

## Architecture

### State machine (server-validated)
```ts
const ALLOWED: Record<PipelineStatus, PipelineStatus[]> = {
  NEW: ['SCREENED','REJECTED'],
  SCREENED: ['SHORTLISTED','REJECTED'],
  REJECTED: ['SHORTLISTED'], // restore
  SHORTLISTED: ['INTERVIEW_SCHEDULED','REJECTED'],
  INTERVIEW_SCHEDULED: ['INTERVIEWED','REJECTED'],
  INTERVIEWED: ['PASSED','FAILED'],
  PASSED: ['OFFERED'],
  FAILED: [],
  OFFERED: ['ACCEPTED','OFFER_REJECTED'],
  ACCEPTED: ['ONBOARDED'],
  OFFER_REJECTED: [],
  ONBOARDED: [],
};
```

## Related Code Files
**Create**
- `src/app/api/recruitment/applications/route.ts` (GET)
- `src/app/api/recruitment/applications/[id]/status/route.ts` (PATCH)
- `src/app/api/recruitment/applications/bulk-reject/route.ts` (POST)
- `src/app/api/recruitment/applications/[id]/restore/route.ts` (PATCH)
- `src/app/dashboard/recruitment/page.tsx`
- `src/app/dashboard/recruitment/recruitment-client.tsx`
- `src/lib/recruitment/state-machine.ts`
- `src/lib/recruitment/pipeline-helpers.ts`

## Implementation Steps
1. Implement `state-machine.ts` (pure function `canTransition(from,to)`)
2. GET list endpoint — joins `persons`, `candidate_screenings`, `job_descriptions`; role-scoped (hr sees own uploads; recruiter/admin see all)
3. PATCH status — validate, insert history, log activity
4. Bulk reject — service role transaction; per-row history
5. Restore endpoint — allowed for recruiter+admin only
6. Build page with tab toggle (list | kanban)
7. Wire `filter-bar` + `bulk-action-bar`
8. Subscribe to Realtime for live status updates on visible rows

## Todo
- [ ] state-machine util
- [ ] GET applications with filters
- [ ] PATCH status with history
- [ ] Bulk reject
- [ ] Restore
- [ ] Dashboard page + client component
- [ ] Realtime list updates

## Success Criteria
- Invalid transition returns 422 with allowed options
- Bulk reject of 50 applications completes <2s
- History row written on every status change
- HR user sees only their uploaded applications

## Risk Assessment
- **Risk:** Race condition on concurrent status edits → use optimistic concurrency via `updated_at` check or single-statement update with WHERE current_status = X
- **Risk:** Heavy joins on list endpoint → add composite index `(pipeline_status, created_at desc)`

## Security Considerations
- All endpoints go through `getAuthContext`
- RLS enforces row visibility; API adds extra guard for writes
- `activity_logs` records actor_id for every mutation

## Next Steps
- Phase 4 adds detail page and score override
