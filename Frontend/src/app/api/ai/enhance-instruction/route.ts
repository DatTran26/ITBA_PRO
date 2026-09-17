import { NextResponse } from "next/server";
import { completeChat } from "@/lib/ai-complete";

export const maxDuration = 120;

export async function POST(request: Request) {
    const body = await request.json();
    const { instruction } = body;

    if (!instruction) {
        return NextResponse.json({ error: "Missing instruction" }, { status: 400 });
    }

    try {
        const response = await completeChat({
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant for IT recruiters. Rewrite the user's short notes into a comprehensive, professional instruction sentence (or short paragraph) that tells an AI test generator what to focus on when generating interview questions.
You must also analyze the instruction and select the most appropriate test matrix preset among:
- 'balanced': standard mix of theoretical questions and practical scenarios. Good default.
- 'optimized': heavily focuses on specific role traits or targeted skills/frameworks.
- 'practical': focuses purely on deep case studies, logical patterns, complex technical usage, and scenarios. No simple choices.

Respond ONLY with a JSON object in this format:
{
  "enhanced": "The rewritten instruction...",
  "preset": "balanced" | "optimized" | "practical"
}`,
                },
                { role: "user", content: instruction },
            ],
            json: true,
            maxTokens: 1000,
            feature: "enhance-instruction",
        });

        const parsed = JSON.parse(response.content.trim() || "{}");
        return NextResponse.json({
            enhanced: parsed.enhanced || instruction,
            preset: parsed.preset || "balanced",
        });
    } catch (err) {
        console.error("AI enhance-instruction error:", err);
        return NextResponse.json({
            enhanced: `Please focus strongly on: ${instruction}, evaluating the candidate thoroughly.`,
        });
    }
}
