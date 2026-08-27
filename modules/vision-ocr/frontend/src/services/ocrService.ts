import type { OCRScanResponse } from "../types/ocr";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type ScanImage = (file: File) => Promise<OCRScanResponse>;

export class OCRServiceError extends Error {
  constructor(public readonly kind: "network" | "service") {
    super(kind);
    this.name = "OCRServiceError";
  }
}

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

  return result;
}
