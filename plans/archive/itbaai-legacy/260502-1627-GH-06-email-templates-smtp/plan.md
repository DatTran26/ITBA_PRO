---
slug: email-templates-smtp
created: 2026-05-02
status: completed
estimated_effort: 5-6 senior dev-days
brainstorm: ../reports/brainstorm-260502-1526-email-templates-smtp.md
base_branch: dev
---

# Plan — Email Templates + SMTP Sending (Phase 1 MVP)

## Goal

Standalone `/dashboard/emails` route với 4 template types × 2 locales (vi/en), pre-defined variables, Gmail SMTP via App Password, DB-encrypted credentials, audit logs. Read/write split: admin/super_admin edit; hr/interviewer/recruiter/admin/super_admin send.

## Source of truth

All 11 decisions + 6 resolved deps in `../reports/brainstorm-260502-1526-email-templates-smtp.md`.

## ⚠ Pre-execution prerequisites

| # | Prereq | Status |
|---|--------|--------|
| 1 | Master encryption key generated: `OGo+QXsxmK+WejyA8JNGl0A/wRWfZvozzl9NrQATl18=` | ✅ Generated, must save to `.env.local` + Vercel + 1Password BEFORE Phase 1 |
| 2 | Developer's Gmail App Password (dev test) | 🟡 User action: Settings → Security → App passwords |
| 3 | Pre-prod swap: `hr@hitek.com.vn` App Password | ⏸ Defer to before staging deploy |

## Phases

| # | Phase | Effort | Status | Branch |
|---|-------|--------|--------|--------|
| 1 | [DB schema + pgcrypto + seed templates](phase-01-db-schema.md) | 0.5d | ✅ completed | `feat/email-templates/phase-01-db-schema` |
| 2 | [SMTP config UI + encryption + test-send](phase-02-smtp-config-ui.md) | 1d | ✅ completed | `feat/email-templates/phase-02-smtp-config` |
| 3 | [Template editor UI (CodeMirror + Preview)](phase-03-template-editor.md) | 1d | ✅ completed | `feat/email-templates/phase-03-template-editor` |
| 4 | [Compose page + recipient picker + autofill](phase-04-compose-page.md) | 1.5d | ✅ completed | `feat/email-templates/phase-04-compose` |
| 5 | [Send API + nodemailer + email_logs](phase-05-send-api.md) | 1d | ✅ completed | `feat/email-templates/phase-05-send-api` |
| 6 | [Logs page + nav-config + permissions](phase-06-logs-and-nav.md) | 0.5d | ✅ completed | `feat/email-templates/phase-06-logs-nav` |
| 7 | [QA + docs + CHANGELOG](phase-07-qa-and-rollout.md) | 0.5d | ✅ completed | `feat/email-templates/phase-07-qa` |

## Dependencies (sequential)

```
Phase 1 (schema)
  └─→ Phase 2 (SMTP config — needs encrypted column)
       └─→ Phase 3 (template editor — needs templates table)
            └─→ Phase 4 (compose — needs templates + variable autofill source)
                 └─→ Phase 5 (send API — needs all above + provider abstraction)
                      └─→ Phase 6 (logs page consumes email_logs from Phase 5; nav adds entries)
                           └─→ Phase 7 (QA + rollout)
```

## Branch strategy

- All branches off `dev` (NOT current sidebar branch). User confirms sidebar feature stable on dev before starting.
- Phase N branches from Phase N-1 to carry forward changes.
- After all phases complete: confirm with user → merge sequentially into `dev`.

## Success criteria

- 8 templates seeded (4 types × vi/en) editable via UI
- SMTP config saveable via Settings; password DB-encrypted
- Compose page sends email via Gmail SMTP, logs written
- Permission split enforced: edit gated to admin/super_admin
- All 5 sender roles can send
- Build passes, no TS errors, no console errors
- Test send to admin's own email works end-to-end

## Out of scope (explicit)

- Auto-trigger on workflow events (Phase 2+ future)
- Resend API integration (Phase 2+ future, see brainstorm Phase 2 note)
- Template versioning, A/B variants, scheduled send
- Bounce handling, unsubscribe automation
- Inline images / file attachments
- Auto-create offer_details / onboarding_details tables for `salary`, `start_date`, etc. — manual fill on compose page

## Rollback

- Disable SMTP toggle in Settings UI → no sends, UI accessible
- Rollback migration: drop 3 tables (`email_provider_config`, `email_templates`, `email_logs`) + remove pgcrypto extension if unused
- Revert phase branches if integrated bugs

## Phase 2 (future) preserve points

- `EmailProvider` interface in Phase 5 — future Resend adapter implements same contract
- `provider_type` enum in `email_provider_config` — already supports `'gmail_smtp' | 'resend'`
- Variable schema in code (NOT DB) — provider-agnostic, no migration needed for Phase 2
