/** Response shape from POST /api/ocr/scan */
export interface OCRScanResponse {
  text: string;
  image_b64: string;
  status: "success" | "error";
}

/** UI state machine for the scanner */
export type OCRScanState = "idle" | "loading" | "done" | "error";
