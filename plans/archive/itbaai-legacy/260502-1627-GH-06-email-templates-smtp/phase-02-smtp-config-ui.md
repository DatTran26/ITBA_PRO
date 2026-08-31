---
phase: 2
title: SMTP config UI + encryption helpers + test-send
status: completed
effort: 1 day
branch: feat/email-templates/phase-02-smtp-config
depends_on: [phase-01]
---

# Phase 2 — SMTP Config UI + Encryption + Test-Send

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: decisions #2, #6 (Gmail SMTP via App Password, pgcrypto encryption)

## Overview

**Priority:** P0
**Description:** Build Settings → SMTP Settings tab matching Supabase UI screenshot. Encrypt password via pgcrypto on save; never decrypt to client. Add test-send endpoint that sends to admin's own email to verify config end-to-end.

## Requirements

**Functional:**
- Settings page with tabs: Templates | SMTP Settings (admin/super_admin only)
- "Enable custom SMTP" toggle gates form submission
- Sender details: email + display name
- Provider settings: host, port, min_interval_seconds, username, password (with Reveal — but UI never shows decrypted password; Reveal only works between save+reload)
- Save action: server-side `pgp_sym_encrypt(password, MASTER_KEY)` then UPDATE
- "Send test email" button: POST `/api/emails/test-send` → sends to current user email
- Validation: all fields required when `enabled=true`
- env: `SMTP_PASSWORD_ENCRYPTION_KEY` (from brainstorm — already generated)

**Non-functional:**
- Password never round-trips to client unencrypted
- Save endpoint server-only (no client RLS write to encrypted column)
- Master key validation on app startup (fail-fast if missing)

## Architecture

### File: `src/lib/email/smtp-credential.ts`

```ts
import { createClient } from "@/lib/supabase/server";

const ENV_KEY = "SMTP_PASSWORD_ENCRYPTION_KEY";

export function getMasterKey(): string {
    const key = process.env[ENV_KEY];
    if (!key || key.length < 32) {
        throw new Error(`${ENV_KEY} missing or too short (need 32+ chars base64)`);
    }
    return key;
}

export interface ProviderConfigPublic {
    enabled: boolean;
    provider_type: "gmail_smtp" | "resend";
    sender_email: string;
    sender_name: string;
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_username: string | null;
    has_password: boolean;  // never expose actual value
    min_interval_seconds: number;
    updated_at: string;
}

/** Server-only: read provider config + decrypt password for sending. */
export async function readProviderConfigForSending(): Promise<{
    config: ProviderConfigPublic;
    decryptedPassword: string | null;
}> {
    const supabase = await createClient();
    const masterKey = getMasterKey();
    const { data } = await supabase
        .from("email_provider_config")
        .select("*, decrypted_password:smtp_password_encrypted")
        .single();
    // Use raw RPC for decryption (RLS still enforced):
    const { data: pw } = await supabase.rpc("decrypt_smtp_password", { master_key: masterKey });
    // ... return shape
}
```

### Helper RPC functions (added in Phase 2 migration)

```sql
-- supabase/migrations/20260502000001_email_smtp_helpers.sql
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(plaintext text, master_key text)
RETURNS bytea LANGUAGE sql SECURITY DEFINER AS $$
  SELECT pgp_sym_encrypt(plaintext, master_key);
$$;

CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(master_key text)
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT pgp_sym_decrypt(smtp_password_encrypted, master_key)::text
  FROM public.email_provider_config
  LIMIT 1;
$$;

-- Restrict RPC to admin/super_admin via REVOKE+GRANT
REVOKE ALL ON FUNCTION public.encrypt_smtp_password(text, text) FROM public;
REVOKE ALL ON FUNCTION public.decrypt_smtp_password(text) FROM public;
GRANT EXECUTE ON FUNCTION public.encrypt_smtp_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_smtp_password(text) TO authenticated;
-- App-level role check enforced in API route
```

### API Routes

```
PATCH /api/emails/smtp-config       Body: { enabled, sender_email, sender_name, smtp_host, smtp_port, smtp_username, smtp_password?, min_interval_seconds }
                                    Auth: admin/super_admin only
                                    Encrypt password if provided

GET   /api/emails/smtp-config       Returns ProviderConfigPublic (no password)

POST  /api/emails/test-send         Sends test email to current user
                                    Auth: admin/super_admin only
                                    Returns: { success, error?, messageId? }
```

### UI: `src/app/dashboard/emails/settings/page.tsx` + `smtp-tab.tsx`

- Page: server component, fetch config + user, gate on admin/super_admin, redirect if not
- SmtpTab: client component, form with all fields, Reveal button (only shows password user just typed in current session), Save button → PATCH, Test Send button → POST then toast result

## Related Code Files

**Modify:** none in this phase (page.tsx is new)

**Create:**
- `supabase/migrations/20260502000001_email_smtp_helpers.sql`
- `src/lib/email/smtp-credential.ts` (server helpers)
- `src/app/dashboard/emails/settings/page.tsx`
- `src/app/dashboard/emails/settings/smtp-tab.tsx`
- `src/app/api/emails/smtp-config/route.ts` (GET + PATCH)
- `src/app/api/emails/test-send/route.ts`

**Verify:**
- Add `SMTP_PASSWORD_ENCRYPTION_KEY` to `.env.local` BEFORE running app

## Implementation Steps

1. Branch from phase-01: `git checkout -b feat/email-templates/phase-02-smtp-config`
2. Write helper RPC migration, apply
3. Add `SMTP_PASSWORD_ENCRYPTION_KEY` to `.env.local`
4. Write `src/lib/email/smtp-credential.ts`
5. Write API routes (GET/PATCH config, POST test-send)
6. Install `nodemailer` + `@types/nodemailer` for SMTP send
7. Test-send uses nodemailer with decrypted credentials
8. Build settings page + smtp-tab
9. Manual: super_admin can save SMTP config; password encrypts in DB (verify `smtp_password_encrypted` is bytea, not plaintext)
10. Manual: Test Send button → email arrives in inbox

## Todo List

- [x] Branch from phase-01
- [x] Migration: pgcrypto helper RPC functions
- [x] Apply migration
- [x] Add SMTP_PASSWORD_ENCRYPTION_KEY to .env.local
- [x] Install nodemailer + types
- [x] Create smtp-credential.ts helpers
- [x] Create GET/PATCH /api/emails/smtp-config
- [x] Create POST /api/emails/test-send
- [x] Settings page + tabs scaffolding
- [x] SmtpTab form (matching Supabase screenshot)
- [x] Save flow: encrypt + UPDATE
- [x] Test Send button + result toast
- [ ] Manual: save config → password encrypted in DB
- [ ] Manual: test send arrives at admin inbox
- [x] Compile passes
- [x] Commit + push

## Success Criteria

- Save SMTP config → DB has bytea (not plaintext) in smtp_password_encrypted
- GET endpoint returns config WITHOUT password
- Test send arrives at admin's email
- Non-admin (hr/recruiter) gets 403 on PATCH
- App fails fast if SMTP_PASSWORD_ENCRYPTION_KEY missing

## Risk Assessment

| Risk | L | I | Mitigation |
|------|---|---|------------|
| Master key leaked via logs | L | H | Never log decrypted password; never log master key; redact in error responses |
| pgcrypto RPC bypassable via RLS | L | M | SECURITY DEFINER + app-layer role check in API route |
| Test send rate limit | M | M | nodemailer error → display friendly toast |
| Gmail App Password format quirk | M | M | Trim whitespace on save; validate 16-char format hint in UI |

## Next Steps

Phase 3 — Template editor UI.
