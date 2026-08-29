import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { getAiConfig } from "@/lib/get-ai-config";

export const maxDuration = 30;

/** Convert to Title Case: "TRAN TAN DAT" → "Tran Tan Dat" */
function toTitleCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase())
        .trim();
}

export async function POST(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 422 });
        }

        const { apiKey, model } = await getAiConfig();

        const fileBytes = await file.arrayBuffer();
        const base64 = Buffer.from(fileBytes).toString("base64");

        const isPdf = file.type === "application/pdf";
        const mediaType = isPdf
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        // Quick call: only extract name + email
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
                        content: `Extract ONLY the candidate's full name and email from this CV/resume file.
Return ONLY valid JSON: {"name": "Full Name", "email": "email@example.com"}
If not found, use empty string. No explanations. No markdown fences.`,
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "file",
                                file: {
                                    filename: file.name,
                                    file_data: `data:${mediaType};base64,${base64}`,
                                },
                            },
                            {
                                type: "text",
                                text: "Extract the candidate name and email from this CV.",
                            },
                        ],
                    },
                ],
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[cv-extract-info] OpenAI error:", errBody);
            return NextResponse.json({ name: "", email: "" });
        }

        const json = await res.json();
        const raw = json.choices?.[0]?.message?.content?.trim() ?? "{}";

        let parsed: { name?: string; email?: string };
        try {
            const cleaned = raw.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = {};
        }

        const rawName = typeof parsed.name === "string" ? parsed.name.trim() : "";
        const name = rawName ? toTitleCase(rawName) : "";
        const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
        console.log("[cv-extract-info] Parsed:", { name, email });

        return NextResponse.json({ name, email });
    } catch (err) {
        console.error("[cv-extract-info] Error:", err);
        return NextResponse.json({ name: "", email: "" });
    }
}
