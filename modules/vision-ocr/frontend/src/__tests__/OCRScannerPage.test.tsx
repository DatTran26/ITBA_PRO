import React from "react";
import { render, screen } from "@testing-library/react";
import { OCRScannerPage } from "../components/OCRScannerPage";

describe("OCRScannerPage", () => {
  it("renders scanner title and drag and drop area", () => {
    render(<OCRScannerPage />);
    expect(screen.getByText(/Vision OCR Scanner/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Kéo thả ảnh vào đây hoặc nhấn để chọn file/i)
    ).toBeInTheDocument();
  });
});
