import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { readSmtpConfigForSending } from "@/lib/email/smtp-credential";
import nodemailer from "nodemailer";

export async function POST() {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch the admin's email for the test recipient
    const { data: profile } = await ctx.supabase
        .from("users")
        .select("email, name")
        .eq("id", ctx.userId)
        .single();

    if (!profile?.email) {
        return NextResponse.json({ error: "Could not resolve sender profile" }, { status: 400 });
    }

    const config = await readSmtpConfigForSending();

    if (!config.enabled) {
        return NextResponse.json({ error: "SMTP not enabled" }, { status: 400 });
    }
    if (!config.decrypted_password) {
        return NextResponse.json({ error: "SMTP password not configured" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
        host: config.smtp_host ?? "smtp.gmail.com",
        port: config.smtp_port ?? 465,
        secure: (config.smtp_port ?? 465) === 465,
        auth: {
            user: config.smtp_username ?? config.sender_email,
            pass: config.decrypted_password,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"${config.sender_name}" <${config.sender_email}>`,
            to: profile.email,
            subject: "ITBA AI - Test Email",
            html: `<p>This is a test email from <strong>${config.sender_name}</strong>.</p><p>If you received this, your SMTP configuration is working correctly.</p>`,
        });
        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
