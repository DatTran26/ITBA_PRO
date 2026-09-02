import { extractPdfText, ExtractionFailedError } from "./extract-pdf-text";
import { extractDocxText } from "./extract-docx-text";
import { extractUrlText } from "./extract-url-text";

const MAX_CHARS = 150_000;

export type ExtractionResult = {
  text: string;
  charCount: number;
  truncated: boolean;
};

export class UnsupportedFormatError extends Error {
  constructor(format: string) {
    super(`Unsupported file format: ${format}`);
    this.name = "UnsupportedFormatError";
  }
}

export { ExtractionFailedError };

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: string,
  fileName: string,
  sourceUrl?: string,
): Promise<ExtractionResult> {
  const fmt = fileType.toLowerCase();
  let raw: string;

  if (fmt === "pdf") {
    raw = await extractPdfText(buffer);
  } else if (fmt === "docx") {
    raw = await extractDocxText(buffer);
  } else if (fmt === "txt" || fmt === "md") {
    raw = buffer.toString("utf8");
  } else if (fmt === "url") {
    if (!sourceUrl) throw new ExtractionFailedError(`sourceUrl required for format 'url' (file: ${fileName})`);
    raw = await extractUrlText(sourceUrl);
  } else {
    throw new UnsupportedFormatError(fmt);
  }

  const truncated = raw.length > MAX_CHARS;
  const text = truncated ? raw.slice(0, MAX_CHARS) : raw;

  if (truncated) {
    console.warn(`[document-parsing] Text truncated at ${MAX_CHARS} chars for file: ${fileName}`);
  }

  return { text, charCount: text.length, truncated };
}
