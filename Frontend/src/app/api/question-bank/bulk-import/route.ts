import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { read, utils } from "xlsx";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

const VALID_ANSWERS = new Set(["a", "b", "c", "d"]);
const VALID_LEVELS = new Set(["junior", "middle", "senior"]);
const MAX_ROWS = 500;
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

interface ParsedRow {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  level: string;
  explanation?: string;
  points?: number;
  time_limit?: number;
  topic_tag?: string;
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 2 MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `File exceeds ${MAX_ROWS} row limit` }, { status: 400 });
    }

    const inserted: number[] = [];
    const duplicates: { row: number; question_text: string }[] = [];
    const errors: { row: number; reason: string }[] = [];
    const toInsert: (ParsedRow & { question_hash: string; row: number })[] = [];

    // Parse + validate each row
    rows.forEach((raw, i) => {
      const rowNum = i + 2; // 1-indexed + header
      const r = (k: string) => String(raw[k] ?? "").trim();

      const question_text = r("question_text");
      const option_a = r("option_a");
      const option_b = r("option_b");
      const option_c = r("option_c");
      const option_d = r("option_d");
      const correct_answer = r("correct_answer").toLowerCase();
      const level = r("level").toLowerCase();

      if (!question_text || !option_a || !option_b || !option_c || !option_d) {
        errors.push({ row: rowNum, reason: "Missing required fields" });
        return;
      }
      if (!VALID_ANSWERS.has(correct_answer)) {
        errors.push({ row: rowNum, reason: `Invalid correct_answer: "${correct_answer}"` });
        return;
      }
      if (!VALID_LEVELS.has(level)) {
        errors.push({ row: rowNum, reason: `Invalid level: "${level}"` });
        return;
      }

      const question_hash = createHash("sha256")
        .update(question_text.toLowerCase())
        .digest("hex");

      toInsert.push({
        row: rowNum,
        question_text,
        question_hash,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        level,
        explanation: r("explanation") || undefined,
        points: raw["points"] ? Number(raw["points"]) : 1,
        time_limit: raw["time_limit"] ? Number(raw["time_limit"]) : 60,
        topic_tag: r("topic_tag") || undefined,
      });
    });

    if (toInsert.length === 0) {
      return NextResponse.json({ inserted: [], duplicates, errors });
    }

    // Batch check existing hashes
    const hashes = toInsert.map((r) => r.question_hash);
    const { data: existing } = await supabase
      .from("question_bank")
      .select("question_hash")
      .in("question_hash", hashes);

    const existingSet = new Set((existing ?? []).map((e) => e.question_hash));

    const newRows = toInsert.filter((r) => {
      if (existingSet.has(r.question_hash)) {
        duplicates.push({ row: r.row, question_text: r.question_text });
        return false;
      }
      return true;
    });

    if (newRows.length > 0) {
      const { data: insertedRows, error: insertError } = await supabase
        .from("question_bank")
        .insert(
          newRows.map(({ row: _row, ...rest }) => ({ ...rest, created_by: userId }))
        )
        .select("id");

      if (insertError) throw insertError;
      (insertedRows ?? []).forEach((_, i) => inserted.push(newRows[i].row));
    }

    return NextResponse.json({ inserted, duplicates, errors });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
