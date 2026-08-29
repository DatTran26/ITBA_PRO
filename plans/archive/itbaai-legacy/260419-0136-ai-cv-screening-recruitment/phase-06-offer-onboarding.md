# Phase 6 — Offer + Onboarding Management

## Context Links
- Phase 3 state machine
- `persons.status`, `persons.joined_date`

## Overview
- **Priority:** P3
- **Status:** completed
- **Description:** Lightweight offer flow — recruiter transitions PASSED → OFFERED → ACCEPTED/OFFER_REJECTED → ONBOARDED. On ONBOARDED, update `persons` to employee.

## Key Insights
- Minimal viable flow: no formal offer documents yet (YAGNI)
- Onboarding means flipping `persons.type` from `candidate` to `employee`, setting `joined_date`, and `persons.source='both'`

## Requirements
**Functional**
- PATCH `/api/recruitment/applications/[id]/offer` with `action: 'make_offer' | 'accept' | 'reject' | 'onboard'` and optional `joined_date`
- Each action validated via state machine
- `onboard` action updates `persons.type='employee'`, `persons.status='active'`, `persons.joined_date=<date>`, `persons.source='both'`
- Offer action-bar UI on detail page

## Architecture
```ts
// PATCH body
interface OfferBody {
  action: 'make_offer' | 'accept' | 'reject' | 'onboard';
  joined_date?: string; // required on 'onboard'
  note?: string;
}
```

State flow driven by existing machine — this endpoint is a thin wrapper with side effects on `onboard`.

## Related Code Files
**Create**
- `src/app/api/recruitment/applications/[id]/offer/route.ts` (PATCH)
- `src/components/recruitment/offer-actions.tsx` (button group)
- `src/components/recruitment/onboard-dialog.tsx` (captures joined_date)

## Implementation Steps
1. PATCH endpoint with action switch; each action calls state machine + updates history
2. On `onboard`: single transaction updating `persons` + `job_applications`
3. Offer-actions component shown only when status ∈ {PASSED, OFFERED, ACCEPTED}
4. Onboard dialog picks `joined_date` (default today)
5. Log activity for each action

## Todo
- [x] Offer PATCH endpoint
- [x] Onboard person-update transaction
- [x] Offer-actions component
- [x] Onboard dialog

## Success Criteria
- PASSED → OFFERED visible in history
- ACCEPTED → ONBOARDED updates `persons.type` and shows in employee list
- Invalid action returns 422

## Risk Assessment
- **Risk:** Partial updates if transaction fails → wrap in single RPC or Supabase `.rpc()` if feasible; otherwise compensating delete
- **Risk:** Duplicate employee record — person_id is same row, just type switch; no duplication

## Security Considerations
- Role guard: recruiter/admin/super_admin only
- `joined_date` must not be in the future >1 year

## Next Steps
- Phase 7 manages JDs used upstream
