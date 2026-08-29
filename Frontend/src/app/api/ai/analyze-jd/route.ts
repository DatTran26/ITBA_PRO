import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { logAiUsage } from "@/lib/ai-usage-logger";
import { getAiConfig } from "@/lib/get-ai-config";
import { getChatParams } from "@/lib/ai-params";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
    try {
        const { apiKey, model } = await getAiConfig();
        if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
            return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey,
            timeout: 120_000,
        });

        const body = await request.json();
        const { job_description } = body;

        if (!job_description) {
            return NextResponse.json({ error: "job_description is required" }, { status: 400 });
        }

        const chatParams = getChatParams(model, {
            messages: [
                {
                    role: "system",
                    content: `You are an expert HR assistant. Analyze the given Job Description and extract the most appropriate main "Job Role" and "Seniority Level".

Known Roles: "Backend Developer", "Frontend Developer", "Full-Stack Developer", "Business Analyst", "QA Engineer", "DevOps Engineer", "Data Analyst", "Mobile Developer", "UI/UX Designer", "Project Manager". If the main job doesn't strongly match these, you can return a custom "Other" role string (e.g., "Data Scientist", "Product Owner", etc.), or suggest the best known role if close.

Also extract any additional related roles (Slide Roles). Map any of these additional roles that fit the Known Roles into an array \`slide_roles\`. Any other additional roles that don't fit the Known Roles should be put into \`custom_slide_roles\`.

Known Levels: "Junior", "Mid", "Senior". If the level isn't explicit, infer it from the required years of experience (e.g. 0-2=Junior, 2-5=Mid, 5+=Senior). If it's a lead/manager/principal position, return "Other" level (e.g., "Lead", "Principal", "Director").

Return ONLY a JSON object in this exact format:
{
  "job_role": "string",
  "level": "string",
  "is_custom_role": boolean,
  "is_custom_level": boolean,
  "slide_roles": [ "string" ],
  "custom_slide_roles": [ "string" ]
}`
                },
                {
                    role: "user",
                    content: `Job Description:\n"""\n${job_description}\n"""`
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000,
        });

        const response = await openai.chat.completions.create(chatParams);

        if (response.usage) {
            logAiUsage({
                feature: "analyze-jd",
                model: response.model || "gpt-4o",
                tokensIn: response.usage.prompt_tokens,
                tokensOut: response.usage.completion_tokens,
            });
        }

        const resultText = response.choices[0].message.content || "{}";
        const result = JSON.parse(resultText);

        return NextResponse.json(result);
    } catch (error) {
        console.error("JD Analysis Error:", error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: "Failed to analyze Job Description", detail: message }, { status: 500 });
    }
}
