import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, isInterviewer, role, userId } = ctx;
  if (!isAdmin && !isHr && !isInterviewer && role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  let query = admin
    .from("interview_schedules")
    .select(`
      id,
      job_application_id,
      interviewer_id,
      scheduled_at,
      duration_minutes,
      timezone,
      recruiter_note,
      status,
      interviewer_status,
      interviewer_proposed_at,
      interviewer_note,
      created_at,
      job_applications (
        id,
        pipeline_status,
        persons ( id, full_name, email ),
        job_descriptions ( id, title, department )
      ),
      interview_results ( id, result, note, submitted_at )
    `)
    .order("scheduled_at", { ascending: true });

  // Interviewers see their own schedules + all unassigned (open) slots they can claim
  if (isInterviewer && !isAdmin) {
    query = query.or(`interviewer_id.eq.${userId},interviewer_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }

  return NextResponse.json({ interviews: data ?? [] });
}
