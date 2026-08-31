import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { logActivity } from "@/lib/crm/log-activity";
import { VALID_ENTITY_TYPES } from "@/lib/crm/constants";

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isHr, isInterviewer } = ctx;

  try {
    const { searchParams } = new URL(request.url);
    const entity_type = searchParams.get("entity_type");
    const entity_id = searchParams.get("entity_id");

    if (!entity_type || !entity_id) {
      return NextResponse.json({ error: "entity_type and entity_id are required" }, { status: 400 });
    }

    let query = supabase
      .from("notes")
      .select("*, users(name, email)")
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    // Admins, HR, and interviewers can see all notes; others see only their own
    if (!isAdmin && !isHr && !isInterviewer) query = query.eq("author_id", userId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    return NextResponse.json({ notes: data });
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
    const { entity_type, entity_id, content, note_type } = body;

    if (!entity_type) return NextResponse.json({ error: "entity_type is required" }, { status: 400 });
    if (!VALID_ENTITY_TYPES.has(entity_type)) return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });
    if (!entity_id) return NextResponse.json({ error: "entity_id is required" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("notes")
      .insert({ entity_type, entity_id, content, note_type: note_type || "general", author_id: userId })
      .select("*, users(name, email)")
      .single();

    if (error) {
      console.error("Supabase insert error in /api/notes:", error);
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }

    logActivity(supabase, userId, entity_type, entity_id, "added_note", { note_id: data.id });

    return NextResponse.json({ note: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
