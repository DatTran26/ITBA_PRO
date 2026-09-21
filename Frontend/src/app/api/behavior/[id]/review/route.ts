import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageVision } from "@/lib/vision-ai";
import { updateViolationAlert, type ViolationStatus } from "@/lib/workplace-local";

const DECISIONS: ViolationStatus[] = ["approved", "rejected", "false_positive", "justified"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  if (!DECISIONS.includes(body.decision)) {
    return NextResponse.json({ error: "decision must be approved, rejected, false_positive, or justified" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.slice(0, 1000) : null;
  const reasonCategory = typeof body.reason_category === "string"
    ? body.reason_category.slice(0, 100)
    : body.decision;
  if (body.decision !== "approved" && (!reasonCategory || !note || note.trim().length < 5)) {
    return NextResponse.json({ error: "Reject, false_positive, and justified reviews require a reason category and note of at least 5 characters" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const local = await updateViolationAlert(id, {
    status: body.decision,
    reviewed_by: ctx.userId,
    reviewed_at: now,
    review_note: note,
    decision_category: reasonCategory,
  });
  if (local) {
    try {
      await createAdminClient()
        .from("violation_alerts")
        .update({
          status: body.decision,
          reviewed_by: ctx.userId,
          reviewed_at: now,
          review_note: note,
        })
        .eq("id", id)
        .eq("status", "pending_review");
    } catch {
      // Local review is enough when Superbase is off.
    }
    return NextResponse.json({ alert: local });
  }

  try {
    const { data, error } = await createAdminClient()
      .from("violation_alerts")
      .update({
        status: body.decision,
        reviewed_by: ctx.userId,
        reviewed_at: now,
        review_note: note,
      })
      .eq("id", id)
      .eq("status", "pending_review")
      .select()
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Pending alert not found" }, { status: 404 });
    return NextResponse.json({ alert: data });
  } catch {
    return NextResponse.json({ error: "Pending alert not found" }, { status: 404 });
  }
}
