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

    const { searchParams } = req.nextUrl;
    const sessionId = searchParams.get("sessionId");
    const type = searchParams.get("type");

    if (!sessionId) {
        return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (type !== "schedule_interview" && type !== "interview_reminder") {
        return NextResponse.json({ error: "type must be schedule_interview or interview_reminder" }, { status: 400 });
    }

    const admin = createAdminClient();

    if (type === "schedule_interview") {
        // Check prior sends for this session
        const { count: priorCount } = await admin
            .from("email_logs")
            .select("id", { count: "exact", head: true })
            .eq("template_type", "schedule_interview")
            .eq("related_entity_type", "interview_session")
            .eq("related_entity_id", sessionId)
            .eq("status", "sent");

        const isResend = (priorCount ?? 0) > 0;

        // Fetch schedules with candidate info
        let query = admin
            .from("interview_schedules")
            .select(`
                id,
                candidate_confirmation,
                job_applications(
                    persons(id, full_name, email)
                )
            `)
            .eq("session_id", sessionId);

        if (isResend) {
            query = query.eq("candidate_confirmation", "pending");
        }

        const { data: schedules, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        type PersonRow = { id: string; full_name: string; email: string };
        type AppRow = { persons: PersonRow | PersonRow[] | null };

        const recipients = (schedules ?? []).flatMap((s) => {
            const app = Array.isArray(s.job_applications)
                ? (s.job_applications[0] as AppRow | undefined)
                : (s.job_applications as AppRow | null);
            if (!app) return [];
            const person = Array.isArray(app.persons)
                ? (app.persons[0] ?? null)
                : app.persons;
            if (!person?.email) return [];
            return [{ id: person.id, name: person.full_name, email: person.email }];
        });

        return NextResponse.json({
            recipients,
            mode: isResend ? "resend" : "first_send",
        });
    }

    // interview_reminder — fetch interviewer(s) from schedules
    const { data: schedules, error: schedErr } = await admin
        .from("interview_schedules")
        .select("interviewer_id, users:interviewer_id(id, name, email)")
        .eq("session_id", sessionId)
        .not("interviewer_id", "is", null);

    if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 500 });

    type UserRow = { id: string; name: string; email: string };

    const seen = new Set<string>();
    const recipients: UserRow[] = [];

    for (const s of schedules ?? []) {
        const u = Array.isArray(s.users)
            ? (s.users[0] as UserRow | undefined)
            : (s.users as UserRow | null);
        if (!u?.id || seen.has(u.id)) continue;
        seen.add(u.id);
        recipients.push({ id: u.id, name: u.name, email: u.email });
    }

    return NextResponse.json({ recipients, mode: "first_send" });
}
