export type OCRJobStatus =
    | "queued"
    | "processing"
    | "needs_review"
    | "confirmed"
    | "error";

export interface GroundedBlock {
    id: string;
    text: string;
    confidence: number;
    bbox: { x: number; y: number; w: number; h: number };
    field_key: string | null;
}

export interface ND30ExportArticle {
    title: string;
    content: string;
}

export interface ND30ExportPayload {
    doc_type: string;
    company_name: string;
    department: string;
    doc_number: string;
    location_date: string;
    subject: string;
    bases: string[];
    articles: ND30ExportArticle[];
    signatory_title: string;
    signatory_name: string;
    recipients: string[];
}

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
    blocks?: GroundedBlock[];
    activeBlockId?: string | null;
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
    | { type: "completed"; id: string; text: string; engine?: string; blocks?: GroundedBlock[] }
    | { type: "failed"; id: string; message: string }
    | { type: "text_edited"; id: string; text: string }
    | { type: "block_selected"; id: string; blockId: string | null }
    | { type: "confirmed"; id: string }
    | { type: "reopened"; id: string }
    | { type: "retried"; id: string }
    | { type: "removed"; id: string }
    | { type: "clear_all" }
    | { type: "validation_error_set"; message: string | null };

