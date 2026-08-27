import { useEffect, useReducer, useRef } from "react";
import type { OCRJob, OCRQueueState } from "../../types/ocr";
import {
  OCRServiceError,
  scanImage,
  type ScanImage,
} from "../../services/ocrService";
import {
  canRemoveJob,
  createOCRJobs,
  initialOCRQueueState,
  ocrQueueReducer,
  validateFiles,
} from "./ocrQueue";

export interface OCRQueueController {
  state: OCRQueueState;
  selectedJob: OCRJob | null;
  addFiles(files: FileList | File[]): void;
  selectJob(id: string): void;
  editText(id: string, text: string): void;
  confirmJob(id: string): void;
  reopenJob(id: string): void;
  retryJob(id: string): void;
  removeJob(id: string): void;
  clearValidationError(): void;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof OCRServiceError && error.kind === "network") {
    return "Không thể kết nối dịch vụ OCR.";
  }
  return "Dịch vụ OCR chưa thể xử lý tài liệu này.";
}

export function useOCRQueue(scanner: ScanImage = scanImage): OCRQueueController {
  const [state, dispatch] = useReducer(ocrQueueReducer, initialOCRQueueState);
  const inFlightId = useRef<string | null>(null);
  const ownedPreviewUrls = useRef(new Set<string>());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      ownedPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      ownedPreviewUrls.current.clear();
    };
  }, []);

  useEffect(() => {
    const processingJob = state.jobs.find((job) => job.status === "processing");
    if (processingJob || inFlightId.current) return;

    const nextJob = state.jobs.find((job) => job.status === "queued");
    if (!nextJob) return;

    inFlightId.current = nextJob.id;
    dispatch({
      type: "processing_started",
      id: nextJob.id,
      startedAt: Date.now(),
    });

    void scanner(nextJob.file)
      .then((response) => {
        if (!isMounted.current) return;
        inFlightId.current = null;
        dispatch({ type: "completed", id: nextJob.id, text: response.text });
      })
      .catch((error: unknown) => {
        if (!isMounted.current) return;
        inFlightId.current = null;
        dispatch({
          type: "failed",
          id: nextJob.id,
          message: safeErrorMessage(error),
        });
      })
      .finally(() => {
        inFlightId.current = null;
      });
  }, [scanner, state.jobs]);

  const selectedJob =
    state.jobs.find((job) => job.id === state.selectedJobId) ?? null;

  function addFiles(files: FileList | File[]): void {
    const { acceptedFiles, errors } = validateFiles(files, state.jobs);
    const jobs = createOCRJobs(acceptedFiles);
    jobs.forEach((job) => ownedPreviewUrls.current.add(job.previewUrl));

    if (jobs.length > 0) {
      dispatch({ type: "jobs_added", jobs });
    }
    dispatch({
      type: "validation_error_set",
      message: errors.length > 0 ? errors.join(" ") : null,
    });
  }

  function selectJob(id: string): void {
    dispatch({ type: "selection_changed", id });
  }

  function editText(id: string, text: string): void {
    dispatch({ type: "text_edited", id, text });
  }

  function confirmJob(id: string): void {
    dispatch({ type: "confirmed", id });
  }

  function reopenJob(id: string): void {
    dispatch({ type: "reopened", id });
  }

  function retryJob(id: string): void {
    dispatch({ type: "retried", id });
  }

  function removeJob(id: string): void {
    const job = state.jobs.find((item) => item.id === id);
    if (!job || !canRemoveJob(job.status)) return;

    URL.revokeObjectURL(job.previewUrl);
    ownedPreviewUrls.current.delete(job.previewUrl);
    dispatch({ type: "removed", id });
  }

  function clearValidationError(): void {
    dispatch({ type: "validation_error_set", message: null });
  }

  return {
    state,
    selectedJob,
    addFiles,
    selectJob,
    editText,
    confirmJob,
    reopenJob,
    retryJob,
    removeJob,
    clearValidationError,
  };
}
