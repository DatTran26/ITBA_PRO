import type {
    GuidanceResponse,
    FieldResolverResult,
    DocumentGenerationResult,
    UserProfile,
} from "../types";

export async function chatGuidance(
    userMessage: string,
    history: Array<{ role: string; content: string }> = []
): Promise<GuidanceResponse> {
    const res = await fetch("/api/ocr/guidance/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: userMessage,
            history,
            conversation_history: history,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Lỗi tư vấn (${res.status})`);
    }

    return res.json();
}

export async function fetchSchemas(): Promise<{
    schemas: Record<string, any>;
    supported_types: string[];
}> {
    const res = await fetch("/api/ocr/guidance/schemas");
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Không tải được danh mục biểu mẫu (${res.status})`);
    }
    return res.json();
}

export async function resolveFields(
    docType: string,
    userProfile: UserProfile,
    answers: Record<string, string> = {}
): Promise<FieldResolverResult> {
    const res = await fetch("/api/ocr/fields/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            doc_type: docType,
            user_profile: userProfile,
            answers,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Lỗi tải trường thông tin (${res.status})`);
    }

    return res.json();
}

export async function generateDocument(
    docType: string,
    values: Record<string, string>
): Promise<DocumentGenerationResult> {
    const res = await fetch("/api/ocr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            doc_type: docType,
            filled_fields: values,
            values,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Lỗi tạo văn bản (${res.status})`);
    }

    return res.json();
}
