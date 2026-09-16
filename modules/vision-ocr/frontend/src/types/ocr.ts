// ─── Grounded Bounding-Box Types ─────────────────────────────────────────────

/**
 * A single text block returned by the OCR backend.
 *
 * ``bbox`` is in normalized coordinates (0.0–1.0 relative to image size):
 *   x — left edge fraction
 *   y — top  edge fraction
 *   w — width  fraction
 *   h — height fraction
 *
 * ``field_key`` is populated by the HR field-mapping layer when a block is
 * matched to a known document field (e.g. "fullName", "idNumber").
 */
export interface GroundedBlock {
  id: string;
  text: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  field_key: string | null;
}

// ─── HR Document Fields (CCCD / Bằng cấp / CV) ────────────────────────────

export interface HRDocumentFields {
  fullName: string;
  idNumber: string;
  dob: string;
  gender: string;
  nationality: string;
  placeOfOrigin: string;
  placeOfResidence: string;
  issueDate: string;
  expiryDate: string;
  // Additional free-form fields
  [key: string]: string;
}

// ─── ND30 Export Payload ─────────────────────────────────────────────────────

export interface ND30ExportArticle {
  title: string;
  content: string;
}

export interface ND30ValidationIssue {
  component: string;
  severity: "error" | "warning" | "info";
  message: string;
  recommendation: string;
  citation: string;
}

export interface ND30ValidationResult {
  score: number;
  is_valid: boolean;
  seal_status: {
    has_seal: boolean;
    seal_type: string;
    overlap_status: string;
    is_compliant: boolean;
    note: string;
  };
  components: {
    quoc_hieu: { valid: boolean; note: string };
    co_quan: { valid: boolean; note: string };
    so_hieu: { valid: boolean; note: string };
    dia_danh_ngay_thang: { valid: boolean; note: string };
    trich_yeu: { valid: boolean; note: string };
    noi_dung: { valid: boolean; note: string };
    nguoi_ky: { valid: boolean; note: string };
    con_dau: { valid: boolean; note: string };
    noi_nhan: { valid: boolean; note: string };
  };
  issues: ND30ValidationIssue[];
}

export interface ND30ExportPayload {
  organ_name_upper?: string;
  organ_name?: string;
  doc_type: string;
  company_name?: string;
  department?: string;
  doc_number?: string;
  doc_code?: string;
  location_date?: string;
  location?: string;
  date_str?: string;
  subject: string;
  bases?: string[];
  legal_bases?: string[];
  articles: ND30ExportArticle[];
  signatory_title?: string;
  signer_title?: string;
  signatory_name?: string;
  signer_name?: string;
  recipients: string[];
}

// ─── OCR Scan Response ────────────────────────────────────────────────────────

export interface OCRScanResponse {
  text: string;
  image_b64: string;
  status: "success" | "error";
  blocks: GroundedBlock[];
}

export type OCRScanState = "idle" | "loading" | "done" | "error";

// ─── Queue Types ──────────────────────────────────────────────────────────────

export type OCRJobStatus =
  | "queued"
  | "processing"
  | "needs_review"
  | "confirmed"
  | "error";

export interface OCRJob {
  id: string;
  file: File;
  previewUrl: string;
  status: OCRJobStatus;
  originalText: string;
  editedText: string;
  confirmedText: string | null;
  errorMessage: string | null;
  engine: string | null;
  attemptCount: number;
  createdAt: number;
  startedAt: number | null;

  /** Grounded bounding-box blocks from PaddleOCR (empty when Gemini path used). */
  blocks: GroundedBlock[];
  /** ID of the currently highlighted block in the document preview. */
  activeBlockId: string | null;
  /** HR structured fields extracted from blocks. */
  hrFields: Partial<HRDocumentFields>;
}

export interface OCRQueueState {
  jobs: OCRJob[];
  selectedJobId: string | null;
  validationError: string | null;
}

export type OCRQueueAction =
  | { type: "jobs_added"; jobs: OCRJob[] }
  | { type: "selection_changed"; id: string }
  | { type: "processing_started"; id: string; startedAt: number }
  | { type: "completed"; id: string; text: string; blocks: GroundedBlock[] }
  | { type: "failed"; id: string; message: string }
  | { type: "text_edited"; id: string; text: string }
  | { type: "block_selected"; id: string; blockId: string | null }
  | { type: "hr_field_set"; id: string; field: string; value: string }
  | { type: "confirmed"; id: string }
  | { type: "reopened"; id: string }
  | { type: "retried"; id: string }
  | { type: "removed"; id: string }
  | { type: "validation_error_set"; message: string | null };
