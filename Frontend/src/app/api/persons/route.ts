import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isHr } = ctx;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase.from("persons").select("*, positions(title, department)").order("created_at", { ascending: false });

    // Admins and HR can see all persons; others see only records they created
    if (!isAdmin && !isHr) query = query.eq("created_by", userId);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch persons" }, { status: 500 });
    return NextResponse.json({ persons: data });
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
    const { full_name, email, type, department, position_id, current_level, joined_date, phone, notes } = body;

    if (!full_name) return NextResponse.json({ error: "full_name is required" }, { status: 400 });
    if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("persons")
      .insert({ full_name, email, type, department, position_id, current_level, joined_date, phone, notes, created_by: userId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create person" }, { status: 500 });
    return NextResponse.json({ person: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
