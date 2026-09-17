import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { completeChat } from "@/lib/ai-complete";
import { getAiConfig } from "@/lib/get-ai-config";
import { resolveModel } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DEFAULT_PROMPT = "Reply with exactly: API OK";

export async function POST(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.isAdmin) {
        return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const start = Date.now();
    try {
        const config = await getAiConfig();
        if (!config.apiKey) {
            return NextResponse.json({
                success: false,
                error: "AI API key is not configured in System Settings.",
                latencyMs: Date.now() - start,
            }, { status: 400 });
        }

        const body = await request.json().catch(() => ({}));
        const prompt: string = body.prompt?.trim() || DEFAULT_PROMPT;
        const testModel = body.model?.trim()
            ? resolveModel(config.provider, body.model.trim())
            : config.model;

        const result = await completeChat({
            messages: [{ role: "user", content: prompt }],
            maxTokens: 1024,
            reasoningEffort: "low",
            timeoutMs: 120_000,
            modelOverride: testModel,
        });

        return NextResponse.json({
            success: true,
            response: result.content,
            model: result.model,
            provider: result.provider,
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            latencyMs: Date.now() - start,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[AI-TEST-API-ERROR]", error);
        return NextResponse.json({
            success: false,
            error: `AI Core Error: ${message}`,
            latencyMs: Date.now() - start,
        }, { status: 500 });
    }
}
