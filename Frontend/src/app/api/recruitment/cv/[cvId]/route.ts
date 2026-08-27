import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cvId: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { cvId } = await params;

  if (!ctx.isHr && !ctx.isInterviewer && !ctx.isAdmin && ctx.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  try {
    const { data: cv, error } = await admin
      .from("candidate_cvs")
      .select("id, storage_path, original_filename, uploaded_by")
      .eq("id", cvId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!cv) return NextResponse.json({ error: "CV not found" }, { status: 404 });

    if (ctx.isHr && cv.uploaded_by !== ctx.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: signedData, error: signedError } = await admin.storage
      .from("candidate-cvs")
      .createSignedUrl(cv.storage_path, 300);

    if (signedError || !signedData) {
      throw new Error(signedError?.message ?? "Failed to generate signed URL");
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      expiresIn: 300,
      originalFilename: cv.original_filename,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
