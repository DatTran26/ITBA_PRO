import { NextResponse, type NextRequest } from "next/server";
import { DEV_AUTH_COOKIE, isDevAuthEnabled, isLocalDevHost } from "@/lib/dev-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi, validateImage } from "@/lib/vision-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

type VerifyResponse = {
  match: boolean;
  similarities: number[];
};

function createDevUserCookieValue(user: { id: string; auth_id?: string | null; name?: string | null; email: string; role: string }) {
  const payload = JSON.stringify({
    id: user.id,
    authId: user.auth_id ?? user.id,
    name: user.name ?? user.email,
    email: user.email,
    role: user.role,
  });
  return `user.${Buffer.from(payload, "utf8").toString("base64url")}`;
}

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.hostname;
  if (!isDevAuthEnabled() || !isLocalDevHost(host)) {
    return NextResponse.json(
      { error: "Face login is enabled for local testing only. Use Supabase Auth flow for production." },
      { status: 403 },
    );
  }

  const incoming = await request.formData();
  const email = incoming.get("email");
  const image = incoming.get("image");
  if (typeof email !== "string" || !email.trim() || !validateImage(image)) {
    return NextResponse.json({ error: "Email và ảnh khuôn mặt là bắt buộc" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: user, error: userError } = await admin
    .from("users")
    .select("id, auth_id, name, email, role")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });

  const { data: enrollment, error: faceError } = await admin
    .from("user_face_embeddings")
    .select("embedding_json")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (faceError) return NextResponse.json({ error: faceError.message }, { status: 500 });
  if (!enrollment) return NextResponse.json({ error: "Tài khoản chưa đăng ký khuôn mặt 4 góc" }, { status: 409 });

  const body = new FormData();
  body.append("image", image);
  body.append("embeddings", JSON.stringify(enrollment.embedding_json));

  try {
    const verification = await callVisionAi("/api/face/verify", { method: "POST", body }) as VerifyResponse;
    if (!verification.match) {
      return NextResponse.json({ error: "Khuôn mặt không khớp với tài khoản" }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      redirectUrl: "/dashboard",
      user: { name: user.name, email: user.email, role: user.role },
      similarity: Math.max(...verification.similarities),
    });
    response.cookies.set(DEV_AUTH_COOKIE, createDevUserCookieValue(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Xác thực khuôn mặt thất bại" },
      { status: 502 },
    );
  }
}
