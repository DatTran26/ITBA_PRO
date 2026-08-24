import {
  CheckCircle,
  Circle,
  Clock,
  PencilSimpleLine,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { OCRJob, OCRJobStatus } from "../../types/ocr";
import { canRemoveJob } from "../../features/ocr/ocrQueue";

const statusLabels: Record<OCRJobStatus, string> = {
  queued: "Đang chờ",
  processing: "Đang trích xuất",
  needs_review: "Cần kiểm tra",
  confirmed: "Đã xác nhận",
  error: "Cần xử lý",
};

function StatusIcon({ status }: { status: OCRJobStatus }) {
  const props = { size: 15, "aria-hidden": true } as const;
  if (status === "processing") return <Clock {...props} />;
  if (status === "needs_review") return <PencilSimpleLine {...props} />;
  if (status === "confirmed") return <CheckCircle {...props} weight="fill" />;
  if (status === "error") return <WarningCircle {...props} weight="fill" />;
  return <Circle {...props} />;
}

interface OCRJobQueueProps {
  jobs: OCRJob[];
  selectedJobId: string | null;
  onSelect(id: string): void;
  onRemove(id: string): void;
}

export function OCRJobQueue({
  jobs,
  selectedJobId,
  onSelect,
  onRemove,
}: OCRJobQueueProps) {
  const liveSummary =
    jobs.length === 0
      ? "Hàng đợi OCR chưa có tài liệu."
      : jobs
          .map((job) => `${job.file.name}: ${statusLabels[job.status]}`)
          .join(". ");

  return (
    <>
      <p
        className="visually-hidden"
        role="status"
        aria-label="Cập nhật hàng đợi OCR"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveSummary}
      </p>
      {jobs.length === 0 ? (
      <div className="queue-empty">
        <span>Chưa có tài liệu</span>
        <p>Tài liệu được giữ trong phiên làm việc hiện tại.</p>
      </div>
      ) : (
        <ol className="job-list" aria-label="Hàng đợi OCR">
      {jobs.map((job, index) => {
        const removable = canRemoveJob(job.status);
        return (
          <li className="job-item" key={job.id} data-status={job.status}>
            <button
              className="job-select"
              type="button"
              onClick={() => onSelect(job.id)}
              aria-pressed={job.id === selectedJobId}
            >
              <span className="job-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="job-details">
                <strong className="job-name" title={job.file.name}>
                  {job.file.name}
                </strong>
                <span className="job-status">
                  <StatusIcon status={job.status} />
                  {statusLabels[job.status]}
                </span>
              </span>
            </button>
            {removable && (
              <button
                className="job-remove"
                type="button"
                onClick={() => onRemove(job.id)}
                aria-label={`Xóa ${job.file.name} khỏi hàng đợi`}
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </li>
        );
      })}
        </ol>
      )}
    </>
  );
}
