import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { getAiConfig } from "@/lib/get-ai-config";
import { callVisionOcr } from "@/lib/vision-ocr";

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

        // Attempt 1: Vision OCR sidecar (Gemini + Tesseract, grounded blocks)
        try {
            const pyForm = new FormData();
            const blob = new Blob([buffer], { type: mimeType });
            pyForm.append("file", blob, file.name);
            const fastApiRes = await callVisionOcr("/api/ocr/scan", {
                method: "POST",
                body: pyForm,
                signal: AbortSignal.timeout(45_000),
            });
            if (fastApiRes.ok) {
                const pyData = await fastApiRes.json();
                return NextResponse.json({
                    text: pyData.text,
                    image_b64: pyData.image_b64 || imageB64,
                    blocks: pyData.blocks || [],
                    status: "success",
                    engine: pyData.engine || "fastapi-grounded",
                });
            }
        } catch {
            // FastAPI backend not running or timed out — proceed to direct Gemini fallback
        }

        // Attempt 2: configured provider from System Settings (DB first)
        const ai = await getAiConfig();
        if (ai.apiKey) {
            try {
                const text = ai.provider === "gemini"
                    ? await extractViaGemini(b64Str, mimeType, ai.apiKey, ai.model)
                    : await extractViaOpenAI(imageB64, ai.apiKey, ai.model);
                if (text) {
                    return NextResponse.json({
                        text,
                        image_b64: imageB64,
                        blocks: [],
                        status: "success",
                        engine: ai.provider === "gemini" ? "gemini-vision" : "openai-vision",
                    });
                }
            } catch (visionErr) {
                console.warn("[OCR] Configured provider vision failed:", visionErr);
            }
        }

        return NextResponse.json(
            {
                error: "No OCR service available. Configure the AI provider API key in System Settings or set VISION_OCR_URL.",
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

async function extractViaGemini(b64Data: string, mimeType: string, apiKey: string, preferredModel?: string): Promise<string> {
    const models = [preferredModel, "gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"].filter(
        (m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i
    );
    let lastError: any = null;

    for (const model of models) {
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                },
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

async function extractViaOpenAI(imageB64Url: string, apiKey: string, model = "gpt-4o"): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
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
