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

  const admin = createAdminClient();
  const [{ data: users, error: usersError }, { data: enrollments, error: facesError }] = await Promise.all([
    admin.from("users").select("id, name, email, role").order("name"),
    admin.from("user_face_embeddings").select("id, user_id, created_at").order("created_at", { ascending: false }),
  ]);
  if (usersError || facesError) {
    return NextResponse.json({ error: usersError?.message ?? facesError?.message }, { status: 500 });
  }
  const enrolledByUser = new Map((enrollments ?? []).map((item) => [item.user_id, item]));
  return NextResponse.json({
    users: (users ?? []).map((user) => ({ ...user, enrollment: enrolledByUser.get(user.id) ?? null })),
  });
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

  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("id").eq("id", userId).maybeSingle();
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = new FormData();
  body.append("userId", userId);
  images.forEach((image) => body.append("images", image));

  try {
    const result = await callVisionAi("/api/face/enroll", { method: "POST", body }) as { embeddings: number[][] };
    if (!Array.isArray(result.embeddings) || result.embeddings.length !== 6) throw new Error("Invalid enroll response");
    await admin.from("user_face_embeddings").delete().eq("user_id", userId);
    const { data, error } = await admin
      .from("user_face_embeddings")
      .insert({ user_id: userId, embedding_json: result.embeddings })
      .select("id, user_id, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ enrollment: data });
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
    await callVisionAi(`/api/face/enroll/${encodeURIComponent(userId)}`, { method: "DELETE" });
    const { error } = await createAdminClient().from("user_face_embeddings").delete().eq("user_id", userId);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Face enrollment delete failed" }, { status: 502 });
  }
}
