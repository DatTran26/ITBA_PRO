import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canIssueFaceReauth,
  issueFaceReauthRequest,
  revokeFaceReauthRequest,
} from "@/lib/face-reauth";

export const runtime = "nodejs";

function publicErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function requestOrigin(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (appUrl) return appUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canIssueFaceReauth(ctx.role)) {
    return NextResponse.json({ error: "Only an administrator can view face verification requests" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("face_reauth_requests")
      .select("id, user_id, created_by, expires_at, used_at, revoked_at, created_at")
      .is("used_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) throw error;

    const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
    const { data: users } = userIds.length
      ? await admin.from("users").select("id, email, name, role").in("id", userIds)
      : { data: [] as Array<{ id: string; email: string; name: string; role: string }> };
    const userMap = new Map((users ?? []).map((user) => [user.id, user]));

    return NextResponse.json({
      requests: (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        email: userMap.get(row.user_id)?.email ?? null,
        name: userMap.get(row.user_id)?.name ?? null,
        role: userMap.get(row.user_id)?.role ?? null,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        createdBy: row.created_by,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: publicErrorMessage(error, "Unable to load face verification requests") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canIssueFaceReauth(ctx.role)) {
    return NextResponse.json({ error: "Only an administrator can create a face verification link" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  try {
    const issued = await issueFaceReauthRequest({
      userId,
      email: typeof body?.email === "string" ? body.email : undefined,
      createdBy: ctx.userId,
      origin: requestOrigin(request),
    });
    return NextResponse.json({ ok: true, request: issued });
  } catch (error) {
    const message = publicErrorMessage(error, "Unable to create the face verification link");
    const status = message === "Account not found" || message.includes("local placeholder") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canIssueFaceReauth(ctx.role)) {
    return NextResponse.json({ error: "Only an administrator can revoke a face verification link" }, { status: 403 });
  }

  const requestId = request.nextUrl.searchParams.get("id")?.trim() ?? "";
  const userId = request.nextUrl.searchParams.get("userId")?.trim() ?? "";
  if (!requestId && !userId) {
    return NextResponse.json({ error: "id or userId is required" }, { status: 400 });
  }

  try {
    if (requestId) {
      await revokeFaceReauthRequest(requestId);
    } else {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("face_reauth_requests")
        .select("id")
        .eq("user_id", userId)
        .is("used_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      await revokeFaceReauthRequest(data.id);
    }
    return NextResponse.json({ ok: true, revoked: true });
  } catch (error) {
    const message = publicErrorMessage(error, "Unable to revoke the face verification link");
    const status = message === "Request not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
