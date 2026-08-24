export interface OCRScanResponse {
  text: string;
  image_b64: string;
  status: "success" | "error";
}

export type OCRScanState = "idle" | "loading" | "done" | "error";

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
  attemptCount: number;
  createdAt: number;
  startedAt: number | null;
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
  | { type: "completed"; id: string; text: string }
  | { type: "failed"; id: string; message: string }
  | { type: "text_edited"; id: string; text: string }
  | { type: "confirmed"; id: string }
  | { type: "reopened"; id: string }
  | { type: "retried"; id: string }
  | { type: "removed"; id: string }
  | { type: "validation_error_set"; message: string | null };
