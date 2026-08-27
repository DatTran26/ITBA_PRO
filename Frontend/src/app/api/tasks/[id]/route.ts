import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { logActivity } from "@/lib/crm/log-activity";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, title, description, assignee_id, due_date } = body;

    // Fetch entity context — scope to creator unless admin
    let fetchQuery = supabase
      .from("crm_tasks")
      .select("entity_type, entity_id")
      .eq("id", id);
    if (!isAdmin) fetchQuery = fetchQuery.eq("created_by", userId);
    const { data: existing, error: fetchError } = await fetchQuery.single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assignee_id !== undefined) updates.assignee_id = assignee_id;
    if (due_date !== undefined) updates.due_date = due_date;

    const { data, error } = await supabase
      .from("crm_tasks")
      .update(updates)
      .eq("id", id)
      .select("*, users(name, email)")
      .single();

    if (error) return NextResponse.json({ error: "Failed to update task" }, { status: 500 });

    const changedFields = Object.keys(updates).filter((k) => k !== "updated_at");
    logActivity(supabase, userId, existing.entity_type, existing.entity_id, "task_updated", { task_id: id, changed: changedFields });

    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const { id } = await params;

    // Fetch entity context — scope to creator unless admin
    let fetchQuery = supabase
      .from("crm_tasks")
      .select("entity_type, entity_id")
      .eq("id", id);
    if (!isAdmin) fetchQuery = fetchQuery.eq("created_by", userId);
    const { data: existing, error: fetchError } = await fetchQuery.single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { error } = await supabase.from("crm_tasks").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });

    logActivity(supabase, userId, existing.entity_type, existing.entity_id, "task_deleted", { task_id: id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
