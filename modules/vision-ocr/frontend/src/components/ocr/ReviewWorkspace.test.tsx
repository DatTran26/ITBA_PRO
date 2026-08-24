import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { OCRJob } from "../../types/ocr";
import { ReviewWorkspace } from "./ReviewWorkspace";

function reviewJob(overrides: Partial<OCRJob> = {}): OCRJob {
  return {
    id: "job-1",
    file: new File(["image"], "hop-dong.png", { type: "image/png" }),
    previewUrl: "blob:document",
    status: "needs_review",
    originalText: "Bản OCR gốc",
    editedText: "Bản OCR gốc",
    confirmedText: null,
    errorMessage: null,
    attemptCount: 0,
    createdAt: 1,
    startedAt: null,
    ...overrides,
  };
}

function ReviewHarness({ initialJob }: { initialJob: OCRJob }) {
  const [job, setJob] = useState(initialJob);
  return (
    <ReviewWorkspace
      job={job}
      onEdit={(_id, text) => setJob((current) => ({ ...current, editedText: text }))}
      onConfirm={() =>
        setJob((current) => ({
          ...current,
          status: "confirmed",
          confirmedText: current.editedText,
        }))
      }
      onReopen={() =>
        setJob((current) => ({
          ...current,
          status: "needs_review",
          confirmedText: null,
        }))
      }
      onRetry={() => undefined}
    />
  );
}

describe("ReviewWorkspace", () => {
  test("preserves the OCR original across edit, confirmation, and reopening", async () => {
    const user = userEvent.setup();
    render(<ReviewHarness initialJob={reviewJob()} />);

    const editor = screen.getByRole("textbox", {
      name: "Nội dung sau kiểm tra",
    });
    await user.clear(editor);
    await user.type(editor, "Bản HR đã sửa");
    await user.click(screen.getByText("Xem bản OCR gốc"));
    expect(screen.getByText("Bản OCR gốc", { selector: "pre" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xác nhận nội dung" }));
    expect(screen.getByRole("status")).toHaveTextContent("Đã xác nhận");
    expect(editor).toHaveAttribute("readonly");
    expect(editor).toHaveValue("Bản HR đã sửa");

    await user.click(screen.getByRole("button", { name: "Mở lại để sửa" }));
    expect(editor).not.toHaveAttribute("readonly");
    expect(editor).toHaveValue("Bản HR đã sửa");
    expect(screen.getByText("Bản OCR gốc", { selector: "pre" })).toBeInTheDocument();
  });

  test("copies and downloads the edited text", async () => {
    const user = userEvent.setup();
    const clipboard = vi.spyOn(navigator.clipboard, "writeText");
    const NativeBlob = globalThis.Blob;
    const blobConstructor = vi.fn(function BlobMock(
      parts: BlobPart[],
      options?: BlobPropertyBag,
    ) {
      return new NativeBlob(parts, options);
    });
    vi.stubGlobal("Blob", blobConstructor);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    try {
      render(
        <ReviewWorkspace
          job={reviewJob({ editedText: "Bản đã sửa" })}
          onEdit={() => undefined}
          onConfirm={() => undefined}
          onReopen={() => undefined}
          onRetry={() => undefined}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Sao chép văn bản" }));
      expect(clipboard).toHaveBeenCalledWith("Bản đã sửa");

      await user.click(screen.getByRole("button", { name: "Tải xuống TXT" }));
      expect(blobConstructor).toHaveBeenCalledWith(["Bản đã sửa"], {
        type: "text/plain;charset=utf-8",
      });
      expect(click).toHaveBeenCalledOnce();
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  test("supports keyboard navigation between source and result tabs", async () => {
    const user = userEvent.setup();
    render(
      <ReviewWorkspace
        job={reviewJob()}
        onEdit={() => undefined}
        onConfirm={() => undefined}
        onReopen={() => undefined}
        onRetry={() => undefined}
      />,
    );

    const sourceTab = screen.getByRole("tab", { name: "Tài liệu gốc" });
    const resultTab = screen.getByRole("tab", { name: "Kết quả OCR" });
    expect(sourceTab).toHaveAttribute("aria-selected", "true");

    sourceTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(resultTab).toHaveAttribute("aria-selected", "true");
    expect(resultTab).toHaveFocus();
    await user.keyboard("{Home}");
    expect(sourceTab).toHaveAttribute("aria-selected", "true");
  });

  test("keeps blank output in review and exposes retry for failed jobs", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const { rerender } = render(
      <ReviewWorkspace
        job={reviewJob({ originalText: "", editedText: "" })}
        onEdit={() => undefined}
        onConfirm={() => undefined}
        onReopen={() => undefined}
        onRetry={retry}
      />,
    );

    expect(
      screen.getByText("Không phát hiện được văn bản đáng tin cậy"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Đã xác nhận")).not.toBeInTheDocument();

    rerender(
      <ReviewWorkspace
        job={reviewJob({
          status: "error",
          errorMessage: "Không thể kết nối dịch vụ OCR.",
          attemptCount: 2,
        })}
        onEdit={() => undefined}
        onConfirm={() => undefined}
        onReopen={() => undefined}
        onRetry={retry}
      />,
    );
    expect(screen.getByText(/Đã thử 3 lần/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thử lại OCR" }));
    expect(retry).toHaveBeenCalledWith("job-1");
  });

  test("resets copy feedback when the selected job changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ReviewWorkspace
        job={reviewJob()}
        onEdit={() => undefined}
        onConfirm={() => undefined}
        onReopen={() => undefined}
        onRetry={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sao chép văn bản" }));
    expect(screen.getByRole("button", { name: "Sao chép văn bản" })).toHaveTextContent(
      "Đã sao chép",
    );

    rerender(
      <ReviewWorkspace
        job={reviewJob({ id: "job-2", file: new File(["image"], "cccd.png") })}
        onEdit={() => undefined}
        onConfirm={() => undefined}
        onReopen={() => undefined}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Sao chép văn bản" })).toHaveTextContent(
      "Sao chép",
    );
  });

  test("ignores clipboard completion from a previously selected job", async () => {
    const user = userEvent.setup();
    let finishCopy: (() => void) | undefined;
    vi.spyOn(navigator.clipboard, "writeText").mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishCopy = resolve;
        }),
    );
    const { rerender } = render(
      <ReviewWorkspace
        job={reviewJob()}
        onEdit={() => undefined}
        onConfirm={() => undefined}
        onReopen={() => undefined}
        onRetry={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sao chép văn bản" }));
    rerender(
      <ReviewWorkspace
        job={reviewJob({ id: "job-2", file: new File(["image"], "cccd.png") })}
        onEdit={() => undefined}
        onConfirm={() => undefined}
        onReopen={() => undefined}
        onRetry={() => undefined}
      />,
    );
    await act(async () => finishCopy?.());

    expect(screen.getByRole("button", { name: "Sao chép văn bản" })).toHaveTextContent(
      "Sao chép",
    );
  });
});
