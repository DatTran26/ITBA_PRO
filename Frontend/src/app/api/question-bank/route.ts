export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { supabase } = ctx;
  const { searchParams } = new URL(request.url);

  if (searchParams.get("distinct") === "topics") {
    try {
      const { data, error } = await supabase
        .from("question_bank")
        .select("topic_tag")
        .not("topic_tag", "is", null)
        .order("topic_tag");
      if (error) throw error;
      const topics = [...new Set((data ?? []).map((r) => r.topic_tag as string))].sort();
      return NextResponse.json({ topics });
    } catch {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  const level = searchParams.get("level");
  const topic = searchParams.get("topic");
  const q = searchParams.get("q");
  const skillId = searchParams.get("skillId");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("question_bank")
      .select("id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, time_limit, level, topic_tag, question_type, answer_payload, metadata, grading_mode, document_source_id, source_ref, skill_id, created_at, created_by", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (level) query = query.eq("level", level);
    if (topic) query = query.eq("topic_tag", topic);
    if (q) query = query.ilike("question_text", `%${q}%`);
    if (skillId) query = query.eq("skill_id", skillId);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { question_text, option_a, option_b, option_c, option_d, correct_answer, level, explanation, points, time_limit, topic_tag, source_ref, skill_id = null, question_type = "single_choice", answer_payload = {}, metadata = {}, grading_mode = "auto" } = body;

    if (!question_text || !level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (correct_answer && !["a", "b", "c", "d"].includes(correct_answer)) {
      return NextResponse.json({ error: "correct_answer must be a, b, c, or d" }, { status: 400 });
    }
    if (!["junior", "middle", "senior"].includes(level)) {
      return NextResponse.json({ error: "level must be junior, middle, or senior" }, { status: 400 });
    }

    const question_hash = createHash("sha256")
      .update(question_text.trim().toLowerCase())
      .digest("hex");

    const { data, error } = await supabase
      .from("question_bank")
      .insert({
        question_text,
        question_hash,
        question_type,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        answer_payload,
        metadata,
        grading_mode,
        level,
        explanation: explanation ?? null,
        points: points ?? 1,
        time_limit: time_limit ?? 60,
        topic_tag: topic_tag ?? null,
        source_ref: source_ref ?? null,
        skill_id: skill_id ?? null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Duplicate question detected", code: "DUPLICATE" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
