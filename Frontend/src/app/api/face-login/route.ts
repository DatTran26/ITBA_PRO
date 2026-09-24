import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEV_AUTH_COOKIE,
  isDevAuthEnabled,
  isFaceLoginHostAllowed,
  isLocalDevHost,
  resolveRequestHostname,
} from "@/lib/dev-auth";
import { listActiveFaceEnrollments } from "@/lib/face-store";
import { userRequiresFaceReauth } from "@/lib/face-reauth";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi, validateImage } from "@/lib/vision-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

const FACE_LOGIN_ATTEMPT_WINDOW_MS = 60_000;
const FACE_LOGIN_MAX_ATTEMPTS = 5;
const faceLoginAttempts = new Map<string, { count: number; resetAt: number }>();

function isFaceLoginRateLimited(request: NextRequest) {
  const now = Date.now();
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientId = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const current = faceLoginAttempts.get(clientId);
  if (!current || current.resetAt <= now) {
    faceLoginAttempts.set(clientId, { count: 1, resetAt: now + FACE_LOGIN_ATTEMPT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > FACE_LOGIN_MAX_ATTEMPTS;
}

type IdentifyResponse = {
  match: boolean;
  userId?: string | null;
  similarities?: number[];
  score?: number;
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

async function attachSupabaseSession(request: NextRequest, response: NextResponse, email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase project configuration is incomplete.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    throw new Error(error?.message ?? "Unable to issue a sign-in session");
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: otpError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (otpError) {
    const { error: emailOtpError } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    if (emailOtpError) throw emailOtpError;
  }
}

export async function POST(request: NextRequest) {
  try {
    const host = resolveRequestHostname(request);
    if (!isFaceLoginHostAllowed(host)) {
      return NextResponse.json(
        { error: "Face ID sign-in is not enabled for this environment" },
        { status: 403 }
      );
    }

    if (isFaceLoginRateLimited(request)) {
      return NextResponse.json(
        { error: "Too many Face ID sign-in attempts. Please wait one minute before trying again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const incoming = await request.formData().catch(() => null);
    if (!incoming) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const image = incoming.get("image");
    if (!validateImage(image)) {
      return NextResponse.json({ error: "A face image is required" }, { status: 400 });
    }

    const candidates = await listActiveFaceEnrollments();
    if (!candidates.length) {
      return NextResponse.json(
        { error: "No enrolled Face ID profiles are available for sign-in" },
        { status: 404 }
      );
    }

    const body = new FormData();
    body.append("image", image);
    body.append(
      "gallery",
      JSON.stringify(candidates.map((user) => ({ userId: user.id, embeddings: user.embeddings })))
    );

    let identification: IdentifyResponse;
    try {
      identification = (await callVisionAi("/api/face/identify", {
        method: "POST",
        body,
      })) as IdentifyResponse;
    } catch (aiErr) {
      return NextResponse.json(
        { error: aiErr instanceof Error ? aiErr.message : "Face verification failed in Vision AI" },
        { status: 502 }
      );
    }

    const matched = identification.match
      ? candidates.find((user) => user.id === identification.userId)
      : undefined;
    if (!matched) {
      return NextResponse.json({ error: "Face does not match an enrolled account" }, { status: 401 });
    }

    if (await userRequiresFaceReauth(matched.id)) {
      return NextResponse.json(
        { error: "Face verification is required. Open the link from your administrator, or sign in with your password." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      redirectUrl: "/dashboard",
      user: { name: matched.name, email: matched.email, role: matched.role },
      similarity: identification.score ?? Math.max(...(identification.similarities ?? [1.0])),
    });

    try {
      await attachSupabaseSession(request, response, matched.email);
    } catch (sessionError) {
      const hostName = host.split(":")[0];
      if (!isDevAuthEnabled() || !isLocalDevHost(hostName)) {
        throw sessionError;
      }
      response.cookies.set(DEV_AUTH_COOKIE, createDevUserCookieValue(matched), {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }

    return response;
  } catch (error) {
    console.error("Error in /api/face-login:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Face verification failed due to a system error" },
      { status: 500 }
    );
  }
}
