import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id: documentId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("document_sources")
    .select("id, status, created_by, document_jobs(status, error_message, created_at)")
    .eq("id", documentId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && data.created_by !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const latestJob = Array.isArray(data.document_jobs)
    ? [...data.document_jobs].sort((a, b) => {
        const timeA = new Date(a.created_at ?? 0).getTime();
        const timeB = new Date(b.created_at ?? 0).getTime();
        return timeB - timeA;
      })[0]
    : null;

  return NextResponse.json({
    id: data.id,
    status: data.status,
    error_message: data.status === "failed" ? (latestJob?.error_message ?? null) : null,
  });
}
