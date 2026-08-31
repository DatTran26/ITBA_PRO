import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { extractTextFromBuffer } from "@/lib/document-parsing/extract-text-from-buffer";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const base = supabase
    .from("documents")
    .select("id, title, file_type, source_type, storage_path, drive_file_id, uploaded_by, created_at, updated_at, document_sources(id, status, created_at)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data, error } = await (isAdmin ? base : base.eq("uploaded_by", userId));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExts = ["pdf", "docx", "txt", "md"];
  if (!allowedExts.includes(ext)) {
    return NextResponse.json({ error: "Unsupported file type. Allowed: pdf, docx, txt, md" }, { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const fileType = ext === "md" ? "txt" : ext;
  const storagePath = `library/${userId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  let extractedText: string | null = null;
  try {
    const result = await extractTextFromBuffer(bytes, ext, file.name);
    extractedText = result.text;
  } catch {
    // extraction failure is non-fatal — pipeline will re-extract
  }

  const { error: uploadError } = await supabase.storage
    .from("document-sources")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      title: file.name,
      file_type: fileType,
      source_type: "upload",
      storage_path: storagePath,
      uploaded_by: userId,
      extracted_text: extractedText,
    })
    .select("id, title, file_type, source_type, storage_path, uploaded_by, created_at, updated_at")
    .single();

  if (insertError || !doc) return NextResponse.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });

  return NextResponse.json({ data: doc }, { status: 201 });
}
