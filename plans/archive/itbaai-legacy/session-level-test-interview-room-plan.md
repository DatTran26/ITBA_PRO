# Session-Level Test + Interview Room Implementation Plan

## Status`r`n`r`nImplemented core flow. This plan documents the finalized business flow and the implementation phases for the new session-centric interview workflow.

## Finalized Business Rules

- Interview workflow is session-centric.
- HR/Admin creates interview sessions.
- A session can have multiple interviewers.
- Interviewers accept or decline participation at the session level.
- Candidates can only be assigned to a session after at least one interviewer has accepted the session.
- One test is attached to the session for MVP.
- Candidates do not receive test links automatically by email.
- HR/Interviewer copies the test link manually from Session Detail or Interview Room.
- `CV Score` is only a pre-screening reference.
- `Session Test Score` is the score of the test candidate does during the interview session.
- No weighted score policy is needed because CV pass is already the gate into interview stage.
- Final decision in interview stage uses `Session Test Score` plus interviewer evaluation notes/result.

## Target User Flows

### HR/Admin Flow

1. Create interview session.
2. Assign one or more interviewers.
3. Wait for at least one interviewer to accept.
4. Attach one candidate test to the session.
5. Assign shortlisted candidates to the accepted session.
6. Optionally notify candidates manually or through existing email tools later.
7. Monitor candidate confirmation, test progress, test score, and interviewer result.

### Interviewer Flow

1. Open assigned sessions.
2. Accept or decline session participation.
3. Open Interview Room.
4. Select an accepted session.
5. Search candidate by name or email.
6. Open candidate detail.
7. Review CV analysis.
8. Copy/open session test link for the candidate.
9. Monitor session test score after submission.
10. Add interview evaluation/result.

## Data Model Plan

### Minimal MVP Additions

- Add `interview_sessions.test_id` referencing `tests.id`.
- Add `interview_session_interviewers` to represent session-level interviewer assignment and acceptance.

### New Table

`interview_session_interviewers`

- `id`
- `session_id`
- `interviewer_id`
- `status`: `pending | accepted | declined`
- `note`
- `responded_at`
- `assigned_by`
- `assigned_at`

## API Plan

### Existing Routes To Extend

- `GET /api/recruitment/sessions`
  - Include session test metadata.
  - Include session interviewer acceptance counts.

- `GET /api/recruitment/sessions/[id]`
  - Include attached test.
  - Include session-level interviewers.
  - Include candidate CV score and candidate test result metadata.

- `POST /api/recruitment/sessions/[id]/assign`
  - Reject with `422` if no interviewer has accepted the session.

- `PATCH /api/recruitment/sessions/[id]/assign-interviewer`
  - Support multiple interviewers.
  - Write to `interview_session_interviewers`.

### New Routes

- `PATCH /api/recruitment/sessions/[id]/test`
  - HR/Admin attach or detach a test from a session.

- `PATCH /api/recruitment/sessions/[id]/respond`
  - Interviewer accepts or declines a session assignment.

- `GET /api/recruitment/interview-room/sessions`
  - Interviewer sees only accepted sessions.

- `GET /api/recruitment/interview-room/sessions/[id]`
  - Returns session, candidates, CV analysis summary, attached test, and test result metadata.

## UI Plan

### Session Detail

Add/adjust panels:

- `AssignInterviewerPanel`
  - Supports multiple interviewers.
  - Shows current session-level assignment statuses.

- `SessionTestPanel`
  - Shows attached test.
  - Lets HR/Admin attach/detach one test.
  - Provides copy test link action.

- `AssignCandidatesPanel`
  - Disabled or fails clearly when no interviewer has accepted.

### Interview Room

New route:

- `/dashboard/interview-room`
- `/dashboard/interview-room/[sessionId]`

Required UI:

- Accepted session selector/list.
- Candidate list in selected session.
- Search by name/email.
- Candidate detail panel.
- CV analysis block.
- Session test link block.
- Session test score/status block.
- Interview note/result block.


## Detailed Implementation Phases

### Phase 0 - Scope Lock And Business Contract

**Goal:** Freeze business rules before implementation so API, UI, and database do not drift.

**Tasks:**

- Confirm session-centric workflow as the only new interview workflow.
- Confirm one test per session for MVP.
- Confirm no automatic candidate test-link email.
- Confirm candidate assignment requires at least one accepted interviewer.
- Confirm `CV Score` and `Session Test Score` are separate concepts.
- Confirm no weighted score policy in interview stage.

**Deliverables:**

- This plan document.
- Final business rules in `docs/system-architecture.md` after implementation stabilizes.

**Acceptance:**

- Product owner can explain the flow without referencing legacy `/dashboard/interviews` candidate-level behavior.

### Phase 1 - Database Model And Migration

**Goal:** Add session-level test and session-level interviewer acceptance without overloading candidate schedules.

**Tasks:**

- Add `interview_sessions.test_id` referencing `tests.id`.
- Create `interview_session_interviewers` for multi-interviewer assignment.
- Add indexes for session lookup and interviewer accepted-session lookup.
- Add RLS policies for HR/Admin and assigned interviewers.
- Backfill session interviewer rows from existing `interview_schedules` where possible.
- Keep legacy `interview_schedules.interviewer_status` for compatibility only.

**Files:**

- `supabase/migrations/20260508012639_session_level_test_interview_room.sql`

**Acceptance:**

- Existing sessions can remain valid with `test_id = null`.
- A session can have multiple interviewer assignments.
- Interviewer assignment status is stored once at session level.

### Phase 2 - Session API Contract

**Goal:** Make session APIs expose and enforce the new workflow.

**Tasks:**

- Extend `GET /api/recruitment/sessions` with:
  - attached test metadata
  - accepted interviewer count
  - session-level interviewer assignments
- Extend `GET /api/recruitment/sessions/[id]` with:
  - attached test metadata
  - session interviewer assignments
  - candidate CV score metadata
  - candidate session test result metadata
- Update `PATCH /api/recruitment/sessions/[id]/assign-interviewer`:
  - support multiple interviewers
  - write to `interview_session_interviewers`
  - keep schedule-level primary interviewer compatibility if needed
- Update `POST /api/recruitment/sessions/[id]/assign`:
  - reject with `422` when no interviewer accepted
  - keep candidate assignment tied to session
- Add `PATCH /api/recruitment/sessions/[id]/test`:
  - HR/Admin attach or detach one test from session
- Add `PATCH /api/recruitment/sessions/[id]/respond`:
  - interviewer accepts or declines session participation

**Files:**

- `src/app/api/recruitment/sessions/route.ts`
- `src/app/api/recruitment/sessions/[id]/route.ts`
- `src/app/api/recruitment/sessions/[id]/assign/route.ts`
- `src/app/api/recruitment/sessions/[id]/assign-interviewer/route.ts`
- `src/app/api/recruitment/sessions/[id]/test/route.ts`
- `src/app/api/recruitment/sessions/[id]/respond/route.ts`

**Acceptance:**

- HR/Admin can attach one test to a session.
- HR/Admin can assign many interviewers to one session.
- Interviewer can accept/decline at session level.
- Candidate assignment before interviewer acceptance returns `422` with a clear message.

### Phase 3 - HR Session Management UI

**Goal:** Update Session Detail so HR/Admin can manage the full preparation flow in one place.

**Tasks:**

- Add `SessionTestPanel` to session detail.
- Update `AssignInterviewerPanel` for multi-select interviewer assignment.
- Show interviewer assignment statuses: `pending`, `accepted`, `declined`.
- Update `AssignCandidatesPanel` behavior:
  - disable or warn when no accepted interviewer exists
  - surface API `422` message clearly
- Show attached test link and copy action.
- Keep manual candidate communication; no automatic test email.

**Files:**

- `src/app/dashboard/recruitment/sessions/[id]/session-detail-client.tsx`
- `src/app/dashboard/recruitment/sessions/[id]/assign-interviewer-panel.tsx`
- `src/app/dashboard/recruitment/sessions/[id]/assign-candidates-panel.tsx`
- `src/app/dashboard/recruitment/sessions/[id]/session-test-panel.tsx`

**Acceptance:**

- HR/Admin can see whether a session is ready for candidate assignment.
- HR/Admin can attach or detach the session test.
- HR/Admin can copy test link from session detail.
- HR/Admin cannot accidentally assign candidates before accepted interviewer gate.

### Phase 4 - Interview Room API And UI

**Goal:** Provide a separate operational workspace for interviewers during the actual interview session.

**Tasks:**

- Add `GET /api/recruitment/interview-room/sessions`:
  - interviewer sees only accepted sessions
  - HR/Admin may see accepted sessions for support/debug
- Add `GET /api/recruitment/interview-room/sessions/[id]`:
  - guard interviewer access by accepted assignment
  - return session info, candidate list, CV analysis summary, session test info, test score/result metadata
- Add `/dashboard/interview-room`:
  - list/select accepted sessions
  - empty state if no accepted sessions
- Add `/dashboard/interview-room/[sessionId]`:
  - candidate list in session
  - search by name/email
  - candidate detail panel
  - CV Analysis Score block
  - Session Test Score block
  - Copy/Open session test link action
  - Interview note/result placeholder if full result submission is not in MVP scope

**Files:**

- `src/app/api/recruitment/interview-room/sessions/route.ts`
- `src/app/api/recruitment/interview-room/sessions/[id]/route.ts`
- `src/app/dashboard/interview-room/page.tsx`
- `src/app/dashboard/interview-room/interview-room-client.tsx`
- `src/app/dashboard/interview-room/[sessionId]/page.tsx`
- `src/app/dashboard/interview-room/[sessionId]/interview-room-session-client.tsx`

**Acceptance:**

- Interviewer sees only sessions they accepted.
- Interviewer can pick a session and see candidates in it.
- Interviewer can search candidates by name/email.
- Interviewer can open candidate context and distinguish CV score from session test score.
- Interviewer can copy session test link.

### Phase 5 - Navigation And Legacy Route Strategy

**Goal:** Reduce confusion between old candidate-level interview page and new Interview Room.

**Tasks:**

- Add Interview Room entry for interviewer dashboard/navigation.
- Decide `/dashboard/interviews` behavior:
  - Option A: redirect interviewer to `/dashboard/interview-room`
  - Option B: keep `/dashboard/interviews` for HR/Admin legacy candidate-level operations only
- Update labels:
  - `Sessions` = setup/manage interview sessions
  - `Interview Room` = conduct accepted interview sessions
  - `Interviews` = legacy candidate-level list if retained

**Files:**

- `src/app/dashboard/interviewer-dashboard-client.tsx`
- `src/components/ui/app-navbar.tsx` or sidebar/nav files if applicable
- `src/app/dashboard/interviews/page.tsx` if redirect is chosen

**Acceptance:**

- Interviewer has a clear entry point for conducting interviews.
- Interviewer is not forced into legacy candidate-level confirmation flow.
- HR/Admin can still access needed operational history if legacy view remains.

### Phase 6 - Validation And Regression Checks

**Goal:** Verify the new flow without masking unrelated existing project issues.

**Tasks:**

- Run focused TypeScript/build checks where possible.
- Run lint if project lint config is usable.
- Manually smoke test API route behavior:
  - assign interviewer
  - accept session
  - attach test
  - assign candidate
  - open interview room session
- Verify role matrix:
  - HR/Admin manage session
  - interviewer accepts session
  - unaccepted interviewer cannot read room data
- Document existing unrelated failures if lint/build fails due current repo config.

**Acceptance:**

- New routes compile.
- Core business gate works: no accepted interviewer means no candidate assignment.
- Interview Room does not expose candidate/test data to unaccepted interviewers.

### Phase 7 - Documentation And Handoff

**Goal:** Make the new workflow maintainable after implementation.

**Tasks:**

- Update this plan with completed status.
- Update `docs/system-architecture.md` with final workflow and new table/API summary.
- Note legacy route behavior in docs.
- Add unresolved items for future phase only if needed.

**Acceptance:**

- Another developer can implement or maintain the feature from docs and code structure.
- Product/business rules are traceable from docs.

## Acceptance Criteria

- HR/Admin can assign multiple interviewers to a session.
- Interviewer can accept or decline a session assignment.
- Candidate assignment is blocked until at least one interviewer accepts.
- HR/Admin can attach exactly one test to a session.
- Interviewer sees only accepted sessions in Interview Room.
- Interviewer can search candidates by name/email in a selected session.
- Interviewer can view CV analysis and CV score separately from session test score.
- Interviewer can copy session test link.
- Session test score displays after candidate submits test.
- Candidate does not receive automatic test email.

## Risks

- Existing code mixes candidate-level interview schedules with session-level acceptance.
- Existing `interview_schedules.interviewer_status` is legacy and can conflict with new session-level acceptance.
- Admin client bypasses RLS, so API-level guards must stay strict.
- Legacy sessions may have no `test_id` or no `interview_session_interviewers` rows.
- Test share token must not be exposed to interviewers who have not accepted the session.

## Current Progress

Completed so far:

- Created migration for `interview_sessions.test_id` and `interview_session_interviewers`.
- Extended session list/detail APIs with test and interviewer assignment metadata.
- Added test attach/detach API.
- Added session accept/decline API.
- Added interview-room API routes.
- Added accepted-interviewer gate to candidate assignment API.
- Started updating multi-interviewer UI.

Remaining:`r`n`r`n- Manual browser smoke test on Cloudflare tunnel.`r`n- Existing unrelated TypeScript/ESLint project issues still need separate cleanup.

## Unresolved Questions

- Should `/dashboard/interviews` redirect to Interview Room, or remain a legacy candidate-level view for HR/Admin?
- Should test results refresh automatically in Interview Room, or only on manual refresh for MVP?


