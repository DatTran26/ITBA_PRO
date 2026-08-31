import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { id: documentId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { sourceId, targetId, mergedTitle, mergedKeyPoints } = (await req.json()) as {
    sourceId: string;
    targetId: string;
    mergedTitle: string;
    mergedKeyPoints: string[];
  };

  if (!sourceId || !targetId || !mergedTitle) {
    return NextResponse.json({ error: "sourceId, targetId, mergedTitle required" }, { status: 400 });
  }

  const { data: run } = await supabase
    .from("document_sources")
    .select("id, created_by")
    .eq("id", documentId)
    .single();

  if (!run) return NextResponse.json({ error: "Document run not found" }, { status: 404 });
  if (!isAdmin && run.created_by !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: topics } = await supabase
    .from("document_topics")
    .select("id")
    .eq("document_id", documentId)
    .in("id", [sourceId, targetId]);

  if (!topics || topics.length < 2) {
    return NextResponse.json({ error: "Both topics must belong to this document run" }, { status: 400 });
  }

  const { data: merged, error: updateErr } = await supabase
    .from("document_topics")
    .update({ title: mergedTitle, key_points: mergedKeyPoints ?? [] })
    .eq("id", targetId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const { error: deleteErr } = await supabase
    .from("document_topics")
    .delete()
    .eq("id", sourceId);

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return NextResponse.json({ mergedTopic: merged });
}
