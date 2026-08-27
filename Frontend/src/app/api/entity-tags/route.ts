import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { logActivity } from "@/lib/crm/log-activity";
import { VALID_ENTITY_TYPES } from "@/lib/crm/constants";

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    const body = await request.json();
    const { tag_id, entity_type, entity_id } = body;

    if (!tag_id) return NextResponse.json({ error: "tag_id is required" }, { status: 400 });
    if (!entity_type) return NextResponse.json({ error: "entity_type is required" }, { status: 400 });
    if (!VALID_ENTITY_TYPES.has(entity_type)) return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });
    if (!entity_id) return NextResponse.json({ error: "entity_id is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("entity_tags")
      .insert({ tag_id, entity_type, entity_id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to attach tag" }, { status: 500 });

    logActivity(supabase, userId, entity_type, entity_id, "tag_added", { tag_id });

    return NextResponse.json({ entity_tag: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId } = ctx;

  try {
    const body = await request.json();
    const { tag_id, entity_type, entity_id } = body;

    if (!tag_id) return NextResponse.json({ error: "tag_id is required" }, { status: 400 });
    if (!entity_type) return NextResponse.json({ error: "entity_type is required" }, { status: 400 });
    if (!entity_id) return NextResponse.json({ error: "entity_id is required" }, { status: 400 });

    const { error } = await supabase
      .from("entity_tags")
      .delete()
      .eq("tag_id", tag_id)
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id);

    if (error) return NextResponse.json({ error: "Failed to detach tag" }, { status: 500 });

    logActivity(supabase, userId, entity_type, entity_id, "tag_removed", { tag_id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
