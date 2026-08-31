import { afterEach, describe, expect, test, vi } from "vitest";
import { scanImage } from "./ocrService";

function image(): File {
  return new File(["image"], "document.png", { type: "image/png" });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("scanImage", () => {
  test("classifies a fetch rejection as a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(scanImage(image())).rejects.toMatchObject({
      name: "OCRServiceError",
      kind: "network",
    });
  });

  test("does not expose server detail for a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "internal stack trace" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const request = scanImage(image());
    await expect(request).rejects.toMatchObject({
      name: "OCRServiceError",
      kind: "service",
    });
    await expect(request).rejects.not.toThrow("internal stack trace");
  });

  test("rejects a malformed success payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ text: null, status: "success" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(scanImage(image())).rejects.toMatchObject({
      name: "OCRServiceError",
      kind: "service",
    });
  });

  test("rejects a success payload without a reusable image preview", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ text: "OCR", status: "success" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(scanImage(image())).rejects.toMatchObject({
      name: "OCRServiceError",
      kind: "service",
    });
  });

  test("returns a complete successful response", async () => {
    const response = {
      text: "Hợp đồng lao động",
      image_b64: "data:image/png;base64,dummy",
      status: "success" as const,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(response), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(scanImage(image())).resolves.toEqual(response);
  });
});
