import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi, canManageVision, validateImage } from "@/lib/vision-ai";
import { getFaceEnrollment } from "@/lib/face-store";
import path from "node:path";
import { promises as fs } from "node:fs";

export const runtime = "nodejs";
export const maxDuration = 300;

interface LocalAttendanceSession {
  id: string;
  user_id: string;
  check_in_at: string;
  check_out_at: string | null;
  check_in_similarity: number;
  check_out_similarity: number | null;
  users?: { name?: string; email?: string } | null;
}

function getAttendanceFilePath(): string {
  return path.resolve(process.cwd(), "..", "data", "vision-ai", "attendance-sessions.json");
}

async function readLocalAttendance(): Promise<LocalAttendanceSession[]> {
  try {
    const raw = await fs.readFile(getAttendanceFilePath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalAttendance(sessions: LocalAttendanceSession[]): Promise<void> {
  const filePath = getAttendanceFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(sessions, null, 2), "utf8");
}

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

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
      return NextResponse.json({ sessions: data });
    }
  } catch {
    // Supabase unavailable; read local sessions
  }

  const localSessions = await readLocalAttendance();
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
    return NextResponse.json({ error: "Thao tác và hình ảnh khuôn mặt hợp lệ là bắt buộc" }, { status: 400 });
  }

  // 1. Single Source of Truth: Get enrollment from face-store (same as login)
  const enrollment = await getFaceEnrollment(ctx.userId);
  if (!enrollment) {
    return NextResponse.json({
      error: "Không tìm thấy dữ liệu khuôn mặt đã đăng ký cho tài khoản này. Vui lòng đăng ký khuôn mặt trước khi chấm công.",
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
        error: "Khuôn mặt quét được không khớp với khuôn mặt đã đăng ký lúc đăng nhập!",
      }, { status: 401 });
    }

    const similarity = Math.max(...verification.similarities);
    const now = new Date().toISOString();

    // 2. Try Supabase first
    try {
      const admin = createAdminClient();
      const { data: active } = await admin
        .from("attendance_sessions")
        .select("id")
        .eq("user_id", ctx.userId)
        .is("check_out_at", null)
        .order("check_in_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (action === "check-in") {
        if (active) return NextResponse.json({ error: "Bạn đã có phiên chấm công đang mở (Check-in)" }, { status: 409 });
        const { data, error } = await admin
          .from("attendance_sessions")
          .insert({ user_id: ctx.userId, check_in_similarity: similarity })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ session: data });
      }

      if (!active) return NextResponse.json({ error: "Bạn cần Check-in trước khi Check-out" }, { status: 409 });
      const { data, error } = await admin
        .from("attendance_sessions")
        .update({ check_out_at: now, check_out_similarity: similarity, updated_at: now })
        .eq("id", active.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ session: data });
    } catch {
      // 3. Fallback to local attendance file if Supabase is unavailable
      const localSessions = await readLocalAttendance();
      const activeIdx = localSessions.findIndex((s) => s.user_id === ctx.userId && !s.check_out_at);

      if (action === "check-in") {
        if (activeIdx !== -1) {
          return NextResponse.json({ error: "Bạn đã có phiên chấm công đang mở (Check-in)" }, { status: 409 });
        }
        const newSession: LocalAttendanceSession = {
          id: `att-${Date.now()}`,
          user_id: ctx.userId,
          check_in_at: now,
          check_out_at: null,
          check_in_similarity: similarity,
          check_out_similarity: null,
          users: { name: ctx.userId, email: "" },
        };
        localSessions.unshift(newSession);
        await writeLocalAttendance(localSessions);
        return NextResponse.json({ session: newSession });
      }

      if (activeIdx === -1) {
        return NextResponse.json({ error: "Bạn cần Check-in trước khi Check-out" }, { status: 409 });
      }
      localSessions[activeIdx].check_out_at = now;
      localSessions[activeIdx].check_out_similarity = similarity;
      await writeLocalAttendance(localSessions);
      return NextResponse.json({ session: localSessions[activeIdx] });
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Chấm công thất bại",
    }, { status: 502 });
  }
}
