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
    .upsert({ key: THRESHOLD_KEY, value: { threshold }, category: "recruitment", label: "Auto-reject threshold" }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });

  // Retroactively reject SCREENED applications below the new threshold
  let autoRejected = 0;
  try {
    const { data: screenedApps } = await admin
      .from("job_applications")
      .select("id, current_screening_id")
      .eq("pipeline_status", "SCREENED")
      .not("current_screening_id", "is", null);

    if (screenedApps && screenedApps.length > 0) {
      const screeningIds = screenedApps.map((a: { id: string; current_screening_id: string }) => a.current_screening_id);

      const { data: belowThreshold } = await admin
        .from("candidate_screenings")
        .select("job_application_id")
        .in("id", screeningIds)
        .lt("final_score", threshold);

      const appIds = (belowThreshold ?? []).map((s: { job_application_id: string }) => s.job_application_id);

      if (appIds.length > 0) {
        await admin
          .from("job_applications")
          .update({ pipeline_status: "REJECTED", updated_at: new Date().toISOString() })
          .in("id", appIds);

        await admin.from("candidate_status_history").insert(
          appIds.map((id: string) => ({
            job_application_id: id,
            from_status: "SCREENED",
            to_status: "REJECTED",
            note: `Auto-rejected: threshold changed to ${threshold}`,
          }))
        );
        autoRejected = appIds.length;
      }
    }
  } catch (e) {
    console.warn("[settings PATCH] retroactive reject failed:", e);
  }

  return NextResponse.json({ success: true, autoRejectThreshold: threshold, autoRejected });
}
