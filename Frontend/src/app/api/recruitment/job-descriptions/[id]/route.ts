import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CAN_WRITE = (role: string, isAdmin: boolean) => isAdmin || role === "interviewer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, role } = ctx;
  if (!isAdmin && role !== "interviewer" && !isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_descriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ jobDescription: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, role } = ctx;
  if (!CAN_WRITE(role, isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { title, role_key, department, seniority, required_skills, full_text, auto_reject_threshold, is_active } = body ?? {};

  if (title !== undefined && !title?.trim()) {
    return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
  }
  if (full_text !== undefined && full_text.length > 20480) {
    return NextResponse.json({ error: "full_text exceeds 20 KB limit" }, { status: 400 });
  }
  if (auto_reject_threshold !== undefined && auto_reject_threshold !== null) {
    if (!Number.isInteger(auto_reject_threshold) || auto_reject_threshold < 0 || auto_reject_threshold > 100) {
      return NextResponse.json({ error: "auto_reject_threshold must be 0–100" }, { status: 400 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (role_key !== undefined) updates.role_key = role_key;
  if (department !== undefined) updates.department = department;
  if (seniority !== undefined) updates.seniority = seniority;
  if (required_skills !== undefined) updates.required_skills = required_skills;
  if (full_text !== undefined) updates.full_text = full_text;
  if (auto_reject_threshold !== undefined) updates.auto_reject_threshold = auto_reject_threshold;
  if (is_active !== undefined) updates.is_active = is_active;

  const admin = createAdminClient();
  const { error } = await admin.from("job_descriptions").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, role } = ctx;
  if (!CAN_WRITE(role, isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Soft-delete: check if referenced by applications
  const { count } = await admin
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("job_description_id", id);

  if ((count ?? 0) > 0) {
    // Soft delete via is_active=false
    await admin.from("job_descriptions").update({ is_active: false }).eq("id", id);
    return NextResponse.json({ success: true, softDeleted: true });
  }

  const { error } = await admin.from("job_descriptions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true, softDeleted: false });
}
