import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canTransition } from "@/lib/recruitment/state-machine";
import { logStatusChange } from "@/lib/recruitment/pipeline-helpers";
import type { PipelineStatus } from "@/types/recruitment";

type OfferAction = "make_offer" | "accept" | "reject" | "onboard";

const ACTION_TO_STATUS: Record<OfferAction, PipelineStatus> = {
  make_offer: "OFFERED",
  accept: "ACCEPTED",
  reject: "OFFER_REJECTED",
  onboard: "ONBOARDED",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, role, userId } = ctx;
  if (!isAdmin && role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action: OfferAction = body?.action;
  const note: string | undefined = body?.note;
  const joinedDate: string | undefined = body?.joined_date;

  if (!action || !(action in ACTION_TO_STATUS)) {
    return NextResponse.json(
      { error: "action must be one of: make_offer, accept, reject, onboard" },
      { status: 400 }
    );
  }

  if (action === "onboard" && !joinedDate) {
    return NextResponse.json({ error: "joined_date is required for onboard" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: application, error: appError } = await admin
    .from("job_applications")
    .select("id, pipeline_status, person_id")
    .eq("id", id)
    .single();

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const toStatus = ACTION_TO_STATUS[action];
  if (!canTransition(application.pipeline_status, toStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${application.pipeline_status} to ${toStatus}` },
      { status: 422 }
    );
  }

  // Update application status
  const { error: updateError } = await admin
    .from("job_applications")
    .update({ pipeline_status: toStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }

  await logStatusChange({
    jobApplicationId: id,
    fromStatus: application.pipeline_status,
    toStatus,
    changedBy: userId,
    note,
  });

  // Onboard side-effect: update persons row
  if (action === "onboard" && application.person_id) {
    await admin
      .from("persons")
      .update({
        type: "employee",
        status: "active",
        joined_date: joinedDate,
        source: "both",
      })
      .eq("id", application.person_id);
  }

  return NextResponse.json({ success: true, pipelineStatus: toStatus });
}
