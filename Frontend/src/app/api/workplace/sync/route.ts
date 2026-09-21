import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageVision } from "@/lib/vision-ai";
import { readLocalRegistry } from "@/lib/face-store";
import {
  readLocalAttendance,
  readMonitoringSessions,
  readViolationAlerts,
} from "@/lib/workplace-local";

export const runtime = "nodejs";

async function pendingCounts() {
  const [alerts, sessions, attendance] = await Promise.all([
    readViolationAlerts(),
    readMonitoringSessions(),
    readLocalAttendance(),
  ]);
  let faces = 0;
  try {
    faces = Object.values(await readLocalRegistry()).filter((item) => item.sync_status !== "synced").length;
  } catch {
    faces = 0;
  }
  return {
    faces,
    violations: alerts.length,
    monitoring_sessions: sessions.length,
    attendance: attendance.length,
  };
}

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const pending = await pendingCounts();
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!configured) {
    return NextResponse.json({ synced: false, reason: "offline_mode", pending });
  }
  return NextResponse.json({ synced: false, reason: "pending_push", pending });
}

export async function POST() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ synced: false, reason: "offline_mode", pending: await pendingCounts() });
  }

  try {
    const admin = createAdminClient();
    const alerts = await readViolationAlerts();
    const attendance = await readLocalAttendance();
    let upserted = 0;
    if (alerts.length) {
      const { error } = await admin.from("violation_alerts").upsert(
        alerts.map((alert) => ({
          id: alert.id,
          violation_type: alert.violation_type,
          severity: alert.severity,
          camera_location: alert.camera_location,
          evidence_url: alert.evidence_url,
          status: alert.status,
          detections_json: alert.detections_json,
          detected_at: alert.detected_at,
          reviewed_by: alert.reviewed_by,
          reviewed_at: alert.reviewed_at,
          review_note: alert.review_note,
        })),
        { onConflict: "id" },
      );
      if (error) throw error;
      upserted += alerts.length;
    }
    if (attendance.length) {
      const { error } = await admin.from("attendance_sessions").upsert(
        attendance.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          check_in_at: row.check_in_at,
          check_out_at: row.check_out_at,
          check_in_similarity: row.check_in_similarity,
          check_out_similarity: row.check_out_similarity,
        })),
        { onConflict: "id" },
      );
      if (error) throw error;
      upserted += attendance.length;
    }
    return NextResponse.json({ synced: true, upserted, pending: await pendingCounts() });
  } catch (error) {
    return NextResponse.json({
      synced: false,
      reason: error instanceof Error ? error.message : "sync_failed",
      pending: await pendingCounts(),
    }, { status: 200 });
  }
}
