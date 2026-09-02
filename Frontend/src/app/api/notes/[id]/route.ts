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
    const { content, is_pinned, note_type } = body;

    // Fetch existing note — scope to author unless admin
    let fetchQuery = supabase
      .from("notes")
      .select("entity_type, entity_id, is_pinned")
      .eq("id", id);
    if (!isAdmin) fetchQuery = fetchQuery.eq("author_id", userId);
    const { data: existing, error: fetchError } = await fetchQuery.single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;
    if (note_type !== undefined) updates.note_type = note_type;

    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", id)
      .select("*, users(name, email)")
      .single();

    if (error) return NextResponse.json({ error: "Failed to update note" }, { status: 500 });

    // Determine action label
    let action = "updated_note";
    if (is_pinned === true && !existing.is_pinned) action = "pinned_note";
    else if (is_pinned === false && existing.is_pinned) action = "unpinned_note";

    logActivity(supabase, userId, existing.entity_type, existing.entity_id, action, { note_id: id });

    return NextResponse.json({ note: data });
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

    // Fetch entity context — scope to author unless admin
    let fetchQuery = supabase
      .from("notes")
      .select("entity_type, entity_id")
      .eq("id", id);
    if (!isAdmin) fetchQuery = fetchQuery.eq("author_id", userId);
    const { data: existing, error: fetchError } = await fetchQuery.single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });

    logActivity(supabase, userId, existing.entity_type, existing.entity_id, "deleted_note", { note_id: id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
