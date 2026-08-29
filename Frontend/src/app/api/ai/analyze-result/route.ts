import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { performAiAnalysis } from "@/lib/ai-analyzer";

export const maxDuration = 120;

export async function POST(request: Request) {
    const supabase = await createClient();
    const { result_id } = await request.json();

    if (!result_id) return NextResponse.json({ error: "Missing result_id" }, { status: 400 });

    // Fetch result
    const { data: result, error: resultError } = await supabase
        .from("results")
        .select("*, tests(*, questions(*))")
        .eq("id", result_id)
        .single();

    if (resultError || !result) {
        return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    if (result.ai_analysis) {
        return NextResponse.json({
            ai_analysis: result.ai_analysis,
            suggested_questions: result.suggested_questions
        });
    }

    try {
        const aiData = await performAiAnalysis({
            answers: result.answers || [],
            questions: result.tests?.questions || [],
            job_role: result.tests?.job_role || "Unknown",
            level: result.tests?.level || "Unknown",
            candidate_name: result.candidate_name || "Unknown",
        });

        // Save back to result
        await supabase.from("results").update({
            ai_analysis: aiData.analysis,
            suggested_questions: aiData.suggested_questions
        }).eq("id", result_id);

        return NextResponse.json({
            ai_analysis: aiData.analysis,
            suggested_questions: aiData.suggested_questions
        });
    } catch (err) {
        console.error(`AI analysis failed for result ${result_id}:`, err);
        return NextResponse.json({
            error: "AI analysis failed",
            detail: err instanceof Error ? err.message : String(err)
        }, { status: 500 });
    }
}
