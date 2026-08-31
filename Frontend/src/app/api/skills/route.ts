import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase.from("skills").select("*").order("name", { ascending: true });
    if (!isAdmin) query = query.eq("created_by", userId);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
    return NextResponse.json({ skills: data });
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
    const { name, category, description } = body;

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("skills")
      .insert({ name, category, description, created_by: userId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
    return NextResponse.json({ skill: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
