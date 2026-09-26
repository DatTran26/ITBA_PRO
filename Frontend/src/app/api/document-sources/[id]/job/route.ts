import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("document_sources")
    .select("id, created_by")
    .eq("id", id)
    .single();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && doc.created_by !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: job, error } = await admin
    .from("document_jobs")
    .select("id, status, result, error_message, created_at, updated_at")
    .eq("document_source_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({
    ...job,
    result_json: job.result,
  });
}
