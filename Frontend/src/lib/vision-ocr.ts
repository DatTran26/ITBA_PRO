export function getVisionOcrUrl(): string {
  const baseUrl = process.env.VISION_OCR_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new Error("VISION_OCR_URL is not configured");
  return baseUrl;
}

export async function callVisionOcr(path: string, init: RequestInit = {}) {
  return fetch(`${getVisionOcrUrl()}${path}`, {
    ...init,
    cache: "no-store",
  });
}
