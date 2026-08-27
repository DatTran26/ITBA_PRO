import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canTransition, getAllowedTransitions } from "@/lib/recruitment/state-machine";
import { logStatusChange } from "@/lib/recruitment/pipeline-helpers";
import type { PipelineStatus } from "@/types/recruitment";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, isInterviewer, role, userId } = ctx;
  if (!isAdmin && !isHr && !isInterviewer && role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const toStatus: PipelineStatus = body?.toStatus;
  const note: string | undefined = body?.note;

  if (!toStatus) {
    return NextResponse.json({ error: "toStatus is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: application, error } = await admin
    .from("job_applications")
    .select("pipeline_status")
    .eq("id", id)
    .single();

  if (error || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const current = application.pipeline_status as PipelineStatus;

  if (!canTransition(current, toStatus)) {
    return NextResponse.json(
      { error: "Invalid transition", allowedTransitions: getAllowedTransitions(current) },
      { status: 422 }
    );
  }

  const { error: updateError } = await admin
    .from("job_applications")
    .update({ pipeline_status: toStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  await logStatusChange({ jobApplicationId: id, fromStatus: current, toStatus, changedBy: userId, note });

  return NextResponse.json({ success: true, pipelineStatus: toStatus });
}
