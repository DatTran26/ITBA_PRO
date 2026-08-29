import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase } = ctx;

  try {
    const { data, error } = await supabase
      .from("skill_categories")
      .select("id, name, description, display_order")
      .order("display_order", { ascending: true });

    if (error) return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    return NextResponse.json({ categories: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, isAdmin } = ctx;

  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { name, description } = body;
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("skill_categories")
      .insert({ name, description })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    return NextResponse.json({ category: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
