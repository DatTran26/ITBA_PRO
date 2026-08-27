import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { logAiUsage } from "@/lib/ai-usage-logger";
import { getAiConfig } from "@/lib/get-ai-config";
import { getChatParams } from "@/lib/ai-params";

// Allow up to 120 seconds for AI generation
export const maxDuration = 300;

export async function POST(request: Request) {
    const body = await request.json();
    const { job_role, level, test_id, job_description, test_description, question_count = 10, position_id } = body;

    if (!job_role || !level || !test_id) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch position context if provided
    let positionContext = '';
    if (position_id) {
        const supabaseCtx = await createClient();
        const { data: position } = await supabaseCtx
            .from("positions")
            .select("title, department, target_level, position_skill_requirements(skills(name), required_level, is_mandatory)")
            .eq("id", position_id)
            .single();

        if (position) {
            type SkillReq = { skills: { name: string }[]; required_level: number; is_mandatory: boolean };
            const skills = (position.position_skill_requirements as unknown as SkillReq[] | null)
                ?.map((r) => `${r.skills[0]?.name ?? ''} (level ${r.required_level}${r.is_mandatory ? ', mandatory' : ''})`)
                .join(', ');
            positionContext = `\nTarget Position: ${position.title}${position.department ? ` (${position.department})` : ''}
Target Level: ${position.target_level || level}
Required Skills: ${skills || 'None specified'}\n`;
        }
    }

    const { apiKey, model } = await getAiConfig();

    let questions: Array<{
        question_text: string;
        options: string[];
        correct_answer: number;
        topic: string;
        difficulty: string;
        explanation: string;
    }>;

    if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
        return NextResponse.json({
            error: "OpenAI API Key is not configured. Please check your system settings or .env file."
        }, { status: 500 });
    }
        try {
            const openai = new OpenAI({ apiKey, timeout: 300_000 });

            // Map speculative or exotic models to known working ones
            const actualModel = ["gpt-5", "gpt-4.1", "gpt-4o"].includes(model) ? "gpt-4o" : model;

            let systemPrompt = `You are an expert IT interviewer. Generate exactly ${question_count} sophisticated Multiple Choice questions (4 options A, B, C, D) for a ${level} ${job_role} candidate.

${positionContext ? `${positionContext}\nCRITICAL: Questions MUST assess the required skills listed above at the specified proficiency levels.\n` : ""}${job_description ? `Based on the following Job Description:\nJD: """\n${job_description}\n"""\nCRITICAL: You MUST ensure that the generated questions heavily align with the specific technologies, skills, and context mentioned in the Job Description above.\n` : ""}
${test_description ? `Format Constraints from Recruiter:\n"""\n${test_description}\n"""\nCRITICAL INSTRUCTIONS FOR DYNAMIC FORMATS:\nIf the constraints above specify formats like 'Scenario-based', 'Short Case Study', 'Reading Comprehension', 'SQL / Logic', or 'Communication', you MUST adapt these into high-quality Multiple Choice Questions.\nStrictly adhere to the specific counts for each format provided in the constraints.` : ""}

CRITICAL INSTRUCTIONS FOR QUESTION STRUCTURE:
- Provide visually rich \`question_text\` formatted ONLY with Markdown for readability.
- ALWAYS provide exactly 4 options (A, B, C, D).
- \`correct_answer\` MUST be an INTEGER between 0 and 3, corresponding to the 0-based index of the correct option in your \`options\` array. (0=A, 1=B, 2=C, 3=D)
- Include a brief, insightful explanation.

Return ONLY a JSON object with a single property 'questions' containing the array of exactly ${question_count} questions:
{
  "questions": [
    {
      "question_text": "...",
      "options": ["...", "...", "...", "..."],
      "correct_answer": 0,
      "topic": "...",
      "difficulty": "${level}",
      "explanation": "..."
    }
  ]
}`;

            // Standard Chat Completions API with JSON mode
            const chatParams = getChatParams(actualModel, {
                messages: [{ role: "system", content: systemPrompt }],
                max_tokens: 4000,
                response_format: { type: "json_object" },
            });

            const response = await openai.chat.completions.create(chatParams);

            if (response.usage) {
                logAiUsage({
                    feature: "generate",
                    model: actualModel,
                    tokensIn: response.usage.prompt_tokens,
                    tokensOut: response.usage.completion_tokens,
                });
            }

            const content = response.choices[0].message.content || "{}";
            const parsed = JSON.parse(content);
            if (!parsed.questions || !Array.isArray(parsed.questions)) {
                throw new Error("Invalid AI response format");
            }
            questions = parsed.questions;
        } catch (err: any) {
            console.error("OpenAI API error:", err);
            return NextResponse.json({
                error: `OpenAI Generation Failed: ${err.message || "Unknown error"}. Please check your API Quota and Key settings.`
            }, { status: 500 });
        }

    // Save questions to database
    const supabase = await createClient();
    const questionRecords = questions.map((q, idx) => {
        // Sanitize correct_answer index: ensure it is a number and within bounds
        let safeCorrectAnswer = typeof q.correct_answer === 'number' ? q.correct_answer : parseInt(String(q.correct_answer), 10);
        if (isNaN(safeCorrectAnswer) || safeCorrectAnswer < 0 || safeCorrectAnswer >= q.options.length) {
            console.warn(`[AI-GENERATE] Invalid correct_answer index "${q.correct_answer}" for question ${idx + 1}. Defaulting to 0.`);
            safeCorrectAnswer = 0;
        }

        const shuffled = shuffleOptions(q.options, safeCorrectAnswer);
        return {
            test_id,
            question_text: q.question_text,
            options: shuffled.options,
            correct_answer: shuffled.correct_answer,
            topic: q.topic,
            difficulty: q.difficulty,
            explanation: q.explanation || "",
            order_num: idx + 1,
        };
    });

    const { error } = await supabase.from("questions").insert(questionRecords);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, count: questions.length });
}

/** Fisher-Yates shuffle — randomise options, update correct_answer index */
function shuffleOptions(options: string[], correctAnswer: number): { options: string[]; correct_answer: number } {
    const indexed = options.map((opt, i) => ({ opt, origIdx: i }));
    for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return {
        options: indexed.map((x) => x.opt),
        correct_answer: indexed.findIndex((x) => x.origIdx === correctAnswer),
    };
}
