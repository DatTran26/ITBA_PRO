import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { callVisionAi } from "@/lib/vision-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Endpoint for super_admin to view and configure the local machine directory
 * where face images and embeddings are stored.
 */
export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!ctx.isSuperAdmin) {
    return NextResponse.json(
      { error: "Chỉ Super Admin mới có quyền xem và chỉnh cấu hình đường dẫn lưu trữ" },
      { status: 403 }
    );
  }

  try {
    const config = await callVisionAi("/api/face/storage-config", { method: "GET" });
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể lấy cấu hình lưu trữ" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!ctx.isSuperAdmin) {
    return NextResponse.json(
      { error: "Chỉ Super Admin mới có quyền thay đổi đường dẫn lưu trữ dữ liệu" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const storagePath = typeof body.storagePath === "string" ? body.storagePath.trim() : "";

  if (!storagePath) {
    return NextResponse.json({ error: "Đường dẫn thư mục lưu trữ không được để trống" }, { status: 400 });
  }

  try {
    const form = new FormData();
    form.append("storagePath", storagePath);

    const result = await callVisionAi("/api/face/storage-config", {
      method: "POST",
      body: form,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật đường dẫn lưu trữ" },
      { status: 502 }
    );
  }
}
