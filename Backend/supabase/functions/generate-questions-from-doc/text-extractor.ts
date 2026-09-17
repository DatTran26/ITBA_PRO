import { extractPdfWithConfig, type AiRuntimeConfig } from "../_shared/ai-settings.ts";

export async function extractTextFromFile(
  bytes: Uint8Array,
  format: string,
  filename: string,
  config: AiRuntimeConfig,
): Promise<string> {
  if (format === "pdf") return extractPdfWithConfig(bytes, filename, config);
  if (format === "docx") return extractDocx(bytes);
  if (format === "txt") return new TextDecoder().decode(bytes);
  throw new Error(`Unsupported format: ${format}`);
}

export async function extractTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDocx(bytes: Uint8Array): string {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const parts: string[] = [];
  for (const m of text.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)) {
    if (m[1].trim()) parts.push(m[1]);
  }
  if (parts.length > 0) return parts.join(" ");
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
