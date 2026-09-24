import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { getChatParams } from "@/lib/ai-params";
import { getAiConfig, type AiConfig } from "@/lib/get-ai-config";
import { logAiUsage } from "@/lib/ai-usage-logger";
import type { AiProvider } from "@/lib/ai-providers";

export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type ChatResult = {
    content: string;
    model: string;
    provider: AiProvider;
    tokensIn: number;
    tokensOut: number;
};

export async function completeChat(input: {
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
    json?: boolean;
    timeoutMs?: number;
    reasoningEffort?: "low" | "medium" | "high";
    feature?: string;
    userId?: string;
    modelOverride?: string;
}): Promise<ChatResult> {
    const config = await getAiConfig();
    if (!config.apiKey || config.apiKey === "YOUR_OPENAI_API_KEY_HERE") {
        throw new Error("AI API key is not configured in System Settings.");
    }

    const model = input.modelOverride || config.model;
    const result =
        config.provider === "gemini"
            ? await completeGemini(config, { ...input, model })
            : await completeOpenAi(config, { ...input, model });

    if (input.feature && (result.tokensIn || result.tokensOut)) {
        logAiUsage({
            userId: input.userId,
            feature: input.feature,
            model: result.model,
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            metadata: { provider: result.provider },
        });
    }

    return result;
}

async function completeOpenAi(
    config: AiConfig,
    input: {
        messages: ChatMessage[];
        maxTokens?: number;
        temperature?: number;
        json?: boolean;
        timeoutMs?: number;
        reasoningEffort?: "low" | "medium" | "high";
        model: string;
    },
): Promise<ChatResult> {
    const openai = new OpenAI({ apiKey: config.apiKey, timeout: input.timeoutMs ?? 120_000 });
    const chatParams = getChatParams(input.model, {
        messages: input.messages,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        reasoning_effort: input.reasoningEffort,
        response_format: input.json ? { type: "json_object" } : undefined,
    });
    const response = await openai.chat.completions.create(chatParams);
    return {
        content: response.choices[0]?.message?.content ?? "",
        model: response.model || input.model,
        provider: "openai",
        tokensIn: response.usage?.prompt_tokens ?? 0,
        tokensOut: response.usage?.completion_tokens ?? 0,
    };
}

async function completeGemini(
    config: AiConfig,
    input: {
        messages: ChatMessage[];
        maxTokens?: number;
        temperature?: number;
        json?: boolean;
        timeoutMs?: number;
        model: string;
    },
): Promise<ChatResult> {
    const system = input.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
    const contents = input.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    const timeoutMs = input.timeoutMs ?? 120_000;
    const response = await Promise.race([
        ai.models.generateContent({
            model: input.model,
            contents: contents.length ? contents : [{ role: "user", parts: [{ text: "Continue." }] }],
            config: {
                systemInstruction: system || undefined,
                maxOutputTokens: input.maxTokens,
                temperature: input.temperature,
                responseMimeType: input.json ? "application/json" : undefined,
            },
        }),
        new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Gemini request timed out")), timeoutMs);
        }),
    ]);

    const usage = response.usageMetadata;
    return {
        content: response.text?.trim() ?? "",
        model: input.model,
        provider: "gemini",
        tokensIn: usage?.promptTokenCount ?? 0,
        tokensOut: usage?.candidatesTokenCount ?? 0,
    };
}

export async function completeFilePrompt(input: {
    system: string;
    userText: string;
    fileBase64: string;
    mimeType: string;
    filename: string;
    json?: boolean;
    timeoutMs?: number;
}): Promise<ChatResult> {
    const config = await getAiConfig();
    if (!config.apiKey || config.apiKey === "YOUR_OPENAI_API_KEY_HERE") {
        throw new Error("AI API key is not configured in System Settings.");
    }

    if (config.provider === "gemini") {
        const ai = new GoogleGenAI({ apiKey: config.apiKey });
        const response = await ai.models.generateContent({
            model: config.model,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `${input.system}\n\n${input.userText}` },
                        { inlineData: { mimeType: input.mimeType, data: input.fileBase64 } },
                    ],
                },
            ],
            config: {
                responseMimeType: input.json ? "application/json" : undefined,
            },
        });
        const usage = response.usageMetadata;
        return {
            content: response.text?.trim() ?? "",
            model: config.model,
            provider: "gemini",
            tokensIn: usage?.promptTokenCount ?? 0,
            tokensOut: usage?.candidatesTokenCount ?? 0,
        };
    }

    const openai = new OpenAI({ apiKey: config.apiKey, timeout: input.timeoutMs ?? 120_000 });
    const response = await openai.chat.completions.create({
        model: config.model,
        messages: [
            { role: "system", content: input.system },
            {
                role: "user",
                content: [
                    {
                        type: "file",
                        file: {
                            filename: input.filename,
                            file_data: `data:${input.mimeType};base64,${input.fileBase64}`,
                        },
                    },
                    { type: "text", text: input.userText },
                ],
            },
        ],
        response_format: input.json ? { type: "json_object" } : undefined,
    });
    return {
        content: response.choices[0]?.message?.content ?? "",
        model: response.model || config.model,
        provider: "openai",
        tokensIn: response.usage?.prompt_tokens ?? 0,
        tokensOut: response.usage?.completion_tokens ?? 0,
    };
}

export async function transcribeAudio(input: {
    bytes: Buffer;
    filename: string;
    mimeType: string;
}): Promise<{ text: string; provider: AiProvider; model: string }> {
    const config = await getAiConfig();
    if (!config.apiKey || config.apiKey === "YOUR_OPENAI_API_KEY_HERE") {
        throw new Error("AI API key is not configured in System Settings.");
    }

    if (config.provider === "gemini") {
        const ai = new GoogleGenAI({ apiKey: config.apiKey });
        const response = await ai.models.generateContent({
            model: config.model,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Transcribe this audio verbatim. Return only the transcript text." },
                        { inlineData: { mimeType: input.mimeType, data: input.bytes.toString("base64") } },
                    ],
                },
            ],
        });
        return { text: response.text?.trim() ?? "", provider: "gemini", model: config.model };
    }

    const openai = new OpenAI({ apiKey: config.apiKey, timeout: 300_000 });
    const whisperFile = await OpenAI.toFile(input.bytes, input.filename, { type: input.mimeType });
    const transcription = await openai.audio.transcriptions.create({
        file: whisperFile,
        model: "whisper-1",
    });
    return { text: transcription.text, provider: "openai", model: "whisper-1" };
}
