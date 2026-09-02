# Phase 04 — Bulk Send API + Compose Flow Update

## Context Links
- Existing single send: `src/app/api/emails/send/route.ts`
- Provider loader: `src/lib/email/get-active-provider.ts`
- Renderer: `src/lib/email/render-template.ts`
- Compose: `src/app/dashboard/emails/compose-client.tsx`

## Overview
- Priority: P2
- Status: pending
- Add `POST /api/emails/send-bulk`. Compose branches between single and bulk based on template type / recipient count.

## Key Insights
- The single-send route already does: auth → resolve recipient → fetch template → rate limit → log → send → update log. Bulk should reuse the same per-recipient logic, looping inside one auth/template/rate-limit envelope.
- Per-recipient variable resolution: `candidate_name` (persons) and `interviewer_name` (users) MUST be filled server-side per recipient (compose only knows shared variables).
- Logs: 1 row per recipient — reuses existing `email_logs` schema, easy to track per-recipient delivery.

## Requirements

### Functional
- Endpoint: `POST /api/emails/send-bulk`
- Body:
  ```ts
  {
    templateId: string;
    recipients: Array<{ id: string; source: "persons" | "users" }>;
    sharedVariables?: Record<string, string>;
    locale?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }
  ```
- Response:
  ```ts
  { sent: number; failed: Array<{ id: string; email?: string; error: string }> }
  ```
- Behavior:
  - Auth + role check (same `ALLOWED_ROLES`).
  - Reject if `recipients` empty or > **50** (hard cap).
  - Validate server-side that `templateId` belongs to `schedule_interview` or `interview_reminder` type; return 400 if not (defense-in-depth against direct API calls).
  - Fetch template once.
  - Load provider once.
  - Rate limit: enforce min-interval check ONCE before the loop (sender quota). Apply **100ms delay** between each individual send (server-side `await sleep(100)`).
  - Generate a single `batch_id` (UUID) for the entire call; stamp each `email_logs` row with it.
  - For each recipient: resolve email/name from table, merge `{...shared, candidate_name|interviewer_name: name}`, render, insert log (pending, batch_id), send, update log status. Push failures to `failed` array; never throw inside the loop.

### Non-functional
- Synchronous loop (YAGNI: no background queue yet). Acceptable for batches up to ~50 recipients within HTTP timeout.
- File ≤ 200 lines: extract per-recipient helper into a shared module.

## Architecture

```
POST /api/emails/send-bulk
   ├─ auth + role check
   ├─ validate body (cap 50; template type must be schedule_interview|interview_reminder)
   ├─ fetch template (once) — validate type
   ├─ load provider (once)
   ├─ enforce min-interval rate limit (once)
   ├─ batch_id = crypto.randomUUID()
   └─ for each recipient:
        ├─ resolve { email, name } via persons|users
        ├─ build vars + per-type name var
        ├─ render subject + body
        ├─ INSERT email_logs (pending, batch_id) → log_id
        ├─ provider.send(...)
        ├─ UPDATE email_logs (sent|failed)
        └─ await sleep(100ms)
```

## Related Code Files

### Create
- `src/app/api/emails/send-bulk/route.ts` — new endpoint
- `src/lib/email/send-one.ts` — extracted per-recipient helper used by both single + bulk routes:
  ```ts
  sendOne({ supabase, providerCtx, template, recipient, sharedVariables, locale, sentBy, related }) → Promise<{ ok: true; logId: string } | { ok: false; logId?: string; error: string }>
  ```

### Modify
- `src/app/api/emails/send/route.ts` — refactor to call `sendOne()` (DRY). Behavior unchanged externally.
- `src/app/dashboard/emails/compose-client.tsx`:
  - `handleSend` branches:
    - `recipients.length === 1` (single mode templates) → POST `/api/emails/send` (legacy payload).
    - `recipients.length > 1` (or always for multi templates) → POST `/api/emails/send-bulk`.
  - Confirm modal shows `{recipients.length} recipient(s)` and sample list (first 3 + "and N more").
  - On bulk response, toast `Sent X / Failed Y` and surface failures via expandable list.

## Implementation Steps

1. Extract `sendOne` from existing `send/route.ts`. Keep all current side-effects (logs, provider call). No behavior change.
2. Refactor `send/route.ts` to delegate to `sendOne`.
3. Create `send-bulk/route.ts`:
   - Validate body with simple guard (no Zod unless already in repo — check first).
   - Cap recipients at **50** with 400 error otherwise.
   - Validate template type is `schedule_interview` or `interview_reminder`; return 400 otherwise.
   - Generate `batch_id = crypto.randomUUID()` before loop.
   - Loop: `sendOne(...)` → `await sleep(100)` → collect successes + failures.
4. Update compose `handleSend` to branch by recipient count.
5. Update confirm modal:
   - Replace single recipient row with count + first 3 emails + "+ N more" pill.
6. Lint + type-check pass.
7. Smoke test:
   - Send `schedule_interview` to 3 candidates → 3 email_logs rows, 3 deliveries.
   - Send `offer` to 1 eligible candidate → unchanged single path.
   - Force a failure (invalid SMTP) → response includes that recipient in `failed`, others succeed.

## Todo List
- [ ] Write migration: `batch_id UUID` column + index on `email_logs`
- [ ] Create `src/lib/email/send-one.ts` extracted helper (accepts `batchId?`)
- [ ] Refactor `src/app/api/emails/send/route.ts` to delegate to `sendOne`
- [ ] Create `src/app/api/emails/send-bulk/route.ts` (cap 50, template type guard, 100ms delay, batch_id)
- [ ] Branch `handleSend` in compose between single + bulk
- [ ] Update confirm modal with multi-recipient summary
- [ ] Lint + type-check pass
- [ ] Manual smoke (3 cases above)

## Success Criteria
- Bulk endpoint produces N email_logs rows with correct per-recipient `candidate_name`/`interviewer_name`.
- Partial failures don't abort the rest of the batch.
- Existing single-send behavior is byte-for-byte unchanged from the API consumer's view.
- Confirm modal communicates recipient count clearly.

## Risk Assessment
- Risk: HTTP timeout for very large batches. Mitigation: hard cap at **50** (100ms delay → max ~5s for full batch); if larger volumes needed, introduce background queue in a future phase.
- Risk: rate-limit check at start lets a user immediately send N×emails after the gate; that's the policy: `minIntervalSeconds` is between sends *initiated* by user, not between deliveries within one batch. Document in route comment.
- Risk: extracting `sendOne` introduces regression. Mitigation: keep diff mechanical; cover with the existing single-send smoke.

## Security
- Same auth/role gating as single send.
- Cap on batch size prevents accidental bulk fanout.
- Per-recipient resolution still goes through Supabase using `recipientId + source` (no client-supplied emails for users/persons rows).

## Clarifications

- **Template type restriction** (resolved): `/api/emails/send-bulk` validates server-side that the template type is `schedule_interview` or `interview_reminder`. Returns 400 for any other type. Defense-in-depth against direct API calls.
- **batch_id** (resolved): Add `batch_id UUID` column to `email_logs`. Migration required before Phase 04 implementation. All rows in one bulk call share the same `batch_id`.
- **Rate limit** (resolved): 100ms delay between each individual send server-side. Hard cap at 50 recipients per call.

## Migration Required

```sql
ALTER TABLE email_logs ADD COLUMN batch_id UUID;
CREATE INDEX idx_email_logs_batch_id ON email_logs(batch_id) WHERE batch_id IS NOT NULL;
```

Add to a new migration file: `supabase/migrations/YYYYMMDDHHMMSS_email_logs_batch_id.sql`

## Next Steps
- Run plan against current codebase, gather any additional schema confirmations, then begin Phase 01 branch.
