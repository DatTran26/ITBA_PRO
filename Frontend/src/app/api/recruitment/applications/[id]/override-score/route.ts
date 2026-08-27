import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!ctx.isHr && !ctx.isInterviewer && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { finalScore: unknown; overrideReason: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { finalScore, overrideReason } = body;

  if (
    typeof finalScore !== "number" ||
    finalScore < 0 ||
    finalScore > 100 ||
    !Number.isFinite(finalScore)
  ) {
    return NextResponse.json(
      { error: "finalScore must be a number between 0 and 100" },
      { status: 400 }
    );
  }

  if (
    typeof overrideReason !== "string" ||
    overrideReason.trim().length < 10
  ) {
    return NextResponse.json(
      { error: "overrideReason must be at least 10 characters" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    const { data: app, error: appError } = await admin
      .from("job_applications")
      .select("id, current_screening_id")
      .eq("id", id)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!app.current_screening_id) {
      return NextResponse.json({ error: "No screening found for this application" }, { status: 404 });
    }

    const { error: updateError } = await admin
      .from("candidate_screenings")
      .update({
        final_score: finalScore,
        is_overridden: true,
        override_reason: overrideReason.trim(),
        overridden_by: ctx.userId,
        overridden_at: new Date().toISOString(),
      })
      .eq("id", app.current_screening_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update screening" }, { status: 500 });
    }

    await admin.from("activity_logs").insert({
      entity_type: "job_application",
      entity_id: id,
      action: "score_overridden",
      details: { finalScore, overrideReason: overrideReason.trim() },
      actor_id: ctx.userId,
    });

    return NextResponse.json({ success: true, finalScore, isOverridden: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
