import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canTransition } from "@/lib/recruitment/state-machine";
import { logStatusChange } from "@/lib/recruitment/pipeline-helpers";
import type { PipelineStatus } from "@/types/recruitment";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, role, userId } = ctx;
  if (!isAdmin && role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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

  if (current !== "REJECTED") {
    return NextResponse.json(
      { error: "Application is not in REJECTED status", currentStatus: current },
      { status: 422 }
    );
  }

  if (!canTransition("REJECTED", "SHORTLISTED")) {
    return NextResponse.json({ error: "Cannot restore application" }, { status: 422 });
  }

  const { error: updateError } = await admin
    .from("job_applications")
    .update({ pipeline_status: "SHORTLISTED", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to restore application" }, { status: 500 });
  }

  await logStatusChange({
    jobApplicationId: id,
    fromStatus: "REJECTED",
    toStatus: "SHORTLISTED",
    changedBy: userId,
  });

  return NextResponse.json({ success: true, pipelineStatus: "SHORTLISTED" });
}
