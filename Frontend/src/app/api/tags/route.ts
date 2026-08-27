import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  // Suppress unused warning — request is implicit via URL
  void request;

  try {
    let query = supabase.from("tags").select("*").order("name", { ascending: true });

    if (!isAdmin) query = query.eq("created_by", userId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    return NextResponse.json({ tags: data });
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
    const { name, color } = body;

    const trimmedName = (name || "").trim();
    if (!trimmedName) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("tags")
      .insert({ name: trimmedName, color: color || "#7C8FFF", created_by: userId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    return NextResponse.json({ tag: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
