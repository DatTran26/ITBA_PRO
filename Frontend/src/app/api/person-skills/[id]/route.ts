import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { logActivity } from "@/lib/crm/log-activity";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    const { id } = await params;
    const body = await request.json();
    const { current_level } = body;

    if (current_level === undefined) {
      return NextResponse.json({ error: "current_level is required" }, { status: 400 });
    }

    // Fetch existing to get person context for activity log
    const { data: existing, error: fetchError } = await supabase
      .from("person_skills")
      .select("person_id, skill_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Person skill not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("person_skills")
      .update({ current_level })
      .eq("id", id)
      .select("*, skills(name, category)")
      .single();

    if (error) return NextResponse.json({ error: "Failed to update skill level" }, { status: 500 });

    logActivity(supabase, userId, "person", existing.person_id, "skill_level_updated", {
      skill_id: existing.skill_id,
      skill_name: data.skills?.name,
      new_level: current_level,
    });

    return NextResponse.json({ person_skill: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    const { id } = await params;

    // Fetch entity context before deletion
    const { data: existing, error: fetchError } = await supabase
      .from("person_skills")
      .select("person_id, skill_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Person skill not found" }, { status: 404 });
    }

    const { error } = await supabase.from("person_skills").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Failed to remove skill" }, { status: 500 });

    logActivity(supabase, userId, "person", existing.person_id, "skill_removed", {
      skill_id: existing.skill_id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
