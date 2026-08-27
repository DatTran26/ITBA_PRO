import type { OCRJobStatus } from "../../types/ocr";

const statusLabels: Record<OCRJobStatus, string> = {
  queued: "Tài liệu đang chờ xử lý",
  processing: "OCR đang chuyển bằng chứng nguồn thành bản nháp",
  needs_review: "Bản OCR đang chờ con người kiểm tra",
  confirmed: "Nội dung đã được con người xác nhận",
  error: "Luồng OCR bị gián đoạn và cần xử lý",
};

interface EvidenceSpineProps {
  status: OCRJobStatus;
}

export function EvidenceSpine({ status }: EvidenceSpineProps) {
  return (
    <div
      className="evidence-spine"
      data-status={status}
      role="img"
      aria-label={statusLabels[status]}
    >
      <span className="evidence-spine__rail" aria-hidden="true" />
      <span className="evidence-spine__sweep" aria-hidden="true" />
      <span className="evidence-spine__node evidence-spine__node--source" aria-hidden="true" />
      <span className="evidence-spine__node evidence-spine__node--review" aria-hidden="true" />
    </div>
  );
}
