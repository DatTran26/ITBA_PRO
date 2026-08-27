import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { getAiConfig } from "@/lib/get-ai-config";
import OpenAI from "openai";

export async function POST(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    try {
        const { jdText } = await request.json();

        if (!jdText || typeof jdText !== "string" || jdText.trim().length < 10) {
            return NextResponse.json(
                { error: "Vui lòng nhập mô tả công việc (ít nhất 10 ký tự)" },
                { status: 422 }
            );
        }

        const { apiKey, model } = await getAiConfig();
        const openai = new OpenAI({ apiKey });

        const SENIORITY_VALUES = ["intern", "junior", "mid", "senior", "lead", "manager"];

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: `You are a recruitment assistant. Analyze the given Job Description (JD) text and extract the most accurate JOB TITLE, SENIORITY, and a CLEANED version of the JD.

RULES FOR "title":
1. Be precise and identify specialized roles (e.g., "ERP Developer", "System Integration Engineer", "Odoo Developer", "Dynamics 365 Specialist").
2. Do NOT just default to general titles like "Backend Engineer" if the JD emphasizes a specific system, domain, or integration (like ERP, CRM, SAP, Data Pipeline).
3. The title should be in English and concise.

RULES FOR "seniority":
1. Choose EXACTLY one from: ${SENIORITY_VALUES.join(", ")}.
- intern: Learning role / student.
- junior: 0-2 years, basic tasks.
- mid: 3-5 years, independent execution (often mentioned as 3+ years experience).
- senior: 5+ years, deep domain knowledge.
- lead: Technical leadership / Architecture decisions.
- manager: Team management / People management.

RULES FOR "cleanedJd":
1. Format visually to be well-structured and highly professional. Remove redundant top-level headers in the text like "Mô tả công việc", "Job Description", "Yêu cầu", etc. only if they are just acting as the title. Just output the meat of the content formatted nicely by group.
2. Fix typos and alignment issues but DO NOT change the core meaning or requirements.
3. Organize logically. Use standard bullet points (-) and line breaks.
4. Ensure every bullet point or sentence ends with a period (.).
5. Keep it in its original language (mostly Vietnamese).

Return ONLY valid JSON: {"title": "...", "seniority": "...", "cleanedJd": "..."}
No explanations. No markdown. Just the JSON object.`,
                },
                {
                    role: "user",
                    content: jdText.trim().slice(0, 5000),
                },
            ],
        });

        const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";

        // Parse JSON, handle possible markdown wrapping
        let parsed: { title?: string; seniority?: string; cleanedJd?: string };
        try {
            const cleaned = raw.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = {};
        }

        const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
        const seniority =
            typeof parsed.seniority === "string" && SENIORITY_VALUES.includes(parsed.seniority)
                ? parsed.seniority
                : "";
        const cleanedJd = typeof parsed.cleanedJd === "string" ? parsed.cleanedJd.trim() : "";

        return NextResponse.json({ title, seniority, cleanedJd });
    } catch (err) {
        console.error("[jd-parse] Error:", err);
        return NextResponse.json(
            { error: "AI parsing failed. Please try again." },
            { status: 500 }
        );
    }
}
