---
title: "Email Compose Refactor — Multi-recipient + Session Expansion + Gates"
description: "Refactor compose flow: dynamic recipient cardinality, session-based expansion, eligibility gates, bulk send"
status: pending
priority: P2
effort: 12h
branch: dev
tags: [email, compose, recruitment, refactor]
created: 2026-05-07
---

# Email Compose Refactor

## Goal
Rework `/dashboard/emails/compose` so recipient picker behavior, eligibility, and send transport adapt to template type. Replace the single-select picker with a dynamic selector that supports multi-select for `schedule_interview` / `interview_reminder` and gated single-select for `offer` / `onboard_confirm`. Add session-based expansion (pick session → auto-fill candidates/interviewers) and a bulk send endpoint.

## Cardinality & Source Matrix

| Template | Source | Cardinality | Gate |
|----------|--------|-------------|------|
| schedule_interview | persons | multi | none |
| interview_reminder | users (role=interviewer) | multi | none |
| offer | persons | single | passed all 3 rounds (reuse `lib/recruitment/offer-gate.ts`) |
| onboard_confirm | persons | single | application status = `ACCEPTED` (offer accepted) |

> Note: `OFFER_ACCEPTED` in spec maps to existing `pipeline_status = 'ACCEPTED'` per `src/types/recruitment.ts`.

## Phases

| # | File | Status | Effort |
|---|------|--------|--------|
| 1 | [phase-01-recipient-selector.md](./phase-01-recipient-selector.md) | pending | 3h |
| 2 | [phase-02-session-expansion.md](./phase-02-session-expansion.md) | pending | 3h |
| 3 | [phase-03-eligibility-gates.md](./phase-03-eligibility-gates.md) | pending | 3h |
| 4 | [phase-04-bulk-send-api.md](./phase-04-bulk-send-api.md) | pending | 3h |

## Key Dependencies

- Existing: `/api/emails/recipients` (extend with eligibility filters in Phase 3)
- Existing: `/api/recruitment/sessions` GET returns sessions with round + counts
- Existing: `/api/recruitment/sessions/[id]` GET returns schedules with candidates
- Existing: `lib/recruitment/offer-gate.ts` — reuse for offer eligibility
- New: `/api/emails/send-bulk` (Phase 4) — wraps single-send loop with shared rate-limit policy

## Branch Plan (per `primary-workflow.md`)
- `feat/email-compose-refactor/phase-01-recipient-selector`
- `feat/email-compose-refactor/phase-02-session-expansion`
- `feat/email-compose-refactor/phase-03-eligibility-gates`
- `feat/email-compose-refactor/phase-04-bulk-send-api`

Branch from `dev`. Merge sequentially after user approval.

## Architecture (data flow)

```
[Template select]
   → drives RecipientSelector mode (multi/single) + source (persons/users)
   → drives SessionPicker visibility (only for schedule_interview / interview_reminder)
   → drives eligibility filter passed to /api/emails/recipients (offer / onboard_confirm)

[handleSend]
   → if single → POST /api/emails/send (unchanged)
   → if multi  → POST /api/emails/send-bulk
```

## Out of Scope (YAGNI)
- Background queue / job worker (synchronous loop is sufficient for current send volumes)
- Per-recipient variable overrides in UI (server resolves `candidate_name` / `interviewer_name` from DB)
- Throttling beyond existing per-user rate limit (bulk endpoint enforces same min-interval but skips check between recipients in the same call — single-author batch)

## Clarifications Resolved

| # | Question | Decision |
|---|----------|----------|
| 1 | Interviewer assignment source | `assigned_interviewer_id` field on `interview_sessions` table (not a join table) |
| 2 | Session expansion filter for `schedule_interview` | First send → ALL candidates; re-send → only `candidate_confirmation = 'pending'`. Detection via `email_logs` prior sends to session's candidates |
| 3 | Offer gate — already offered candidates | Candidates with status `OFFERED` or `ACCEPTED` → excluded from offer picker (no re-send) |
| 4 | Onboard gate — already onboarded candidates | Candidates with status `ONBOARDED` → excluded from onboard_confirm picker |
| 5 | Bulk rate limit | 100ms server-side delay between each email send; cap at 50 recipients per bulk call |
| 6 | batch_id | Add `batch_id` UUID column to `email_logs` (migration required); groups all sends in one bulk call |
| 7 | Bulk endpoint template restriction | `/api/emails/send-bulk` validates server-side that `templateId` type is `schedule_interview` or `interview_reminder`; returns 400 otherwise |
