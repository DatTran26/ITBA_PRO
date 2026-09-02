import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEmailProvider } from "@/lib/email/get-active-provider";
import { sendOne } from "@/lib/email/send-one";

const ALLOWED_ROLES = ["admin", "super_admin", "hr", "interviewer", "recruiter"];

interface SendBody {
    templateId: string;
    recipientEmail?: string;
    recipientName?: string;
    recipientId?: string;
    recipientSource?: string;
    variables?: Record<string, string>;
    locale?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

async function resolveRecipient(
    body: SendBody
): Promise<{ id: string; email: string; name: string } | null> {
    if (body.recipientEmail) {
        return { id: "", email: body.recipientEmail, name: body.recipientName ?? "" };
    }
    if (body.recipientId) {
        const admin = createAdminClient();
        const table = body.recipientSource === "users" ? "users" : "persons";
        const nameCol = table === "persons" ? "full_name" : "name";
        const { data } = await admin
            .from(table)
            .select(`email, ${nameCol}`)
            .eq("id", body.recipientId)
            .single();
        const resolved = data as
            | { email: string | null; name?: string | null; full_name?: string | null }
            | null;

        if (!resolved?.email) return null;

        return {
            id: body.recipientId,
            email: resolved.email,
            name: table === "persons" ? (resolved.full_name ?? "") : (resolved.name ?? ""),
        };
    }
    return null;
}

export async function POST(req: NextRequest) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ALLOWED_ROLES.includes(ctx.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: SendBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.templateId) {
        return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const recipient = await resolveRecipient(body);
    if (!recipient?.email) {
        return NextResponse.json({ error: "Recipient email could not be resolved" }, { status: 400 });
    }

    const { data: templateRow, error: tplErr } = await ctx.supabase
        .from("email_templates")
        .select("id, type, locale, subject, body_html")
        .eq("id", body.templateId)
        .single();

    const template = templateRow ? { ...templateRow, template_type: templateRow.type } : null;

    if (tplErr || !template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    let providerCtx: Awaited<ReturnType<typeof getActiveEmailProvider>>;
    try {
        providerCtx = await getActiveEmailProvider();
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Email provider not available" },
            { status: 400 }
        );
    }

    // Rate-limit check
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

    const result = await sendOne({
        supabase: ctx.supabase,
        provider: providerCtx,
        template,
        recipient,
        variables: body.variables ?? {},
        sentBy: ctx.userId,
        relatedEntityType: body.relatedEntityType,
        relatedEntityId: body.relatedEntityId,
    });

    if (!result.ok) {
        return NextResponse.json(
            { success: false, log_id: result.logId, error: result.error },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true, log_id: result.logId });
}
