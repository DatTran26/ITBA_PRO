import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

const PATCH_WHITELIST = ["full_name", "email", "type", "department", "position_id", "current_level", "joined_date", "phone", "notes", "status"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    let query = supabase.from("persons").select("*, positions(title, department)").eq("id", id);
    if (!isAdmin) query = query.eq("created_by", userId);

    const { data, error } = await query.single();
    if (error) return NextResponse.json({ error: "Person not found" }, { status: 404 });
    return NextResponse.json({ person: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    const body = await request.json();
    const updateFields: Record<string, unknown> = {};
    for (const key of PATCH_WHITELIST) {
      if (key in body) updateFields[key] = body[key];
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updateFields.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("persons")
      .update(updateFields)
      .eq("id", id)
      .eq("created_by", userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to update person" }, { status: 500 });
    return NextResponse.json({ person: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    const { error } = await supabase
      .from("persons")
      .delete()
      .eq("id", id)
      .eq("created_by", userId);

    if (error) return NextResponse.json({ error: "Failed to delete person" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
