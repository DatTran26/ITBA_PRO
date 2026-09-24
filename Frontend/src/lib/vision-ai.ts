const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateImage(value: FormDataEntryValue | null): value is File {
  return value instanceof File
    && value.size > 0
    && value.size <= MAX_IMAGE_SIZE
    && ALLOWED_IMAGE_TYPES.has(value.type);
}

export async function callVisionAi(path: string, init: RequestInit) {
  const baseUrl = process.env.VISION_AI_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new Error("VISION_AI_URL is not configured");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Vision AI failed (${response.status}): ${detail}`);
  }
  return response.json();
}

export function canManageVision(role: string) {
  return ["admin", "super_admin", "leader"].includes(role);
}
