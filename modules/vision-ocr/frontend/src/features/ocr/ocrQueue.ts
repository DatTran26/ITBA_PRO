import type {
  GroundedBlock,
  OCRJob,
  OCRJobStatus,
  OCRQueueAction,
  OCRQueueState,
} from "../../types/ocr";

const REMOVABLE_STATUSES = new Set<OCRJobStatus>([
  "queued",
  "confirmed",
  "error",
]);

export function canRemoveJob(status: OCRJobStatus): boolean {
  return REMOVABLE_STATUSES.has(status);
}

export const MAX_QUEUE_SIZE = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const ACCEPTED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

export const initialOCRQueueState: OCRQueueState = {
  jobs: [],
  selectedJobId: null,
  validationError: null,
};

interface OCRJobFactoryDependencies {
  createId(file: File, index: number): string;
  createPreviewUrl(file: File): string;
  now(): number;
}

const defaultFactoryDependencies: OCRJobFactoryDependencies = {
  createId: () => globalThis.crypto.randomUUID(),
  createPreviewUrl: (file) => URL.createObjectURL(file),
  now: () => Date.now(),
};

export function createOCRJobs(
  files: File[],
  dependencies: OCRJobFactoryDependencies = defaultFactoryDependencies,
): OCRJob[] {
  const createdAt = dependencies.now();

  return files.map((file, index) => ({
    id: dependencies.createId(file, index),
    file,
    previewUrl: dependencies.createPreviewUrl(file),
    status: "queued",
    originalText: "",
    editedText: "",
    confirmedText: null,
    errorMessage: null,
    engine: null,
    attemptCount: 0,
    createdAt: createdAt + index,
    startedAt: null,
    blocks: [],
    activeBlockId: null,
    hrFields: {},
  }));
}

export interface FileValidationResult {
  acceptedFiles: File[];
  errors: string[];
}

function fingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function hasAcceptedFormat(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    ACCEPTED_MIME_TYPES.has(file.type) && ACCEPTED_EXTENSIONS.has(extension)
  );
}

export function validateFiles(
  files: File[] | FileList,
  existingJobs: OCRJob[],
): FileValidationResult {
  const acceptedFiles: File[] = [];
  const errors: string[] = [];
  const fingerprints = new Set(existingJobs.map((item) => fingerprint(item.file)));
  let capacityReported = false;

  for (const file of Array.from(files)) {
    if (!hasAcceptedFormat(file)) {
      errors.push(`${file.name}: định dạng không được hỗ trợ.`);
      continue;
    }

    if (file.size === 0) {
      errors.push(`${file.name}: tệp trống hoặc không đọc được.`);
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: dung lượng vượt quá 10 MB.`);
      continue;
    }

    const fileFingerprint = fingerprint(file);
    if (fingerprints.has(fileFingerprint)) {
      errors.push(`${file.name}: có thể đã tồn tại trong phiên này.`);
      continue;
    }

    if (existingJobs.length + acceptedFiles.length >= MAX_QUEUE_SIZE) {
      if (!capacityReported) {
        errors.push("Hàng đợi chỉ chứa tối đa 5 tài liệu.");
        capacityReported = true;
      }
      continue;
    }

    fingerprints.add(fileFingerprint);
    acceptedFiles.push(file);
  }

  return { acceptedFiles, errors };
}

function updateJob(
  state: OCRQueueState,
  id: string,
  update: (job: OCRJob) => OCRJob | null,
): OCRQueueState {
  let changed = false;
  const jobs = state.jobs.map((job) => {
    if (job.id !== id) return job;
    const next = update(job);
    if (!next) return job;
    changed = true;
    return next;
  });

  return changed ? { ...state, jobs } : state;
}

export function ocrQueueReducer(
  state: OCRQueueState,
  action: OCRQueueAction,
): OCRQueueState {
  switch (action.type) {
    case "jobs_added": {
      if (action.jobs.length === 0) return state;
      const jobs = [...state.jobs, ...action.jobs].slice(0, MAX_QUEUE_SIZE);
      return {
        ...state,
        jobs,
        selectedJobId: state.selectedJobId ?? jobs[0]?.id ?? null,
      };
    }

    case "selection_changed":
      return state.jobs.some((job) => job.id === action.id)
        ? { ...state, selectedJobId: action.id }
        : state;

    case "processing_started":
      return updateJob(state, action.id, (job) =>
        job.status === "queued"
          ? { ...job, status: "processing", startedAt: action.startedAt }
          : null,
      );

    case "completed":
      return updateJob(state, action.id, (job) =>
        job.status === "processing"
          ? {
              ...job,
              status: "needs_review",
              originalText: action.text,
              editedText: action.text,
              errorMessage: null,
              startedAt: null,
              blocks: action.blocks ?? [],
              activeBlockId: action.blocks?.[0]?.id ?? null,
            }
          : null,
      );

    case "failed":
      return updateJob(state, action.id, (job) =>
        job.status === "processing"
          ? {
              ...job,
              status: "error",
              errorMessage: action.message,
              startedAt: null,
            }
          : null,
      );

    case "text_edited":
      return updateJob(state, action.id, (job) =>
        job.status === "needs_review" ? { ...job, editedText: action.text } : null,
      );

    case "block_selected":
      return updateJob(state, action.id, (job) => ({
        ...job,
        activeBlockId: action.blockId,
      }));

    case "hr_field_set":
      return updateJob(state, action.id, (job) => ({
        ...job,
        hrFields: { ...job.hrFields, [action.field]: action.value },
      }));

    case "confirmed":
      return updateJob(state, action.id, (job) =>
        job.status === "needs_review"
          ? {
              ...job,
              status: "confirmed",
              confirmedText: job.editedText,
            }
          : null,
      );

    case "reopened":
      return updateJob(state, action.id, (job) =>
        job.status === "confirmed"
          ? { ...job, status: "needs_review", confirmedText: null }
          : null,
      );

    case "retried":
      return updateJob(state, action.id, (job) =>
        job.status === "error"
          ? {
              ...job,
              status: "queued",
              attemptCount: job.attemptCount + 1,
              errorMessage: null,
              startedAt: null,
              blocks: [],
              activeBlockId: null,
            }
          : null,
      );

    case "removed": {
      const index = state.jobs.findIndex((job) => job.id === action.id);
      if (index < 0) return state;
      const target = state.jobs[index];
      if (!target || !canRemoveJob(target.status)) {
        return state;
      }

      const jobs = state.jobs.filter((job) => job.id !== action.id);
      const selectedJobId =
        state.selectedJobId === action.id
          ? (jobs[index]?.id ?? jobs[index - 1]?.id ?? null)
          : state.selectedJobId;
      return { ...state, jobs, selectedJobId };
    }

    case "validation_error_set":
      return { ...state, validationError: action.message };
  }
}
