import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { logActivity } from "@/lib/crm/log-activity";

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase } = ctx;

  try {
    const { searchParams } = new URL(request.url);
    const person_id = searchParams.get("person_id");

    if (!person_id) {
      return NextResponse.json({ error: "person_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("person_skills")
      .select("*, skills(name, category)")
      .eq("person_id", person_id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Failed to fetch person skills" }, { status: 500 });
    return NextResponse.json({ person_skills: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    const body = await request.json();
    const { person_id, skill_id, current_level } = body;

    if (!person_id) return NextResponse.json({ error: "person_id is required" }, { status: 400 });
    if (!skill_id) return NextResponse.json({ error: "skill_id is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("person_skills")
      .insert({ person_id, skill_id, current_level: current_level ?? 1 })
      .select("*, skills(name, category)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This skill is already assigned to this person" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
    }

    logActivity(supabase, userId, "person", person_id, "skill_added", {
      skill_id,
      skill_name: data.skills?.name,
      level: current_level ?? 1,
    });

    return NextResponse.json({ person_skill: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
