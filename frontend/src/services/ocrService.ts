import { OCRScanResponse } from "../types/ocr";

export async function scanImage(file: File): Promise<OCRScanResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/ocr/scan", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to scan image");
  }

  return response.json();
}
