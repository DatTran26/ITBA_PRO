import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEmailProvider } from "@/lib/email/get-active-provider";
import { sendOne } from "@/lib/email/send-one";

const ALLOWED_ROLES = ["admin", "super_admin", "hr", "interviewer", "recruiter"];
const BULK_ALLOWED_TYPES = ["schedule_interview", "interview_reminder"];
const MAX_RECIPIENTS = 50;

interface BulkRecipient {
    id: string;
    source: "persons" | "users";
}

interface SendBulkBody {
    templateId: string;
    recipients: BulkRecipient[];
    sharedVariables?: Record<string, string>;
    locale?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

interface FailedEntry {
    id: string;
    email?: string;
    error: string;
}

export async function POST(req: NextRequest) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ALLOWED_ROLES.includes(ctx.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: SendBulkBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { templateId, recipients, sharedVariables = {}, locale = "vi", relatedEntityType, relatedEntityId } = body;

    if (!templateId) {
        return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json({ error: "recipients must be a non-empty array" }, { status: 400 });
    }
    if (recipients.length > MAX_RECIPIENTS) {
        return NextResponse.json({ error: `Max ${MAX_RECIPIENTS} recipients per bulk send` }, { status: 400 });
    }

    // Fetch + validate template type
    const { data: templateRow, error: tplErr } = await ctx.supabase
        .from("email_templates")
        .select("id, type, locale, subject, body_html")
        .eq("id", templateId)
        .single();

    if (tplErr || !templateRow) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const template = { ...templateRow, template_type: templateRow.type };
    if (!BULK_ALLOWED_TYPES.includes(template.template_type)) {
        return NextResponse.json(
            { error: `Bulk send not allowed for template type '${template.template_type}'` },
            { status: 400 }
        );
    }

    // Load provider once
    let providerCtx: Awaited<ReturnType<typeof getActiveEmailProvider>>;
    try {
        providerCtx = await getActiveEmailProvider();
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Email provider not available" },
            { status: 400 }
        );
    }

    // Single rate-limit check for the batch
    const intervalSecs = providerCtx.minIntervalSeconds;
    const { count } = await ctx.supabase
        .from("email_logs")
        .select("id", { count: "exact", head: true })
        .eq("sent_by", ctx.userId)
        .eq("status", "sent")
        .gte("sent_at", new Date(Date.now() - intervalSecs * 1000).toISOString());

    if ((count ?? 0) > 0) {
        return NextResponse.json(
            { error: `Rate limit: wait ${intervalSecs}s between sends` },
            { status: 429 }
        );
    }

    const batchId = crypto.randomUUID();
    const failed: FailedEntry[] = [];
    let sent = 0;
    const admin = createAdminClient();

    for (const rec of recipients) {
        // Use admin client to bypass persons RLS (created_by restriction)
        const table = rec.source === "users" ? "users" : "persons";
        const nameCol = rec.source === "persons" ? "full_name" : "name";
        const { data } = await admin
            .from(table)
            .select(`id, email, ${nameCol}`)
            .eq("id", rec.id)
            .single();

        const resolved = data as
            | { id: string; email: string | null; name?: string | null; full_name?: string | null }
            | null;

        if (!resolved?.email) {
            failed.push({ id: rec.id, error: "Could not resolve recipient" });
            continue;
        }

        const name = rec.source === "persons"
            ? (resolved.full_name ?? "")
            : (resolved.name ?? "");
        const email = resolved.email;

        // Merge variables: inject the correct name variable per template type
        const nameVar = rec.source === "persons" ? "candidate_name" : "interviewer_name";
        const variables: Record<string, string> = { ...sharedVariables, [nameVar]: name };

        const result = await sendOne({
            supabase: ctx.supabase,
            provider: providerCtx,
            template,
            recipient: { id: rec.id, name, email },
            variables,
            sentBy: ctx.userId,
            batchId,
            relatedEntityType,
            relatedEntityId,
        });

        if (result.ok) {
            sent++;
        } else {
            failed.push({ id: rec.id, email, error: result.error });
        }

        // Throttle between sends
        await new Promise((r) => setTimeout(r, 100));
    }

    return NextResponse.json({ sent, failed });
}
