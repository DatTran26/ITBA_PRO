---
phase: 4
title: Compose page + recipient picker + autofill
status: pending
effort: 1.5 day
branch: feat/email-templates/phase-04-compose
depends_on: [phase-03]
---

# Phase 4 — Compose Page

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: decisions #7, #11, dep #3, #4 (standalone route, send permission, autofill, recipient picker)

## Overview

**Priority:** P0
**Description:** `/dashboard/emails` route — main entry for senders. Choose template type → choose recipient (filtered source per type) → optional related entity (job_application/interview) for autofill → variables pre-filled where derivable, manual fill rest → preview rendered → send button.

## Requirements

**Functional:**
- Form steps (single page, no wizard):
  1. Template type dropdown (4 options)
  2. Locale toggle (vi / en)
  3. Recipient picker — filtered by type:
     - `schedule_interview/offer/onboard_confirm` → search `persons` (candidates)
     - `interview_reminder` → search `users WHERE role='interviewer'`
  4. Optional: link to related entity (job_application or interview_schedule) → auto-fill derivable vars
  5. Variable inputs — auto-fill what's available, manual for rest
  6. Subject preview (live, with substitution)
  7. Body preview (iframe sandbox, live render)
  8. "Send" button → confirm modal → POST `/api/emails/send`
- All 5 sender roles can access page

**Non-functional:**
- Recipient picker: debounced search ≤300ms
- Variable autofill: server action returns `{ variables: { key: value } }` keyed by template_type
- Preview re-renders on any field change

## Architecture

### File: `src/lib/email/render-template.ts`

```ts
/** Replace {{ variable }} with values; missing → '<missing>'. */
export function renderTemplate(body: string, variables: Record<string, string>): string {
    return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key) =>
        variables[key] ?? `<${key} missing>`
    );
}
```

### File: `src/lib/email/autofill-variables.ts`

```ts
import { createClient } from "@/lib/supabase/server";
import type { TemplateType } from "./template-variables";

interface AutofillContext {
    senderUserId: string;
    relatedEntityType?: "job_application" | "interview_schedule";
    relatedEntityId?: string;
    locale: "vi" | "en";
}

/** Server-side: derive auto-fillable variables from existing entities.
 *  Variables NOT derivable (salary, start_date, meeting_link, etc.) → empty,
 *  user fills manually on compose page. */
export async function autofillVariables(
    type: TemplateType,
    ctx: AutofillContext,
): Promise<Record<string, string>> {
    const supabase = await createClient();
    const result: Record<string, string> = {};

    // Sender info (current user)
    const { data: sender } = await supabase
        .from("users").select("name, email").eq("id", ctx.senderUserId).single();
    if (sender) {
        result.hr_name = sender.name;
        result.hr_email = sender.email;
    }

    // Company name from system_settings
    const { data: companySetting } = await supabase
        .from("system_settings").select("value").eq("key", "company_name").single();
    result.company_name = (companySetting?.value as string) ?? "ITBA";

    // Entity-derived
    if (ctx.relatedEntityType === "interview_schedule" && ctx.relatedEntityId) {
        const { data: interview } = await supabase
            .from("interview_schedules")
            .select("scheduled_at, timezone, interviewer_id, job_application_id")
            .eq("id", ctx.relatedEntityId).single();

        if (interview) {
            // Format date/time per locale + timezone
            const dt = new Date(interview.scheduled_at);
            result.interview_date = dt.toLocaleDateString(
                ctx.locale === "vi" ? "vi-VN" : "en-US",
                { timeZone: interview.timezone, year: "numeric", month: "long", day: "numeric" },
            );
            result.interview_time = dt.toLocaleTimeString(
                ctx.locale === "vi" ? "vi-VN" : "en-US",
                { timeZone: interview.timezone, hour: "2-digit", minute: "2-digit" },
            );

            // Interviewer name
            const { data: interviewer } = await supabase
                .from("users").select("name").eq("id", interview.interviewer_id).single();
            if (interviewer) {
                result.interviewer_name = interviewer.name;
                result.interviewer_names = interviewer.name;  // single for now
            }

            // Pull candidate + position via job_application
            const { data: app } = await supabase
                .from("job_applications")
                .select("person_id, job_description_id")
                .eq("id", interview.job_application_id).single();

            if (app) {
                const [{ data: person }, { data: jd }] = await Promise.all([
                    supabase.from("persons").select("name").eq("id", app.person_id).single(),
                    supabase.from("job_descriptions").select("title").eq("id", app.job_description_id).single(),
                ]);
                if (person) result.candidate_name = person.name;
                if (jd) result.position_name = jd.title;

                // CV link (signed URL)
                const { data: cv } = await supabase
                    .from("candidate_cvs").select("storage_path")
                    .eq("person_id", app.person_id)
                    .order("uploaded_at", { ascending: false }).limit(1).single();
                if (cv?.storage_path) {
                    const { data: signed } = await supabase.storage
                        .from("cvs").createSignedUrl(cv.storage_path, 60 * 60 * 24 * 7);
                    if (signed?.signedUrl) result.candidate_cv_link = signed.signedUrl;
                }
            }
        }
    }

    if (ctx.relatedEntityType === "job_application" && ctx.relatedEntityId) {
        // Similar mapping for offer/onboard without interview context
        // ...
    }

    return result;
}
```

### Compose UI: `src/app/dashboard/emails/page.tsx` + `compose-client.tsx`

- Page: server component, fetch templates list + user, pass to client
- ComposeClient: form state, recipient search (debounced), autofill button (or auto-fetch on entity-link), preview, send

### API: `/api/emails/recipients`

```
GET /api/emails/recipients?type=schedule_interview&q=tran
  → returns persons matching name/email
GET /api/emails/recipients?type=interview_reminder&q=tran
  → returns users WHERE role='interviewer' matching
```

## Related Code Files

**Create:**
- `src/lib/email/render-template.ts`
- `src/lib/email/autofill-variables.ts`
- `src/app/dashboard/emails/page.tsx`
- `src/app/dashboard/emails/compose-client.tsx`
- `src/app/dashboard/emails/_components/recipient-picker.tsx`
- `src/app/dashboard/emails/_components/variable-fields.tsx`
- `src/app/dashboard/emails/_components/template-preview.tsx`
- `src/app/api/emails/recipients/route.ts`
- `src/app/api/emails/autofill/route.ts` (POST, takes type + context, returns variables)

## Implementation Steps

1. Branch from phase-03
2. Create render-template.ts + autofill-variables.ts
3. Create recipients API + autofill API
4. Create compose page + form
5. Recipient picker with debounced search
6. Variable fields auto-populate on entity link
7. Live preview with substitution
8. Send button (placeholder for now — actual API in Phase 5)
9. Manual: each role can access page; admin/hr/recruiter/interviewer/super_admin OK

## Todo List

- [ ] Branch from phase-03
- [ ] Create render-template.ts
- [ ] Create autofill-variables.ts (entity → vars mapping)
- [ ] GET /api/emails/recipients (filtered by template type)
- [ ] POST /api/emails/autofill
- [ ] Compose page scaffolding
- [ ] Template type dropdown
- [ ] Locale toggle vi/en
- [ ] Recipient picker (debounced)
- [ ] Optional related-entity link
- [ ] Variable fields with autofill
- [ ] Live subject + body preview
- [ ] Send button + confirm modal (calls POST /api/emails/send placeholder)
- [ ] All 5 roles can access (RLS allows SELECT templates)
- [ ] Compile passes
- [ ] Commit + push

## Success Criteria

- Page accessible by all 5 sender roles
- Recipient picker filters source by template type
- Autofill populates derivable variables on entity link
- Preview reflects current form state
- All template types selectable

## Risk Assessment

| Risk | L | I | Mitigation |
|------|---|---|------------|
| Recipient leak across roles | L | H | RLS on `persons` already enforces; `/recipients` API double-checks role |
| Stale autofill (entity changed mid-compose) | M | L | Re-fetch on entity link change; cache invalidation per render |
| Variable values contain HTML (XSS in preview) | M | M | Escape values before substitution in preview; DOMPurify in render |

## Next Steps

Phase 5 — Send API + nodemailer + email_logs writes.
