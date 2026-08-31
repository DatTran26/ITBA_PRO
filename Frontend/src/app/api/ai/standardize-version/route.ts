import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAiConfig } from "@/lib/get-ai-config";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { getChatParams } from "@/lib/ai-params";

export const maxDuration = 120;

export async function POST(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (isAuthError(ctx)) return ctx;

        // Version management is restricted to authorized administrative personnel
        if (!ctx.isSuperAdmin) {
            return NextResponse.json({ error: "Access denied. Super Admin authorization required for identity standardization." }, { status: 403 });
        }

        const { raw_content, title, version_number } = await request.json();

        if (!raw_content) {
            return NextResponse.json({ error: "Missing identity criteria for standardization" }, { status: 400 });
        }

        const { apiKey, model } = await getAiConfig();
        if (!apiKey) {
            return NextResponse.json({ error: "Intelligence core offline. API key missing." }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey, timeout: 120_000 });

        const prompt = `You are a professional software release engineer. Standardize the following raw release notes into a professional, friendly, and structured format.

Release: ${title} (${version_number})
Raw Changes:
"""
${raw_content}
"""

Rules:
1. Divide changes into: UI (User Interface), UX (User Experience), and Bug Fixes.
2. IMPORTANT: Remove all issue tracking IDs like #123, #456, etc. They are for internal tracking and should not be in public notes.
3. For Bug Fixes, ONLY mention critical or important fixes. If a fix is trivial, merge it into UI/UX or omit it.
4. Language: Use professional yet warm and friendly Vietnamese (Tiếng Việt).
5. Output format: Return JSON only.

Example JSON response:
{
  "ui_changes": ["Thêm icon bút chì để chỉnh sửa tiêu đề trực tiếp", "Cập nhật màu sắc nút nhấn nổi bật hơn"],
  "ux_changes": ["Tăng tốc độ phản hồi khi lưu thông tin", "Tối ưu hóa quy trình nhập liệu mượt mà hơn"],
  "bug_fixes": ["Vá lỗi bảo mật RLS quan trọng trong phân quyền bảng tests"],
  "is_critical": true,
  "summary": "Phiên bản này tập trung nâng cấp trải nghiệm chỉnh sửa trực tiếp và vá các lỗ hổng bảo mật hệ thống."
}`;

        const chatParams = getChatParams(model, {
            messages: [
                { role: "system", content: "You are a professional release manager identity." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const response = await openai.chat.completions.create(chatParams);

        const result = JSON.parse(response.choices[0].message.content || "{}");

        return NextResponse.json(result);

    } catch (err: unknown) {
        console.error("[Version Standardizer]", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : "System instance failure" }, { status: 500 });
    }
}
