import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/followup-sessions/[id]
 * Fetch a follow-up session by ID
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: session, error } = await supabase
        .from("follow_up_sessions")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
}

/**
 * PUT /api/followup-sessions/[id]
 * Update follow-up session questions (for editing)
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions)) {
        return NextResponse.json({ error: "questions array is required" }, { status: 400 });
    }

    const { data: session, error } = await supabase
        .from("follow_up_sessions")
        .update({ questions, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error || !session) {
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    return NextResponse.json({ success: true, session });
}

/**
 * DELETE /api/followup-sessions/[id]
 * Delete a follow-up session
 */
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("follow_up_sessions")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
