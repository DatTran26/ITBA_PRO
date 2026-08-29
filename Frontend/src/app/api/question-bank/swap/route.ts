export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_LEVELS = ["junior", "middle", "senior"] as const;

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { supabase, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { level, excludeIds, topics } = body as {
      level?: string;
      excludeIds?: unknown[];
      topics?: string[];
    };

    if (!level || !VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
      return NextResponse.json({ error: "level must be junior, middle, or senior" }, { status: 400 });
    }

    const ids: string[] = [];
    if (excludeIds) {
      if (!Array.isArray(excludeIds)) {
        return NextResponse.json({ error: "excludeIds must be an array" }, { status: 400 });
      }
      for (const id of excludeIds) {
        if (typeof id !== "string" || !UUID_REGEX.test(id)) {
          return NextResponse.json({ error: "excludeIds must contain valid UUIDs" }, { status: 400 });
        }
        ids.push(id);
      }
    }

    let query = supabase
      .from("question_bank")
      .select("id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, time_limit, level, topic_tag")
      .eq("level", level)
      .limit(20);

    if (ids.length > 0) {
      query = query.not("id", "in", `(${ids.join(",")})`);
    }

    if (topics && topics.length > 0) {
      query = query.in("topic_tag", topics);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ question: null });
    }

    const pick = data[Math.floor(Math.random() * data.length)];
    return NextResponse.json({ question: pick });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
