import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const base = supabase
    .from("document_sources")
    .select("id, file_name, format, source_url, status, created_by, created_at, document_jobs(id, status, error_message)")
    .order("created_at", { ascending: false });

  const { data, error } = await (isAdmin ? base : base.eq("created_by", userId));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const libraryDocumentId = (formData.get("documentId") as string | null)?.trim() || null;
  // File is uploaded directly to Storage by the browser (signed URL); the client
  // then registers it here by storage path + metadata. No binary passes through.
  const storage_path = (formData.get("storage_path") as string | null)?.trim() || null;
  const file_name_in = (formData.get("file_name") as string | null)?.trim() || null;
  const format_in = (formData.get("format") as string | null)?.trim().toLowerCase() || null;
  const source_url = (formData.get("source_url") as string | null)?.trim() || null;
  // null = global question bank; set = skill-scoped generation.
  const skill_id = (formData.get("skill_id") as string | null)?.trim() || null;

  // Library path: re-run pipeline from an existing documents record
  if (libraryDocumentId) {
    const { data: libDoc, error: libErr } = await supabase
      .from("documents")
      .select("id, title, file_type, storage_path, uploaded_by")
      .eq("id", libraryDocumentId)
      .is("deleted_at", null)
      .single();

    if (libErr || !libDoc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    if (!isAdmin && libDoc.uploaded_by !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Compute parent + version so re-runs are traceable.
    const { data: priorRuns } = await supabase
      .from("document_sources")
      .select("id, version_number")
      .eq("document_id", libDoc.id)
      .order("version_number", { ascending: false })
      .limit(1);
    const lastRun = priorRuns?.[0];
    const nextVersion = (lastRun?.version_number ?? 0) + 1;

    const { data: src, error: srcErr } = await supabase
      .from("document_sources")
      .insert({
        document_id: libDoc.id,
        file_name: libDoc.title,
        file_url: libDoc.storage_path,
        format: libDoc.file_type,
        status: "pending",
        created_by: userId,
        parent_run_id: lastRun?.id ?? null,
        version_number: nextVersion,
        skill_id,
      })
      .select("id")
      .single();

    if (srcErr || !src) return NextResponse.json({ error: srcErr?.message ?? "Insert failed" }, { status: 500 });

    supabase.functions.invoke("extract-document-topics", { body: { documentId: src.id } }).catch(() => {});

    return NextResponse.json({ documentId: src.id }, { status: 201 });
  }

  if (!storage_path && !source_url) {
    return NextResponse.json({ error: "storage_path or source_url required" }, { status: 400 });
  }

  let file_name: string | null = null;
  let file_url: string | null = null;
  let format: string;

  if (storage_path) {
    // Only accept paths inside the caller's own folder (matches Storage RLS).
    if (!storage_path.startsWith(`${userId}/`)) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
    }
    if (!format_in || !["pdf", "docx", "txt"].includes(format_in)) {
      return NextResponse.json({ error: "Unsupported file type. Allowed: pdf, docx, txt" }, { status: 400 });
    }
    format = format_in;
    file_name = file_name_in;
    file_url = storage_path;
  } else {
    format = "url";
  }

  const { data: doc, error: docError } = await supabase
    .from("document_sources")
    .insert({ file_name, file_url, format, source_url, status: "pending", created_by: userId, skill_id })
    .select("id")
    .single();

  if (docError || !doc) return NextResponse.json({ error: docError?.message ?? "Insert failed" }, { status: 500 });

  supabase.functions.invoke("extract-document-topics", { body: { documentId: doc.id } }).catch(() => {});

  return NextResponse.json({ documentId: doc.id }, { status: 201 });
}
