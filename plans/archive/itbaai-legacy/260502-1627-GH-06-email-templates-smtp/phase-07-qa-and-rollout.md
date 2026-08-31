---
phase: 7
title: QA + docs + CHANGELOG
status: completed
effort: 0.5 day
branch: feat/email-templates/phase-07-qa
depends_on: [phase-06]
---

# Phase 7 — QA + Rollout

## Context Links
- Plan: [plan.md](plan.md)

## Overview

**Priority:** P0
**Description:** End-to-end QA across roles, locales, template types. Update CHANGELOG, system-architecture docs. Document Phase 2 migration path explicitly. Plan production rollout (App Password swap).

## QA Matrix

### Permission split (5 roles × 4 capabilities)

| Role | View Compose | Send Email | Edit Templates | Edit SMTP | View All Logs |
|------|--------------|------------|----------------|-----------|----------------|
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| hr | ✅ | ✅ | ❌ | ❌ | own only |
| recruiter | ✅ | ✅ | ❌ | ❌ | own only |
| interviewer | ✅ | ✅ | ❌ | ❌ | own only |

### Send-flow E2E (4 types × 2 locales = 8 paths)

For each: choose template type → fill recipient → fill required variables → send → verify email arrives + log status=sent.

| # | Type | Locale | Pass |
|---|------|--------|------|
| 1 | schedule_interview | vi | [ ] |
| 2 | schedule_interview | en | [ ] |
| 3 | interview_reminder | vi | [ ] |
| 4 | interview_reminder | en | [ ] |
| 5 | offer | vi | [ ] |
| 6 | offer | en | [ ] |
| 7 | onboard_confirm | vi | [ ] |
| 8 | onboard_confirm | en | [ ] |

### Failure cases

| # | Test | Expected |
|---|------|----------|
| 1 | Send with SMTP disabled | UI disabled / API 400 |
| 2 | Send with bad credentials | log status='failed', error_message recorded |
| 3 | Rate-limit (2 sends within 60s) | 2nd returns 429 |
| 4 | hr tries PATCH template | 403 |
| 5 | hr tries PATCH SMTP config | 403 |
| 6 | hr accesses /emails/settings | redirect to dashboard |
| 7 | XSS attempt in template body | DOMPurify strips on save |
| 8 | XSS attempt in variable value | escaped in render |

### Audit fixes

- [ ] Compose page top-padding correct in both topnav + sidebar layouts (uses `pt-[var(--page-top)]` or `<PageContainer>`)
- [ ] Logs page same
- [ ] Settings page same

## Documentation updates

### `CHANGELOG.md`

```markdown
## [Unreleased] (additive to sidebar nav)

### ✨ Tính năng mới
- **Email templates + SMTP sending:** Soạn 4 loại email (schedule, reminder, offer, onboard) song ngữ vi/en. Gửi qua Gmail SMTP với App Password, password DB-encrypted via pgcrypto.
- **Email logs:** Audit trail tất cả email gửi đi, admin xem all, hr/recruiter/interviewer xem own.

### 🔐 Security
- pgcrypto extension enabled cho symmetric encryption SMTP password
- Master encryption key trong env: `SMTP_PASSWORD_ENCRYPTION_KEY`
- Permission split: edit templates/SMTP (admin+super_admin), send (5 recruitment roles)

### 📦 Migration cần apply
- `supabase/migrations/20260502000000_email_templates_smtp.sql` — 3 tables + RLS + 8 seeded templates
- `supabase/migrations/20260502000001_email_smtp_helpers.sql` — pgcrypto RPC helpers

### 🧩 Phase 2 (future)
- Resend integration với verified domain (notes trong plan)
- Auto-trigger trên workflow events
- Template versioning + A/B variants
```

### `docs/system-architecture.md`

Add subsection "Email System":
- Architecture diagram (compose → API → provider → SMTP → audit log)
- Provider abstraction explained
- Permission matrix
- Phase 2 migration path

## Rollout sequence

1. Apply 2 migrations on staging
2. Set `SMTP_PASSWORD_ENCRYPTION_KEY` in staging Vercel env (use generated value, also store in 1Password)
3. Set developer's Gmail App Password in staging via UI (Settings → SMTP)
4. Internal QA round (1 day): senior dev + HR test all 4 templates
5. Production: same migrations + env var + staging-tested SMTP config
6. **Pre-prod swap:** When `hr@hitek.com.vn` App Password ready → super_admin updates SMTP config via UI (no code change)
7. Monitor email_logs for 1 week — failure rate, latency

## Rollback procedure

Disable SMTP toggle in Settings UI → no sends, UI accessible.

If broken:
- Revert phase branches in reverse order
- Drop 3 tables (data loss for templates + logs — OK if not yet in production use)
- Remove pgcrypto extension (only if no other consumer)

## Implementation Steps

1. Branch from phase-06
2. Run QA matrix manually
3. Run failure cases
4. Audit padding in compose/logs/settings pages
5. Update CHANGELOG.md
6. Update docs/system-architecture.md
7. Final build green
8. Commit + push

## Todo List

- [ ] Branch from phase-06
- [ ] QA permission matrix all 5 roles × 4 capabilities
- [ ] QA send-flow E2E 8 paths
- [ ] QA failure cases
- [ ] Audit page padding (compose, logs, settings)
- [ ] Update CHANGELOG.md
- [ ] Update docs/system-architecture.md
- [ ] Final build green
- [ ] Commit + push
- [ ] Document Phase 2 (Resend) migration path in docs

## Success Criteria

- All 5 roles × 4 capabilities matrix passes
- All 8 send-flow paths arrive at recipient inbox
- All 8 failure cases handled gracefully
- CHANGELOG + system-architecture updated
- Build + lint green

## Post-merge actions

- Schedule background agent in 4 weeks: evaluate Resend migration readiness
- Monitor email_logs failure rate; alert if >5% in 24h

## Unresolved questions

- None blocking. Phase 2 (Resend + auto-trigger) deferred per scope.
