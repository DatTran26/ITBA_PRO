import { NextResponse } from "next/server";
import { getAuthContext, isAuthError, type AuthContext } from "@/lib/api/auth-helpers";

async function verifyGroupOwnership(supabase: AuthContext["supabase"], id: string, userId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("id")
    .eq("id", id)
    .eq("created_by", userId)
    .single();
  return !error && !!data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    if (!isAdmin) {
      const owned = await verifyGroupOwnership(supabase, id, userId);
      if (!owned) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("group_members")
      .select("*, persons(id, full_name, email, type, department, current_level, position_id)")
      .eq("group_id", id)
      .order("added_at", { ascending: true });

    if (error) return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    return NextResponse.json({ members: data });
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
    const owned = await verifyGroupOwnership(supabase, id, userId);
    if (!owned) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const body = await request.json();
    const { person_id } = body;
    if (!person_id) return NextResponse.json({ error: "person_id is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("group_members")
      .insert({ group_id: id, person_id })
      .select("*, persons(id, full_name, email, type)")
      .single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Person already in group" }, { status: 409 });
      return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }
    return NextResponse.json({ member: data }, { status: 201 });
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
    const owned = await verifyGroupOwnership(supabase, id, userId);
    if (!owned) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const body = await request.json();
    const { person_id } = body;
    if (!person_id) return NextResponse.json({ error: "person_id is required" }, { status: 400 });

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("person_id", person_id);

    if (error) return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
