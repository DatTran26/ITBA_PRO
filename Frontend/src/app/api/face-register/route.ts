import { NextResponse, type NextRequest } from "next/server";
import { isDevAuthEnabled, isLocalDevHost } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";
import { callVisionAi, validateImage } from "@/lib/vision-ai";
import { findUserByEmail, saveFaceEnrollment } from "@/lib/face-store";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Face registration from login page.
 * User specifies email (+ password if in production), then submits 6 face images.
 * Works seamlessly in both local dev (saving to disk) and production (disk + Supabase).
 */
export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData().catch(() => null);
    if (!incoming) {
      return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ" }, { status: 400 });
    }

    const email = incoming.get("email");
    const password = incoming.get("password");
    const images = incoming.getAll("images");

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email là bắt buộc" }, { status: 400 });
    }
    if (images.length !== 6 || !images.every(validateImage)) {
      return NextResponse.json(
        { error: "Cần đúng 6 ảnh khuôn mặt hợp lệ (JPEG, PNG hoặc WebP)" },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") ?? request.nextUrl.hostname;
    const isDevLocal = isDevAuthEnabled() && isLocalDevHost(host);

    // 1. Locate user record
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản trong hệ thống" }, { status: 404 });
    }

    // 2. In production, require password verification with Supabase
    if (!isDevLocal) {
      if (typeof password !== "string" || !password) {
        return NextResponse.json({ error: "Mật khẩu là bắt buộc để đăng ký khuôn mặt" }, { status: 400 });
      }
      try {
        const supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError || !authData.user) {
          return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
        }
        await supabase.auth.signOut().catch(() => {});
      } catch (authErr) {
        return NextResponse.json(
          { error: authErr instanceof Error ? authErr.message : "Xác thực tài khoản thất bại" },
          { status: 401 }
        );
      }
    }

    // 3. Forward 6 images to Python Vision AI to extract embeddings & persist on local disk
    const body = new FormData();
    body.append("userId", user.id);
    images.forEach((image) => body.append("images", image));

    let result: { embeddings: number[][] };
    try {
      result = (await callVisionAi("/api/face/enroll", {
        method: "POST",
        body,
      })) as { embeddings: number[][] };
    } catch (aiErr) {
      return NextResponse.json(
        { error: aiErr instanceof Error ? aiErr.message : "Không thể kết nối đến hệ thống nhận diện khuôn mặt" },
        { status: 502 }
      );
    }

    if (!Array.isArray(result.embeddings) || result.embeddings.length !== 6) {
      return NextResponse.json({ error: "Phản hồi từ Vision AI không hợp lệ" }, { status: 502 });
    }

    // 4. Save to local registry and Supabase (if available)
    await saveFaceEnrollment(user, result.embeddings);

    return NextResponse.json({
      ok: true,
      message: "Đăng ký khuôn mặt thành công! Bây giờ bạn có thể đăng nhập bằng khuôn mặt.",
      userId: user.id,
    });
  } catch (err) {
    console.error("Error in /api/face-register:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Đăng ký khuôn mặt thất bại do lỗi hệ thống" },
      { status: 500 }
    );
  }
}
