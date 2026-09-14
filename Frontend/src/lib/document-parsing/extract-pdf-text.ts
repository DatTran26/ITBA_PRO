export class ExtractionFailedError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ExtractionFailedError";
  }
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to prevent top-level DOMMatrix evaluation during Next.js build collection
    const pdfParseModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfParseModule as any).default ?? (pdfParseModule as any);
    const result = await pdfParse(buffer);
    return result.text ?? "";
  } catch (err) {
    throw new ExtractionFailedError("PDF extraction failed", err);
  }
}
