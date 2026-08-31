import { NextResponse } from "next/server";
import OpenAI from "openai";
import { logAiUsage } from "@/lib/ai-usage-logger";
import { getAiConfig } from "@/lib/get-ai-config";
import { getChatParams } from "@/lib/ai-params";

export const maxDuration = 120;

export async function POST(request: Request) {
    const body = await request.json();
    const { instruction } = body;

    if (!instruction) {
        return NextResponse.json({ error: "Missing instruction" }, { status: 400 });
    }

    const { apiKey, model } = await getAiConfig();

    if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
        return NextResponse.json({ enhanced: `Please focus strongly on: ${instruction}, evaluating the candidate thoroughly.` });
    }

    try {
        const openai = new OpenAI({ apiKey, timeout: 120_000 });
        const chatParams = getChatParams(model, {
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
}`
                },
                {
                    role: "user",
                    content: instruction
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1000,
        });

        const response = await openai.chat.completions.create(chatParams);

        if (response.usage) {
            logAiUsage({
                feature: "enhance-instruction",
                model: response.model || "gpt-4o",
                tokensIn: response.usage.prompt_tokens,
                tokensOut: response.usage.completion_tokens,
            });
        }

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) throw new Error("Empty response");

        const parsed = JSON.parse(content);

        return NextResponse.json({
            enhanced: parsed.enhanced || instruction,
            preset: parsed.preset || "balanced"
        });
    } catch (err) {
        console.error("OpenAI API error:", err);
        return NextResponse.json({ error: "Enhancement failed" }, { status: 500 });
    }
}
