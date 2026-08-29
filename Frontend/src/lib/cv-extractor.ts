export async function extractText(
    fileBytes: Uint8Array,
    mimeType: string,
    filename: string,
    openaiApiKey: string
): Promise<string> {
    if (mimeType === "application/pdf") {
        return extractPdfViaOpenAI(fileBytes, openaiApiKey);
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        return extractDocx(fileBytes);
    }
    throw new Error(`Unsupported mime type: ${mimeType}`);
}

/**
 * Use OpenAI GPT-4o vision to read PDF pages as images.
 * We convert the PDF bytes to base64 and send as an image_url,
 * asking GPT to transcribe all visible text.
 */
async function extractPdfViaOpenAI(
    bytes: Uint8Array,
    apiKey: string,
): Promise<string> {
    const base64 = Buffer.from(bytes).toString("base64");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an OCR assistant. Extract ALL text from this PDF document. Return ONLY the raw text content, preserving the original structure. No commentary.",
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "file",
                            file: {
                                filename: "document.pdf",
                                file_data: `data:application/pdf;base64,${base64}`,
                            },
                        },
                        {
                            type: "text",
                            text: "Extract all text from this document.",
                        },
                    ],
                },
            ],
        }),
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenAI PDF extraction failed (${res.status}): ${errBody}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? "";
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
        throw new Error("Failed to extract DOCX content");
    }
}
