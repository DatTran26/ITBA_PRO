import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CAN_WRITE = (role: string, isAdmin: boolean, isHr: boolean) => isAdmin || role === "interviewer" || isHr;
const CAN_READ = (role: string, isAdmin: boolean, isHr: boolean) =>
  isAdmin || role === "interviewer" || isHr;

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, role } = ctx;
  if (!CAN_READ(role, isAdmin, isHr)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_descriptions")
    .select("id, title, role_key, department, seniority, required_skills, auto_reject_threshold, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch job descriptions" }, { status: 500 });
  return NextResponse.json({ jobDescriptions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, role, userId } = ctx;
  if (!CAN_WRITE(role, isAdmin, isHr)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { title, role_key, department, seniority, required_skills, full_text, auto_reject_threshold } = body ?? {};

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (full_text && full_text.length > 20480) {
    return NextResponse.json({ error: "full_text exceeds 20 KB limit" }, { status: 400 });
  }
  if (auto_reject_threshold !== undefined && auto_reject_threshold !== null) {
    if (!Number.isInteger(auto_reject_threshold) || auto_reject_threshold < 0 || auto_reject_threshold > 100) {
      return NextResponse.json({ error: "auto_reject_threshold must be 0–100" }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_descriptions")
    .insert({
      title: title.trim(),
      role_key: role_key ?? null,
      department: department ?? null,
      seniority: seniority ?? null,
      required_skills: required_skills ?? [],
      full_text: full_text ?? "",
      auto_reject_threshold: auto_reject_threshold ?? null,
      is_active: true,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create job description" }, { status: 500 });
  return NextResponse.json({ jobDescription: data }, { status: 201 });
}
