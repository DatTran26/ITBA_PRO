---
type: brainstorm
date: 2026-05-02
slug: email-templates-smtp
status: ready-for-plan
---

# Brainstorm — Email Templates + SMTP Sending

## Executive Summary

Build standalone `/dashboard/emails` route với 4 template types (schedule, reminder, offer, onboard), bilingual (vi/en), pre-defined variables per type, Gmail SMTP via App Password (Phase 1) → Resend với verified domain (Phase 2). Templates + SMTP config DB-encrypted via pgcrypto. Read/write split: admin/super_admin edit templates + SMTP config; hr/interviewer/recruiter/admin/super_admin choose recipient + send. Estimated **5-6 senior dev-days** for Phase 1 (MVP).

## Decisions Locked (11)

| # | Decision | Choice |
|---|----------|--------|
| 1 | MVP scope | Store + button-click send (NOT auto-trigger) |
| 2 | Email provider Phase 1 | Gmail SMTP via App Password (`hr@hitek.com.vn`) |
| 3 | Email provider Phase 2 | Resend with verified domain (TODO future) |
| 4 | Variables system | Pre-defined per template type, strict schema |
| 5 | Localization | Bilingual: vi + en (1 record per type per locale) |
| 6 | Credential storage | DB encrypted via pgcrypto, master key in env |
| 7 | Send entry | Standalone `/dashboard/emails` page (not per-workflow) |
| 8 | Email logs | Yes — basic log table for audit + debugging |
| 9 | Editor | Code source with syntax highlight (Monaco or CodeMirror) + Preview tab |
| 10 | Nav location | New top-level "Emails" group in nav-config |
| 11 | Permission split | **Edit templates + SMTP:** admin/super_admin only. **Send (compose + recipient + send button):** hr/interviewer/recruiter/admin/super_admin |

## Phase 2 Note (DO NOT FORGET)

When migrating to Resend post-MVP:

- DNS access required for `hitek.com.vn` (or subdomain like `mail.hitek.com.vn`) — IT/sysadmin team owns this, NOT Gmail Workspace admin
- Verify TXT records: SPF, DKIM, DMARC (~30 min admin work)
- Add Resend API key to env (no DB change needed for API key — env-only)
- Provider abstraction in code: `EmailProvider` interface with `gmail-smtp` and `resend` adapters
- Schema `email_provider_config` already supports both — only add `provider_type` enum field
- Migration test: send test email from each provider before flipping default
- Rollback: keep Gmail SMTP as fallback for 1 sprint

## Phase 1 Architecture

### DB Schema (3 tables + pgcrypto)

```sql
-- 1. SMTP / email provider config (1 row, singleton)
CREATE TABLE email_provider_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled boolean NOT NULL DEFAULT false,
  provider_type varchar NOT NULL DEFAULT 'gmail_smtp'  -- future: 'resend'
    CHECK (provider_type IN ('gmail_smtp', 'resend')),
  sender_email varchar NOT NULL,
  sender_name varchar NOT NULL,
  smtp_host varchar,
  smtp_port int DEFAULT 465,
  smtp_username varchar,
  smtp_password_encrypted bytea,  -- pgcrypto pgp_sym_encrypt
  min_interval_seconds int DEFAULT 60,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- 2. Email templates (one row per type+locale, 4 types × 2 locales = 8 rows seeded)
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type varchar NOT NULL
    CHECK (type IN ('schedule_interview', 'interview_reminder', 'offer', 'onboard_confirm')),
  locale varchar NOT NULL CHECK (locale IN ('vi', 'en')),
  subject varchar NOT NULL,
  body_html text NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (type, locale)
);

-- 3. Email send log (audit + debug)
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type varchar NOT NULL,
  locale varchar NOT NULL,
  to_email varchar NOT NULL,
  to_name varchar,
  subject varchar NOT NULL,
  rendered_body text NOT NULL,  -- final body after var substitution
  variables jsonb NOT NULL,     -- snapshot of variables used
  related_entity_type varchar,  -- 'job_application' | 'interview' | etc.
  related_entity_id uuid,
  sent_by uuid REFERENCES users(id) NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status varchar NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text
);

CREATE INDEX idx_email_logs_to ON email_logs(to_email);
CREATE INDEX idx_email_logs_sent_by ON email_logs(sent_by);
CREATE INDEX idx_email_logs_related ON email_logs(related_entity_type, related_entity_id);
```

### Variable Schema (defined in code, NOT DB)

```ts
// src/lib/email/template-variables.ts
export const TEMPLATE_VARIABLES = {
  schedule_interview: [
    'candidate_name', 'position_name', 'interview_date', 'interview_time',
    'interview_location', 'interview_type',  // 'online' | 'onsite'
    'meeting_link', 'interviewer_names', 'company_name', 'hr_name', 'hr_email',
  ],
  interview_reminder: [
    'interviewer_name', 'candidate_name', 'position_name',
    'interview_date', 'interview_time', 'interview_location',
    'meeting_link', 'candidate_cv_link',
  ],
  offer: [
    'candidate_name', 'position_name', 'salary', 'start_date',
    'response_deadline', 'company_name', 'hr_name', 'contract_link',
  ],
  onboard_confirm: [
    'candidate_name', 'position_name', 'start_date', 'work_location',
    'manager_name', 'items_to_bring', 'hr_name', 'contact_email',
  ],
} as const;
```

### Encryption Strategy

```ts
// src/lib/crypto/smtp-credential.ts
// Postgres-side: pgcrypto pgp_sym_encrypt('password', master_key)
// Read in Node only at send-time:
//   SELECT pgp_sym_decrypt(smtp_password_encrypted, $1) FROM email_provider_config

// Master key: SMTP_PASSWORD_ENCRYPTION_KEY in env (32+ chars random)
// Risk: Lose key = lose stored password (UI shows "<not configured>")
// Mitigation: Document key in 1Password / company secrets vault
```

### Provider abstraction

```ts
// src/lib/email/provider.ts
export interface EmailProvider {
  send(input: {
    from: { email: string; name: string };
    to: { email: string; name?: string };
    subject: string;
    html: string;
  }): Promise<{ id: string; status: 'sent' | 'failed'; error?: string }>;
}

// Phase 1 impl: nodemailer with Gmail SMTP
// Phase 2 add: ResendProvider implements EmailProvider
```

### Routes & Pages

```
src/app/dashboard/emails/
├── page.tsx                       Compose (default landing)
│                                  - Template type dropdown
│                                  - Locale toggle (vi/en)
│                                  - Recipient picker (search candidates / interviewers)
│                                  - Variable autofill from related entity
│                                  - Preview pane
│                                  - Send button → POST /api/emails/send
├── compose-client.tsx
├── settings/
│   ├── page.tsx                   Tabs: Templates | SMTP Settings
│   │                              admin/super_admin only
│   ├── templates-tab.tsx          List of 8 templates (4 types × 2 locales)
│   │                              click → editor
│   ├── template-editor.tsx        Code editor + Preview + variable chips
│   │                              Save → PATCH /api/emails/templates/:id
│   ├── smtp-tab.tsx               Form matching Supabase screenshot
│   │                              Save → PATCH /api/emails/smtp-config
│   └── _components/
│       └── code-editor.tsx        Wraps @uiw/react-codemirror
└── logs/
    └── page.tsx                   Optional: list of email_logs (filter by candidate/sender)
```

### API Routes

```
POST   /api/emails/send            Body: { template_type, locale, to_email, variables, related_entity? }
                                   Permission: 5 roles
GET    /api/emails/templates       List all 8
PATCH  /api/emails/templates/:id   Update subject + body
                                   Permission: admin/super_admin
GET    /api/emails/smtp-config     Returns config WITHOUT decrypted password
PATCH  /api/emails/smtp-config     Updates config + re-encrypts password
                                   Permission: admin/super_admin
POST   /api/emails/test-send       Send test email to admin's own email
                                   Permission: admin/super_admin
GET    /api/emails/logs            Filter + paginate
                                   Permission: admin/super_admin/hr (own sends)
```

### Nav config addition

```ts
// nav-config.ts — new group
{
  id: 'emails',
  label: 'Emails',
  triggerIcon: Mail,
  links: [
    { href: '/dashboard/emails', label: 'Compose', icon: Send },
    { href: '/dashboard/emails/settings', label: 'Settings', icon: Settings },  // admin only via separate visibility check
    { href: '/dashboard/emails/logs', label: 'Logs', icon: ScrollText },
  ],
  allowedRoles: ['hr', 'interviewer', 'recruiter', 'admin', 'super_admin'],
  accentColor: '#36DDAB',  // green/teal — new accent for Emails
}
```

Sub-link visibility (Settings) requires per-link role check, NOT just group-level. Need to extend nav-config with optional `link.allowedRoles` override OR handle in render.

## Risk Assessment

| Risk | L | I | Mitigation |
|------|---|---|------------|
| Gmail App Password deprecated by Google | M | H | Phase 2 migration to Resend planned; document migration path in plan |
| Workspace daily rate limit (2000/day) | L | H | Email logs surface volume; add rate-limit warning in UI when approaching threshold |
| Master encryption key loss | L | H | Document key in 1Password / company secrets vault BEFORE deploying; add warning in Settings UI |
| Variable typos in template body | M | M | Variable chips clickable to insert; validation on save (parse `{{ }}` against schema, warn on unknown var) |
| Send to wrong recipient (PII leak) | L | H | Confirm modal before send; log includes sender + recipient for audit; rate-limit per user |
| Spam compliance (CAN-SPAM, GDPR) | M | H | Footer with unsubscribe link (manual not automated); company contact info in templates; legal review before production |
| Template body XSS via stored HTML | L | M | Render in iframe sandbox in Preview; sanitize on send (DOMPurify server-side) |
| Workspace admin disables App Password | L | H | Detect 535 auth error → log + alert super_admin; fallback warning in compose UI |
| Send-while-Edit race | L | M | Editor save invalidates compose preview cache |

## Strategic Options Compared

| Approach | Effort | Risk | Notes |
|----------|--------|------|-------|
| **Phase 1 as designed** (Recommended) | 5-6 days | Low | Matches all 11 locked decisions |
| Skip pgcrypto, use env-only | -1 day | Low | But UI in screenshot becomes read-only — mismatch with user choice |
| Skip email_logs | -0.5 day | Medium | Lose audit trail, harder debug |
| Skip bilingual (vi only) | -0.5 day | Low | Can add later, but schema needs UNIQUE constraint update |

## Phase Breakdown (proposal for /plan)

| # | Phase | Effort | Critical |
|---|-------|--------|----------|
| 1 | DB schema + pgcrypto + seed templates | 0.5d | P0 |
| 2 | SMTP config UI + encryption helpers + test-send | 1d | P0 |
| 3 | Template editor UI (CodeMirror + Preview + variable chips) | 1d | P0 |
| 4 | Compose page + recipient picker + variable autofill | 1.5d | P0 |
| 5 | Send API + nodemailer + email_logs writes + provider abstraction | 1d | P0 |
| 6 | Logs page + nav-config update + permission gates | 0.5d | P1 |
| 7 | QA + docs + CHANGELOG | 0.5d | P0 |

**Total: 5-6 senior dev-days**

## Dependencies — RESOLVED

| # | Item | Resolution |
|---|------|------------|
| 1 | Gmail App Password | Dev: developer's personal Gmail App Password để test flow. Pre-prod: swap sang `hr@hitek.com.vn` khi Workspace admin sẵn sàng. KHÔNG block plan. |
| 2 | Master encryption key | Generated: `OGo+QXsxmK+WejyA8JNGl0A/wRWfZvozzl9NrQATl18=` (32 bytes base64). Lưu vào `.env.local`, Vercel env, 1Password vault BEFORE Phase 1 deploy. |
| 3 | Variable autofill source | **Approach B (KISS):** Auto-fill từ existing entities (`persons`, `job_descriptions`, `interview_schedules`, `users`, current session). Variables không có trong DB (`salary`, `start_date`, `meeting_link`, `interview_location`, etc.) → manual fill on compose page. Tránh tạo `offer_details`/`onboarding_details` tables — defer to Phase 3 nếu cần structured data sau. |
| 4 | Recipient picker source | Filter theo template type: `schedule_interview/offer/onboard_confirm` → search `persons`; `interview_reminder` → search `users WHERE role='interviewer'`. |
| 5 | Email log retention | Keep forever (compliance + audit trail). DB size estimate: 1KB/row × 10k emails = ~10MB; non-issue. |
| 6 | Templates seed content | Placeholder content seeded qua migration với đầy đủ variables để demo. 8 templates (4 types × vi/en). Admin edit sau launch. KHÔNG block plan execution. |

### Variable autofill mapping (locked)

| Variable | Auto-fill source |
|----------|------------------|
| `candidate_name` | `persons.name` (via `job_applications.person_id`) |
| `position_name` | `job_descriptions.title` |
| `interview_date`, `interview_time` | `interview_schedules.scheduled_at` formatted in timezone |
| `interviewer_name` (single), `interviewer_names` (multi) | `users.name` (via `interview_schedules.interviewer_id`) |
| `candidate_cv_link` | Signed URL of `candidate_cvs.storage_path` (TTL 7 days) |
| `hr_name`, `hr_email` | Current logged-in user (sender) |
| `company_name` | `system_settings.company_name` (new key, default "ITBA") |
| `interview_location`, `meeting_link`, `interview_type` | Manual fill |
| `salary`, `start_date`, `response_deadline`, `contract_link` | Manual fill |
| `work_location`, `manager_name`, `items_to_bring` | Manual fill |

## Out of scope (rejected for MVP)

- Auto-trigger on workflow events (Phase 2+)
- Resend integration (Phase 2)
- A/B variants
- Scheduled send (queue + cron)
- Template versioning / history
- Bounce handling, unsubscribe management
- Inline image attachments / file attachments
- Reply tracking / threading

## Next Steps

1. User confirms decisions + answers 6 open dependencies
2. Run `/plan` to formalize phase files with branch-per-phase strategy
3. Workspace admin creates App Password (parallel)
4. Generate + securely store master encryption key
5. Begin Phase 1
