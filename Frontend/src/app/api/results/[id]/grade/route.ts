import { createClient } from "@/lib/supabase/server";
import { recomputeResultScore } from "@/lib/grading/recompute-result-score";
import { NextResponse } from "next/server";

const MAX_NOTE_LENGTH = 5000;

// PATCH: grade a single manual answer (Đạt/Không đạt) then recompute the result's score + status.
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: resultId } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { question_id, is_correct, note } = body as {
            question_id?: string;
            is_correct?: boolean;
            note?: string;
        };

        if (typeof question_id !== "string" || typeof is_correct !== "boolean") {
            return NextResponse.json({ error: "question_id and is_correct (boolean) are required" }, { status: 400 });
        }
        if (note !== undefined && (typeof note !== "string" || note.length > MAX_NOTE_LENGTH)) {
            return NextResponse.json({ error: "Invalid note" }, { status: 400 });
        }

        const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", user.id)
            .single();

        const updateFields: Record<string, unknown> = {
            is_correct,
            graded_by: userData?.id ?? null,
            graded_at: new Date().toISOString(),
        };
        if (note !== undefined) updateFields.note = note;

        const { error: updateError } = await supabase
            .from("answer_grades")
            .update(updateFields)
            .eq("result_id", resultId)
            .eq("question_id", question_id);

        if (updateError) return NextResponse.json({ error: "Failed to save grade" }, { status: 500 });

        const recomputed = await recomputeResultScore(supabase, resultId);

        const { data: result } = await supabase
            .from("results")
            .select("test_id")
            .eq("id", resultId)
            .single();

        if (result?.test_id) {
            const { revalidatePath } = await import("next/cache");
            revalidatePath(`/dashboard/tests/${result.test_id}`);
            revalidatePath(`/dashboard/results/${resultId}`);
        }

        return NextResponse.json({ success: true, ...recomputed });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
