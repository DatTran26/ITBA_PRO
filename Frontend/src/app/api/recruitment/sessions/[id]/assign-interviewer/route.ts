import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.isAdmin && !ctx.isHr) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    let body: { interviewerId?: string | null; interviewerIds?: string[] };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify session exists
    const { data: session } = await admin
        .from("interview_sessions")
        .select("id")
        .eq("id", sessionId)
        .single();

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const requested = Array.isArray(body.interviewerIds)
        ? body.interviewerIds
        : (body.interviewerId ? [body.interviewerId] : []);

    const interviewerIds = [...new Set(requested.filter((value): value is string => typeof value === "string" && value.length > 0))];

    if (interviewerIds.length > 0) {
        const { data: users, error: userError } = await admin
            .from("users")
            .select("id, role, is_active")
            .in("id", interviewerIds);

        if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
        const allowedRoles = new Set(["interviewer", "admin", "hr", "super_admin"]);
        const invalid = (users ?? []).filter((user) => !allowedRoles.has(user.role) || !user.is_active);
        if ((users ?? []).length !== interviewerIds.length || invalid.length > 0) {
            return NextResponse.json({ error: "Invalid or inactive interviewer in selection" }, { status: 400 });
        }
    }

    const { data: existingRows, error: existingErr } = await admin
        .from("interview_session_interviewers")
        .select("interviewer_id")
        .eq("session_id", sessionId);

    if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

    const existingIds = new Set((existingRows ?? []).map((row) => row.interviewer_id as string));
    const requestedIds = new Set(interviewerIds);
    const idsToRemove = [...existingIds].filter((interviewerId) => !requestedIds.has(interviewerId));
    const idsToAdd = interviewerIds.filter((interviewerId) => !existingIds.has(interviewerId));

    if (idsToRemove.length > 0) {
        const { error: deleteErr } = await admin
            .from("interview_session_interviewers")
            .delete()
            .eq("session_id", sessionId)
            .in("interviewer_id", idsToRemove);

        if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    if (idsToAdd.length > 0) {
        const rows = idsToAdd.map((interviewerId) => ({
            session_id: sessionId,
            interviewer_id: interviewerId,
            status: "pending",
            assigned_by: ctx.userId,
        }));

        const { error: insertErr } = await admin
            .from("interview_session_interviewers")
            .insert(rows);

        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const primaryInterviewerId = interviewerIds[0] ?? null;

    const { data: updatedSchedules, error } = await admin
        .from("interview_schedules")
        .update({ interviewer_id: primaryInterviewerId })
        .eq("session_id", sessionId)
        .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, updated: updatedSchedules?.length ?? 0, assignedInterviewers: interviewerIds.length });
}
