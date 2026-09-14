import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s timeout for vision OCR

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
]);

const VISION_PROMPT = `You are an expert OCR engine. Accurately transcribe ALL visible text from this image, including:
- Printed text
- Handwritten text
- Table contents (preserve structure with | separators)
- Numbers, dates, codes
- Headers, footers, watermarks

Rules:
1. Preserve the original language — do NOT translate.
2. Maintain line breaks and paragraph structure.
3. For tables, use markdown table format.
4. If text is unclear, mark it as [unclear].
5. Return ONLY the extracted text, no commentary.`;

export async function POST(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    try {
        const formData = await request.formData();
        const file = (formData.get("file") || formData.get("image")) as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const mimeType = file.type?.toLowerCase();
        if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
            return NextResponse.json(
                {
                    error: `Unsupported file type: ${mimeType}. Allowed: PNG, JPG, JPEG, WEBP.`,
                },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > MAX_UPLOAD_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum allowed size is 10 MB." },
                { status: 413 }
            );
        }

        if (buffer.length === 0) {
            return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
        }

        const b64Str = buffer.toString("base64");
        const imageB64 = `data:${mimeType};base64,${b64Str}`;

        // Attempt 1: Gemini Vision API (process.env.GEMINI_API_KEY or system_settings)
        let geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "";
        if (!geminiKey) {
            const { data: setting } = await ctx.supabase
                .from("system_settings")
                .select("value")
                .eq("key", "gemini_api_key")
                .maybeSingle();
            if (setting?.value && typeof setting.value === "string") {
                geminiKey = setting.value;
            }
        }

        if (geminiKey) {
            try {
                const text = await extractViaGemini(b64Str, mimeType, geminiKey);
                if (text) {
                    return NextResponse.json({
                        text,
                        image_b64: imageB64,
                        status: "success",
                        engine: "gemini-vision",
                    });
                }
            } catch (geminiErr) {
                console.warn("[OCR] Gemini Vision failed, attempting fallbacks:", geminiErr);
            }
        }

        // Attempt 2: Local FastAPI Python OCR Backend if reachable
        try {
            const fastApiRes = await fetch("http://localhost:8000/api/ocr/scan", {
                method: "POST",
                body: (() => {
                    const pyForm = new FormData();
                    const blob = new Blob([buffer], { type: mimeType });
                    pyForm.append("file", blob, file.name);
                    return pyForm;
                })(),
                signal: AbortSignal.timeout(10_000),
            });
            if (fastApiRes.ok) {
                const pyData = await fastApiRes.json();
                return NextResponse.json({
                    text: pyData.text,
                    image_b64: pyData.image_b64 || imageB64,
                    status: "success",
                    engine: "fastapi-local",
                });
            }
        } catch {
            // FastAPI backend not running or timed out — proceed to OpenAI fallback
        }

        // Attempt 3: OpenAI GPT-4o Vision fallback
        let openAiKey = process.env.OPENAI_API_KEY || "";
        if (!openAiKey) {
            const { data: setting } = await ctx.supabase
                .from("system_settings")
                .select("value")
                .eq("key", "openai_api_key")
                .maybeSingle();
            if (setting?.value && typeof setting.value === "string") {
                openAiKey = setting.value;
            }
        }

        if (openAiKey && openAiKey !== "YOUR_OPENAI_API_KEY_HERE") {
            try {
                const text = await extractViaOpenAI(imageB64, openAiKey);
                if (text) {
                    return NextResponse.json({
                        text,
                        image_b64: imageB64,
                        status: "success",
                        engine: "openai-vision",
                    });
                }
            } catch (openAiErr) {
                console.error("[OCR] OpenAI Vision fallback failed:", openAiErr);
            }
        }

        return NextResponse.json(
            {
                error: "No OCR service available. Please configure GEMINI_API_KEY or OPENAI_API_KEY in environment/settings or start the local OCR backend.",
            },
            { status: 503 }
        );
    } catch (err: any) {
        console.error("[OCR-API-ERROR]", err);
        return NextResponse.json(
            { error: err?.message || "Failed to process image OCR" },
            { status: 500 }
        );
    }
}

async function extractViaGemini(b64Data: string, mimeType: string, apiKey: string): Promise<string> {
    const models = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
    let lastError: any = null;

    for (const model of models) {
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: VISION_PROMPT },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: b64Data,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192,
                    },
                }),
                signal: AbortSignal.timeout(30_000),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (typeof text === "string") {
                return text.trim();
            }
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error("Gemini Vision failed across all model fallbacks");
}

async function extractViaOpenAI(imageB64Url: string, apiKey: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: VISION_PROMPT,
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: { url: imageB64Url },
                        },
                        {
                            type: "text",
                            text: "Extract all text from this image precisely.",
                        },
                    ],
                },
            ],
            temperature: 0.1,
            max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(35_000),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
}
