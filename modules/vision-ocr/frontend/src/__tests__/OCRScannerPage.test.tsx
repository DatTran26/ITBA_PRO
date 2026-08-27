import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { OCRScannerPage } from "../components/OCRScannerPage";
import type { OCRScanResponse } from "../types/ocr";

const pendingScan = () => new Promise<OCRScanResponse>(() => undefined);

function image(name: string, size = 8, lastModified = 1): File {
  return new File([new Uint8Array(size)], name, {
    type: "image/png",
    lastModified,
  });
}

describe("OCRScannerPage", () => {
  test("renders Document AI inside a truthful HRMS shell", () => {
    render(<OCRScannerPage scanner={pendingScan} />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Document AI" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Điều hướng chính" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Thanh")).toBeInTheDocument();
    expect(screen.getByText("HR Operations")).toBeInTheDocument();
    expect(screen.getByText("Tài khoản demo")).toBeInTheDocument();

    const dashboard = screen.getByText("Tổng quan & báo cáo");
    expect(dashboard.closest("[aria-disabled='true']")).toBeInTheDocument();
    const documentAI = screen.getByText("Document AI", {
      selector: ".navigation-item__label",
    });
    expect(documentAI.closest("[aria-current='page']")).toBeInTheDocument();
    expect(screen.getAllByText("Sắp ra mắt").length).toBeGreaterThan(1);
    expect(
      screen.getByRole("status", { name: "Cập nhật hàng đợi OCR" }),
    ).toBeInTheDocument();
  });

  test("starts with an accurate collapsed rail at tablet widths", async () => {
    const user = userEvent.setup();
    const matchMedia = vi.mocked(window.matchMedia);
    const originalImplementation = matchMedia.getMockImplementation();
    matchMedia.mockImplementation(
      (query) =>
        ({
          matches: query === "(max-width: 1279px)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );

    try {
      const { container } = render(<OCRScannerPage scanner={pendingScan} />);
      const shell = container.querySelector(".app-shell");
      const toggle = screen.getByRole("button", {
        name: "Mở rộng thanh điều hướng",
      });

      expect(shell).toHaveAttribute("data-sidebar-collapsed", "true");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await user.click(toggle);
      expect(shell).toHaveAttribute("data-sidebar-collapsed", "false");
      expect(toggle).toHaveAccessibleName("Thu gọn thanh điều hướng");
    } finally {
      matchMedia.mockImplementation(originalImplementation!);
    }
  });

  test("preserves the desktop rail preference across responsive changes", async () => {
    const user = userEvent.setup();
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    let compact = false;
    const matchMedia = vi.mocked(window.matchMedia);
    const originalImplementation = matchMedia.getMockImplementation();
    matchMedia.mockImplementation(
      (query) =>
        ({
          get matches() {
            return query === "(max-width: 1279px)" ? compact : false;
          },
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (
            _type: string,
            listener: EventListenerOrEventListenerObject,
          ) => {
            if (query === "(max-width: 1279px)") {
              listeners.add(listener as (event: MediaQueryListEvent) => void);
            }
          },
          removeEventListener: (
            _type: string,
            listener: EventListenerOrEventListenerObject,
          ) => {
            listeners.delete(listener as (event: MediaQueryListEvent) => void);
          },
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );

    try {
      const { container } = render(<OCRScannerPage scanner={pendingScan} />);
      await user.click(
        screen.getByRole("button", { name: "Thu gọn thanh điều hướng" }),
      );
      expect(container.querySelector(".app-shell")).toHaveAttribute(
        "data-sidebar-collapsed",
        "true",
      );

      compact = true;
      act(() =>
        listeners.forEach((listener) =>
          listener({ matches: true } as MediaQueryListEvent),
        ),
      );
      compact = false;
      act(() =>
        listeners.forEach((listener) =>
          listener({ matches: false } as MediaQueryListEvent),
        ),
      );

      expect(container.querySelector(".app-shell")).toHaveAttribute(
        "data-sidebar-collapsed",
        "true",
      );
    } finally {
      matchMedia.mockImplementation(originalImplementation!);
    }
  });

  test("adds valid images to the session queue", async () => {
    const user = userEvent.setup();
    render(<OCRScannerPage scanner={pendingScan} />);
    const input = screen.getByLabelText("Chọn tài liệu để OCR");

    await user.upload(input, [
      image("hop-dong.png", 8, 2),
      image("cccd.png", 8, 3),
    ]);

    const queue = screen.getByRole("list", { name: "Hàng đợi OCR" });
    expect(within(queue).getByText("hop-dong.png")).toBeInTheDocument();
    expect(within(queue).getByText("cccd.png")).toBeInTheDocument();
  });

  test("focuses a concise validation summary and caps the queue at five", async () => {
    const user = userEvent.setup();
    render(<OCRScannerPage scanner={pendingScan} />);
    const input = screen.getByLabelText("Chọn tài liệu để OCR");
    const files = Array.from({ length: 6 }, (_, index) =>
      image(`tai-lieu-${index + 1}.png`, 8, index + 10),
    );

    await user.upload(input, files);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Hàng đợi chỉ chứa tối đa 5 tài liệu.");
    await waitFor(() => expect(alert).toHaveFocus());
    expect(
      within(screen.getByRole("list", { name: "Hàng đợi OCR" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(5);
  });

  test("rejects an oversized image without adding it to the queue", async () => {
    const user = userEvent.setup();
    render(<OCRScannerPage scanner={pendingScan} />);

    await user.upload(
      screen.getByLabelText("Chọn tài liệu để OCR"),
      image("qua-lon.png", 10 * 1024 * 1024 + 1, 50),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "qua-lon.png: dung lượng vượt quá 10 MB.",
    );
    expect(
      screen.queryByText("qua-lon.png", { selector: ".job-name" }),
    ).not.toBeInTheDocument();
  });

  test("exposes a static workspace mode when reduced motion is preferred", () => {
    const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );

    try {
      const { container } = render(<OCRScannerPage scanner={pendingScan} />);
      expect(container.querySelector(".document-workspace")).toHaveAttribute(
        "data-motion",
        "reduced",
      );
      expect(
        screen.getByText("Kiểm tra bằng chứng gốc trước khi xác nhận nội dung OCR."),
      ).toBeVisible();
    } finally {
      matchMedia.mockRestore();
    }
  });
});
