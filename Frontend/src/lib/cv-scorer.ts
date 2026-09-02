export interface ScreeningResult {
    ai_score: number;
    skill_match_score: number;
    experience_match_score: number;
    domain_match_score: number;
    education_match_score: number;
    culture_fit_score: number;
    strengths: string[];
    weaknesses: string[];
    summary: string;
    recommendation: "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE";
    parsed_cv: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        total_years_experience?: number;
        current_title?: string;
        current_company?: string;
        education?: Array<{
            degree?: string;
            school?: string;
            year?: string;
            field?: string;
        }>;
        experience?: Array<{
            title?: string;
            company?: string;
            duration?: string;
            highlights?: string[];
        }>;
        skills?: string[];
        certifications?: string[];
        languages?: string[];
    };
    key_highlights: string[];
    missing_requirements: string[];
    ai_provider: string;
    ai_model: string;
    prompt_version: string;
}

export interface CvScorer {
    score(cvText: string, jdText: string): Promise<ScreeningResult>;
}

export class OpenAIScorer implements CvScorer {
    private apiKey: string;
    private model: string;
    private onUsage?: (tokensIn: number, tokensOut: number) => void;

    constructor(
        apiKey: string,
        model: string,
        onUsage?: (tokensIn: number, tokensOut: number) => void
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.onUsage = onUsage;
    }

    async score(cvText: string, jdText: string): Promise<ScreeningResult> {
        const systemPrompt = `Bạn là một chuyên gia tuyển dụng cấp cao với hơn 15 năm kinh nghiệm. Hãy phân tích CV ứng viên so với Mô tả Công việc (JD) một cách toàn diện và chi tiết.

## RUBRIC CHẤM ĐIỂM (0-100):

### ai_score (Điểm tổng thể)
- 90-100: Ứng viên xuất sắc, đáp ứng vượt trội tất cả yêu cầu
- 75-89: Ứng viên tốt, đáp ứng hầu hết yêu cầu quan trọng
- 60-74: Ứng viên khá, đáp ứng các yêu cầu cơ bản, cần đào tạo thêm
- 40-59: Ứng viên trung bình, thiếu nhiều yêu cầu quan trọng
- 0-39: Không phù hợp với vị trí

### skill_match_score (Kỹ năng)
So sánh kỹ năng kỹ thuật (hard skills) trong CV với yêu cầu JD. Đánh giá mức độ phù hợp, độ sâu kiến thức và kinh nghiệm sử dụng.

### experience_match_score (Kinh nghiệm)
So sánh số năm kinh nghiệm, vai trò/vị trí tương đương, quy mô dự án/công ty, thành tựu đạt được.

### domain_match_score (Lĩnh vực)
Mức độ phù hợp về ngành/lĩnh vực hoạt động, hiểu biết domain-specific knowledge.

### education_match_score (Học vấn)
Mức độ phù hợp về bằng cấp, chuyên ngành, chứng chỉ liên quan.

### culture_fit_score (Phù hợp văn hóa)
Dựa trên soft skills thể hiện trong CV, phong cách làm việc, giá trị cá nhân (nếu có thể đánh giá).

## RECOMMENDATION LEVELS:
- STRONG_HIRE: ai_score >= 85, ứng viên nổi bật, nên ưu tiên
- HIRE: ai_score >= 70, ứng viên tốt, nên phỏng vấn
- MAYBE: ai_score >= 50, cần cân nhắc thêm
- NO_HIRE: ai_score < 50, không phù hợp

## YÊU CẦU OUTPUT:
Trả về JSON duy nhất (không markdown) với cấu trúc:
{
  "ai_score": number,
  "skill_match_score": number,
  "experience_match_score": number,
  "domain_match_score": number,
  "education_match_score": number,
  "culture_fit_score": number,
  "strengths": ["Điểm mạnh 1 bằng tiếng Việt (chi tiết, cụ thể)", ...],
  "weaknesses": ["Điểm yếu 1 bằng tiếng Việt (chi tiết, cụ thể)", ...],
  "summary": "Đánh giá tổng quan chi tiết 3-5 câu bằng tiếng Việt về ứng viên",
  "recommendation": "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE",
  "key_highlights": ["Điểm nổi bật đáng chú ý nhất 1", "Điểm nổi bật 2", ...],
  "missing_requirements": ["Yêu cầu còn thiếu 1", "Yêu cầu còn thiếu 2", ...],
  "parsed_cv": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "total_years_experience": number,
    "current_title": "string",
    "current_company": "string",
    "education": [{"degree": "", "school": "", "year": "", "field": ""}],
    "experience": [{"title": "", "company": "", "duration": "", "highlights": [""]}],
    "skills": ["skill1", "skill2"],
    "certifications": ["cert1"],
    "languages": ["Vietnamese", "English"]
  }
}

QUAN TRỌNG:
- Tất cả strengths, weaknesses, summary, key_highlights, missing_requirements PHẢI bằng tiếng Việt
- Mỗi điểm mạnh/yếu phải chi tiết, cụ thể, liên quan đến JD
- strengths và weaknesses mỗi mảng có 3-6 mục
- key_highlights có 2-4 mục — là những điểm ấn tượng nhất
- missing_requirements là những yêu cầu trong JD mà CV không thể hiện`;

        const userPrompt = `=== MÔ TẢ CÔNG VIỆC (JD) ===\n${jdText}\n\n=== CV ỨNG VIÊN ===\n${cvText}`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`OpenAI API error: ${err}`);
        }

        const data = await res.json();
        const usage = data.usage as { prompt_tokens: number; completion_tokens: number } | undefined;

        if (usage && this.onUsage) {
            this.onUsage(usage.prompt_tokens, usage.completion_tokens);
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty response from OpenAI");

        const parsed = JSON.parse(content) as Record<string, unknown>;

        // Validate and clamp scores
        const clamp = (v: unknown) => Math.min(100, Math.max(0, Number(v) || 0));
        const ai_score = clamp(parsed.ai_score);

        // Determine recommendation
        const rawRecommendation = String(parsed.recommendation ?? "").toUpperCase();
        const validRecs = ["STRONG_HIRE", "HIRE", "MAYBE", "NO_HIRE"] as const;
        const recommendation = validRecs.includes(rawRecommendation as typeof validRecs[number])
            ? rawRecommendation as ScreeningResult["recommendation"]
            : ai_score >= 85 ? "STRONG_HIRE" : ai_score >= 70 ? "HIRE" : ai_score >= 50 ? "MAYBE" : "NO_HIRE";

        return {
            ai_score,
            skill_match_score: clamp(parsed.skill_match_score),
            experience_match_score: clamp(parsed.experience_match_score),
            domain_match_score: clamp(parsed.domain_match_score),
            education_match_score: clamp(parsed.education_match_score),
            culture_fit_score: clamp(parsed.culture_fit_score),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths as string[] : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses as string[] : [],
            summary: typeof parsed.summary === "string" ? parsed.summary : "",
            recommendation,
            key_highlights: Array.isArray(parsed.key_highlights) ? parsed.key_highlights as string[] : [],
            missing_requirements: Array.isArray(parsed.missing_requirements) ? parsed.missing_requirements as string[] : [],
            parsed_cv: (parsed.parsed_cv as ScreeningResult["parsed_cv"]) ?? {},
            ai_provider: "openai",
            ai_model: this.model,
            prompt_version: "v2",
        };
    }
}
