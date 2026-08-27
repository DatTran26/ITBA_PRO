import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

type RespondAction = 'accept' | 'decline' | 'reschedule';

export async function PATCH(
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
  const action: RespondAction = body?.action;
  const proposed_at: string | undefined = body?.proposed_at;
  const note: string | undefined = body?.note;

  if (!['accept', 'decline', 'reschedule'].includes(action)) {
    return NextResponse.json({ error: "action must be accept | decline | reschedule" }, { status: 400 });
  }

  if (action === 'reschedule' && !proposed_at) {
    return NextResponse.json({ error: "proposed_at required for reschedule" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: schedule, error: schedErr } = await admin
    .from("interview_schedules")
    .select("id, interviewer_id, interviewer_status, status")
    .eq("id", id)
    .single();

  if (schedErr || !schedule) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const isUnassigned = !schedule.interviewer_id;

  // Unassigned slot: any interviewer can claim by accepting
  // Assigned slot: only the assigned interviewer (or admin) can respond
  if (!isAdmin && !isUnassigned && schedule.interviewer_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent claiming an already-assigned slot
  if (!isAdmin && isUnassigned && action !== 'accept') {
    return NextResponse.json({ error: "Unassigned slots can only be accepted (claimed)" }, { status: 422 });
  }

  if (schedule.status !== 'scheduled') {
    return NextResponse.json({ error: "Cannot respond to a completed or cancelled interview" }, { status: 422 });
  }

  const statusMap: Record<RespondAction, string> = {
    accept: 'accepted',
    decline: 'declined',
    reschedule: 'reschedule_requested',
  };

  const updatePayload: Record<string, unknown> = {
    interviewer_status: statusMap[action],
    interviewer_note: note ?? null,
    interviewer_proposed_at: action === 'reschedule' ? proposed_at : null,
  };

  // Claim the slot: set interviewer_id when accepting an unassigned schedule
  if (isUnassigned && action === 'accept') {
    updatePayload.interviewer_id = userId;
  }

  const { error: updateError } = await admin
    .from("interview_schedules")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true, interviewer_status: statusMap[action] });
}
