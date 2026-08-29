import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { logStatusChange } from "@/lib/recruitment/pipeline-helpers";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  let body: { applicationIds: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { applicationIds } = body;
  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return NextResponse.json({ error: "applicationIds must be a non-empty array" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch session to get scheduled_at
  const { data: session, error: sessionErr } = await admin
    .from("interview_sessions")
    .select("id, scheduled_at, duration_minutes, location_type, location_detail, recruiter_note, round")
    .eq("id", sessionId)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { count: acceptedInterviewerCount, error: acceptedErr } = await admin
    .from("interview_session_interviewers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "accepted");

  if (acceptedErr) {
    return NextResponse.json({ error: acceptedErr.message }, { status: 500 });
  }

  if (!acceptedInterviewerCount || acceptedInterviewerCount < 1) {
    return NextResponse.json(
      { error: "Cannot assign candidates before at least one interviewer accepts this session" },
      { status: 422 }
    );
  }

  // Validate all applications are SHORTLISTED and get their current status
  const { data: applications, error: appErr } = await admin
    .from("job_applications")
    .select("id, pipeline_status")
    .in("id", applicationIds);

  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 });

  const roundLabel = session.round === 3 ? "Final" : `Round ${session.round}`;
  let assigned = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const app of applications ?? []) {
    if (app.pipeline_status !== "SHORTLISTED") {
      skipped++;
      continue;
    }

    // Check if already assigned to this session
    const { count: existingCount } = await admin
      .from("interview_schedules")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("job_application_id", app.id);

    if (existingCount && existingCount > 0) {
      skipped++;
      continue;
    }

    const token = randomUUID();
    const { error: insertErr } = await admin.from("interview_schedules").insert({
      session_id: sessionId,
      job_application_id: app.id,
      scheduled_at: session.scheduled_at,
      timezone: "Asia/Ho_Chi_Minh",
      duration_minutes: session.duration_minutes,
      location_type: session.location_type,
      location_detail: session.location_detail ?? null,
      recruiter_note: session.recruiter_note ?? null,
      interview_round: roundLabel,
      status: "scheduled",
      interviewer_status: "pending",
      candidate_confirmation: "pending",
      confirmation_token: token,
      created_by: ctx.userId,
    });

    if (insertErr) {
      errors.push(`${app.id}: ${insertErr.message}`);
      continue;
    }

    // Transition pipeline status
    await admin
      .from("job_applications")
      .update({ pipeline_status: "INTERVIEW_SCHEDULED" })
      .eq("id", app.id);

    await logStatusChange({
      jobApplicationId: app.id,
      fromStatus: "SHORTLISTED",
      toStatus: "INTERVIEW_SCHEDULED",
      changedBy: ctx.userId,
      note: `Xếp vào ${roundLabel} — session ${sessionId}`,
    });

    assigned++;
  }

  return NextResponse.json({ success: true, assigned, skipped, errors });
}
