# Project overview

Town Hown is a B2B HRMS with AI assistance. This file owns product intent,
non-goals, terminology, and business constraints at the classic-docs route.
Executable behavior stays in source; this page does not restate screens or
APIs.

## Intent versus shipped code

- Target product contract: [`PRODUCT.md`](../PRODUCT.md).
- Commercial v1 cut, personas, goals, and non-goals: [`downtown/prd.md`](downtown/prd.md).
- Feature requirement route (PRD → URD → SRS): [`features/README.md`](features/README.md).

Shipped behavior is whatever `Frontend/`, `Backend/`, and `modules/` currently
prove. Presence of a module in the product contract is not proof it is
production-ready.

## Why this product exists

Organizations split HR work across files and tools. Status, evidence, and
accountability get lost. AI can extract, match, summarize, and draft, but
unreviewed AI on people-decisions creates legal and fairness risk. Town Hown
exists to keep one auditable path from source data to a human-owned decision.

## Non-goals (durable)

These are product constraints, not temporary backlog:

- AI must not hire, reject, discipline, score character, or set pay/KPI on its
  own. A person with authority remains accountable.
- No secret monitoring, keylogging, or collection outside a published policy.
- Not a payroll, tax, or legal system of record in v1.
- Not a consumer HR marketplace.
- Workplace cameras are only for announced areas; CV events are alerts until a
  manager confirms them.

Full wording lives in [`PRODUCT.md`](../PRODUCT.md) (system constraints) and
[`downtown/prd.md`](downtown/prd.md) (v1 non-goals).

## Terminology

| Term | Meaning |
| --- | --- |
| Town Hown | Product and this repository. |
| ITBAAI | Historical application name still visible in some manifests. |
| Human review | Required confirmation before AI output becomes an official HR fact. |
| Provenance | Link from a derived field back to the source file, page, or event. |
| BFF | Same-origin Next.js `/api/*` handlers in `Frontend/src/app/api`. |
| Downtown docs | Current detailed product/ops set under [`downtown/`](downtown/README.md). |

## Business constraints that code cannot invent

- Role, department, and management-scope limits are product rules, not optional
  hardening.
- Biometric face data is collected only with consent, for sign-in and attendance.
- Sensitive payloads sent to third-party AI must be minimized.
- Demo data must be synthetic, anonymized, or lawfully consented.

Security policy: [`SECURITY.md`](../SECURITY.md) and
[`downtown/security.md`](downtown/security.md).
