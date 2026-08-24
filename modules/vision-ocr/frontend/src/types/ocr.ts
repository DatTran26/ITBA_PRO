export interface OCRScanResponse {
  text: string;
  image_b64: string;
  status: "success" | "error";
}

export type OCRScanState = "idle" | "loading" | "done" | "error";
