# Phase 4 — Application Detail + Score Override

## Context Links
- `src/components/crm/detail-drawer.tsx`
- `notes` table (polymorphic)
- Phase 3 list + state machine

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Full detail view of an application with screening breakdown, strengths/weaknesses, CV preview, timeline, notes, and admin/recruiter score override.

## Key Insights
- Reuse polymorphic `notes` with `entity_type='job_application'`
- Timeline = `candidate_status_history` + `activity_logs` merged, sorted desc
- Score override only available to `recruiter | admin | super_admin`

## Requirements
**Functional**
- GET detail: application + person + jd + screening + history + notes + interviews
- PATCH override-score: set `final_score`, `is_overridden=true`, `override_reason`, `overridden_by`, `overridden_at`
- Notes CRUD via existing notes API (if exists; else add for entity_type='job_application')
- CV preview via signed URL endpoint (Phase 2)

## Architecture
```ts
// GET /api/recruitment/applications/[id] response
interface ApplicationDetail {
  application: JobApplication;
  person: Person;
  jobDescription: JobDescription | null;
  screening: CandidateScreening | null;
  history: CandidateStatusHistoryRow[];
  notes: Note[];
  interviews: InterviewSchedule[];
}
```

## Related Code Files
**Create**
- `src/app/api/recruitment/applications/[id]/route.ts` (GET)
- `src/app/api/recruitment/applications/[id]/override-score/route.ts` (PATCH)
- `src/app/dashboard/recruitment/[id]/page.tsx`
- `src/app/dashboard/recruitment/[id]/application-detail-client.tsx`
- `src/components/recruitment/score-card.tsx`
- `src/components/recruitment/score-breakdown.tsx`
- `src/components/recruitment/status-timeline.tsx`
- `src/components/recruitment/override-score-dialog.tsx`

**Modify (if missing entity support)**
- `src/app/api/notes/route.ts` — ensure `job_application` entity_type allowed

## Implementation Steps
1. GET detail endpoint (single-query with joins + subselects)
2. Override-score endpoint (role-guard: recruiter/admin/super_admin, require `override_reason`)
3. Score-card + breakdown components (numbers + bar chart from existing shadcn primitives)
4. Status-timeline component
5. Detail page wires components, CV preview via signed URL
6. Override dialog — confirm before submit, log activity

## Todo
- [ ] GET detail
- [ ] Override-score endpoint
- [ ] Score-card
- [ ] Score-breakdown
- [ ] Status-timeline
- [ ] Override dialog
- [ ] Detail page assembled

## Success Criteria
- Page loads detail in <500ms P95
- Override persists and renders with "overridden by X on Y" badge
- Notes list updates after adding
- CV preview opens in new tab via signed URL

## Risk Assessment
- **Risk:** `parsed_cv_json` may be huge → render collapsible
- **Risk:** Override mis-use → require reason (>=10 chars) and log activity

## Security Considerations
- Role guard on override
- Signed URL never cached server-side
- `override_reason` sanitized (trim, length-check)

## Next Steps
- Phase 5 adds interview scheduling from this page
