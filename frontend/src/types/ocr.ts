export interface OCRScanResponse {
  text: string;
  image_b64: string;
  status: "success" | "error";
}
