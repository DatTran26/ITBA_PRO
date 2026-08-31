export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import type { BankQuestion, QuestionType, QuestionTypeCount, ShortageProposal } from "@/components/question-bank/question-bank-types";

const VALID_LEVELS = ["junior", "middle", "senior"] as const;

const QUESTION_FIELDS = "id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, time_limit, level, topic_tag, question_type, answer_payload, metadata, grading_mode";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeType(raw: unknown): QuestionType {
  return (typeof raw === "string" && raw.trim().length > 0 ? raw : "single_choice") as QuestionType;
}

function normalizeTypes(typeCounts: QuestionTypeCount[] | undefined, total: number): QuestionTypeCount[] {
  if (!typeCounts || typeCounts.length === 0) return [];
  const normalized = typeCounts
    .filter((entry) => typeof entry?.count === "number" && entry.count > 0)
    .map((entry) => ({ question_type: normalizeType(entry.question_type), count: Math.floor(entry.count) }));
  const sum = normalized.reduce((acc, current) => acc + current.count, 0);
  if (sum === total) return normalized;
  if (sum > total) {
    let over = sum - total;
    return normalized.map((entry) => {
      if (over <= 0) return entry;
      const cut = Math.min(over, entry.count);
      over -= cut;
      return { ...entry, count: entry.count - cut };
    }).filter((entry) => entry.count > 0);
  }
  // sum < total — respect user's explicit per-type allocation rather than padding
  // with single_choice (which masks true shortages). Caller's total will be
  // truncated to the sum via the slice at the end of POST.
  return normalized;
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { supabase, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { mode, total, level, ratios, topics, type_counts, confirmSubstitution, skillIds, random } = body as {
      mode: "single" | "mixed";
      total: number;
      level?: string;
      ratios?: { junior: number; middle: number; senior: number };
      topics?: string[];
      type_counts?: QuestionTypeCount[];
      confirmSubstitution?: boolean;
      // Multi-skill test creation: restrict the pool to questions tagged with these skills.
      skillIds?: string[];
      // Random mode: ignore level distribution, shuffle the whole pool to `total`.
      random?: boolean;
    };

    if (!total || typeof total !== "number" || total < 1 || total > 200) {
      return NextResponse.json({ error: "total must be between 1 and 200" }, { status: 400 });
    }

    const skillFilter = Array.isArray(skillIds) && skillIds.length > 0 ? skillIds : null;

    // Random mode: pool from selected skills (and optional topics), shuffle, slice — no level logic.
    if (random) {
      let randomQuery = supabase.from("question_bank").select(QUESTION_FIELDS);
      if (skillFilter) randomQuery = randomQuery.in("skill_id", skillFilter);
      if (topics && topics.length > 0) randomQuery = randomQuery.in("topic_tag", topics);
      const { data: randomData, error: randomError } = await randomQuery;
      if (randomError) throw randomError;
      const pool: BankQuestion[] = (randomData ?? []).map((row) => ({ ...row, question_type: normalizeType(row.question_type) })) as BankQuestion[];
      return NextResponse.json({ questions: shuffle(pool).slice(0, total), requires_confirmation: false });
    }

    if (!mode) {
      return NextResponse.json({ error: "mode required unless random" }, { status: 400 });
    }

    const normalizedTypeCounts = normalizeTypes(type_counts, total);

    const levelTargets: Record<string, number> = { junior: 0, middle: 0, senior: 0 };
    if (mode === "single") {
      if (!level || !VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
        return NextResponse.json({ error: "level required for single mode" }, { status: 400 });
      }
      levelTargets[level] = total;
    } else if (mode === "mixed") {
      if (!ratios || typeof ratios.junior !== "number" || typeof ratios.middle !== "number" || typeof ratios.senior !== "number") {
        return NextResponse.json({ error: "ratios required for mixed mode" }, { status: 400 });
      }
      const sum = ratios.junior + ratios.middle + ratios.senior;
      if (Math.abs(sum - 100) > 0.01) {
        return NextResponse.json({ error: "ratios must sum to 100" }, { status: 400 });
      }
      levelTargets.junior = Math.floor((ratios.junior / 100) * total);
      levelTargets.middle = Math.floor((ratios.middle / 100) * total);
      levelTargets.senior = total - levelTargets.junior - levelTargets.middle;
    } else {
      return NextResponse.json({ error: "mode must be single or mixed" }, { status: 400 });
    }

    let query = supabase.from("question_bank").select(QUESTION_FIELDS);
    const activeLevels = Object.entries(levelTargets).filter(([, count]) => count > 0).map(([lvl]) => lvl);
    if (activeLevels.length > 0) query = query.in("level", activeLevels);
    if (topics && topics.length > 0) query = query.in("topic_tag", topics);
    if (skillFilter) query = query.in("skill_id", skillFilter);

    const { data, error } = await query;
    if (error) throw error;

    const rows: BankQuestion[] = (data ?? []).map((row) => ({ ...row, question_type: normalizeType(row.question_type) })) as BankQuestion[];

    const byLevel = new Map<string, BankQuestion[]>();
    for (const lvl of Object.keys(levelTargets)) byLevel.set(lvl, []);
    for (const row of rows) {
      const bucket = byLevel.get(row.level);
      if (bucket) bucket.push(row);
    }

    const selected: BankQuestion[] = [];
    for (const [lvl, targetCount] of Object.entries(levelTargets)) {
      if (targetCount <= 0) continue;
      const picked = shuffle(byLevel.get(lvl) ?? []).slice(0, targetCount);
      selected.push(...picked);
    }

    if (normalizedTypeCounts.length === 0) {
      return NextResponse.json({ questions: shuffle(selected).slice(0, total), requires_confirmation: false });
    }

    const finalSelected = shuffle(selected).slice(0, total);
    const byType = new Map<QuestionType, BankQuestion[]>();
    for (const question of finalSelected) {
      const questionType = normalizeType(question.question_type);
      const bucket = byType.get(questionType) ?? [];
      bucket.push(question);
      byType.set(questionType, bucket);
    }

    const fulfilled: BankQuestion[] = [];
    const usedIds = new Set<string>();
    const shortages: NonNullable<ShortageProposal["items"]> = [];

    for (const requestItem of normalizedTypeCounts) {
      const available = (byType.get(requestItem.question_type) ?? []).filter((question) => !usedIds.has(question.id));
      const picked = available.slice(0, requestItem.count);
      picked.forEach((question) => usedIds.add(question.id));
      fulfilled.push(...picked);

      if (picked.length < requestItem.count) {
        shortages.push({
          question_type: requestItem.question_type,
          requested: requestItem.count,
          available: picked.length,
          missing: requestItem.count - picked.length,
          proposed_substitutes: [],
        });
      }
    }

    if (shortages.length > 0) {
      const remaining = finalSelected.filter((question) => !usedIds.has(question.id));
      const remainingByType = new Map<QuestionType, number>();
      for (const question of remaining) {
        const key = normalizeType(question.question_type);
        remainingByType.set(key, (remainingByType.get(key) ?? 0) + 1);
      }

      for (const shortage of shortages) {
        const substitutes: QuestionTypeCount[] = [];
        let needed = shortage.missing;
        for (const [question_type, count] of Array.from(remainingByType.entries()).sort((a, b) => b[1] - a[1])) {
          if (needed <= 0) break;
          const take = Math.min(count, needed);
          if (take > 0) {
            substitutes.push({ question_type, count: take });
            remainingByType.set(question_type, count - take);
            needed -= take;
          }
        }
        shortage.proposed_substitutes = substitutes;
      }

      if (!confirmSubstitution) {
        return NextResponse.json({
          questions: fulfilled,
          requires_confirmation: true,
          shortage_proposal: {
            items: shortages,
            message: "Some requested question types do not have enough items. Review and accept substitution to continue.",
          },
        });
      }

      const supplement = finalSelected.filter((question) => !usedIds.has(question.id));
      const missingTotal = shortages.reduce((sum, item) => sum + item.missing, 0);
      fulfilled.push(...supplement.slice(0, missingTotal));
    }

    return NextResponse.json({ questions: fulfilled.slice(0, total), requires_confirmation: false });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
