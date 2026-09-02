import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    const { id } = await params;
    const { data, error } = await ctx.supabase
        .from("assessment_templates")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ template: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    const { id } = await params;
    const body = await request.json();

    // Check ownership or admin
    const { data: existing } = await ctx.supabase
        .from("assessment_templates")
        .select("created_by")
        .eq("id", id)
        .single();

    if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    if (existing.created_by !== ctx.userId && !ctx.isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await ctx.supabase
        .from("assessment_templates")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ template: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    const { id } = await params;

    const { data: existing } = await ctx.supabase
        .from("assessment_templates")
        .select("created_by")
        .eq("id", id)
        .single();

    if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    if (existing.created_by !== ctx.userId && !ctx.isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await ctx.supabase
        .from("assessment_templates")
        .delete()
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
