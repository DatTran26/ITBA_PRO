import { completeChatFetch, type AiRuntimeConfig } from "../_shared/ai-settings.ts";

export interface ScreeningResult {
  ai_score: number;
  skill_match_score: number;
  experience_match_score: number;
  domain_match_score: number;
  strengths: string[];
  weaknesses: string[];
  parsed_cv: Record<string, unknown>;
  ai_provider: string;
  ai_model: string;
  prompt_version: string;
}

export interface CvScorer {
  score(cvText: string, jdText: string): Promise<ScreeningResult>;
}

export class OpenAIScorer implements CvScorer {
  constructor(
    private config: AiRuntimeConfig,
    private onUsage?: (tokensIn: number, tokensOut: number) => void,
  ) {}

  async score(cvText: string, jdText: string): Promise<ScreeningResult> {
    const systemPrompt = `Bạn là chuyên gia tuyển dụng cấp cao. Hãy phân tích CV ứng viên so với Mô tả Công việc và trả về JSON với các trường sau:
- ai_score: số từ 0-100 (điểm tổng thể)
- skill_match_score: số từ 0-100 (mức độ phù hợp kỹ năng)
- experience_match_score: số từ 0-100 (mức độ phù hợp kinh nghiệm)
- domain_match_score: số từ 0-100 (mức độ phù hợp lĩnh vực)
- strengths: mảng chuỗi bằng tiếng Việt (điểm mạnh của ứng viên)
- weaknesses: mảng chuỗi bằng tiếng Việt (điểm yếu/thiếu sót)
- parsed_cv: object chứa thông tin cấu trúc từ CV (name, email, phone, education, experience, skills)
Toàn bộ nội dung strengths và weaknesses PHẢI viết bằng tiếng Việt.`;

    const userPrompt = `=== MÔ TẢ CÔNG VIỆC ===\n${jdText}\n\n=== CV ỨNG VIÊN ===\n${cvText}`;

    const { content, tokensIn, tokensOut } = await completeChatFetch(this.config, {
      system: systemPrompt,
      user: userPrompt,
      json: true,
      temperature: 0.2,
    });

    if (this.onUsage) this.onUsage(tokensIn, tokensOut);
    if (!content) throw new Error("Empty response from AI");

    const parsed = JSON.parse(content) as Record<string, unknown>;

    return {
      ai_score: Number(parsed.ai_score ?? 0),
      skill_match_score: Number(parsed.skill_match_score ?? 0),
      experience_match_score: Number(parsed.experience_match_score ?? 0),
      domain_match_score: Number(parsed.domain_match_score ?? 0),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths as string[] : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses as string[] : [],
      parsed_cv: (parsed.parsed_cv as Record<string, unknown>) ?? {},
      ai_provider: this.config.provider,
      ai_model: this.config.model,
      prompt_version: "v1",
    };
  }
}
