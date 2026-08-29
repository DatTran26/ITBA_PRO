import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE = 104857600; // 100MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!ctx.isHr && !ctx.isInterviewer && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const admin = createAdminClient();

  // Interviewers can only record for sessions they are assigned to
  if (ctx.isInterviewer && !ctx.isAdmin && !ctx.isHr) {
    const { count } = await admin
      .from("interview_session_interviewers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("interviewer_id", ctx.userId)
      .eq("status", "accepted");

    if (!count) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let storagePath: string | null = null;

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 100MB limit." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    // Unique file name to avoid collisions
    storagePath = `${sessionId}/${Date.now()}_recording.${file.name.split('.').pop() || 'webm'}`;

    const { error: uploadError } = await admin.storage
      .from("interview-recordings")
      .upload(storagePath, bytes, { contentType: file.type || "audio/webm" });

    if (uploadError) {
      return NextResponse.json({ error: "Storage upload failed", detail: uploadError.message }, { status: 500 });
    }

    // Update database
    const { data: updatedSession, error: dbError } = await admin
      .from("interview_sessions")
      .update({ recording_url: storagePath })
      .eq("id", sessionId)
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    // Generate a temporary signed URL for immediate playback
    const { data: signedData } = await admin.storage
      .from("interview-recordings")
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      success: true,
      recording_url: storagePath,
      signedUrl: signedData?.signedUrl || null,
      session: updatedSession
    });

  } catch (err) {
    // Cleanup storage if upload succeeded but db failed
    if (storagePath) {
      await admin.storage.from("interview-recordings").remove([storagePath]).catch(() => null);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
