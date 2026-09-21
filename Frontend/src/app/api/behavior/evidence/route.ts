import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { canManageVision } from "@/lib/vision-ai";
import { resolveSafeEvidenceFile } from "@/lib/workplace-local";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rel = new URL(request.url).searchParams.get("path") ?? "";
  const filePath = resolveSafeEvidenceFile(rel);
  if (!filePath) return NextResponse.json({ error: "Invalid evidence path" }, { status: 400 });

  try {
    const bytes = await fs.readFile(filePath);
    const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }
}
