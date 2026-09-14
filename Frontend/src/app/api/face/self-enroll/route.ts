import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { callVisionAi, validateImage } from "@/lib/vision-ai";
import { getFaceEnrollment, saveFaceEnrollment, deleteFaceEnrollment } from "@/lib/face-store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  try {
    const enrollment = await getFaceEnrollment(ctx.userId);
    return NextResponse.json({
      enrolled: !!enrollment,
      enrollment: enrollment ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể kiểm tra trạng thái khuôn mặt" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const incoming = await request.formData().catch(() => null);
  if (!incoming) {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ" }, { status: 400 });
  }

  const images = incoming.getAll("images");
  if (images.length !== 6 || !images.every(validateImage)) {
    return NextResponse.json(
      { error: "Cần đúng 6 ảnh khuôn mặt hợp lệ (JPEG, PNG hoặc WebP)" },
      { status: 400 }
    );
  }

  const body = new FormData();
  body.append("userId", ctx.userId);
  images.forEach((image) => body.append("images", image));

  try {
    const result = (await callVisionAi("/api/face/enroll", {
      method: "POST",
      body,
    })) as { embeddings: number[][] };

    if (!Array.isArray(result.embeddings) || result.embeddings.length !== 6) {
      throw new Error("Phản hồi từ Vision AI không hợp lệ");
    }

    await saveFaceEnrollment(
      { id: ctx.userId, email: ctx.userId, role: ctx.role },
      result.embeddings
    );

    return NextResponse.json({
      ok: true,
      message: "Đăng ký khuôn mặt thành công!",
      enrollment: {
        id: `enroll-${ctx.userId}`,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đăng ký khuôn mặt thất bại" },
      { status: 502 }
    );
  }
}

export async function DELETE() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  try {
    await deleteFaceEnrollment(ctx.userId);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Xóa đăng ký khuôn mặt thất bại" },
      { status: 500 }
    );
  }
}
