import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr && !ctx.isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  let query = admin
    .from("interview_sessions")
    .select(`
      id, round, scheduled_at, duration_minutes, location_type, location_detail, test_id,
      job_descriptions(id, title),
      tests(id, title, job_role, share_token, status),
      interview_session_interviewers!inner(id, interviewer_id, status)
    `)
    .order("scheduled_at", { ascending: true });

  if (ctx.isInterviewer && !ctx.isAdmin && !ctx.isHr) {
    query = query
      .eq("interview_session_interviewers.interviewer_id", ctx.userId)
      .eq("interview_session_interviewers.status", "accepted");
  } else {
    query = query.eq("interview_session_interviewers.status", "accepted");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const uniqueSessions = [...new Map((data ?? []).map((session) => [session.id, session])).values()];

  return NextResponse.json({ sessions: uniqueSessions });
}
