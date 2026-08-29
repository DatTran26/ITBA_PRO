import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function GET(_request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    let query = supabase
      .from("positions")
      .select("*, position_skill_requirements(count)")
      .order("created_at", { ascending: false });

    if (!isAdmin) query = query.eq("created_by", userId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
    return NextResponse.json({ positions: data });
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
    const { title, department, description, target_level } = body;

    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("positions")
      .insert({ title, department, description, target_level, created_by: userId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create position" }, { status: 500 });

    /* Clone skill requirements from source position */
    if (body.clone_from && data) {
      const { data: srcReqs } = await supabase
        .from("position_skill_requirements")
        .select("skill_id, required_level, is_mandatory, checklist_order")
        .eq("position_id", body.clone_from);

      if (srcReqs?.length) {
        await supabase.from("position_skill_requirements").insert(
          srcReqs.map((r) => ({ ...r, position_id: data.id }))
        );
      }
    }

    return NextResponse.json({ position: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
