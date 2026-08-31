import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, title, file_type, source_type, storage_path, drive_file_id, uploaded_by, created_at, updated_at, deleted_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && doc.uploaded_by !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch last pipeline run
  const { data: lastRun } = await supabase
    .from("document_sources")
    .select("id, status, created_at")
    .eq("document_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ data: { ...doc, last_run: lastRun ?? null } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("uploaded_by")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && doc.uploaded_by !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
