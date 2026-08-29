import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr && !ctx.isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: applicationId } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("interview_schedules")
    .select(`
      id, session_id, scheduled_at, timezone, status, interviewer_status,
      candidate_confirmation, candidate_confirmed_at, interview_round,
      duration_minutes, location_type, location_detail, recruiter_note,
      test_link, created_at,
      interview_sessions(id, round),
      interview_results(id, result, note, submitted_at, submitted_by)
    `)
    .eq("job_application_id", applicationId)
    .order("scheduled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ interviews: data ?? [] });
}
