import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { getMasterKey, readSmtpConfigPublic } from "@/lib/email/smtp-credential";

export async function GET() {
    try {
        const config = await readSmtpConfigPublic();
        return NextResponse.json(config);
    } catch {
        return NextResponse.json({ error: "Failed to read config" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
        enabled,
        provider_type,
        sender_email,
        sender_name,
        smtp_host,
        smtp_port,
        smtp_username,
        smtp_password,
        min_interval_seconds,
    } = body;

    const updatePayload: Record<string, unknown> = {
        enabled,
        provider_type,
        sender_email,
        sender_name,
        smtp_host,
        smtp_port,
        smtp_username,
        min_interval_seconds,
        updated_by: ctx.userId,
        updated_at: new Date().toISOString(),
    };

    // Encrypt password only if a new one was provided
    if (smtp_password && typeof smtp_password === "string" && smtp_password.trim()) {
        const masterKey = getMasterKey();
        const { data: encrypted, error: encErr } = await ctx.supabase.rpc("encrypt_smtp_password", {
            plaintext: smtp_password.trim(),
            master_key: masterKey,
        });
        if (encErr) return NextResponse.json({ error: "Encryption failed" }, { status: 500 });
        updatePayload.smtp_password_encrypted = encrypted;
    }

    const { error } = await ctx.supabase
        .from("email_provider_config")
        .update(updatePayload)
        .not("id", "is", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const updated = await readSmtpConfigPublic();
    return NextResponse.json(updated);
}
