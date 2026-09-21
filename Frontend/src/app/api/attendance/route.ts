import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi, canManageVision, validateImage } from "@/lib/vision-ai";
import { getFaceEnrollment } from "@/lib/face-store";
import {
  punchLocalAttendance,
  readLocalAttendance,
} from "@/lib/workplace-local";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const localSessions = await readLocalAttendance();
  try {
    const admin = createAdminClient();
    let query = admin
      .from("attendance_sessions")
      .select("id, user_id, check_in_at, check_out_at, check_in_similarity, check_out_similarity, users(name, email)")
      .order("check_in_at", { ascending: false })
      .limit(100);
    if (!canManageVision(ctx.role)) query = query.eq("user_id", ctx.userId);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const localIds = new Set(localSessions.map((row) => row.id));
      const merged = [...localSessions, ...data.filter((row) => !localIds.has(row.id))];
      const filtered = canManageVision(ctx.role) ? merged : merged.filter((s) => s.user_id === ctx.userId);
      return NextResponse.json({ sessions: filtered });
    }
  } catch {
    // Superbase optional.
  }

  const filtered = canManageVision(ctx.role)
    ? localSessions
    : localSessions.filter((s) => s.user_id === ctx.userId);

  return NextResponse.json({ sessions: filtered });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const incoming = await request.formData();
  const action = incoming.get("action");
  const image = incoming.get("image");
  if ((action !== "check-in" && action !== "check-out") || !validateImage(image)) {
    return NextResponse.json({ error: "A valid action and face image are required" }, { status: 400 });
  }

  const enrollment = await getFaceEnrollment(ctx.userId);
  if (!enrollment) {
    return NextResponse.json({
      error: "No face enrollment was found for this account. Enroll your face before using attendance.",
    }, { status: 409 });
  }

  const body = new FormData();
  body.append("image", image);
  body.append("userId", ctx.userId);
  if (enrollment.embeddings && Array.isArray(enrollment.embeddings)) {
    body.append("embeddings", JSON.stringify(enrollment.embeddings));
  }

  try {
    const verification = await callVisionAi("/api/face/verify", { method: "POST", body }) as {
      match: boolean; similarities: number[];
    };
    if (!verification.match) {
      return NextResponse.json({
        error: "The scanned face does not match the enrolled face.",
      }, { status: 401 });
    }

    const similarity = Math.max(...verification.similarities);
    const punched = await punchLocalAttendance({
      userId: ctx.userId,
      similarity,
      direction: action === "check-in" ? "in" : "out",
    });
    if (!punched.ok) return NextResponse.json({ error: punched.error }, { status: punched.status });
    return NextResponse.json({ session: punched.session });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Attendance failed",
    }, { status: 502 });
  }
}
