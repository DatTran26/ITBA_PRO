import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: test, error } = await supabase
        .from("tests")
        .select("*, questions(*, id, question_text, options, correct_answer, topic, difficulty, explanation, order_num), results(*, id, candidate_name, candidate_email, score, total_questions, time_taken, submitted_at, ai_analysis)")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    // Sort questions by order_num
    if (test.questions) {
        test.questions.sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num);
    }

    return NextResponse.json({ test });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { status, target_type, position_id, group_id } = body;
    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {};
    if (status !== undefined) updatePayload.status = status;
    if (target_type !== undefined) updatePayload.target_type = target_type;
    if (position_id !== undefined) updatePayload.position_id = position_id;
    if (group_id !== undefined) updatePayload.group_id = group_id;

    const { data: test, error } = await supabase
        .from("tests")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ test });
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
        .from("tests")
        .delete()
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
