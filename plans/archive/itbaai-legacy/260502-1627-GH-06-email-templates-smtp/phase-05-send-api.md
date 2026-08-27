---
phase: 5
title: Send API + nodemailer + email_logs
status: completed
effort: 1 day
branch: feat/email-templates/phase-05-send-api
depends_on: [phase-04]
---

# Phase 5 — Send API + Provider Abstraction

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: decision #1 (button-click send), Phase 2 future Resend abstraction

## Overview

**Priority:** P0
**Description:** Build POST `/api/emails/send` endpoint. Provider abstraction (`EmailProvider` interface) with `gmail-smtp` adapter Phase 1. Insert `email_logs` row pre-send (status=pending), update status post-send. Permission gate: 5 roles. Rate-limit per sender via `min_interval_seconds`.

## Requirements

**Functional:**
- POST `/api/emails/send`:
  - Body: `{ template_type, locale, to_email, to_name?, variables, related_entity_type?, related_entity_id? }`
  - Auth: 5 roles
  - Steps:
    1. Verify SMTP config enabled
    2. Rate-limit check: `email_logs WHERE sent_by=$user AND sent_at > NOW() - min_interval_seconds`
    3. Render subject + body via `renderTemplate(template, variables)`
    4. INSERT email_logs (status='pending') → get log_id
    5. Decrypt SMTP password (server-only)
    6. Send via `EmailProvider.send()` (nodemailer Gmail SMTP)
    7. UPDATE email_logs SET status='sent'|'failed', error_message
  - Returns: `{ success, log_id, error? }`

**Non-functional:**
- Provider abstraction: future Resend swap = add 1 file, no schema change
- Logs retain even on failure (debugging)
- Decrypted password never crosses process boundary; only used inside `/api/emails/send` handler

## Architecture

### File: `src/lib/email/provider.ts`

```ts
export interface SendInput {
    from: { email: string; name: string };
    to: { email: string; name?: string };
    subject: string;
    html: string;
}

export interface SendResult {
    messageId?: string;
    status: "sent" | "failed";
    error?: string;
}

export interface EmailProvider {
    send(input: SendInput): Promise<SendResult>;
}
```

### File: `src/lib/email/providers/gmail-smtp-provider.ts`

```ts
import nodemailer from "nodemailer";
import type { EmailProvider, SendInput, SendResult } from "../provider";

export interface GmailSmtpConfig {
    host: string;
    port: number;
    username: string;
    password: string;  // decrypted; caller's responsibility
}

export function createGmailSmtpProvider(config: GmailSmtpConfig): EmailProvider {
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: { user: config.username, pass: config.password },
    });

    return {
        async send(input: SendInput): Promise<SendResult> {
            try {
                const info = await transporter.sendMail({
                    from: `"${input.from.name}" <${input.from.email}>`,
                    to: input.to.name
                        ? `"${input.to.name}" <${input.to.email}>`
                        : input.to.email,
                    subject: input.subject,
                    html: input.html,
                });
                return { messageId: info.messageId, status: "sent" };
            } catch (err) {
                return {
                    status: "failed",
                    error: err instanceof Error ? err.message : "Unknown error",
                };
            }
        },
    };
}
```

### File: `src/lib/email/get-active-provider.ts`

```ts
import { createClient } from "@/lib/supabase/server";
import { getMasterKey } from "./smtp-credential";
import { createGmailSmtpProvider } from "./providers/gmail-smtp-provider";
import type { EmailProvider } from "./provider";

/** Server-only: load active provider config + decrypted password,
 *  return provider instance. Throws if not enabled or misconfigured. */
export async function getActiveEmailProvider(): Promise<{
    provider: EmailProvider;
    sender: { email: string; name: string };
    minIntervalSeconds: number;
}> {
    const supabase = await createClient();
    const { data: cfg } = await supabase
        .from("email_provider_config").select("*").single();
    if (!cfg?.enabled) throw new Error("Email sending is disabled");
    if (cfg.provider_type !== "gmail_smtp") {
        throw new Error(`Unsupported provider: ${cfg.provider_type}`);
    }

    const { data: pw } = await supabase.rpc("decrypt_smtp_password", {
        master_key: getMasterKey(),
    });
    if (!pw) throw new Error("SMTP password not configured");

    return {
        provider: createGmailSmtpProvider({
            host: cfg.smtp_host!,
            port: cfg.smtp_port!,
            username: cfg.smtp_username!,
            password: pw as string,
        }),
        sender: { email: cfg.sender_email, name: cfg.sender_name },
        minIntervalSeconds: cfg.min_interval_seconds,
    };
}
```

### API: `src/app/api/emails/send/route.ts`

```ts
// 1. Auth: 5 roles (return 401/403)
// 2. Validate body
// 3. Fetch template by (type, locale)
// 4. Rate-limit check via email_logs query
// 5. Render subject + body via renderTemplate
// 6. INSERT email_logs (status='pending', sent_by=user.id) → log_id
// 7. Try { getActiveEmailProvider().send(...) } catch network errors
// 8. UPDATE email_logs SET status, error_message WHERE id=log_id
// 9. Return { success, log_id, error? }
```

## Related Code Files

**Create:**
- `src/lib/email/provider.ts` (interface)
- `src/lib/email/providers/gmail-smtp-provider.ts`
- `src/lib/email/get-active-provider.ts`
- `src/app/api/emails/send/route.ts`

**Modify:**
- `src/lib/email/smtp-credential.ts` (Phase 2) — refactor decrypt helper if needed

## Implementation Steps

1. Branch from phase-04
2. Create provider interface
3. Create gmail-smtp-provider.ts (wraps nodemailer)
4. Create get-active-provider.ts
5. Create POST /api/emails/send with full flow
6. Wire compose page Send button to actually call this API
7. Manual: send test email → arrives at recipient inbox
8. Manual: check email_logs row created with status='sent'
9. Manual: trigger failure (bad smtp creds) → log status='failed'
10. Manual: rate-limit → second send within interval returns 429

## Todo List

- [x] Branch from phase-04
- [x] Create provider.ts interface
- [x] Create gmail-smtp-provider.ts
- [x] Create get-active-provider.ts
- [x] Create POST /api/emails/send
- [x] Render template via renderTemplate
- [x] Insert email_logs (pending) → update post-send
- [x] Rate-limit check via min_interval_seconds
- [x] Wire Send button in compose page (Phase 4 placeholder → actual)
- [ ] Manual: send arrives + log status=sent
- [ ] Manual: bad creds → status=failed + error_message
- [ ] Manual: rate-limit returns 429
- [ ] Manual: hr can send; admin can send
- [x] Compile passes
- [x] Commit + push

## Success Criteria

- Send actually delivers via Gmail SMTP
- email_logs row reflects sent/failed status correctly
- Rate-limit enforced
- Provider abstraction allows future Resend swap with single file add
- Permission split correct: edit gated to admin/super_admin (Phase 3); send open to 5 roles (Phase 5)

## Risk Assessment

| Risk | L | I | Mitigation |
|------|---|---|------------|
| Gmail App Password rejected (auth fail) | M | H | Surface error_message clearly to UI; admin re-checks SMTP tab |
| Send latency >5s blocks user | M | M | Show "Sending..." state; toast on completion; consider job queue Phase 2 |
| Email_logs.rendered_body grows large (PII + HTML) | M | M | Compress on archive (post-MVP cron); GDPR keep-forever per dep #5 |
| Variable substitution allows HTML injection via input | M | H | Escape values before substitution in render-template.ts |

## Next Steps

Phase 6 — Logs page + nav-config additions + permission gates.
