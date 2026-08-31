import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { NextResponse } from "next/server";

export async function GET() {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    const { supabase } = ctx;
    const { data, error } = await supabase
        .from("assessment_templates")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ templates: data });
}

export async function POST(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    const body = await request.json();
    const { name, job_role, level, question_count, time_limit, target_type, job_description, test_description, description } = body;

    if (!name || !job_role || !level) {
        return NextResponse.json({ error: "Name, job_role, and level are required" }, { status: 400 });
    }

    const { data, error } = await ctx.supabase
        .from("assessment_templates")
        .insert({
            name,
            description: description || null,
            job_role,
            level,
            question_count: question_count || 10,
            time_limit: time_limit || 30,
            target_type: target_type || "candidate",
            job_description: job_description || null,
            test_description: test_description || null,
            is_global: ctx.isAdmin,
            created_by: ctx.userId,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ template: data }, { status: 201 });
}
