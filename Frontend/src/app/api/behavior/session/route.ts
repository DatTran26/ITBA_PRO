import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { canManageVision } from "@/lib/vision-ai";
import {
  getActiveMonitoringSession,
  heartbeatMonitoringSession,
  readMonitoringSessions,
  startMonitoringSession,
  stopMonitoringSession,
} from "@/lib/workplace-local";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sessions = await readMonitoringSessions();
  return NextResponse.json({
    active: sessions.find((row) => row.status === "active") ?? null,
    sessions: sessions.slice(0, 50),
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const cameraId = typeof body.camera_id === "string" && body.camera_id.trim()
    ? body.camera_id.trim().slice(0, 128)
    : undefined;

  if (action === "start") {
    const session = await startMonitoringSession({
      operator_id: ctx.userId,
      operator_name: ctx.userId,
      camera_id: typeof body.camera_id === "string" ? body.camera_id : undefined,
      camera_location: typeof body.camera_location === "string" ? body.camera_location : undefined,
      monitored_user_ids: Array.isArray(body.monitored_user_ids) ? body.monitored_user_ids : undefined,
    });
    return NextResponse.json({ session });
  }
  if (action === "stop") {
    const session = await stopMonitoringSession(cameraId);
    return NextResponse.json({ session });
  }
  if (action === "heartbeat") {
    const session = await heartbeatMonitoringSession(undefined, cameraId);
    return NextResponse.json({ session: session ?? (await getActiveMonitoringSession(cameraId)) });
  }
  return NextResponse.json({ error: "action must be start, stop, or heartbeat" }, { status: 400 });
}
