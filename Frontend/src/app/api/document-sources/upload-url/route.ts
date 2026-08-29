import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

const ALLOWED = ["pdf", "docx", "txt"];

// Issues a one-time signed upload URL so the browser can upload the file directly
// to Storage, bypassing the serverless request-body size limit. The server still
// gates the role and owns the storage path (user-scoped folder, RLS-compatible).
export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { fileName } = await request.json().catch(() => ({ fileName: null }));
  if (!fileName || typeof fileName !== "string") {
    return NextResponse.json({ error: "fileName required" }, { status: 400 });
  }
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.includes(ext)) {
    return NextResponse.json({ error: "Unsupported file type. Allowed: pdf, docx, txt" }, { status: 400 });
  }

  const storagePath = `${userId}/${Date.now()}-${fileName.replace(/\s+/g, "_")}`;
  const { data, error } = await supabase.storage
    .from("document-sources")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create upload URL" }, { status: 500 });
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
