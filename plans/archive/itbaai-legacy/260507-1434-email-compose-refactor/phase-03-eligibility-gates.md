# Phase 03 — Eligibility Gates (Offer + Onboard Confirm)

## Context Links
- Reuse helper: `src/lib/recruitment/offer-gate.ts` (`checkOfferEligibility(jobApplicationId)`)
- Recipients API: `src/app/api/emails/recipients/route.ts`
- Pipeline status types: `src/types/recruitment.ts` (`PipelineStatus`)

## Overview
- Priority: P2
- Status: pending
- Restrict the recipient picker results so:
  - `offer` → only candidates whose latest application passed all 3 rounds
  - `onboard_confirm` → only candidates with application `pipeline_status = 'ACCEPTED'`

## Key Insights
- `offer-gate.ts` already encodes the round-pass check per job_application. We need to find candidates with at least one eligible application, then resolve their `persons` row for the picker.
- `onboard_confirm` has a much simpler filter: join `persons` ↔ `job_applications` where `pipeline_status = 'ACCEPTED'`.
- Spec says "OFFER_ACCEPTED" but the actual enum value is `'ACCEPTED'` (post-`OFFERED`). Document this mapping in the route.

## Requirements

### Functional
- Extend `/api/emails/recipients` GET with optional `gate=offer | onboard_confirm` parameter:
  - When set, filter persons accordingly.
  - Without `gate`, behavior unchanged.
- RecipientSelector passes `gate` to the API based on template type.

### Non-functional
- Keep eligibility filter server-side (single source of truth, prevents client tampering).
- Don't N+1: one query per request, even when `offer` requires checking interview results.

## Architecture

```
RecipientSelector (type=offer)
   → GET /api/emails/recipients?type=offer&gate=offer&q=...
        → server resolves candidate set:
            offer: SELECT persons WHERE id IN (
                       SELECT person_id FROM job_applications
                       WHERE id IN <eligible_app_ids>
                     )
                with eligible_app_ids = applications that pass round-gate query
            onboard_confirm: SELECT persons JOIN job_applications
                             WHERE pipeline_status = 'ACCEPTED'
```

## Related Code Files

### Modify
- `src/app/api/emails/recipients/route.ts`
  - Read `gate` searchParam.
  - For `gate=offer`: build set of eligible application ids via single query; then filter persons.
  - For `gate=onboard_confirm`: join filter on `pipeline_status='ACCEPTED'`.

### Create
- `src/lib/recruitment/eligibility-queries.ts` — pure helpers:
  - `getOfferEligiblePersonIds(supabase, q?: string, limit?: number): Promise<string[]>`
  - `getOnboardEligiblePersonIds(supabase, q?: string, limit?: number): Promise<string[]>`
  - Encapsulates the set-building logic; keeps the route thin.

## Implementation Steps

1. Inspect `interview_schedules` + `interview_results` schema in migration `20260419000000_recruitment_schema.sql` to confirm columns used in `offer-gate.ts`.
2. Create `src/lib/recruitment/eligibility-queries.ts`:
   - `getOfferEligiblePersonIds`: pull all application ids with at least 3 distinct rounds where any related `interview_results.result = 'pass'` and schedule `status = 'completed'`. Then map app ids → person ids via `job_applications`.
   - `getOnboardEligiblePersonIds`: simple `select person_id from job_applications where pipeline_status='ACCEPTED'`.
   - Apply `q` ILIKE filter at person-level after id set is computed.
3. Edit `recipients/route.ts`:
   - Branch on `gate` param. Default behavior preserved.
   - Cap result at 10 like current code.
4. Edit `RecipientSelector` consumers (compose-client) to append `&gate=offer` or `&gate=onboard_confirm` based on template type. Move URL building into a single helper inside picker.
5. Compile + lint.

## Todo List
- [ ] Read migration to confirm interview_results / interview_schedules columns
- [ ] Create `eligibility-queries.ts`
- [ ] Extend `recipients/route.ts` with `gate` param
- [ ] Pipe `gate` from picker query string
- [ ] Manual smoke: search candidate not eligible for offer → should not appear
- [ ] Manual smoke: candidate with `pipeline_status='ACCEPTED'` appears for onboard_confirm only
- [ ] Lint + type-check pass

## Success Criteria
- `offer` picker hides candidates who haven't completed/passed all 3 rounds.
- `onboard_confirm` picker only lists candidates with `pipeline_status = 'ACCEPTED'`.
- `schedule_interview` and `interview_reminder` pickers behave as before (no gate).

## Risk Assessment
- Risk: round-pass logic duplicated between `offer-gate.ts` (per-application boolean) and the new bulk query (set of app ids). Mitigation: keep `offer-gate.ts` for the single-application action gate (already used by `applications/[id]/offer`); the new helper computes the set via SQL/Supabase only. Document the parallel path with a comment.
- Risk: misnaming spec value (`OFFER_ACCEPTED` vs `ACCEPTED`). Mitigation: comment + constant.

## Security
- Filter is server-side; client cannot bypass via `gate=` value because:
  - `gate=offer` only narrows results
  - `gate=onboard_confirm` only narrows results
  - Auth/role check unchanged

## Clarifications

- **Offer gate** (resolved): Candidates with status `OFFERED` or `ACCEPTED` are **excluded** from the offer picker. No re-send for already-offered candidates.
- **Onboard gate** (resolved): Candidates with status `ONBOARDED` are **excluded** from the onboard_confirm picker. Already-onboarded candidates are hidden.

### Updated eligibility query specs

**Offer gate** (`gate=offer`):
```sql
-- Eligible: passed all 3 rounds AND pipeline_status NOT IN ('OFFERED', 'ACCEPTED', 'ONBOARDED', 'REJECTED')
```
Use `getOfferEligiblePersonIds` — already excludes non-eligible rounds. Add additional filter:
```ts
.not('pipeline_status', 'in', '("OFFERED","ACCEPTED")')
```

**Onboard confirm gate** (`gate=onboard_confirm`):
```sql
-- Eligible: pipeline_status = 'ACCEPTED' (offer accepted, not yet onboarded)
WHERE pipeline_status = 'ACCEPTED'
-- ONBOARDED excluded implicitly (different status)
```

## Next Steps
- Phase 04 wires bulk send endpoint and final compose flow update.
