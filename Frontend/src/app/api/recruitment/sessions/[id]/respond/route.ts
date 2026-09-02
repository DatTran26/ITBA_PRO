import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

type SessionRespondAction = "accept" | "decline";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const body = await req.json().catch(() => null) as { action?: SessionRespondAction; note?: string } | null;
  const action = body?.action;

  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "action must be accept or decline" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("interview_sessions")
    .select("scheduled_at")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (new Date(session.scheduled_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Cannot respond to a past interview session" }, { status: 422 });
  }

  const { data: assignment, error: assignmentError } = await admin
    .from("interview_session_interviewers")
    .select("id, interviewer_id, status")
    .eq("session_id", sessionId)
    .eq("interviewer_id", ctx.userId)
    .single();

  if (assignmentError || !assignment) {
    return NextResponse.json({ error: "Session assignment not found" }, { status: 404 });
  }

  if (assignment.status !== "pending") {
    return NextResponse.json({ error: `Session already ${assignment.status}` }, { status: 422 });
  }

  const status = action === "accept" ? "accepted" : "declined";
  const { error: updateError } = await admin
    .from("interview_session_interviewers")
    .update({ status, note: body?.note ?? null, responded_at: new Date().toISOString() })
    .eq("id", assignment.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await admin
    .from("interview_schedules")
    .update({ interviewer_status: status })
    .eq("session_id", sessionId)
    .eq("interviewer_id", ctx.userId);

  return NextResponse.json({ success: true, status });
}
