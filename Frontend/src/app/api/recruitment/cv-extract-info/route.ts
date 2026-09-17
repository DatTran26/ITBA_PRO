import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { completeFilePrompt } from "@/lib/ai-complete";

export const maxDuration = 30;

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

        const fileBytes = await file.arrayBuffer();
        const base64 = Buffer.from(fileBytes).toString("base64");
        const isPdf = file.type === "application/pdf";
        const mediaType = isPdf
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        const result = await completeFilePrompt({
            system: `Extract ONLY the candidate's full name and email from this CV/resume file.
Return ONLY valid JSON: {"name": "Full Name", "email": "email@example.com"}
If not found, use empty string. No explanations. No markdown fences.`,
            userText: "Extract the candidate name and email from this CV.",
            fileBase64: base64,
            mimeType: mediaType,
            filename: file.name,
            json: true,
        });

        let parsed: { name?: string; email?: string };
        try {
            const cleaned = result.content.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = {};
        }

        const rawName = typeof parsed.name === "string" ? parsed.name.trim() : "";
        const name = rawName ? toTitleCase(rawName) : "";
        const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
        return NextResponse.json({ name, email });
    } catch (err) {
        console.error("[cv-extract-info] Error:", err);
        return NextResponse.json({ name: "", email: "" });
    }
}
