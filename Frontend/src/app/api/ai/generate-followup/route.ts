import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { logAiUsage } from "@/lib/ai-usage-logger";
import { getAiConfig } from "@/lib/get-ai-config";
import { getChatParams } from "@/lib/ai-params";

interface FollowUpQuestion {
    question_text: string;
    purpose: string;
    category: "strength_validation" | "weakness_probe" | "hidden_gap" | "depth_check";
    priority: "high" | "medium" | "low";
    related_topics: string[];
    suggested_follow_up_points: string[];
}

/**
 * POST /api/ai/generate-followup
 *
 * Generates candidate-specific follow-up interview questions
 * based on test results and AI analysis.
 */
export const maxDuration = 120;

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { result_id, ai_analysis: clientAnalysis } = body;

    if (!result_id) {
        return NextResponse.json({ error: "result_id is required" }, { status: 400 });
    }

    // Fetch result
    const { data: result, error: resultError } = await supabase
        .from("results")
        .select("*")
        .eq("id", result_id)
        .single();

    if (resultError || !result) {
        return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Fetch test with questions
    const { data: test, error: testError } = await supabase
        .from("tests")
        .select("*, questions(*)")
        .eq("id", result.test_id)
        .single();

    if (testError || !test) {
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

    // Use DB analysis first, fall back to client-provided analysis
    const analysis = result.ai_analysis || clientAnalysis;
    if (!analysis) {
        return NextResponse.json(
            { error: "AI analysis must be completed before generating follow-up questions" },
            { status: 400 }
        );
    }

    const questions = (test.questions || []).sort(
        (a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num
    );

    // Build detailed answer analysis
    const percentage = Math.round((result.score / result.total_questions) * 100);
    const answers = result.answers || [];

    const correctTopics: string[] = [];
    const incorrectDetails: string[] = [];

    answers.forEach((a: { question_id: string; selected_answer: number; is_correct: boolean }) => {
        const q = questions.find((q: { id: string }) => q.id === a.question_id);
        if (!q) return;
        if (a.is_correct) {
            correctTopics.push(q.topic);
        } else {
            const selectedOpt = q.options[a.selected_answer] || "No answer";
            const correctOpt = q.options[q.correct_answer];
            incorrectDetails.push(
                `[${q.topic}] Q: "${q.question_text.substring(0, 120)}..." → Candidate chose "${selectedOpt}" instead of "${correctOpt}"`
            );
        }
    });

    const suggestedQuestions = result.suggested_questions || [];

    try {
        const followUpQuestions = await generateFollowUp({
            candidate_name: result.candidate_name,
            job_role: test.job_role,
            level: test.level,
            job_description: test.job_description,
            percentage,
            score: result.score,
            total: result.total_questions,
            analysis,
            correctTopics,
            incorrectDetails,
            suggestedQuestions,
            existingQuestions: questions.map(
                (q: { question_text: string; topic: string }) =>
                    `[${q.topic}] ${q.question_text.substring(0, 100)}`
            ),
        });

        // Save to follow_up_sessions
        const { data: session, error: insertError } = await supabase
            .from("follow_up_sessions")
            .insert({
                result_id,
                test_id: result.test_id,
                questions: followUpQuestions,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Insert error:", insertError);
            return NextResponse.json({ error: "Failed to save follow-up session" }, { status: 500 });
        }

        return NextResponse.json({ success: true, session });
    } catch (err) {
        console.error("Follow-up generation error:", err);
        return NextResponse.json(
            { error: "Failed to generate follow-up questions. Please try again." },
            { status: 500 }
        );
    }
}

interface GenerateFollowUpOptions {
    candidate_name: string;
    job_role: string;
    level: string;
    job_description?: string;
    percentage: number;
    score: number;
    total: number;
    analysis: {
        overall_assessment: string;
        strengths: string[];
        weaknesses: string[];
        recommendation: string;
        detail_note?: string;
    };
    correctTopics: string[];
    incorrectDetails: string[];
    suggestedQuestions: { question: string; purpose: string }[];
    existingQuestions: string[];
}

async function generateFollowUp(options: GenerateFollowUpOptions): Promise<FollowUpQuestion[]> {
    const { apiKey, model } = await getAiConfig();

    if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
        return generateFallback(options);
    }

    const openai = new OpenAI({ apiKey, timeout: 120_000 });

    const systemPrompt = `You are a senior technical interviewer crafting targeted follow-up questions for a SPECIFIC candidate based on their actual test performance. Your goal is to uncover the candidate's REAL capability — validating strengths, probing weaknesses, and finding hidden knowledge gaps.

## CANDIDATE PROFILE
- Name: ${options.candidate_name}
- Role: ${options.level} ${options.job_role}
- Score: ${options.score}/${options.total} (${options.percentage}%)
${options.job_description ? `- Job Description:\n"""\n${options.job_description}\n"""` : ""}

## AI ANALYSIS
- Overall: ${options.analysis.overall_assessment}
- Strengths: ${options.analysis.strengths.join("; ")}
- Weaknesses: ${options.analysis.weaknesses.join("; ")}
- Recommendation: ${options.analysis.recommendation}
${options.analysis.detail_note ? `- Detail: ${options.analysis.detail_note}` : ""}

## CORRECT ANSWERS (topics the candidate got right):
${options.correctTopics.join(", ") || "None"}

## INCORRECT ANSWERS (detailed):
${options.incorrectDetails.join("\n") || "None"}

## EXISTING TEST QUESTIONS (DO NOT repeat these):
${options.existingQuestions.join("\n")}

## YOUR TASK
Generate 8-12 follow-up interview questions that are:

1. **Strength Validation** (2-3 questions): The candidate answered correctly on some topics, but a correct multiple-choice answer doesn't prove deep understanding. Ask open-ended questions that force the candidate to EXPLAIN, DESIGN, or TROUBLESHOOT in areas they scored well. If they truly know it, they'll shine. If they guessed correctly, this will expose it.

2. **Weakness Probe** (2-3 questions): For topics the candidate got wrong, don't just re-ask — go DEEPER. Ask scenario-based questions that test whether the candidate has practical experience or just surface-level knowledge. Focus on the SPECIFIC misconceptions revealed by their wrong answers.

3. **Hidden Gap Detection** (2-3 questions): Look for patterns in the candidate's performance. What adjacent knowledge areas weren't tested? What foundational concepts might be weak given their error patterns? What real-world scenarios would stress-test their claimed knowledge level (${options.level})?

4. **Depth Check** (2-3 questions): These should test whether the candidate can operate at the ${options.level} level in practice — architecture decisions, trade-off analysis, debugging complex scenarios, code review, system design at the appropriate scale.

## RULES
- Questions MUST be in Vietnamese
- Each question should be open-ended (not multiple choice) — designed for a live interview
- Include suggested follow-up points the interviewer can use to dig deeper
- Provide the PURPOSE of each question so the interviewer understands what signal to look for
- DO NOT repeat or rephrase the original test questions
- Make questions progressively harder within each category
- Questions should feel natural in a conversation, not like a second written test

Return ONLY valid JSON:
{
  "questions": [
    {
      "question_text": "Vietnamese question here",
      "purpose": "What this reveals about the candidate (Vietnamese)",
      "category": "strength_validation|weakness_probe|hidden_gap|depth_check",
      "priority": "high|medium|low",
      "related_topics": ["topic1", "topic2"],
      "suggested_follow_up_points": ["Point 1 in Vietnamese", "Point 2"]
    }
  ]
}`;

    const chatParams = getChatParams(model, {
        messages: [{ role: "system", content: systemPrompt }],
        max_tokens: 4000,
        response_format: { type: "json_object" },
    });

    const response = await openai.chat.completions.create(chatParams);

    if (response.usage) {
        logAiUsage({
            feature: "generate-followup",
            model: response.model || "gpt-4o",
            tokensIn: response.usage.prompt_tokens,
            tokensOut: response.usage.completion_tokens,
        });
    }

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid AI response format");
    }

    return parsed.questions;
}

function generateFallback(options: GenerateFollowUpOptions): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Strength validation from correct topics
    const uniqueCorrect = [...new Set(options.correctTopics)];
    uniqueCorrect.slice(0, 2).forEach((topic) => {
        questions.push({
            question_text: `Bạn đã trả lời đúng câu hỏi về ${topic}. Hãy giải thích chi tiết cách bạn đã áp dụng ${topic} trong dự án thực tế gần nhất. Bạn gặp những thách thức gì và giải quyết chúng như thế nào?`,
            purpose: `Xác minh hiểu biết thực sự về ${topic} — không chỉ là kiến thức lý thuyết từ bài test`,
            category: "strength_validation",
            priority: "high",
            related_topics: [topic],
            suggested_follow_up_points: [
                "Hỏi thêm về trade-offs trong quyết định kỹ thuật",
                "Yêu cầu mô tả debugging scenario cụ thể",
            ],
        });
    });

    // Weakness probes from incorrect details
    const weakTopics = options.incorrectDetails.map((d) => d.match(/\[(.+?)\]/)?.[1] || "").filter(Boolean);
    const uniqueWeak = [...new Set(weakTopics)];
    uniqueWeak.slice(0, 2).forEach((topic) => {
        questions.push({
            question_text: `Trong bài test, bạn gặp khó khăn với ${topic}. Hãy chia sẻ hiểu biết hiện tại của bạn về ${topic} và những kinh nghiệm thực tế bạn đã có. Nếu bạn phải thiết kế một giải pháp liên quan đến ${topic}, bạn sẽ bắt đầu từ đâu?`,
            purpose: `Đánh giá mức độ thiếu hụt kiến thức thực sự về ${topic} — liệu đây là lỗ hổng kiến thức hay chỉ là sai sót trong lúc làm test`,
            category: "weakness_probe",
            priority: "high",
            related_topics: [topic],
            suggested_follow_up_points: [
                `Yêu cầu so sánh các cách tiếp cận khác nhau cho ${topic}`,
                "Hỏi về best practices và anti-patterns",
            ],
        });
    });

    // Hidden gap
    questions.push({
        question_text: `Với vai trò ${options.level} ${options.job_role}, khi bạn nhận được một yêu cầu mới từ PM, quy trình làm việc của bạn từ lúc nhận yêu cầu đến khi deploy là gì? Hãy mô tả chi tiết.`,
        purpose: "Phát hiện lỗ hổng trong quy trình làm việc thực tế — đánh giá năng lực tổng hợp ngoài kiến thức kỹ thuật",
        category: "hidden_gap",
        priority: "medium",
        related_topics: ["workflow", "process", "collaboration"],
        suggested_follow_up_points: [
            "Hỏi về cách xử lý conflict trong code review",
            "Yêu cầu mô tả cách estimate task",
        ],
    });

    // Depth check
    questions.push({
        question_text: `Hãy mô tả một bug phức tạp nhất bạn từng debug trong dự án thực tế. Bạn phát hiện ra nó như thế nào, quá trình troubleshoot ra sao, và bài học rút ra là gì?`,
        purpose: "Đánh giá khả năng giải quyết vấn đề thực tế và tư duy phân tích — đây là indicator mạnh cho năng lực thực sự",
        category: "depth_check",
        priority: "high",
        related_topics: ["debugging", "problem-solving", "critical-thinking"],
        suggested_follow_up_points: [
            "Hỏi về tools và methodology sử dụng",
            "Yêu cầu explain bước suy luận logic",
        ],
    });

    return questions;
}
