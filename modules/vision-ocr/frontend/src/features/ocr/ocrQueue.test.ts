import { describe, expect, test } from "vitest";
import type { OCRJob, OCRQueueState } from "../../types/ocr";
import {
  canRemoveJob,
  createOCRJobs,
  MAX_QUEUE_SIZE,
  initialOCRQueueState,
  ocrQueueReducer,
  validateFiles,
} from "./ocrQueue";

function file(
  name: string,
  type = "image/png",
  size = 8,
  lastModified = 1,
): File {
  return new File([new Uint8Array(size)], name, { type, lastModified });
}

function job(
  id: string,
  status: OCRJob["status"] = "queued",
  overrides: Partial<OCRJob> = {},
): OCRJob {
  return {
    id,
    file: file(`${id}.png`),
    previewUrl: `blob:${id}`,
    status,
    originalText: "",
    editedText: "",
    confirmedText: null,
    errorMessage: null,
    attemptCount: 0,
    createdAt: 1,
    startedAt: null,
    ...overrides,
  };
}

function stateWith(jobs: OCRJob[], selectedJobId: string | null): OCRQueueState {
  return { jobs, selectedJobId, validationError: null };
}

describe("validateFiles", () => {
  test("creates isolated queued jobs with owned preview URLs", () => {
    const jobs = createOCRJobs([file("cv.png"), file("id.webp", "image/webp")], {
      createId: (_file, index) => `job-${index}`,
      createPreviewUrl: (item) => `blob:${item.name}`,
      now: () => 42,
    });

    expect(jobs).toEqual([
      expect.objectContaining({
        id: "job-0",
        previewUrl: "blob:cv.png",
        status: "queued",
        originalText: "",
        editedText: "",
        createdAt: 42,
      }),
      expect.objectContaining({
        id: "job-1",
        previewUrl: "blob:id.webp",
        status: "queued",
        createdAt: 43,
      }),
    ]);
  });

  test("accepts only the remaining queue capacity and reports overflow", () => {
    const existing = [job("existing")];
    const selection = Array.from({ length: MAX_QUEUE_SIZE }, (_, index) =>
      file(`file-${index}.png`, "image/png", 8, index + 10),
    );

    const result = validateFiles(selection, existing);

    expect(result.acceptedFiles.map((item) => item.name)).toEqual([
      "file-0.png",
      "file-1.png",
      "file-2.png",
      "file-3.png",
    ]);
    expect(result.errors).toContain("Hàng đợi chỉ chứa tối đa 5 tài liệu.");
  });

  test("rejects invalid, empty, oversized, and likely duplicate files", () => {
    const duplicate = file("same.png", "image/png", 8, 77);
    const invalid = file("notes.txt", "text/plain");
    const empty = file("empty.png", "image/png", 0);
    const oversized = file("large.webp", "image/webp", 10 * 1024 * 1024 + 1);

    const result = validateFiles(
      [invalid, empty, oversized, duplicate],
      [job("same", "queued", { file: duplicate })],
    );

    expect(result.acceptedFiles).toEqual([]);
    expect(result.errors).toEqual([
      "notes.txt: định dạng không được hỗ trợ.",
      "empty.png: tệp trống hoặc không đọc được.",
      "large.webp: dung lượng vượt quá 10 MB.",
      "same.png: có thể đã tồn tại trong phiên này.",
    ]);
  });
});

describe("ocrQueueReducer", () => {
  test("defines removal eligibility once for every queue status", () => {
    expect(canRemoveJob("queued")).toBe(true);
    expect(canRemoveJob("confirmed")).toBe(true);
    expect(canRemoveJob("error")).toBe(true);
    expect(canRemoveJob("processing")).toBe(false);
    expect(canRemoveJob("needs_review")).toBe(false);
  });

  test("adds jobs and selects the first job without replacing an existing selection", () => {
    const first = ocrQueueReducer(initialOCRQueueState, {
      type: "jobs_added",
      jobs: [job("a"), job("b")],
    });
    const second = ocrQueueReducer(first, {
      type: "jobs_added",
      jobs: [job("c")],
    });

    expect(first.selectedJobId).toBe("a");
    expect(second.selectedJobId).toBe("a");
    expect(second.jobs.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  test("completing a background job preserves selection and both text versions", () => {
    const initial = stateWith(
      [job("a"), job("b", "processing", { startedAt: 20 })],
      "a",
    );

    const next = ocrQueueReducer(initial, {
      type: "completed",
      id: "b",
      text: "Hợp đồng lao động",
    });

    expect(next.selectedJobId).toBe("a");
    expect(next.jobs[1]).toMatchObject({
      status: "needs_review",
      originalText: "Hợp đồng lao động",
      editedText: "Hợp đồng lao động",
      startedAt: null,
    });
  });

  test("editing, confirming, and reopening never mutate the OCR original", () => {
    const review = stateWith(
      [
        job("a", "needs_review", {
          originalText: "Bản OCR gốc",
          editedText: "Bản OCR gốc",
        }),
      ],
      "a",
    );
    const edited = ocrQueueReducer(review, {
      type: "text_edited",
      id: "a",
      text: "Bản HR đã sửa",
    });
    const confirmed = ocrQueueReducer(edited, {
      type: "confirmed",
      id: "a",
    });
    const reopened = ocrQueueReducer(confirmed, {
      type: "reopened",
      id: "a",
    });

    expect(confirmed.jobs[0]).toMatchObject({
      status: "confirmed",
      originalText: "Bản OCR gốc",
      editedText: "Bản HR đã sửa",
      confirmedText: "Bản HR đã sửa",
    });
    expect(reopened.jobs[0]).toMatchObject({
      status: "needs_review",
      originalText: "Bản OCR gốc",
      editedText: "Bản HR đã sửa",
      confirmedText: null,
    });
  });

  test("removes only queued, confirmed, or failed jobs and selects a neighbor", () => {
    const initial = stateWith(
      [
        job("queued"),
        job("processing", "processing"),
        job("review", "needs_review"),
        job("confirmed", "confirmed"),
        job("error", "error"),
      ],
      "queued",
    );

    const withoutQueued = ocrQueueReducer(initial, {
      type: "removed",
      id: "queued",
    });
    const processingAttempt = ocrQueueReducer(withoutQueued, {
      type: "removed",
      id: "processing",
    });
    const reviewAttempt = ocrQueueReducer(processingAttempt, {
      type: "removed",
      id: "review",
    });

    expect(withoutQueued.selectedJobId).toBe("processing");
    expect(processingAttempt.jobs.map((item) => item.id)).toEqual([
      "processing",
      "review",
      "confirmed",
      "error",
    ]);
    expect(reviewAttempt).toEqual(processingAttempt);
  });

  test("retries only failed jobs and increments the attempt count", () => {
    const initial = stateWith(
      [
        job("failed", "error", { attemptCount: 1, errorMessage: "Lỗi" }),
        job("review", "needs_review"),
      ],
      "failed",
    );

    const retry = ocrQueueReducer(initial, { type: "retried", id: "failed" });
    const invalidRetry = ocrQueueReducer(retry, {
      type: "retried",
      id: "review",
    });

    expect(retry.jobs[0]).toMatchObject({
      status: "queued",
      attemptCount: 2,
      errorMessage: null,
    });
    expect(invalidRetry).toEqual(retry);
  });
});
