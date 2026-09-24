import type {
  FieldResolverResult,
  GeneratedDocument,
  GuidanceMessage,
  GuidanceResponse,
  ND30ExportPayload,
  OCRScanResponse,
  UserProfile,
} from "../types/ocr";

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
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}

// ─── Advisory Flow API ────────────────────────────────────────────────────────

/**
 * [Luồng A] Gửi tin nhắn tới Guidance Agent (RAG hội thoại).
 * Stateless: gửi full conversation_history mỗi request.
 */
export async function chatGuidance(
  message: string,
  conversationHistory: GuidanceMessage[] = [],
): Promise<GuidanceResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ocr/guidance/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
      }),
    });
  } catch {
    throw new OCRServiceError("network");
  }
  if (!response.ok) throw new OCRServiceError("service");
  return response.json() as Promise<GuidanceResponse>;
}

/**
 * [Luồng A] Field Resolver: đối chiếu schema với hồ sơ user,
 * trả về filled_fields (tự điền) và missing_fields (cần hỏi user).
 */
export async function resolveFields(
  docType: string,
  userProfile: UserProfile,
  partialAnswers: Record<string, string> = {},
): Promise<FieldResolverResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ocr/fields/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_type: docType,
        user_profile: userProfile,
        partial_answers: partialAnswers,
      }),
    });
  } catch {
    throw new OCRServiceError("network");
  }
  if (!response.ok) throw new OCRServiceError("service");
  return response.json() as Promise<FieldResolverResult>;
}

/**
 * [Luồng A] Document Generation Engine: tạo export_payload từ filled_fields có nhãn.
 * input_mode = "structured" → ND30Validator score cao hơn luồng OCR.
 */
export async function generateDocument(
  docType: string,
  filledFields: Record<string, string>,
): Promise<GeneratedDocument> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ocr/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_type: docType,
        filled_fields: filledFields,
      }),
    });
  } catch {
    throw new OCRServiceError("network");
  }
  if (!response.ok) throw new OCRServiceError("service");
  return response.json() as Promise<GeneratedDocument>;
}

/**
 * [Luồng A] Lấy danh sách loại văn bản được hỗ trợ + Field Schema.
 */
export async function fetchSupportedSchemas(): Promise<{
  supported_types: string[];
  schemas: Record<string, any>;
}> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ocr/guidance/schemas`);
  } catch {
    throw new OCRServiceError("network");
  }
  if (!response.ok) throw new OCRServiceError("service");
  return response.json();
}



