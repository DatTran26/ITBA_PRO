import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canTransition } from "@/lib/recruitment/state-machine";
import { logStatusChange } from "@/lib/recruitment/pipeline-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, role, userId } = ctx;
  if (!isAdmin && !["hr", "interviewer"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const {
    interviewer_id,
    scheduled_at,
    timezone,
    recruiter_note,
    duration_minutes,
    location_type,
    location_detail,
    interview_round
  } = body ?? {};

  if (!scheduled_at) {
    return NextResponse.json(
      { error: "scheduled_at is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Validate interviewer only when explicitly provided
  if (interviewer_id) {
    const { data: interviewer } = await admin
      .from("users")
      .select("id, role, is_active")
      .eq("id", interviewer_id)
      .single();

    if (!interviewer || !["interviewer", "admin", "hr"].includes(interviewer.role) || !interviewer.is_active) {
      return NextResponse.json({ error: "Invalid or inactive interviewer" }, { status: 400 });
    }
  }

  // Validate application status
  const { data: application, error: appError } = await admin
    .from("job_applications")
    .select("pipeline_status")
    .eq("id", id)
    .single();

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (!canTransition(application.pipeline_status, "INTERVIEW_SCHEDULED")) {
    return NextResponse.json(
      { error: `Cannot schedule interview from status ${application.pipeline_status}` },
      { status: 422 }
    );
  }

  // Insert schedule
  const { data: schedule, error: scheduleError } = await admin
    .from("interview_schedules")
    .insert({
      job_application_id: id,
      interviewer_id: interviewer_id ?? null,
      scheduled_at,
      timezone: timezone ?? "Asia/Bangkok",
      recruiter_note: recruiter_note ?? null,
      status: "scheduled",
      // pending = waiting for interviewer to accept (assigned or unassigned)
      interviewer_status: "pending",
      created_by: userId,
      duration_minutes: duration_minutes ?? 60,
      location_type: location_type ?? 'online',
      location_detail: location_detail ?? null,
      interview_round: interview_round ?? 'Round 1'
    })
    .select("id")
    .single();

  if (scheduleError || !schedule) {
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }

  // Transition status
  await admin
    .from("job_applications")
    .update({ pipeline_status: "INTERVIEW_SCHEDULED", updated_at: new Date().toISOString() })
    .eq("id", id);

  await logStatusChange({
    jobApplicationId: id,
    fromStatus: application.pipeline_status,
    toStatus: "INTERVIEW_SCHEDULED",
    changedBy: userId,
    note: recruiter_note ?? undefined,
  });

  return NextResponse.json({ success: true, scheduleId: schedule.id }, { status: 201 });
}
