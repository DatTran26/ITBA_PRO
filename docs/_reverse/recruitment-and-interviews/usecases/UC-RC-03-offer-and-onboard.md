# UC-RC-03 — Offer và onboard

- **Actor:** Admin/recruiter theo live route.
- **Precondition:** Application ở state cho phép theo state machine.
- **Flow:** mark offered → record accepted/rejected → nếu accepted và có joined
  date thì chuyển person thành active employee và application ONBOARDED.
- **Missing actor:** Candidate self-service/consent chưa có evidence.
- **Evidence:** `Frontend/src/app/api/recruitment/applications/[id]/offer/route.ts:8-95`.
