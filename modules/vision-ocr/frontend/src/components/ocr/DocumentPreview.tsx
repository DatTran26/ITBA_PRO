import { FileImage } from "@phosphor-icons/react";
import type { OCRJob } from "../../types/ocr";

interface DocumentPreviewProps {
  job: OCRJob;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentPreview({ job }: DocumentPreviewProps) {
  return (
    <div className="document-preview">
      <div className="panel-heading">
        <div>
          <span className="section-label">Bằng chứng nguồn</span>
          <h3>Tài liệu gốc</h3>
        </div>
        <span className="file-type-badge">
          <FileImage size={15} aria-hidden="true" />
          {job.file.name.split(".").pop()?.toUpperCase()}
        </span>
      </div>
      <div className="document-stage">
        <img src={job.previewUrl} alt={`Bản xem trước ${job.file.name}`} />
      </div>
      <div className="document-metadata">
        <strong title={job.file.name}>{job.file.name}</strong>
        <span>{formatFileSize(job.file.size)}</span>
      </div>
    </div>
  );
}
