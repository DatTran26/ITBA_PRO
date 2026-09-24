import type { ND30ExportPayload, OCRScanResponse } from "../types/ocr";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type ScanImage = (file: File) => Promise<OCRScanResponse>;

export class OCRServiceError extends Error {
  constructor(public readonly kind: "network" | "service") {
    super(kind);
    this.name = "OCRServiceError";
  }
}

/** POST an image file to /api/ocr/scan and return the full OCRScanResponse. */
export async function scanImage(file: File): Promise<OCRScanResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new OCRServiceError("network");
  }

  if (!response.ok) {
    throw new OCRServiceError("service");
  }

  const result = (await response.json()) as OCRScanResponse;
  if (
    typeof result.text !== "string" ||
    typeof result.image_b64 !== "string" ||
    result.status !== "success"
  ) {
    throw new OCRServiceError("service");
  }

  // Ensure blocks is always an array even if backend omits it
  return { ...result, blocks: result.blocks ?? [] };
}

/**
 * POST ND30 export payload to /api/ocr/export-nd30.
 * Returns a Blob of the .docx file which the caller can trigger as a download.
 */
export async function exportND30(payload: ND30ExportPayload): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ocr/export-nd30`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OCRServiceError("network");
  }

  if (!response.ok) {
    throw new OCRServiceError("service");
  }

  return response.blob();
}

/** Auto-draft ND30 document from raw OCR text using AI backend */
export async function autoGenerateND30(
  ocrText: string,
  documentType = "QUYẾT ĐỊNH",
  userNotes = "",
): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ocr/nd30/auto-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ocr_text: ocrText,
        document_type: documentType,
        user_notes: userNotes,
      }),
    });
  } catch {
    throw new OCRServiceError("network");
  }

  if (!response.ok) {
    throw new OCRServiceError("service");
  }

  return response.json();
}

/** Validate document according to Decree 30/2020/ND-CP rules & seal checklist */
export async function validateND30(documentData: Record<string, any>): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ocr/nd30/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(documentData),
    });
  } catch {
    throw new OCRServiceError("network");
  }

  if (!response.ok) {
    throw new OCRServiceError("service");
  }

  return response.json();
}

/** Trigger a browser download for a Blob with a given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
