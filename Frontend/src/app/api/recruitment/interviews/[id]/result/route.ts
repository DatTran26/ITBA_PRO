import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { logStatusChange } from "@/lib/recruitment/pipeline-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isInterviewer, userId } = ctx;
  if (!isAdmin && !isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const result: "pass" | "fail" = body?.result;
  const note: string | undefined = body?.note;

  if (result !== "pass" && result !== "fail") {
    return NextResponse.json({ error: "result must be 'pass' or 'fail'" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch schedule with ownership check
  const { data: schedule, error: schedErr } = await admin
    .from("interview_schedules")
    .select("id, interviewer_id, job_application_id, status")
    .eq("id", id)
    .single();

  if (schedErr || !schedule) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  // Interviewer can only submit their own
  if (!isAdmin && schedule.interviewer_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (schedule.status !== "scheduled") {
    return NextResponse.json({ error: "Interview already completed or cancelled" }, { status: 422 });
  }

  // Insert result (unique index prevents double-submission)
  const { error: resultError } = await admin
    .from("interview_results")
    .insert({
      interview_schedule_id: id,
      result,
      note: note ?? null,
      submitted_by: userId,
    });

  if (resultError) {
    if (resultError.code === "23505") {
      return NextResponse.json({ error: "Result already submitted" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to submit result" }, { status: 500 });
  }

  // Mark schedule completed
  await admin
    .from("interview_schedules")
    .update({ status: "completed" })
    .eq("id", id);

  // Auto-transition application: pass → PASSED, fail → FAILED
  const appId = schedule.job_application_id;
  const toStatus = result === "pass" ? "PASSED" : "FAILED";

  const { data: application } = await admin
    .from("job_applications")
    .select("pipeline_status")
    .eq("id", appId)
    .single();

  await admin
    .from("job_applications")
    .update({ pipeline_status: toStatus, updated_at: new Date().toISOString() })
    .eq("id", appId);

  await logStatusChange({
    jobApplicationId: appId,
    fromStatus: application?.pipeline_status ?? "INTERVIEW_SCHEDULED",
    toStatus,
    changedBy: userId,
    note: note ?? undefined,
  });

  return NextResponse.json({ success: true, applicationStatus: toStatus });
}
