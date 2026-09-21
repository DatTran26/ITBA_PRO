import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { listActiveFaceEnrollments } from "@/lib/face-store";
import { callVisionAi, canManageVision, validateImage } from "@/lib/vision-ai";
import { punchLocalAttendance } from "@/lib/workplace-local";

export const runtime = "nodejs";
export const maxDuration = 300;

type IdentifyResponse = {
  match: boolean;
  userId?: string | null;
  similarities?: number[];
  score?: number;
};

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const incoming = await request.formData();
  const image = incoming.get("image");
  const kioskId = String(incoming.get("kioskId") ?? "kiosk-lobby").slice(0, 64);
  if (!validateImage(image)) {
    return NextResponse.json({ error: "A face image is required" }, { status: 400 });
  }

  const candidates = await listActiveFaceEnrollments();
  if (!candidates.length) {
    return NextResponse.json({ error: "No enrolled faces are available for kiosk identify" }, { status: 404 });
  }

  const body = new FormData();
  body.append("image", image);
  body.append("gallery", JSON.stringify(candidates.map((user) => ({ userId: user.id, embeddings: user.embeddings }))));

  try {
    const identification = (await callVisionAi("/api/face/identify", { method: "POST", body })) as IdentifyResponse;
    const matched = identification.match ? candidates.find((user) => user.id === identification.userId) : undefined;
    if (!matched) {
      return NextResponse.json({ match: false, error: "Face does not match an enrolled account" }, { status: 401 });
    }
    const similarity = identification.score ?? Math.max(...(identification.similarities ?? [0]));
    const punched = await punchLocalAttendance({
      userId: matched.id,
      name: matched.name,
      email: matched.email,
      similarity,
      direction: "auto",
      kioskId,
    });
    if (!punched.ok) return NextResponse.json({ error: punched.error, match: true, user: { name: matched.name } }, { status: punched.status });
    return NextResponse.json({
      match: true,
      direction: punched.direction,
      similarity,
      user: { id: matched.id, name: matched.name, email: matched.email },
      session: punched.session,
      kiosk_id: kioskId,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Kiosk identify failed",
    }, { status: 502 });
  }
}
