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
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const email = incoming.get("email");
    const password = incoming.get("password");
    const images = incoming.getAll("images");

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (images.length !== 6 || !images.every(validateImage)) {
      return NextResponse.json(
        { error: "Exactly six valid face images are required (JPEG, PNG, or WebP)" },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") ?? request.nextUrl.hostname;
    const isDevLocal = isDevAuthEnabled() && isLocalDevHost(host);

    // 1. Locate user record
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // 2. In production, require password verification with Supabase
    if (!isDevLocal) {
      if (typeof password !== "string" || !password) {
        return NextResponse.json({ error: "Password is required to register a face" }, { status: 400 });
      }
      try {
        const supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError || !authData.user) {
          return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
        }
        await supabase.auth.signOut().catch(() => {});
      } catch (authErr) {
        return NextResponse.json(
          { error: authErr instanceof Error ? authErr.message : "Account verification failed" },
          { status: 401 }
        );
      }
    }

    // 3. Forward 6 images to Python Vision AI to extract embeddings & persist on local disk
    const body = new FormData();
    body.append("userId", user.id);
    body.append("profileName", user.name);
    images.forEach((image) => body.append("images", image));

    let result: { embeddings: number[][] };
    try {
      result = (await callVisionAi("/api/face/enroll", {
        method: "POST",
        body,
      })) as { embeddings: number[][] };
    } catch (aiErr) {
      return NextResponse.json(
        { error: aiErr instanceof Error ? aiErr.message : "Unable to connect to the face recognition service" },
        { status: 502 }
      );
    }

    if (!Array.isArray(result.embeddings) || result.embeddings.length !== 6) {
      return NextResponse.json({ error: "Invalid response from Vision AI" }, { status: 502 });
    }

    // 4. Save to local registry and Supabase (if available)
    await saveFaceEnrollment(user, result.embeddings);

    return NextResponse.json({
      ok: true,
      message: "Face registered successfully. You can now sign in with Face ID.",
      userId: user.id,
    });
  } catch (err) {
    console.error("Error in /api/face-register:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Face registration failed due to a system error" },
      { status: 500 }
    );
  }
}
