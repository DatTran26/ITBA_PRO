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

  const { parentTopicId, keyPointIndex, newTopicTitle } = (await req.json()) as {
    parentTopicId: string;
    keyPointIndex: number;
    newTopicTitle: string;
  };

  if (!parentTopicId || keyPointIndex == null || !newTopicTitle) {
    return NextResponse.json({ error: "parentTopicId, keyPointIndex, newTopicTitle required" }, { status: 400 });
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

  const { data: parent, error: fetchErr } = await supabase
    .from("document_topics")
    .select("*")
    .eq("id", parentTopicId)
    .eq("document_id", documentId)
    .single();

  if (fetchErr || !parent) return NextResponse.json({ error: "Parent topic not found" }, { status: 404 });

  const keyPoints: string[] = parent.key_points ?? [];
  if (keyPointIndex < 0 || keyPointIndex >= keyPoints.length) {
    return NextResponse.json({ error: "keyPointIndex out of bounds" }, { status: 400 });
  }

  const removedKeyPoint = keyPoints[keyPointIndex];
  const updatedKeyPoints = keyPoints.filter((_: string, i: number) => i !== keyPointIndex);

  const { data: updatedParent, error: updateErr } = await supabase
    .from("document_topics")
    .update({ key_points: updatedKeyPoints })
    .eq("id", parentTopicId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const { data: maxRow } = await supabase
    .from("document_topics")
    .select("order_index")
    .eq("document_id", documentId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrderIndex = (maxRow?.order_index ?? 0) + 1;

  const { data: newTopic, error: insertErr } = await supabase
    .from("document_topics")
    .insert({
      document_id: documentId,
      title: newTopicTitle,
      summary: "",
      key_points: [removedKeyPoint],
      order_index: nextOrderIndex,
      is_approved: false,
    })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ updatedParent, newTopic });
}
