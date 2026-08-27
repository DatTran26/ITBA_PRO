import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const body = await req.json().catch(() => null) as { testId?: string | null } | null;
  const testId = body?.testId ?? null;
  const admin = createAdminClient();

  if (testId) {
    const { data: test, error: testError } = await admin
      .from("tests")
      .select("id")
      .eq("id", testId)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
  }

  const { data, error } = await admin
    .from("interview_sessions")
    .update({ test_id: testId })
    .eq("id", sessionId)
    .select("id, test_id, tests(id, title, job_role, share_token, status, time_limit_minutes)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
