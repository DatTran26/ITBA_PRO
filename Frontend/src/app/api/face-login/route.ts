import { NextResponse, type NextRequest } from "next/server";
import { DEV_AUTH_COOKIE, isDevAuthEnabled, isLocalDevHost } from "@/lib/dev-auth";
import { callVisionAi, validateImage } from "@/lib/vision-ai";
import { findUserByEmail, getFaceEnrollment } from "@/lib/face-store";

export const runtime = "nodejs";
export const maxDuration = 300;

type VerifyResponse = {
  match: boolean;
  similarities: number[];
};

function createDevUserCookieValue(user: { id: string; authId?: string | null; name?: string | null; email: string; role: string }) {
  const payload = JSON.stringify({
    id: user.id,
    authId: user.authId ?? user.id,
    name: user.name ?? user.email,
    email: user.email,
    role: user.role,
  });
  return `user.${Buffer.from(payload, "utf8").toString("base64url")}`;
}

export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get("host") ?? request.nextUrl.hostname;
    if (!isDevAuthEnabled() || !isLocalDevHost(host)) {
      return NextResponse.json(
        { error: "Đăng nhập bằng khuôn mặt chỉ hỗ trợ ở môi trường dev local" },
        { status: 403 }
      );
    }

    const incoming = await request.formData().catch(() => null);
    if (!incoming) {
      return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ" }, { status: 400 });
    }

    const email = incoming.get("email");
    const image = incoming.get("image");
    if (typeof email !== "string" || !email.trim() || !validateImage(image)) {
      return NextResponse.json({ error: "Email và ảnh khuôn mặt là bắt buộc" }, { status: 400 });
    }

    // 1. Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản trong hệ thống" }, { status: 404 });
    }

    // 2. Check enrollment
    const enrollment = await getFaceEnrollment(user.id);

    // 3. Prepare payload for Python Vision AI
    const body = new FormData();
    body.append("image", image);
    body.append("userId", user.id);

    if (enrollment?.embeddings && Array.isArray(enrollment.embeddings)) {
      body.append("embeddings", JSON.stringify(enrollment.embeddings));
    }

    let verification: VerifyResponse;
    try {
      verification = (await callVisionAi("/api/face/verify", {
        method: "POST",
        body,
      })) as VerifyResponse;
    } catch (aiErr) {
      return NextResponse.json(
        { error: aiErr instanceof Error ? aiErr.message : "Xác thực khuôn mặt thất bại (lỗi AI)" },
        { status: 502 }
      );
    }

    if (!verification.match) {
      return NextResponse.json({ error: "Khuôn mặt không khớp với tài khoản" }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      redirectUrl: "/dashboard",
      user: { name: user.name, email: user.email, role: user.role },
      similarity: Math.max(...(verification.similarities ?? [1.0])),
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
    console.error("Error in /api/face-login:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Xác thực khuôn mặt thất bại do lỗi hệ thống" },
      { status: 500 }
    );
  }
}
