import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canTransition } from "@/lib/recruitment/state-machine";
import { logStatusChange } from "@/lib/recruitment/pipeline-helpers";
import type { PipelineStatus } from "@/types/recruitment";

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, role, userId } = ctx;
  if (!isAdmin && role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const ids: string[] = body?.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: "ids must not exceed 100 items" }, { status: 400 });
  }

  const admin = createAdminClient();
  let rejected = 0;
  let skipped = 0;

  for (const id of ids) {
    const { data: application, error } = await admin
      .from("job_applications")
      .select("pipeline_status")
      .eq("id", id)
      .single();

    if (error || !application) {
      skipped++;
      continue;
    }

    const current = application.pipeline_status as PipelineStatus;

    if (!canTransition(current, "REJECTED")) {
      skipped++;
      continue;
    }

    const { error: updateError } = await admin
      .from("job_applications")
      .update({ pipeline_status: "REJECTED", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      skipped++;
      continue;
    }

    await logStatusChange({
      jobApplicationId: id,
      fromStatus: current,
      toStatus: "REJECTED",
      changedBy: userId,
    });

    rejected++;
  }

  return NextResponse.json({ rejected, skipped });
}
