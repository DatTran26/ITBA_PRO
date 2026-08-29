import * as pdfParseLib from "pdf-parse";
// pdf-parse ESM has no default export; resolve the callable regardless of interop
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfParseLib as any).default ?? (pdfParseLib as any);

export class ExtractionFailedError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ExtractionFailedError";
  }
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const result = await pdfParse(buffer);
    return result.text ?? "";
  } catch (err) {
    throw new ExtractionFailedError("PDF extraction failed", err);
  }
}
