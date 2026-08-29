import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import type { AiQuestion } from "@/components/question-bank/question-bank-types";

export const runtime = "nodejs";

const MANUAL_GRADING_TYPES = new Set(["short_answer", "sql_logic_code", "short_case_study"]);

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as { questions: AiQuestion[]; level_override?: string };
  const { questions, level_override } = body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "questions array required" }, { status: 400 });
  }

  // Verify the document source belongs to this user (or is admin)
  const { data: doc } = await supabase
    .from("document_sources")
    .select("id, created_by, skill_id")
    .eq("id", id)
    .single();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (!isAdmin && !isLeader && doc.created_by !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const toInsert = questions.map((q) => {
    const type = q.question_type ?? "single_choice";
    // correct_answer column is CHAR(1) — only a single a/b/c/d letter fits.
    // For multi-correct, T/F text, matching/ordering/etc, the real answer lives
    // in answer_payload; mirror a primary letter only when it cleanly fits.
    const primaryLetter = normalizeSingleLetter(q, type);
    const payload = mergeAnswerPayload(q, type);
    return {
      question_type: type,
      question_text: q.question_text,
      option_a: q.option_a ?? null,
      option_b: q.option_b ?? null,
      option_c: q.option_c ?? null,
      option_d: q.option_d ?? null,
      correct_answer: primaryLetter,
      answer_payload: payload,
      metadata: q.metadata ?? {},
      grading_mode: q.grading_mode ?? (MANUAL_GRADING_TYPES.has(type) ? "manual" : "auto"),
      explanation: q.explanation ?? null,
      level: normalizeLevel(level_override || q.level),
      topic_tag: q.topic_tag ?? null,
      points: 1,
      time_limit: 60,
      question_hash: createHash("sha256").update(q.question_text.trim().toLowerCase()).digest("hex"),
      document_source_id: id,
      source_ref: q.source_excerpt ?? null,
      skill_id: doc.skill_id ?? null,
      created_by: userId,
    };
  });

  const hashes = toInsert.map((r) => r.question_hash);
  const { data: existing } = await supabase
    .from("question_bank")
    .select("question_hash")
    .in("question_hash", hashes);

  const existingSet = new Set((existing ?? []).map((e) => e.question_hash));
  const newRows = toInsert.filter((r) => !existingSet.has(r.question_hash));
  const duplicates = toInsert.length - newRows.length;

  if (newRows.length === 0) return NextResponse.json({ inserted: 0, duplicates });

  const { error } = await supabase.from("question_bank").insert(newRows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: newRows.length, duplicates });
}

const VALID_LETTERS = new Set(["a", "b", "c", "d"]);

// DB CHECK constraint only allows lowercase junior/middle/senior. Map common AI variants.
function normalizeLevel(raw: string | null | undefined): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "junior" || v === "jr" || v === "entry" || v === "beginner") return "junior";
  if (v === "middle" || v === "mid" || v === "intermediate") return "middle";
  if (v === "senior" || v === "sr" || v === "advanced" || v === "expert") return "senior";
  return "junior"; // safe default — AI sometimes returns blank or unexpected values
}

// CHAR(1) column accepts only a/b/c/d. Anything else (multi-correct array, "true"/"false",
// matching/ordering payloads) must go to NULL — real answer is in answer_payload.
function normalizeSingleLetter(q: AiQuestion, type: string): string | null {
  if (type === "single_choice" || type === "true_false") {
    const raw = q.correct_answer;
    if (typeof raw === "string") {
      const letter = raw.trim().toLowerCase();
      if (VALID_LETTERS.has(letter)) return letter;
      // Map "true"/"false" → a/b for true_false convenience.
      if (type === "true_false") {
        if (letter === "true" || letter === "t" || letter === "1") return "a";
        if (letter === "false" || letter === "f" || letter === "0") return "b";
      }
    }
  }
  return null;
}

// Ensure structured answers always land in answer_payload so consumers (test runner,
// reviewer UI) can rely on it for any non-single-choice type.
function mergeAnswerPayload(q: AiQuestion, type: string): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...(q.answer_payload ?? {}) };
  if (type === "multiple_choice" && payload.correct_answer === undefined) {
    // If AI returned multi-correct as comma string in correct_answer, lift to array.
    const raw = typeof q.correct_answer === "string" ? q.correct_answer : "";
    const letters = raw.split(/[,\s]+/).map((s) => s.toLowerCase()).filter((l) => VALID_LETTERS.has(l));
    if (letters.length) payload.correct_answer = letters;
  }
  if (type === "true_false" && payload.correct_answer === undefined && typeof q.correct_answer === "string") {
    const v = q.correct_answer.trim().toLowerCase();
    if (v === "a" || v === "true" || v === "t" || v === "1") payload.correct_answer = true;
    if (v === "b" || v === "false" || v === "f" || v === "0") payload.correct_answer = false;
  }
  return payload;
}
