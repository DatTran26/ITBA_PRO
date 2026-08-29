import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import DOMPurify from "isomorphic-dompurify";
import { findUnknownVariables } from "@/lib/email/template-variables";
import type { TemplateType } from "@/lib/email/template-variables";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabase
        .from("users")
        .select("id, role")
        .eq("auth_id", user.id)
        .single();

    if (!userData || !["admin", "super_admin"].includes(userData.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { subject, body_html } = body as { subject: string; body_html: string };

    if (!subject?.trim() || !body_html?.trim()) {
        return NextResponse.json(
            { error: "Subject and body are required" },
            { status: 400 }
        );
    }

    const sanitized = DOMPurify.sanitize(body_html, {
        USE_PROFILES: { html: true },
    });

    const { data: tmpl } = await supabase
        .from("email_templates")
        .select("type")
        .eq("id", id)
        .single();

    let unknownVars: string[] = [];
    if (tmpl?.type) {
        unknownVars = findUnknownVariables(tmpl.type as TemplateType, sanitized);
    }

    const { error } = await supabase
        .from("email_templates")
        .update({
            subject: subject.trim(),
            body_html: sanitized,
            updated_by: userData.id,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        success: true,
        warnings:
            unknownVars.length > 0
                ? [`Unknown variables: ${unknownVars.join(", ")}`]
                : [],
    });
}
