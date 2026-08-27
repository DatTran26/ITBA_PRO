import type { SupabaseClient } from "@supabase/supabase-js";

interface StoredAnswer {
    question_id: string;
    is_correct?: boolean | null;
    requires_manual?: boolean;
}

export interface RecomputedScore {
    score: number;
    total_questions: number;
    grading_status: "pending_grading" | "graded";
}

// Single source of truth for a result's score + grading status.
// score = auto-correct answers (results.answers) + manual answers graded Đạt (answer_grades).
// grading_status = pending_grading while any answer_grades row is ungraded (is_correct IS NULL), else graded.
export async function recomputeResultScore(
    client: SupabaseClient,
    resultId: string
): Promise<RecomputedScore> {
    const { data: result } = await client
        .from("results")
        .select("answers, total_questions")
        .eq("id", resultId)
        .single();

    const answers = (result?.answers ?? []) as StoredAnswer[];
    const autoCorrect = answers.filter((a) => !a.requires_manual && a.is_correct === true).length;

    const { data: grades } = await client
        .from("answer_grades")
        .select("is_correct")
        .eq("result_id", resultId);

    const manualPass = (grades ?? []).filter((g) => g.is_correct === true).length;
    const hasUngraded = (grades ?? []).some((g) => g.is_correct === null);

    const score = autoCorrect + manualPass;
    const grading_status: RecomputedScore["grading_status"] = hasUngraded ? "pending_grading" : "graded";

    await client.from("results").update({ score, grading_status }).eq("id", resultId);

    return { score, total_questions: result?.total_questions ?? 0, grading_status };
}
