import { StrictMode, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { OCRScanResponse } from "../../types/ocr";
import { OCRServiceError } from "../../services/ocrService";
import { useOCRQueue } from "./useOCRQueue";

interface PendingScan {
  file: File;
  resolve(response: OCRScanResponse): void;
  reject(error: Error): void;
}

function image(name: string, lastModified: number): File {
  return new File(["image"], name, { type: "image/png", lastModified });
}

function success(text: string): OCRScanResponse {
  return { text, image_b64: "data:image/png;base64,dummy", status: "success" };
}

function deferredScanner() {
  const pending: PendingScan[] = [];
  const scan = (file: File) =>
    new Promise<OCRScanResponse>((resolve, reject) => {
      pending.push({ file, resolve, reject });
    });
  return { pending, scan };
}

describe("useOCRQueue", () => {
  beforeEach(() => {
    vi.mocked(URL.createObjectURL).mockClear();
    vi.mocked(URL.revokeObjectURL).mockClear();
  });

  test("processes files in FIFO order with one active request", async () => {
    const scanner = deferredScanner();
    const files = [image("a.png", 1), image("b.png", 2), image("c.png", 3)];
    const { result } = renderHook(() => useOCRQueue(scanner.scan));

    act(() => result.current.addFiles(files));

    await waitFor(() => {
      expect(result.current.state.jobs.map((job) => job.status)).toEqual([
        "processing",
        "queued",
        "queued",
      ]);
    });
    expect(scanner.pending.map(({ file }) => file.name)).toEqual(["a.png"]);

    act(() => scanner.pending[0]?.resolve(success("Văn bản A")));

    await waitFor(() => {
      expect(result.current.state.jobs.map((job) => job.status)).toEqual([
        "needs_review",
        "processing",
        "queued",
      ]);
    });
    expect(scanner.pending.map(({ file }) => file.name)).toEqual([
      "a.png",
      "b.png",
    ]);
  });

  test("keeps an empty successful result in human review", async () => {
    const scanner = deferredScanner();
    const { result } = renderHook(() => useOCRQueue(scanner.scan));

    act(() => result.current.addFiles([image("blank.png", 4)]));
    await waitFor(() => expect(scanner.pending).toHaveLength(1));
    act(() => scanner.pending[0]?.resolve(success("")));

    await waitFor(() => {
      expect(result.current.selectedJob).toMatchObject({
        status: "needs_review",
        originalText: "",
        editedText: "",
      });
    });
  });

  test("maps service errors to safe copy and retries the original file", async () => {
    const scanner = deferredScanner();
    const source = image("retry.png", 5);
    const { result } = renderHook(() => useOCRQueue(scanner.scan));

    act(() => result.current.addFiles([source]));
    await waitFor(() => expect(scanner.pending).toHaveLength(1));
    act(() => scanner.pending[0]?.reject(new OCRServiceError("network")));

    await waitFor(() => {
      expect(result.current.selectedJob).toMatchObject({
        status: "error",
        errorMessage: "Không thể kết nối dịch vụ OCR.",
      });
    });

    const failedId = result.current.selectedJob?.id;
    expect(failedId).toBeTruthy();
    act(() => result.current.retryJob(failedId!));

    await waitFor(() => expect(scanner.pending).toHaveLength(2));
    expect(scanner.pending[1]?.file).toBe(source);
    expect(result.current.selectedJob?.attemptCount).toBe(1);
  });

  test("revokes owned preview URLs on removal and unmount", async () => {
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:a")
      .mockReturnValueOnce("blob:b");
    const scanner = deferredScanner();
    const { result, unmount } = renderHook(() => useOCRQueue(scanner.scan));

    act(() =>
      result.current.addFiles([image("a.png", 6), image("b.png", 7)]),
    );
    await waitFor(() => expect(result.current.state.jobs).toHaveLength(2));

    const queuedJob = result.current.state.jobs.find(
      (job) => job.status === "queued",
    );
    expect(queuedJob).toBeTruthy();
    act(() => result.current.removeJob(queuedJob!.id));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(queuedJob!.previewUrl);

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:a");
  });

  test("completes a scan when React StrictMode replays effects", async () => {
    const scanner = deferredScanner();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    );
    const { result } = renderHook(() => useOCRQueue(scanner.scan), { wrapper });

    act(() => result.current.addFiles([image("strict.png", 8)]));
    await waitFor(() => expect(scanner.pending).toHaveLength(1));
    act(() => scanner.pending[0]?.resolve(success("Nội dung StrictMode")));

    await waitFor(() => {
      expect(result.current.selectedJob).toMatchObject({
        status: "needs_review",
        editedText: "Nội dung StrictMode",
      });
    });
  });
});
