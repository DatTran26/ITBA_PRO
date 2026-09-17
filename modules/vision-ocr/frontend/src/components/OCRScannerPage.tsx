import { useEffect, useRef } from "react";
import { Info, Scan } from "@phosphor-icons/react";
import type { ScanImage } from "../services/ocrService";
import { useOCRQueue } from "../features/ocr/useOCRQueue";
import { useWorkspaceMotion } from "../hooks/useWorkspaceMotion";
import { AppShell } from "./app/AppShell";
import { OCRJobQueue } from "./ocr/OCRJobQueue";
import { ReviewWorkspace } from "./ocr/ReviewWorkspace";
import { UploadLauncher } from "./ocr/UploadLauncher";

interface OCRScannerPageProps {
  scanner?: ScanImage;
}

export function OCRScannerPage({ scanner }: OCRScannerPageProps) {
  const queue = useOCRQueue(scanner);
  const validationRef = useRef<HTMLDivElement>(null);
  const motion = useWorkspaceMotion(
    queue.state.jobs.length,
    queue.selectedJob?.status,
  );

  useEffect(() => {
    if (!queue.state.validationError) return;
    const focusTask = window.setTimeout(() => validationRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTask);
  }, [queue.state.validationError]);

  return (
    <AppShell>
      <div
        className="document-workspace"
        data-motion={motion.motionMode}
        ref={motion.scopeRef}
      >
        <header className="page-heading">
          <div>
            <span className="page-heading__kicker">
              <Scan size={16} aria-hidden="true" />
              AI & dữ liệu
            </span>
            <h1>Document AI</h1>
            <p>Kiểm tra bằng chứng gốc trước khi xác nhận nội dung OCR.</p>
          </div>
          <div className="session-note">
            <Info size={17} aria-hidden="true" />
            <span>Dữ liệu chỉ tồn tại trong phiên này</span>
          </div>
        </header>

        {queue.state.validationError && (
          <div
            className="validation-summary"
            role="alert"
            tabIndex={-1}
            ref={validationRef}
          >
            <span className="validation-summary__mark" aria-hidden="true">
              !
            </span>
            <span>{queue.state.validationError}</span>
            <button type="button" onClick={queue.clearValidationError}>
              Đóng
            </button>
          </div>
        )}

        <div className="workspace-grid">
          <aside className="queue-panel" aria-label="Tài liệu trong phiên">
            <div className="queue-panel__header">
              <div>
                <span className="section-label">Hàng đợi</span>
                <strong>{queue.state.jobs.length}/5 tài liệu</strong>
              </div>
              <span className="queue-mode">Tuần tự</span>
            </div>
            <UploadLauncher
              compact={queue.state.jobs.length > 0}
              onFiles={queue.addFiles}
            />
            <OCRJobQueue
              jobs={queue.state.jobs}
              selectedJobId={queue.state.selectedJobId}
              onSelect={queue.selectJob}
              onRemove={queue.removeJob}
            />
          </aside>

          <ReviewWorkspace
            job={queue.selectedJob}
            onEdit={queue.editText}
            onConfirm={queue.confirmJob}
            onReopen={queue.reopenJob}
            onRetry={queue.retryJob}
            onSelectBlock={queue.selectBlock}
          />
        </div>
      </div>
    </AppShell>
  );
}
