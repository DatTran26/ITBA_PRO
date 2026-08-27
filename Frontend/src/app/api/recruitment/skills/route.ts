import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, isInterviewer } = ctx;
  if (!isAdmin && !isHr && !isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("skills")
    .select("id, name, category")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }

  return NextResponse.json({ skills: data ?? [] });
}
