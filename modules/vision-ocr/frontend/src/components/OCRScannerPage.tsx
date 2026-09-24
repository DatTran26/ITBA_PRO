import { useEffect, useRef, useState } from "react";
import { Info, MagicWand, Scan } from "@phosphor-icons/react";
import type { ScanImage } from "../services/ocrService";
import { useOCRQueue } from "../features/ocr/useOCRQueue";
import { useWorkspaceMotion } from "../hooks/useWorkspaceMotion";
import { AppShell } from "./app/AppShell";
import { OCRJobQueue } from "./ocr/OCRJobQueue";
import { ReviewWorkspace } from "./ocr/ReviewWorkspace";
import { UploadLauncher } from "./ocr/UploadLauncher";
import { AdvisoryWorkspace } from "./ocr/AdvisoryWorkspace";
import type { UserProfile } from "../types/ocr";

type WorkspaceMode = "advisory" | "ocr";

interface OCRScannerPageProps {
  scanner?: ScanImage;
  /** Hồ sơ user từ Supabase auth session. */
  userProfile?: UserProfile;
}

export function OCRScannerPage({ scanner, userProfile = {} }: OCRScannerPageProps) {
  const [mode, setMode] = useState<WorkspaceMode>("advisory");
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
              AI &amp; dữ liệu
            </span>
            <h1>Document AI</h1>
            <p>Tư vấn &amp; tạo văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP.</p>
          </div>
          <div className="session-note">
            <Info size={17} aria-hidden="true" />
            <span>Dữ liệu chỉ tồn tại trong phiên này</span>
          </div>
        </header>

        {/* ── Mode Tab Switcher ── */}
        <div className="workspace-mode-tabs" role="tablist" aria-label="Chọn luồng làm việc">
          <button
            id="tab-advisory"
            role="tab"
            aria-selected={mode === "advisory"}
            aria-controls="panel-advisory"
            className={`workspace-tab${mode === "advisory" ? " workspace-tab--active" : ""}`}
            onClick={() => setMode("advisory")}
          >
            <MagicWand size={16} aria-hidden="true" />
            Tạo văn bản mới
          </button>
          <button
            id="tab-ocr"
            role="tab"
            aria-selected={mode === "ocr"}
            aria-controls="panel-ocr"
            className={`workspace-tab${mode === "ocr" ? " workspace-tab--active" : ""}`}
            onClick={() => setMode("ocr")}
          >
            <Scan size={16} aria-hidden="true" />
            Số hóa bản scan
          </button>
        </div>

        {/* ── Advisory Flow (Luồng A) ── */}
        {mode === "advisory" && (
          <div
            id="panel-advisory"
            role="tabpanel"
            aria-labelledby="tab-advisory"
            className="workspace-panel"
          >
            <AdvisoryWorkspace userProfile={userProfile} />
          </div>
        )}

        {/* ── OCR Reactive Flow (Luồng B) ── */}
        {mode === "ocr" && (
          <div
            id="panel-ocr"
            role="tabpanel"
            aria-labelledby="tab-ocr"
            className="workspace-panel"
          >
            {queue.state.validationError && (
              <div
                className="validation-summary"
                role="alert"
                tabIndex={-1}
                ref={validationRef}
              >
                <span className="validation-summary__mark" aria-hidden="true">!</span>
                <span>{queue.state.validationError}</span>
                <button type="button" onClick={queue.clearValidationError}>Đóng</button>
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
        )}
      </div>
    </AppShell>
  );
}


