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

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        temperature: 0.2,
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

    return {
      ai_score: Number(parsed.ai_score ?? 0),
      skill_match_score: Number(parsed.skill_match_score ?? 0),
      experience_match_score: Number(parsed.experience_match_score ?? 0),
      domain_match_score: Number(parsed.domain_match_score ?? 0),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths as string[] : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses as string[] : [],
      parsed_cv: (parsed.parsed_cv as Record<string, unknown>) ?? {},
      ai_provider: "openai",
      ai_model: this.model,
      prompt_version: "v1",
    };
  }
}
