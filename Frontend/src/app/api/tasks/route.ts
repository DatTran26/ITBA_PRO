import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { logActivity } from "@/lib/crm/log-activity";
import { VALID_ENTITY_TYPES } from "@/lib/crm/constants";

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const { searchParams } = new URL(request.url);
    const entity_type = searchParams.get("entity_type");
    const entity_id = searchParams.get("entity_id");

    if (!entity_type || !entity_id) {
      return NextResponse.json({ error: "entity_type and entity_id are required" }, { status: 400 });
    }

    let query = supabase
      .from("crm_tasks")
      .select("*, users(name, email)")
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id)
      .order("status", { ascending: true })
      .order("due_date", { ascending: true });

    if (!isAdmin) query = query.eq("created_by", userId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    return NextResponse.json({ tasks: data });
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
    const { entity_type, entity_id, title, description, assignee_id, due_date } = body;

    if (!entity_type) return NextResponse.json({ error: "entity_type is required" }, { status: 400 });
    if (!VALID_ENTITY_TYPES.has(entity_type)) return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });
    if (!entity_id) return NextResponse.json({ error: "entity_id is required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("crm_tasks")
      .insert({ entity_type, entity_id, title, description: description || null, assignee_id: assignee_id || null, due_date: due_date || null, created_by: userId })
      .select("*, users(name, email)")
      .single();

    if (error) return NextResponse.json({ error: "Failed to create task" }, { status: 500 });

    logActivity(supabase, userId, entity_type, entity_id, "task_created", { task_id: data.id, title });

    return NextResponse.json({ task: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
