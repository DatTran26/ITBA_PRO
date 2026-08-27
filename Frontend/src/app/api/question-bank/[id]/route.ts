import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { supabase, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { question_text, option_a, option_b, option_c, option_d, correct_answer, level, explanation, points, time_limit, topic_tag, source_ref } = body;

    if (correct_answer && !["a", "b", "c", "d"].includes(correct_answer)) {
      return NextResponse.json({ error: "correct_answer must be a, b, c, or d" }, { status: 400 });
    }
    if (level && !["junior", "middle", "senior"].includes(level)) {
      return NextResponse.json({ error: "level must be junior, middle, or senior" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (option_a !== undefined) updatePayload.option_a = option_a;
    if (option_b !== undefined) updatePayload.option_b = option_b;
    if (option_c !== undefined) updatePayload.option_c = option_c;
    if (option_d !== undefined) updatePayload.option_d = option_d;
    if (correct_answer !== undefined) updatePayload.correct_answer = correct_answer;
    if (level !== undefined) updatePayload.level = level;
    if (explanation !== undefined) updatePayload.explanation = explanation;
    if (points !== undefined) updatePayload.points = points;
    if (time_limit !== undefined) updatePayload.time_limit = time_limit;
    if (topic_tag !== undefined) updatePayload.topic_tag = topic_tag;
    if (source_ref !== undefined) updatePayload.source_ref = source_ref;

    if (question_text !== undefined) {
      updatePayload.question_text = question_text;
      updatePayload.question_hash = createHash("sha256")
        .update(question_text.trim().toLowerCase())
        .digest("hex");
    }

    const { data, error } = await supabase
      .from("question_bank")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Duplicate question detected", code: "DUPLICATE" }, { status: 409 });
      }
      throw error;
    }
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { supabase, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { error } = await supabase
      .from("question_bank")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
