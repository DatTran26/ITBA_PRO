import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageVision } from "@/lib/vision-ai";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json({ error: "decision must be approved or rejected" }, { status: 400 });
  }
  const { data, error } = await createAdminClient()
    .from("violation_alerts")
    .update({
      status: body.decision,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      review_note: typeof body.note === "string" ? body.note.slice(0, 1000) : null,
    })
    .eq("id", id)
    .eq("status", "pending_review")
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Pending alert not found" }, { status: 404 });
  return NextResponse.json({ alert: data });
}
