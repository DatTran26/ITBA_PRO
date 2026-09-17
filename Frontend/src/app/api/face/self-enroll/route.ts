import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { callVisionAi, validateImage } from "@/lib/vision-ai";
import { getAllFaceUsers, getFaceEnrollment, saveFaceEnrollment } from "@/lib/face-store";
import { completeFaceReauthForUser, getPendingFaceReauth, userRequiresFaceReauth } from "@/lib/face-reauth";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  try {
    const enrollment = await getFaceEnrollment(ctx.userId);
    const pending = await getPendingFaceReauth(ctx.userId);
    const reauthRequired = Boolean(pending) || (await userRequiresFaceReauth(ctx.userId));
    return NextResponse.json({
      enrolled: !!enrollment,
      enrollment: enrollment ?? null,
      reauthRequired,
      canSelfEnroll: Boolean(pending),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to check face enrollment status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const pending = await getPendingFaceReauth(ctx.userId);
  if (!pending) {
    return NextResponse.json(
      { error: "An administrator must send a face verification link before you can update your face" },
      { status: 403 }
    );
  }

  const incoming = await request.formData().catch(() => null);
  if (!incoming) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  const images = incoming.getAll("images");
  if (images.length !== 6 || !images.every(validateImage)) {
    return NextResponse.json(
      { error: "Exactly six valid face images are required (JPEG, PNG, or WebP)" },
      { status: 400 }
    );
  }

  const body = new FormData();
  const users = await getAllFaceUsers();
  const profile = users.find((user) => user.id === ctx.userId) ?? {
    id: ctx.userId,
    email: ctx.userId,
    name: ctx.userId,
    role: ctx.role,
  };
  body.append("userId", ctx.userId);
  body.append("profileName", profile.name);
  images.forEach((image) => body.append("images", image));

  try {
    const result = (await callVisionAi("/api/face/enroll", {
      method: "POST",
      body,
    })) as { embeddings: number[][] };

    if (!Array.isArray(result.embeddings) || result.embeddings.length !== 6) {
      throw new Error("Invalid response from Vision AI");
    }

    await saveFaceEnrollment(profile, result.embeddings);
    await completeFaceReauthForUser(ctx.userId, pending.id);

    return NextResponse.json({
      ok: true,
      message: "Face enrolled successfully!",
      enrollment: {
        id: `enroll-${ctx.userId}`,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Face enrollment failed" },
      { status: 502 }
    );
  }
}

export async function DELETE() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  return NextResponse.json(
    { error: "Only an administrator can delete a face enrollment from Face Management" },
    { status: 403 }
  );
}
