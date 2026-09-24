import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { callVisionAi, canManageVision, validateImage } from "@/lib/vision-ai";
import { getAllFaceUsers, saveFaceEnrollment, deleteFaceEnrollment } from "@/lib/face-store";
import { completeFaceReauthForUser } from "@/lib/face-reauth";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await getAllFaceUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load face enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const incoming = await request.formData();
  const userId = incoming.get("userId");
  const images = incoming.getAll("images");
  if (typeof userId !== "string" || !userId || images.length !== 6 || !images.every(validateImage)) {
    return NextResponse.json({ error: "userId and exactly six JPEG, PNG, or WebP images are required" }, { status: 400 });
  }

  const users = await getAllFaceUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = new FormData();
  body.append("userId", userId);
  body.append("profileName", target.name);
  images.forEach((image) => body.append("images", image));

  try {
    const result = await callVisionAi("/api/face/enroll", { method: "POST", body }) as { embeddings: number[][] };
    if (!Array.isArray(result.embeddings) || result.embeddings.length !== 6) throw new Error("Invalid enroll response");

    await saveFaceEnrollment(target, result.embeddings);
    await completeFaceReauthForUser(userId);

    return NextResponse.json({
      enrollment: {
        id: `enroll-${userId}`,
        user_id: userId,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Face enrollment failed" }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  try {
    await deleteFaceEnrollment(userId);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Face enrollment delete failed" }, { status: 502 });
  }
}
