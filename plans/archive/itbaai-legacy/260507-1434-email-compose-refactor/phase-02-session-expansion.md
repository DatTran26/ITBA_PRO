# Phase 02 — Session-based Recipient Expansion

## Context Links
- Sessions API: `src/app/api/recruitment/sessions/route.ts` (GET returns sessions w/ candidate counts)
- Session detail: `src/app/api/recruitment/sessions/[id]/route.ts` (GET returns schedules + persons)
- Compose: `src/app/dashboard/emails/compose-client.tsx`

## Overview
- Priority: P2
- Status: pending
- Add a `SessionPicker` for the two multi-recipient templates. Selecting a session auto-fills recipients from session members.

## Key Insights
- `interview_sessions` already has `round (1|2|3)`, `scheduled_at`, FK `job_descriptions`.
- `interview_schedules` is the join row (session ↔ job_application). Each schedule embeds `persons` (candidate) via `job_applications`.
- For `schedule_interview`: candidates = all `interview_schedules` for that session → `job_applications.persons`.
- For `interview_reminder`: `assigned_interviewer_id` column on `interview_sessions` holds the assigned user. Single interviewer per session.

## Requirements

### Functional
- `SessionPicker` shows when template type is `schedule_interview` or `interview_reminder`.
- List sessions: search + dropdown — show `Round N — JD Title — scheduled_at — Ncandidates`.
- On select session:
  - `schedule_interview`: fetch `/api/recruitment/sessions/[id]` → map `schedules[].job_applications.persons` → set recipients (merge, dedupe by id).
  - `interview_reminder`: fetch session's interviewers (Phase 02b — see new endpoint below) → set recipients.
- Recipients still editable after expansion (chips can be removed).

### Non-functional
- Optional control: user can skip session and pick recipients manually.

## Architecture

```
[type ∈ {schedule_interview, interview_reminder}]
   → SessionPicker visible
       ↓ user selects session
       ↓ fetch members
       ↓ append (deduped) to RecipientSelector value
```

## Related Code Files

### Create
- `src/app/dashboard/emails/_components/session-picker.tsx` — list+search sessions, single-select.
- `src/app/api/emails/session-recipients/route.ts` — `GET ?sessionId=…&type=…` returns `{ recipients: Recipient[] }`. Server-side resolution avoids leaking schedule structure to client.

### Modify
- `src/app/dashboard/emails/compose-client.tsx`
  - Add `sessionId` state + `<SessionPicker />` render block (only for the two multi types).
  - On session select: fetch `/api/emails/session-recipients`, merge into `recipients`.

## Implementation Steps

1. Create endpoint `src/app/api/emails/session-recipients/route.ts`:
   - Auth: same `ALLOWED_ROLES` as send.
   - Inputs: `sessionId` (uuid), `type` (`schedule_interview` | `interview_reminder`).
   - For `schedule_interview`:
     ```
     interview_schedules(session_id) → job_applications → persons(id, full_name, email)
     ```
   - For `interview_reminder`:
     - Query `interview_sessions.assigned_interviewer_id` → fetch `users` row for that id.
     - Returns single recipient (the assigned interviewer).
   - Output: `{ recipients: [{ id, name, email, source }] }`, deduped by id.

2. Create `session-picker.tsx`:
   - Props: `value: SessionLite | null`, `onChange`, `disabled`.
   - Fetches `/api/recruitment/sessions` (existing) on mount; client-side filter by query string.
   - Display: `Round {N} • {jd.title} • {scheduled_at locale} • {candidate_count} cand`.

3. Edit `compose-client.tsx`:
   - Add `session: SessionLite | null` state (only for the two multi types).
   - `useEffect` on session change: call new endpoint, merge results into `recipients` (dedupe by id, do not clear existing chips).
   - Add a small "Clear all" button next to chip list (KISS).

4. Compile check + lint.

## Todo List
- [x] Verify schema for per-session interviewer assignment — `assigned_interviewer_id` on `interview_sessions` (confirmed)
- [ ] Create `/api/emails/session-recipients` route
- [ ] Create `session-picker.tsx`
- [ ] Wire session picker in compose flow with merge-on-select
- [ ] Add Clear-all chips control
- [ ] Lint + type-check pass
- [ ] Smoke test: schedule_interview session with 3 candidates → picker fills all 3

## Success Criteria
- Picking a session populates recipients from server response.
- Recipients are deduped (selecting same session twice does not duplicate chips).
- Recipients remain manually editable.
- Type narrows: session picker hidden for `offer` / `onboard_confirm`.

## Risk Assessment
- Risk: interviewer assignment may not exist as a per-session relation. Mitigation: scout `notify` route (Phase 02 first step). If absent, document fallback "all interviewers" behavior in plan and surface a UI note.
- Risk: session list endpoint is admin/HR only. Compose page already requires the same roles, so no new RLS work.

## Security
- New endpoint enforces `ALLOWED_ROLES` (same as `/api/emails/send`).
- Use `createAdminClient` only after auth check (consistent with siblings).

## Clarifications

- **Interviewer source** (resolved): `assigned_interviewer_id` is on `interview_sessions` (not a join table). No fallback to "all interviewers" needed.
- **Candidate expansion logic** (resolved): distinguish first-send vs re-send per session:
  - **First send** (no prior entry in `email_logs` for this session's candidates): expand ALL candidates.
  - **Re-send**: expand only candidates where `candidate_confirmation = 'pending'`.
  - Detection: query `email_logs` for any prior send with `related_entity_type = 'session'` and `related_entity_id = sessionId`. If rows exist → re-send mode.
  - The `/api/emails/session-recipients` endpoint accepts an optional `mode` response field or the client can pass `resend=true` once detection logic confirms a prior send.

### Updated Implementation Step 1 (session-recipients endpoint)

For `schedule_interview`:
```
1. Check email_logs for prior sends: SELECT COUNT(*) FROM email_logs
   WHERE related_entity_type='session' AND related_entity_id=:sessionId
   AND template_type='schedule_interview'
2. If count > 0 (re-send): filter interview_schedules where candidate_confirmation='pending'
3. If count = 0 (first send): return ALL candidates
```

For `interview_reminder`:
```
SELECT assigned_interviewer_id FROM interview_sessions WHERE id=:sessionId
→ fetch users row → { id, name, email }
```

## Next Steps
- Phase 03 adds eligibility gates for `offer` and `onboard_confirm`.
