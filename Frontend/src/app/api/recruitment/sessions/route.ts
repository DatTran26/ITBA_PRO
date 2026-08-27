import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr && !ctx.isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Interviewers see sessions they're assigned to at session-level
  let sessionIds: string[] | null = null;
  if (ctx.isInterviewer) {
    const { data: assigned } = await admin
      .from("interview_session_interviewers")
      .select("session_id")
      .eq("interviewer_id", ctx.userId);
    sessionIds = [
      ...new Set(
        (assigned ?? [])
          .map((r) => r.session_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      ),
    ];
    if (sessionIds.length === 0) return NextResponse.json({ sessions: [] });
  }

  let query = admin
    .from("interview_sessions")
    .select(`
      id, job_description_id, round, scheduled_at, duration_minutes,
      location_type, location_detail, recruiter_note, notification_sent_at,
      created_by, created_at, test_id,
      job_descriptions(id, title),
      tests(id, title, job_role, share_token, status),
      interview_session_interviewers(id, interviewer_id, status),
      interview_schedules(id, candidate_confirmation)
    `)
    .order("scheduled_at", { ascending: false });

  if (sessionIds !== null) {
    query = query.in("id", sessionIds);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessions = (data ?? []).map((s) => {
    const schedules = (s.interview_schedules ?? []) as Array<{ id: string; candidate_confirmation: string }>;
    const interviewers = (s.interview_session_interviewers ?? []) as Array<{ id: string; interviewer_id: string; status: string }>;
    return {
      ...s,
      candidate_count: schedules.length,
      confirmed_count: schedules.filter((x) => x.candidate_confirmation === "confirmed").length,
      pending_count: schedules.filter((x) => x.candidate_confirmation === "pending").length,
      declined_count: schedules.filter((x) => x.candidate_confirmation === "declined").length,
      accepted_interviewer_count: interviewers.filter((x) => x.status === "accepted").length,
    };
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    job_description_id?: string;
    round: 1 | 2 | 3;
    scheduled_at: string;
    duration_minutes: number;
    location_type: "online" | "office" | "phone";
    location_detail?: string;
    recruiter_note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.round || !body.scheduled_at || !body.duration_minutes || !body.location_type) {
    return NextResponse.json({ error: "Missing required fields: round, scheduled_at, duration_minutes, location_type" }, { status: 400 });
  }
  if (![1, 2, 3].includes(body.round)) {
    return NextResponse.json({ error: "round must be 1, 2, or 3" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("interview_sessions")
    .insert({
      job_description_id: body.job_description_id ?? null,
      round: body.round,
      scheduled_at: body.scheduled_at,
      duration_minutes: body.duration_minutes,
      location_type: body.location_type,
      location_detail: body.location_detail ?? null,
      recruiter_note: body.recruiter_note ?? null,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}
