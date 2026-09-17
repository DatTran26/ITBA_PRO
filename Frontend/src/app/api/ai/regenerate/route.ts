import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { completeChat } from "@/lib/ai-complete";

interface GeneratedQuestion {
    question_text: string;
    options: string[];
    correct_answer: number;
    topic: string;
    difficulty: string;
    explanation: string;
}

// Allow up to 120 seconds for AI generation
export const maxDuration = 300;

/**
 * POST /api/ai/regenerate
 *
 * Supports two modes:
 * 1. Regenerate full test:  { test_id, custom_prompt? }
 * 2. Regenerate single question: { test_id, question_id, custom_prompt? }
 */
export async function POST(request: Request) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { test_id, question_id, custom_prompt } = body;

    if (!test_id) {
        return NextResponse.json({ error: "test_id is required" }, { status: 400 });
    }

    console.log("[regenerate] start", { test_id, question_id: question_id || null, user_id: user.id });

    // Fetch test with full context
    const { data: test, error: testError } = await supabase
        .from("tests")
        .select("*, questions(*)")
        .eq("id", test_id)
        .single();

    if (testError || !test) {
        console.error("[regenerate] test fetch failed", testError);
        return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Verify ownership (admins can access all tests)
    const { data: userData } = await supabase
        .from("users")
        .select("id, role")
        .eq("auth_id", user.id)
        .single();

    if (!userData) {
        return NextResponse.json({ error: "User profile not found" }, { status: 403 });
    }

    if (userData.role !== "admin" && test.recruiter_id !== userData.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Sort questions by order_num
    const existingQuestions = (test.questions || []).sort(
        (a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num
    );

    const isFullRegeneration = !question_id;

    // If single question, validate it exists
    if (question_id) {
        const targetQuestion = existingQuestions.find((q: { id: string }) => q.id === question_id);
        if (!targetQuestion) {
            return NextResponse.json({ error: "Question not found in this test" }, { status: 404 });
        }
    }

    try {
        if (isFullRegeneration) {
            console.log("[regenerate] full mode — calling AI", { question_count: test.question_count || existingQuestions.length });
            const questions = await generateQuestions({
                job_role: test.job_role,
                level: test.level,
                job_description: test.job_description,
                test_description: test.test_description,
                question_count: test.question_count || existingQuestions.length || 10,
                custom_prompt,
                mode: "full",
            });

            console.log("[regenerate] full — AI done, generated", questions.length, "questions");

            // Delete old questions and insert new ones in a transaction-like flow
            console.log("[regenerate] full — deleting old questions for test_id", test_id);
            const { error: deleteError } = await supabase
                .from("questions")
                .delete()
                .eq("test_id", test_id);

            if (deleteError) {
                console.error("[regenerate] full — delete failed", { code: deleteError.code, message: deleteError.message });
                return NextResponse.json({ error: "Failed to remove old questions" }, { status: 500 });
            }

            const questionRecords = questions.map((q, idx) => {
                // Sanitize correct_answer index: ensure it is a number and within bounds
                let safeCorrectAnswer = typeof q.correct_answer === 'number' ? q.correct_answer : parseInt(String(q.correct_answer), 10);
                if (isNaN(safeCorrectAnswer) || safeCorrectAnswer < 0 || safeCorrectAnswer >= q.options.length) {
                    console.warn(`[AI-REGENERATE-FULL] Invalid correct_answer index "${q.correct_answer}" for question ${idx + 1}. Defaulting to 0.`);
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

            console.log("[regenerate] full — inserting", questionRecords.length, "new questions");
            const { error: insertError } = await supabase
                .from("questions")
                .insert(questionRecords);

            if (insertError) {
                console.error("[regenerate] full — insert failed", { code: insertError.code, message: insertError.message });
                return NextResponse.json({ error: "Failed to save new questions" }, { status: 500 });
            }

            // Return updated test
            const { data: updatedTest } = await supabase
                .from("tests")
                .select("*, questions(*)")
                .eq("id", test_id)
                .single();

            if (updatedTest?.questions) {
                updatedTest.questions.sort(
                    (a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num
                );
            }

            return NextResponse.json({
                success: true,
                mode: "full",
                test: updatedTest,
            });
        } else {
            // Single question regeneration
            const targetQuestion = existingQuestions.find((q: { id: string }) => q.id === question_id);
            const questionIndex = existingQuestions.findIndex((q: { id: string }) => q.id === question_id);

            // Build context about existing questions to avoid duplicates
            const otherQuestions = existingQuestions
                .filter((q: { id: string }) => q.id !== question_id)
                .map((q: { topic: string; question_text: string }) => `- [${q.topic}]: ${q.question_text.substring(0, 100)}`)
                .join("\n");

            console.log("[regenerate] single — calling AI for question_id", question_id);
            const questions = await generateQuestions({
                job_role: test.job_role,
                level: test.level,
                job_description: test.job_description,
                test_description: test.test_description,
                question_count: 1,
                custom_prompt,
                mode: "single",
                existingContext: {
                    topic: targetQuestion.topic,
                    difficulty: targetQuestion.difficulty,
                    otherQuestions,
                },
            });

            if (!questions.length) {
                return NextResponse.json({ error: "Failed to generate replacement question" }, { status: 500 });
            }

            console.log("[regenerate] single — AI done, updating question in DB");
            const newQuestion = questions[0];
            // Sanitize correct_answer index
            let safeIdx = typeof newQuestion.correct_answer === 'number' ? newQuestion.correct_answer : parseInt(String(newQuestion.correct_answer), 10);
            if (isNaN(safeIdx) || safeIdx < 0 || safeIdx >= newQuestion.options.length) {
                console.warn(`[AI-REGENERATE-SINGLE] Invalid correct_answer index "${newQuestion.correct_answer}". Defaulting to 0.`);
                safeIdx = 0;
            }

            const shuffled = shuffleOptions(newQuestion.options, safeIdx);

            // Update the specific question in-place
            const { data: updatedQuestion, error: updateError } = await supabase
                .from("questions")
                .update({
                    question_text: newQuestion.question_text,
                    options: shuffled.options,
                    correct_answer: shuffled.correct_answer,
                    topic: newQuestion.topic,
                    difficulty: newQuestion.difficulty,
                    explanation: newQuestion.explanation || "",
                })
                .eq("id", question_id)
                .select()
                .single();

            if (updateError) {
                console.error("[regenerate] single — update failed", { code: updateError.code, message: updateError.message });
                return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
            }
            console.log("[regenerate] single — done, question updated");

            return NextResponse.json({
                success: true,
                mode: "single",
                question: updatedQuestion,
                questionIndex,
            });
        }
    } catch (err) {
        console.error("Regeneration error:", err);
        const message =
            err instanceof Error ? err.message : "Regeneration failed. Please try again.";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
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

interface GenerateOptions {
    job_role: string;
    level: string;
    job_description?: string;
    test_description?: string;
    question_count: number;
    custom_prompt?: string;
    mode: "full" | "single";
    existingContext?: {
        topic: string;
        difficulty: string;
        otherQuestions: string;
    };
}

async function generateQuestions(options: GenerateOptions): Promise<GeneratedQuestion[]> {
    const {
        job_role,
        level,
        job_description,
        test_description,
        question_count,
        custom_prompt,
        mode,
        existingContext,
    } = options;


    let systemPrompt = "";

    if (mode === "full") {
        systemPrompt = `You are an expert IT interviewer. Generate exactly ${question_count} sophisticated multiple-choice questions for a ${level} ${job_role} candidate.

${job_description ? `Based on the following Job Description:\nJD: """\n${job_description}\n"""\nCRITICAL: You MUST ensure that the generated questions heavily align with the specific technologies, skills, and context mentioned in the Job Description above.\n` : ""}
${test_description ? `Additional Instructions & Format Constraints from Recruiter:\n"""\n${test_description}\n"""\nCRITICAL: You MUST strictly generate the exact number of questions for each format specified in the "Question Format Constraints" above.\n` : ""}
${custom_prompt ? `Additional Custom Instructions from Recruiter:\n"""\n${custom_prompt}\n"""\nIMPORTANT: Incorporate these instructions while keeping the questions relevant to the role, level, and job context above.\n` : ""}

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
    } else {
        // Single question mode
        systemPrompt = `You are an expert IT interviewer. Generate exactly 1 replacement multiple-choice question for a ${level} ${job_role} candidate.

${job_description ? `Based on the following Job Description:\nJD: """\n${job_description}\n"""\n` : ""}
${test_description ? `Test Format Context:\n"""\n${test_description}\n"""\n` : ""}
${custom_prompt ? `Additional Custom Instructions from Recruiter:\n"""\n${custom_prompt}\n"""\n` : ""}

The question you are replacing was about the topic "${existingContext?.topic}" at "${existingContext?.difficulty}" difficulty level.

IMPORTANT: The following questions already exist in this test. You MUST generate a DIFFERENT question that does NOT overlap with any of these:
${existingContext?.otherQuestions || "(no other questions)"}

CRITICAL INSTRUCTIONS FOR QUESTION STRUCTURE:
- Provide visually rich \`question_text\` formatted ONLY with Markdown.
- ALWAYS provide exactly 4 options (A, B, C, D).
- \`correct_answer\` MUST be an INTEGER between 0 and 3, corresponding to the 0-based index of the correct option in your \`options\` array. (0=A, 1=B, 2=C, 3=D)
- Include a brief, insightful explanation.

Return ONLY a JSON object with a single property 'questions' containing an array with exactly 1 question:
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
    }

    try {
        const response = await completeChat({
            messages: [{ role: "system", content: systemPrompt }],
            maxTokens: 4000,
            json: true,
            timeoutMs: 300_000,
            feature: "regenerate",
        });
        const parsed = JSON.parse(response.content || "{}");
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error("Invalid AI response format");
        }
        return parsed.questions;
    } catch (apiErr: unknown) {
        console.error("AI error in regeneration:", apiErr);
        const message = apiErr instanceof Error ? apiErr.message : "Unknown error";
        throw new Error(`AI regeneration failed: ${message}. Check API configuration.`);
    }
}
