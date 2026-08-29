import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

async function verifyResultOwnership(
  supabase: import("@/lib/api/auth-helpers").AuthContext["supabase"],
  resultId: string,
  userId: string,
  isAdmin: boolean
) {
  const { data, error } = await supabase
    .from("results")
    .select("id, test_id, tests(recruiter_id)")
    .eq("id", resultId)
    .single();

  if (error || !data) return false;
  if (isAdmin) return true;
  const recruiterId = (data.tests as unknown as { recruiter_id: string } | null)?.recruiter_id;
  return recruiterId === userId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const allowed = await verifyResultOwnership(supabase, resultId, userId, isAdmin);
    if (!allowed) return NextResponse.json({ error: "Result not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("skill_evaluations")
      .select("*, skills(name, category)")
      .eq("result_id", resultId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
    return NextResponse.json({ evaluations: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const allowed = await verifyResultOwnership(supabase, resultId, userId, isAdmin);
    if (!allowed) return NextResponse.json({ error: "Result not found" }, { status: 404 });

    const body = await request.json();
    const { skill_id, score = 0, status = "not_evaluated", reviewer_comment, ai_insight } = body;

    if (!skill_id) return NextResponse.json({ error: "skill_id is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("skill_evaluations")
      .upsert(
        { result_id: resultId, skill_id, score, status, reviewer_comment, ai_insight, evaluated_by: userId },
        { onConflict: "result_id,skill_id" }
      )
      .select("*, skills(name, category)")
      .single();

    if (error) return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
    return NextResponse.json({ evaluation: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const allowed = await verifyResultOwnership(supabase, resultId, userId, isAdmin);
    if (!allowed) return NextResponse.json({ error: "Result not found" }, { status: 404 });

    const body = await request.json();
    const { evaluation_id, score, status, reviewer_comment, ai_insight } = body;

    if (!evaluation_id) return NextResponse.json({ error: "evaluation_id is required" }, { status: 400 });

    const updateFields: Record<string, unknown> = {};
    if (score !== undefined) updateFields.score = score;
    if (status !== undefined) updateFields.status = status;
    if (reviewer_comment !== undefined) updateFields.reviewer_comment = reviewer_comment;
    if (ai_insight !== undefined) updateFields.ai_insight = ai_insight;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("skill_evaluations")
      .update(updateFields)
      .eq("id", evaluation_id)
      .eq("result_id", resultId)
      .select("*, skills(name, category)")
      .single();

    if (error) return NextResponse.json({ error: "Failed to update evaluation" }, { status: 500 });
    return NextResponse.json({ evaluation: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
