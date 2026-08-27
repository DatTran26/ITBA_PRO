import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    // Verify position ownership before listing requirements
    let posQuery = supabase.from("positions").select("id").eq("id", id);
    if (!isAdmin) posQuery = posQuery.eq("created_by", userId);
    const { data: pos, error: posErr } = await posQuery.single();
    if (posErr || !pos) return NextResponse.json({ error: "Position not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("position_skill_requirements")
      .select("*, skills(name, category, description)")
      .eq("position_id", id)
      .order("checklist_order", { ascending: true });

    if (error) return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 });
    return NextResponse.json({ requirements: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    // Verify position ownership
    const { data: pos, error: posErr } = await supabase
      .from("positions").select("id").eq("id", id).eq("created_by", userId).single();
    if (posErr || !pos) return NextResponse.json({ error: "Position not found" }, { status: 404 });

    const body = await request.json();
    const { skill_id, required_level = 3, is_mandatory = false, checklist_order = 0 } = body;

    if (!skill_id) return NextResponse.json({ error: "skill_id is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("position_skill_requirements")
      .insert({ position_id: id, skill_id, required_level, is_mandatory, checklist_order })
      .select("*, skills(name, category)")
      .single();

    if (error) return NextResponse.json({ error: "Failed to add requirement" }, { status: 500 });
    return NextResponse.json({ requirement: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    // Verify position ownership
    const { data: pos, error: posErr } = await supabase
      .from("positions").select("id").eq("id", id).eq("created_by", userId).single();
    if (posErr || !pos) return NextResponse.json({ error: "Position not found" }, { status: 404 });

    const body = await request.json();
    const { requirement_id } = body;
    if (!requirement_id) return NextResponse.json({ error: "requirement_id is required" }, { status: 400 });

    const { error } = await supabase
      .from("position_skill_requirements")
      .delete()
      .eq("id", requirement_id)
      .eq("position_id", id);

    if (error) return NextResponse.json({ error: "Failed to delete requirement" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
