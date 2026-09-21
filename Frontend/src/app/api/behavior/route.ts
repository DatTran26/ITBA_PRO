import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi, canManageVision, validateImage } from "@/lib/vision-ai";
import {
  appendViolationAlerts,
  bumpActiveSessionStats,
  evidencePublicUrl,
  getActiveMonitoringSession,
  relativeEvidencePath,
  readViolationAlerts,
  type LocalViolationAlert,
} from "@/lib/workplace-local";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const local = await readViolationAlerts();
  try {
    const { data, error } = await createAdminClient()
      .from("violation_alerts")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(100);
    if (!error && data?.length) {
      const localIds = new Set(local.map((row) => row.id));
      const merged = [...local, ...data.filter((row) => !localIds.has(row.id))];
      merged.sort((a, b) => String(b.detected_at).localeCompare(String(a.detected_at)));
      return NextResponse.json({ alerts: merged.slice(0, 200) });
    }
  } catch {
    // Local JSON is the source of truth when Superbase is empty or unconfigured.
  }
  return NextResponse.json({ alerts: local });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const incoming = await request.formData();
  const image = incoming.get("image");
  const cameraLocation = String(incoming.get("cameraLocation") ?? "Manual upload").slice(0, 200);
  const cameraId = String(incoming.get("cameraId") ?? "").trim().slice(0, 128);
  const modelPath = String(incoming.get("modelPath") ?? "").trim();
  const userId = String(incoming.get("userId") ?? "").trim();
  const profileName = String(incoming.get("profileName") ?? "").trim().slice(0, 100);
  if (!validateImage(image)) return NextResponse.json({ error: "A JPEG, PNG, or WebP image is required" }, { status: 400 });
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(userId) || !profileName) {
    return NextResponse.json({ error: "Select a monitored profile" }, { status: 400 });
  }
  const body = new FormData();
  body.append("image", image);
  body.append("userId", userId);
  body.append("profileName", profileName);
  if (modelPath) body.append("modelPath", modelPath);

  try {
    const result = await callVisionAi("/api/behavior/detect", { method: "POST", body }) as {
      detections: Array<{ label: string; confidence: number; bbox: number[]; isViolation: boolean }>;
      processingMs: number;
      evidencePath: string | null;
    };
    if (!Array.isArray(result.detections)) throw new Error("Invalid behavior response");
    const violations = result.detections.filter((detection) => detection.isViolation);
    await bumpActiveSessionStats({
      frames: 1,
      violations: violations.length,
      alerts: violations.length,
    }, cameraId || undefined);
    if (!violations.length) {
      return NextResponse.json({ detections: result.detections, alerts: [], processingMs: result.processingMs });
    }

    const session = await getActiveMonitoringSession(cameraId || undefined);
    const rel = relativeEvidencePath(result.evidencePath);
    const now = new Date().toISOString();
    const alerts: LocalViolationAlert[] = violations.map((detection) => ({
      id: randomUUID(),
      session_id: session?.id ?? null,
      user_id: userId,
      profile_name: profileName,
      violation_type: ["smoke", "cigarette"].includes(detection.label.toLowerCase()) ? "smoking" : "empty_desk",
      severity: ["smoke", "cigarette"].includes(detection.label.toLowerCase()) ? "High" : "Medium",
      camera_location: cameraLocation,
      evidence_relative_path: rel,
      evidence_url: evidencePublicUrl(rel),
      detected_at: now,
      status: "pending_review",
      confidence: detection.confidence,
      bbox: detection.bbox,
      detections_json: { ...detection, userId, profileName },
    }));
    await appendViolationAlerts(alerts);

    try {
      await createAdminClient().from("violation_alerts").insert(
        alerts.map((alert) => ({
          id: alert.id,
          track_id: alert.id,
          violation_type: alert.violation_type,
          severity: alert.severity,
          camera_location: alert.camera_location,
          evidence_url: alert.evidence_url,
          status: alert.status,
          detections_json: alert.detections_json,
          detected_at: alert.detected_at,
        })),
      );
    } catch {
      // Superbase optional; local file already holds the alerts.
    }

    return NextResponse.json({ detections: result.detections, alerts, processingMs: result.processingMs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Behavior scan failed" }, { status: 502 });
  }
}
