import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi, canManageVision, validateImage } from "@/lib/vision-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const admin = createAdminClient();
  let query = admin
    .from("attendance_sessions")
    .select("id, user_id, check_in_at, check_out_at, check_in_similarity, check_out_similarity, users(name, email)")
    .order("check_in_at", { ascending: false })
    .limit(100);
  if (!canManageVision(ctx.role)) query = query.eq("user_id", ctx.userId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const incoming = await request.formData();
  const action = incoming.get("action");
  const image = incoming.get("image");
  if ((action !== "check-in" && action !== "check-out") || !validateImage(image)) {
    return NextResponse.json({ error: "Valid action and face image are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: enrollment } = await admin
    .from("user_face_embeddings")
    .select("embedding_json")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "No face enrollment found" }, { status: 409 });

  const body = new FormData();
  body.append("image", image);
  body.append("embeddings", JSON.stringify(enrollment.embedding_json));

  try {
    const verification = await callVisionAi("/api/face/verify", { method: "POST", body }) as {
      match: boolean; similarities: number[];
    };
    if (!verification.match) return NextResponse.json({ error: "Face verification failed" }, { status: 401 });
    const similarity = Math.max(...verification.similarities);
    const { data: active } = await admin
      .from("attendance_sessions")
      .select("id")
      .eq("user_id", ctx.userId)
      .is("check_out_at", null)
      .order("check_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (action === "check-in") {
      if (active) return NextResponse.json({ error: "You already have an active attendance session" }, { status: 409 });
      const { data, error } = await admin
        .from("attendance_sessions")
        .insert({ user_id: ctx.userId, check_in_similarity: similarity })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ session: data });
    }

    if (!active) return NextResponse.json({ error: "Check in before checking out" }, { status: 409 });
    const { data, error } = await admin
      .from("attendance_sessions")
      .update({ check_out_at: new Date().toISOString(), check_out_similarity: similarity, updated_at: new Date().toISOString() })
      .eq("id", active.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ session: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Attendance failed" }, { status: 502 });
  }
}
