import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/ai-usage?period=30d  (admin only)
export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") || "30d";
  const days = parseInt(periodParam.replace("d", ""), 10) || 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const admin = createAdminClient();

  // Fetch raw usage rows (all users via admin client — bypasses RLS)
  const { data: usageRows, error: usageErr } = await admin
    .from("ai_usage")
    .select("user_id, feature, tokens_in, tokens_out, cost_estimate, created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (usageErr) {
    return NextResponse.json({ error: usageErr.message }, { status: 500 });
  }

  const records = usageRows || [];

  // Totals
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCost = 0;
  for (const r of records) {
    totalTokensIn += r.tokens_in ?? 0;
    totalTokensOut += r.tokens_out ?? 0;
    totalCost += Number(r.cost_estimate ?? 0);
  }

  // Aggregate by day
  const dayMap = new Map<string, { tokens: number; cost: number }>();
  for (const r of records) {
    const date = (r.created_at as string).split("T")[0];
    const existing = dayMap.get(date) ?? { tokens: 0, cost: 0 };
    existing.tokens += (r.tokens_in ?? 0) + (r.tokens_out ?? 0);
    existing.cost += Number(r.cost_estimate ?? 0);
    dayMap.set(date, existing);
  }

  // Aggregate by feature
  const featureMap = new Map<string, { tokens: number; cost: number; count: number }>();
  for (const r of records) {
    const existing = featureMap.get(r.feature) ?? { tokens: 0, cost: 0, count: 0 };
    existing.tokens += (r.tokens_in ?? 0) + (r.tokens_out ?? 0);
    existing.cost += Number(r.cost_estimate ?? 0);
    existing.count += 1;
    featureMap.set(r.feature, existing);
  }

  // Aggregate per user (for top-5)
  const userMap = new Map<string, { tokens: number; cost: number }>();
  for (const r of records) {
    if (!r.user_id) continue;
    const existing = userMap.get(r.user_id) ?? { tokens: 0, cost: 0 };
    existing.tokens += (r.tokens_in ?? 0) + (r.tokens_out ?? 0);
    existing.cost += Number(r.cost_estimate ?? 0);
    userMap.set(r.user_id, existing);
  }

  // Sort users by tokens desc, take top 5
  const topUserIds = [...userMap.entries()]
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 5)
    .map(([id]) => id);

  // Fetch user profiles for top users
  let topUsers: { user_id: string; name: string | null; email: string | null; tokens: number; cost: number }[] = [];
  if (topUserIds.length > 0) {
    const { data: userProfiles } = await admin
      .from("users")
      .select("id, name, email")
      .in("id", topUserIds);

    const profileMap = new Map(
      (userProfiles || []).map((u: { id: string; name: string | null; email: string | null }) => [u.id, u])
    );

    topUsers = topUserIds.map((uid) => {
      const stats = userMap.get(uid)!;
      const profile = profileMap.get(uid);
      return {
        user_id: uid,
        name: profile?.name ?? null,
        email: profile?.email ?? null,
        tokens: stats.tokens,
        cost: round6(stats.cost),
      };
    });
  }

  return NextResponse.json({
    totals: {
      tokens_in: totalTokensIn,
      tokens_out: totalTokensOut,
      cost_estimate: round6(totalCost),
      request_count: records.length,
    },
    byDay: [...dayMap.entries()].map(([date, s]) => ({
      date,
      tokens: s.tokens,
      cost: round6(s.cost),
    })),
    byFeature: [...featureMap.entries()].map(([feature, s]) => ({
      feature,
      tokens: s.tokens,
      cost: round6(s.cost),
      count: s.count,
    })),
    topUsers,
  });
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
