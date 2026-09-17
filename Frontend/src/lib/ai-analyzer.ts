import { completeChat } from "@/lib/ai-complete";
import { getAiConfig } from "@/lib/get-ai-config";

export interface AnalyzeParams {
    answers: any[];
    questions: any[];
    job_role: string;
    level: string;
    candidate_name: string;
}

export async function performAiAnalysis(params: AnalyzeParams) {
    const { answers, questions, job_role, level, candidate_name } = params;
    // Calculate score
    let correctCount = 0;
    const answerDetails = answers.map(
        (a: { question_id: string; selected_answer: number }, idx: number) => {
            const q = questions.find((q: { id: string }) => q.id === a.question_id) || questions[idx];
            const isCorrect = q && a.selected_answer === q.correct_answer;
            if (isCorrect) correctCount++;
            return {
                question: q?.question_text || "",
                selected: a.selected_answer,
                correct: q?.correct_answer,
                is_correct: isCorrect,
                topic: q?.topic || "",
            };
        }
    );

    const score = correctCount;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // Determine weak areas
    const weakTopics = [...new Set(
        answerDetails
            .filter((a: { is_correct: boolean }) => !a.is_correct)
            .map((a: { topic: string }) => a.topic)
    )].filter(Boolean);

    let analysis;
    let suggestedQuestions;

    const { apiKey } = await getAiConfig();

    if (apiKey && apiKey !== "YOUR_OPENAI_API_KEY_HERE") {
        try {
            const response = await completeChat({
                messages: [
                    {
                        role: "system",
                        content: `Analyze this interview test result for a ${level} ${job_role} candidate named "${candidate_name}":

Score: ${score}/${total} (${percentage}%)
Weak areas: ${weakTopics.join(", ") || "None"}

Correct answers: ${answerDetails.filter((a: { is_correct: boolean }) => a.is_correct).map((a: { topic: string }) => a.topic).join(", ")}
Incorrect answers: ${answerDetails.filter((a: { is_correct: boolean }) => !a.is_correct).map((a: { topic: string; question: string }) => `${a.topic}: ${a.question}`).join("; ")}

Return ONLY valid JSON (no markdown) with this format:
{
  "analysis": {
    "overall_assessment": "Brief overall assessment in Vietnamese",
    "strengths": ["Strength 1 in Vietnamese", "Strength 2"],
    "weaknesses": ["Weakness 1 in Vietnamese", "Weakness 2"],
    "recommendation": "Hire recommendation in Vietnamese (Recommend/Consider/Not recommended)",
    "detail_note": "Detailed note in Vietnamese"
  },
  "suggested_questions": [
    {"question": "Follow-up question in Vietnamese", "purpose": "Why this question in Vietnamese"},
    {"question": "Follow-up question 2", "purpose": "Why this question"}
  ]
}`,
                    },
                ],
                json: true,
                feature: "analyze",
            });

            const parsed = JSON.parse(response.content || "{}");
            if (parsed.analysis && parsed.suggested_questions) {
                analysis = parsed.analysis;
                suggestedQuestions = parsed.suggested_questions;
            }
        } catch (err) {
            console.error("[AiAnalyzer] AI Error:", err);
        }
    }

    // Fallback analysis
    if (!analysis) {
        analysis = {
            overall_assessment:
                percentage >= 80
                    ? `Ứng viên ${candidate_name} có kiến thức tốt về ${job_role} ở level ${level}. Đạt ${percentage}% điểm.`
                    : percentage >= 50
                        ? `Ứng viên ${candidate_name} có kiến thức cơ bản về ${job_role}. Đạt ${percentage}% điểm, cần cải thiện thêm.`
                        : `Ứng viên ${candidate_name} cần bổ sung thêm kiến thức ${job_role}. Chỉ đạt ${percentage}% điểm.`,
            strengths: answerDetails
                .filter((a: { is_correct: boolean }) => a.is_correct)
                .slice(0, 3)
                .map((a: { topic: string }) => `Nắm vững ${a.topic}`),
            weaknesses: weakTopics.slice(0, 3).map((t) => `Cần cải thiện ${t}`),
            recommendation:
                percentage >= 80 ? "Recommend" : percentage >= 50 ? "Consider" : "Not recommended",
            detail_note: `Ứng viên trả lời đúng ${score}/${total} câu. ${weakTopics.length > 0
                ? "Các chủ đề cần cải thiện: " + weakTopics.join(", ")
                : "Không có điểm yếu rõ ràng."
                }`,
        };
    }

    if (!suggestedQuestions) {
        suggestedQuestions = weakTopics.slice(0, 3).map((topic) => ({
            question: `Hãy giải thích chi tiết về ${topic} và cách bạn áp dụng trong dự án thực tế?`,
            purpose: `Đánh giá sâu hơn kiến thức về ${topic}`,
        }));
    }

    return {
        score,
        total,
        percentage,
        analysis,
        suggested_questions: suggestedQuestions,
    };
}
