import { OCRScanResponse } from "../types/ocr";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function scanImage(file: File): Promise<OCRScanResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const detail = errorBody?.detail ?? response.statusText;
    throw new Error(`OCR scan failed: ${detail}`);
  }

  return response.json();
}
