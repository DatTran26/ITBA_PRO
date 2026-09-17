import { NextResponse, type NextRequest } from "next/server";
import { callVisionAi, validateImage } from "@/lib/vision-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveFaceEnrollment } from "@/lib/face-store";
import {
  completeFaceReauthForUser,
  claimFaceReauthByToken,
  describeFaceReauthState,
  findFaceReauthByToken,
  releaseFaceReauthClaim,
} from "@/lib/face-reauth";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!token) return NextResponse.json({ error: "A verification token is required" }, { status: 400 });

  try {
    const row = await findFaceReauthByToken(token);
    const invalid = describeFaceReauthState(row);
    if (!row || invalid) {
      return NextResponse.json({ error: invalid ?? "This face verification link is invalid." }, { status: 410 });
    }

    const admin = createAdminClient();
    const { data: user, error } = await admin
      .from("users")
      .select("id, email, name")
      .eq("id", row.user_id)
      .maybeSingle();
    if (error) throw error;
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    return NextResponse.json({
      ok: true,
      expiresAt: row.expires_at,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to validate the face verification link" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const incoming = await request.formData().catch(() => null);
  if (!incoming) return NextResponse.json({ error: "Invalid request data" }, { status: 400 });

  const token = typeof incoming.get("token") === "string" ? String(incoming.get("token")).trim() : "";
  const images = incoming.getAll("images");
  if (!token) return NextResponse.json({ error: "A verification token is required" }, { status: 400 });
  if (images.length !== 6 || !images.every(validateImage)) {
    return NextResponse.json(
      { error: "Exactly six valid face images are required (JPEG, PNG, or WebP)" },
      { status: 400 }
    );
  }

  let claim: { id: string; usedAt: string } | null = null;
  try {
    const row = await claimFaceReauthByToken(token);
    if (!row || !row.used_at) {
      return NextResponse.json({ error: "This face verification link is invalid, expired, revoked, or already in use." }, { status: 410 });
    }
    claim = { id: row.id, usedAt: row.used_at };

    const admin = createAdminClient();
    const { data: user, error } = await admin
      .from("users")
      .select("id, email, name, role")
      .eq("id", row.user_id)
      .maybeSingle();
    if (error) throw error;
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const body = new FormData();
    body.append("userId", user.id);
    body.append("profileName", user.name ?? user.email);
    images.forEach((image) => body.append("images", image));

    const result = (await callVisionAi("/api/face/enroll", { method: "POST", body })) as {
      embeddings?: number[][];
    };
    if (!Array.isArray(result.embeddings) || result.embeddings.length !== 6) {
      throw new Error("Invalid response from Vision AI");
    }

    await saveFaceEnrollment(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      result.embeddings
    );
    await completeFaceReauthForUser(user.id, row.id, { requireClaim: true });
    claim = null;

    return NextResponse.json({
      ok: true,
      message: "Face verified. You can now sign in with Face ID.",
    });
  } catch (error) {
    if (claim) {
      try {
        await releaseFaceReauthClaim(claim.id, claim.usedAt);
      } catch (releaseError) {
        console.error("Unable to release failed face re-authentication claim", releaseError);
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Face verification failed" },
      { status: 502 }
    );
  }
}
