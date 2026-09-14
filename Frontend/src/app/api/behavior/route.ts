import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi, canManageVision, validateImage } from "@/lib/vision-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await createAdminClient()
    .from("violation_alerts")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const incoming = await request.formData();
  const image = incoming.get("image");
  const cameraLocation = String(incoming.get("cameraLocation") ?? "Manual upload").slice(0, 200);
  const modelPath = String(incoming.get("modelPath") ?? "").trim();
  if (!validateImage(image)) return NextResponse.json({ error: "A JPEG, PNG, or WebP image is required" }, { status: 400 });
  const body = new FormData();
  body.append("image", image);
  if (modelPath) body.append("modelPath", modelPath);

  try {
    const result = await callVisionAi("/api/behavior/detect", { method: "POST", body }) as {
      detections: Array<{ label: string; confidence: number; bbox: number[]; isViolation: boolean }>;
    };
    if (!Array.isArray(result.detections)) throw new Error("Invalid behavior response");
    const rows = result.detections.filter((detection) => detection.isViolation).map((detection) => ({
      track_id: randomUUID(),
      violation_type: ["smoke", "cigarette"].includes(detection.label.toLowerCase()) ? "smoking" : "empty_desk",
      severity: ["smoke", "cigarette"].includes(detection.label.toLowerCase()) ? "High" : "Medium",
      camera_location: cameraLocation,
      status: "pending_review",
      detections_json: detection,
    }));
    if (!rows.length) return NextResponse.json({ detections: result.detections, alerts: [] });
    try {
      const { data, error } = await createAdminClient().from("violation_alerts").insert(rows).select();
      if (error) throw error;
      return NextResponse.json({ detections: result.detections, alerts: data });
    } catch {
      return NextResponse.json({
        detections: result.detections,
        alerts: [],
        warning: "Violation detected but the alert could not be saved",
      });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Behavior scan failed" }, { status: 502 });
  }
}
