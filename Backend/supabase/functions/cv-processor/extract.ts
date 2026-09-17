import { extractPdfWithConfig, type AiRuntimeConfig } from "../_shared/ai-settings.ts";

export async function extractText(
  fileBytes: Uint8Array,
  mimeType: string,
  filename: string,
  config: AiRuntimeConfig,
): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractPdfWithConfig(fileBytes, filename, config);
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractDocx(fileBytes);
  }
  throw new Error(`Unsupported mime type: ${mimeType}`);
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
