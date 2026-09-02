import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("groups")
      .select("*, group_members(count)")
      .order("created_at", { ascending: false });

    if (!isAdmin) query = query.eq("created_by", userId);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    return NextResponse.json({ groups: data });
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
    const { name, type, description } = body;

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("groups")
      .insert({ name, type, description, created_by: userId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    return NextResponse.json({ group: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
