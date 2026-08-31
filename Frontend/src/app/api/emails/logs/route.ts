import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_ROLES = ["admin", "super_admin", "hr", "interviewer", "recruiter"];

export async function GET(req: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("auth_id", user.id)
        .single();

    if (!userData || !ALLOWED_ROLES.includes(userData.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;
    const offset = (page - 1) * limit;
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const toEmail = searchParams.get("to_email");

    let query = supabase
        .from("email_logs")
        .select(
            "id, template_type, locale, to_email, to_name, subject, status, sent_at, error_message, sent_by, variables",
            { count: "exact" },
        )
        .order("sent_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (type) query = query.eq("template_type", type);
    if (status) query = query.eq("status", status);
    if (toEmail) query = query.ilike("to_email", `%${toEmail}%`);

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ logs: data ?? [], total: count ?? 0, page, limit });
}
