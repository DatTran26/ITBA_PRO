import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = (role: string, isAdmin: boolean) =>
  isAdmin || role === "recruiter" || role === "hr";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, role } = ctx;
  if (!ALLOWED(role, isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? new Date(Date.now() - 30 * 86400_000).toISOString();
  const to = searchParams.get("to") ?? new Date().toISOString();
  const jdId = searchParams.get("jd_id") ?? null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("recruitment_dashboard", {
    from_date: from,
    to_date: to,
    p_jd_id: jdId,
  });

  if (error) {
    console.error("[recruitment/dashboard] RPC error:", error.message);
    return NextResponse.json({ error: "Failed to fetch dashboard data", detail: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? {});
}
