import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr && !ctx.isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const admin = createAdminClient();

  if (ctx.isInterviewer && !ctx.isAdmin && !ctx.isHr) {
    const { count } = await admin
      .from("interview_session_interviewers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("interviewer_id", ctx.userId)
      .eq("status", "accepted");

    if (!count) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: session, error: sessionError } = await admin
    .from("interview_sessions")
    .select(`
      id, round, scheduled_at, duration_minutes, location_type, location_detail, recruiter_note, test_id,
      recording_url, transcript, ai_summary,
      job_descriptions(id, title),
      tests(id, title, job_role, share_token, status, time_limit_minutes)
    `)
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Generate a signed URL for recording if it exists
  let signedRecordingUrl: string | null = null;
  if (session.recording_url) {
    const { data: signedData } = await admin.storage
      .from("interview-recordings")
      .createSignedUrl(session.recording_url, 3600); // 1 hour expiry
    signedRecordingUrl = signedData?.signedUrl || null;
  }

  const { data: schedules, error: schedulesError } = await admin
    .from("interview_schedules")
    .select(`
      id, job_application_id, candidate_confirmation, status, scheduled_at,
      job_applications(
        id, pipeline_status,
        persons(id, full_name, email),
        candidate_screenings!candidate_screenings_job_application_id_fkey(final_score, ai_score, summary, strengths_json, weaknesses_json)
      )
    `)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (schedulesError) return NextResponse.json({ error: schedulesError.message }, { status: 500 });

  const personIds = (schedules ?? [])
    .map((row) => {
      const appRaw = row.job_applications as { persons?: { id?: string } | { id?: string }[] } | { persons?: { id?: string } | { id?: string }[] }[] | null;
      const appObj = Array.isArray(appRaw) ? (appRaw[0] ?? null) : appRaw;
      const personsRaw = appObj?.persons ?? null;
      const personObj = Array.isArray(personsRaw) ? (personsRaw[0] ?? null) : personsRaw;
      return personObj?.id ?? null;
    })
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  let resultsByPerson = new Map<string, unknown[]>();
  if (session.test_id && personIds.length > 0) {
    const { data: results } = await admin
      .from("results")
      .select("id, person_id, test_id, score, total_questions, status, submitted_at")
      .eq("test_id", session.test_id)
      .in("person_id", personIds);

    resultsByPerson = (results ?? []).reduce((map, result) => {
      const current = map.get(result.person_id) ?? [];
      current.push(result);
      map.set(result.person_id, current);
      return map;
    }, new Map<string, unknown[]>());
  }

  const enriched = (schedules ?? []).map((row) => {
    const appRaw = row.job_applications as { persons?: { id?: string } | { id?: string }[] } | { persons?: { id?: string } | { id?: string }[] }[] | null;
    const appObj = Array.isArray(appRaw) ? (appRaw[0] ?? null) : appRaw;
    const personsRaw = appObj?.persons ?? null;
    const personObj = Array.isArray(personsRaw) ? (personsRaw[0] ?? null) : personsRaw;
    const personId = personObj?.id;
    const linkedResults = personId ? (resultsByPerson.get(personId) ?? []) : [];

    return {
      ...row,
      job_applications: appObj
        ? {
            ...appObj,
            results: linkedResults,
          }
        : null,
    };
  });

  return NextResponse.json({
    session: {
      ...session,
      signed_recording_url: signedRecordingUrl
    },
    candidates: enriched
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!ctx.isAdmin && !ctx.isHr && !ctx.isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const admin = createAdminClient();

  // Interviewers can only update sessions they are assigned to
  if (ctx.isInterviewer && !ctx.isAdmin && !ctx.isHr) {
    const { count } = await admin
      .from("interview_session_interviewers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("interviewer_id", ctx.userId)
      .eq("status", "accepted");

    if (!count) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowedFields = ["recruiter_note", "transcript", "ai_summary"];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) update[key] = body[key];
  }

  const { data: updatedSession, error: updateError } = await admin
    .from("interview_sessions")
    .update(update)
    .eq("id", sessionId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ session: updatedSession });
}
