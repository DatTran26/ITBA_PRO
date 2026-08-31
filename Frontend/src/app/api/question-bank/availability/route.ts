export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import type { QuestionType } from "@/components/question-bank/question-bank-types";

// Returns counts of available questions in the bank filtered by level + topics,
// grouped by question_type. Used by LevelConfigStep to show inline shortage hints
// BEFORE the user clicks Execute, so format weights can be tuned upfront.
export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { levels, topics } = (await request.json()) as { levels?: string[]; topics?: string[] };

    // Fetch with the user's filter (level + topics) and also without topics
    // so the UI can offer "expand to other topics of the same level" as a fallback.
    const baseQuery = supabase.from("question_bank").select("question_type, level, topic_tag");
    const withLevels = levels && levels.length > 0 ? baseQuery.in("level", levels) : baseQuery;
    const { data: levelRows, error } = await withLevels;
    if (error) throw error;

    const byType: Partial<Record<QuestionType, number>> = {};
    const byTypeAllTopics: Partial<Record<QuestionType, number>> = {};
    const byLevel: Record<string, number> = { junior: 0, middle: 0, senior: 0 };
    let total = 0;
    let totalAllTopics = 0;
    const topicSet = topics && topics.length > 0 ? new Set(topics) : null;
    for (const row of levelRows ?? []) {
      const t = (row.question_type ?? "single_choice") as QuestionType;
      byTypeAllTopics[t] = (byTypeAllTopics[t] ?? 0) + 1;
      totalAllTopics++;
      if (!topicSet || (row.topic_tag && topicSet.has(row.topic_tag))) {
        byType[t] = (byType[t] ?? 0) + 1;
        if (row.level && byLevel[row.level] !== undefined) byLevel[row.level]++;
        total++;
      }
    }
    return NextResponse.json({
      total,
      byType,
      byLevel,
      // Broader pool ignoring topic filter — used by "Bổ sung từ topic khác cùng level".
      totalAllTopics,
      byTypeAllTopics,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
