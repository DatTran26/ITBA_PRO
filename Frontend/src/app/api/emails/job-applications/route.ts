import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = ["admin", "super_admin", "hr", "interviewer", "recruiter"];

export async function GET(req: NextRequest) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ALLOWED_ROLES.includes(ctx.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json([]);

    const admin = createAdminClient();

    // Resolve matching person IDs first, then join to applications
    const { data: persons } = await admin
        .from("persons")
        .select("id")
        .ilike("full_name", `%${q}%`)
        .limit(20);

    const personIds = (persons ?? []).map((p: { id: string }) => p.id);
    if (personIds.length === 0) return NextResponse.json([]);

    const { data } = await admin
        .from("job_applications")
        .select("id, pipeline_status, persons(full_name), job_descriptions(title)")
        .in("person_id", personIds)
        .limit(10);

    type Row = {
        id: string;
        pipeline_status: string;
        persons: { full_name: string } | { full_name: string }[] | null;
        job_descriptions: { title: string } | { title: string }[] | null;
    };

    return NextResponse.json(
        (data ?? []).map((row: Row) => ({
            id: row.id,
            candidate_name: (Array.isArray(row.persons) ? row.persons[0] : row.persons)?.full_name ?? "",
            position_title: (Array.isArray(row.job_descriptions) ? row.job_descriptions[0] : row.job_descriptions)?.title ?? "",
            pipeline_status: row.pipeline_status,
        }))
    );
}
