import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const THRESHOLD_KEY = "recruitment.auto_reject_threshold";
const DEFAULT_THRESHOLD = 40;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, isInterviewer } = ctx;
  if (!isAdmin && !isHr && !isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", THRESHOLD_KEY)
    .single();

  const threshold =
    (data?.value as { threshold?: number } | null)?.threshold ?? DEFAULT_THRESHOLD;

  return NextResponse.json({ autoRejectThreshold: threshold });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden — HR or admin required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const threshold = body?.autoRejectThreshold;

  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
    return NextResponse.json({ error: "autoRejectThreshold must be 0–100" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("system_settings")
    .upsert({ key: THRESHOLD_KEY, value: { threshold }, category: "recruitment", label: "Review threshold" }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });

  return NextResponse.json({ success: true, autoRejectThreshold: threshold });
}
