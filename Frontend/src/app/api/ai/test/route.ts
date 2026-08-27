import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { getChatParams } from "@/lib/ai-params";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Increased to 120s for reasoning models

const DEFAULT_PROMPT = "Reply with exactly: API OK";

export async function POST(request: Request) {
    // Require admin auth — also gives us a user-session Supabase client
    // that can read system_settings via RLS (no service role key needed).
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.isAdmin) {
        return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const start = Date.now();
    try {
        // Read AI config directly via admin session
        const { data: settings } = await ctx.supabase
            .from("system_settings")
            .select("key, value")
            .in("key", ["openai_api_key", "ai_model"]);

        const map = new Map((settings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value]));
        const apiKey = typeof map.get("openai_api_key") === "string" ? (map.get("openai_api_key") as string) : "";
        const dbModel = typeof map.get("ai_model") === "string" ? (map.get("ai_model") as string) : "gpt-4o";

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "OpenAI API key is not configured in System Settings.", latencyMs: Date.now() - start }, { status: 400 });
        }

        const body = await request.json().catch(() => ({}));
        const prompt: string = body.prompt?.trim() || DEFAULT_PROMPT;
        const testModel: string = body.model?.trim() || dbModel;

        const openai = new OpenAI({ apiKey, timeout: 120_000 }); // Explicit 120s timeout

        // Use reasoning_effort: "low" to ensure the test is FAST while maintaining quality
        const chatParams = getChatParams(testModel, {
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
            reasoning_effort: "low",
        });

        const response = await openai.chat.completions.create(chatParams);

        const latencyMs = Date.now() - start;
        return NextResponse.json({
            success: true,
            response: response.choices[0].message.content ?? "",
            model: response.model,
            tokensIn: response.usage?.prompt_tokens ?? 0,
            tokensOut: response.usage?.completion_tokens ?? 0,
            latencyMs,
        });
    } catch (error: any) {
        // Standardize error reporting — ensure it's not HTML being sent back
        const message = error.message || String(error);
        console.error("[AI-TEST-API-ERROR]", error);
        return NextResponse.json({
            success: false,
            error: `AI Core Error: ${message}`,
            latencyMs: Date.now() - start
        }, { status: 500 });
    }
}
