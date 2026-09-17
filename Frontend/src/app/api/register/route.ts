import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isDevAuthEnabled, isLocalDevHost } from "@/lib/dev-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { findUserByEmail, saveFaceEnrollment } from "@/lib/face-store";
import { callVisionAi, validateImage } from "@/lib/vision-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request data" }, { status: 400 });

  const name = typeof form.get("name") === "string" ? String(form.get("name")).trim() : "";
  const email = typeof form.get("email") === "string" ? String(form.get("email")).trim().toLowerCase() : "";
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  const images = form.getAll("images");

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must contain at least 6 characters" }, { status: 400 });
  }
  if (images.length !== 6 || !images.every(validateImage)) {
    return NextResponse.json(
      { error: "Exactly six valid face images are required (JPEG, PNG, or WebP)" },
      { status: 400 }
    );
  }

  let admin: ReturnType<typeof createAdminClient> | null = null;
  let authId: string | null = null;
  let userId: string | null = null;
  let user: { id: string; email: string; name: string; role: string } | null = null;

  try {
    try {
      admin = createAdminClient();
      const { data: existing } = await admin.from("users").select("id").eq("email", email).maybeSingle();
      if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: "user" },
      });
      if (authError || !authData.user) throw authError ?? new Error("Unable to create account");
      authId = authData.user.id;

      const { data: createdUser, error: userError } = await admin
        .from("users")
        .insert({ auth_id: authId, email, name, role: "user" })
        .select("id, email, name, role")
        .single();
      if (userError || !createdUser) throw userError ?? new Error("Unable to create user profile");
      userId = createdUser.id;
      user = createdUser;
    } catch (supabaseErr) {
      const host = request.headers.get("host") ?? "";
      const isDevLocal = (isDevAuthEnabled() && isLocalDevHost(host)) || !process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!isDevLocal) throw supabaseErr;

      const existingLocal = await findUserByEmail(email);
      if (existingLocal) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      userId = `local-user-${randomUUID().slice(0, 8)}`;
      user = { id: userId, email, name, role: "user" };
    }

    if (!user) throw new Error("Unable to initialize user profile");

    const body = new FormData();
    body.append("userId", user.id);
    body.append("profileName", name);
    images.forEach((image) => body.append("images", image));
    const result = (await callVisionAi("/api/face/enroll", { method: "POST", body })) as {
      embeddings?: number[][];
    };
    if (!Array.isArray(result.embeddings) || result.embeddings.length !== 6) {
      throw new Error("Invalid response from Vision AI");
    }

    await saveFaceEnrollment(user, result.embeddings);
    return NextResponse.json({
      ok: true,
      message: "Account created. An administrator can now assign your access role.",
    });
  } catch (error) {
    if (userId && admin) await admin.from("users").delete().eq("id", userId);
    if (authId && admin) await admin.auth.admin.deleteUser(authId);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Account registration failed" },
      { status: 500 }
    );
  }
}
