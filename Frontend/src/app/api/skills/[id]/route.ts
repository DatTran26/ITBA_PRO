import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

const PATCH_WHITELIST = ["name", "category", "description"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    let query = supabase.from("skills").select("*").eq("id", id);
    if (!isAdmin) query = query.eq("created_by", userId);

    const { data, error } = await query.single();
    if (error) return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    return NextResponse.json({ skill: data });
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

    const { data, error } = await supabase
      .from("skills")
      .update(updateFields)
      .eq("id", id)
      .eq("created_by", userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
    return NextResponse.json({ skill: data });
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
      .from("skills")
      .delete()
      .eq("id", id)
      .eq("created_by", userId);

    if (error) return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
