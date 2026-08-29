import { NextResponse } from "next/server";
import { performAiAnalysis } from "@/lib/ai-analyzer";

export const maxDuration = 120;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { answers, questions, job_role, level, candidate_name } = body;

        if (!answers || !questions) {
            return NextResponse.json({ error: "Missing required data" }, { status: 400 });
        }

        const result = await performAiAnalysis({
            answers,
            questions,
            job_role,
            level,
            candidate_name,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[api/ai/analyze] Error:", err);
        return NextResponse.json({
            error: "Internal Server Error",
            detail: err instanceof Error ? err.message : String(err)
        }, { status: 500 });
    }
}
