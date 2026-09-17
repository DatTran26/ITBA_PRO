import { completeFilePrompt } from "@/lib/ai-complete";

export async function extractText(
    fileBytes: Uint8Array,
    mimeType: string,
    filename: string,
    _apiKey?: string,
): Promise<string> {
    if (mimeType === "application/pdf") {
        return extractPdfViaAi(fileBytes, filename);
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        return extractDocx(fileBytes);
    }
    throw new Error(`Unsupported mime type: ${mimeType}`);
}

async function extractPdfViaAi(bytes: Uint8Array, filename: string): Promise<string> {
    const result = await completeFilePrompt({
        system: "You are an OCR assistant. Extract ALL text from this PDF document. Return ONLY the raw text content, preserving the original structure. No commentary.",
        userText: "Extract all text from this document.",
        fileBase64: Buffer.from(bytes).toString("base64"),
        mimeType: "application/pdf",
        filename,
    });
    return result.content.trim();
}

function extractDocx(bytes: Uint8Array): string {
    try {
        const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        const matches = text.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g);
        const parts: string[] = [];
        for (const m of matches) {
            if (m[1].trim()) parts.push(m[1]);
        }
        if (parts.length > 0) return parts.join(" ");
        return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    } catch {
        return "";
    }
}
