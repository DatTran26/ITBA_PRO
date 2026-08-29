import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr && !ctx.isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Interviewers may only access sessions they're assigned to at session-level
  if (ctx.isInterviewer) {
    const { count } = await admin
      .from("interview_session_interviewers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", id)
      .eq("interviewer_id", ctx.userId);
    if (!count || count === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: session, error } = await admin
    .from("interview_sessions")
    .select(`
      id, job_description_id, round, scheduled_at, duration_minutes,
      location_type, location_detail, recruiter_note, notification_sent_at,
      created_by, created_at, test_id,
      job_descriptions(id, title),
      tests(id, title, job_role, share_token, status, time_limit_minutes),
      interview_session_interviewers(
        id, interviewer_id, status, note, responded_at, assigned_at,
        users!interview_session_interviewers_interviewer_id_fkey(id, name, email)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  let myAssignmentStatus: "pending" | "accepted" | "declined" | null = null;
  if (ctx.isInterviewer) {
    const rows = (session.interview_session_interviewers ?? []) as Array<{ interviewer_id: string; status: "pending" | "accepted" | "declined" }>;
    const mine = rows.find((row) => row.interviewer_id === ctx.userId);
    myAssignmentStatus = mine?.status ?? null;
  }

  const { data: schedules } = await admin
    .from("interview_schedules")
    .select(`
      id, job_application_id, interviewer_id, candidate_confirmation, candidate_confirmed_at,
      confirmation_token, status, interviewer_status, scheduled_at,
      users!interview_schedules_interviewer_id_fkey(id, name),
      job_applications(
        id, pipeline_status,
        persons(id, full_name, email),
        candidate_screenings!candidate_screenings_job_application_id_fkey(final_score, ai_score),
        results(id, score, total_questions, status, submitted_at, tests(id, title))
      )
    `)
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ session, schedules: schedules ?? [], myAssignmentStatus });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowedFields = ["scheduled_at", "duration_minutes", "location_type", "location_detail", "recruiter_note", "test_id"];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) update[key] = body[key];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("interview_sessions")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { count } = await admin
    .from("interview_schedules")
    .select("id", { count: "exact", head: true })
    .eq("session_id", id);

  if (count && count > 0) {
    return NextResponse.json({ error: "Cannot delete session with assigned candidates" }, { status: 409 });
  }

  const { error } = await admin.from("interview_sessions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
