import mammoth from "mammoth";
import { ExtractionFailedError } from "./extract-pdf-text";

export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  } catch (err) {
    throw new ExtractionFailedError("DOCX extraction failed", err);
  }
}
