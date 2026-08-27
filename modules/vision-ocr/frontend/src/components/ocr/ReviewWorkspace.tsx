import {
  ArrowClockwise,
  Check,
  CheckCircle,
  Clipboard,
  DownloadSimple,
  FileSearchIcon,
  HourglassMedium,
  Info,
  PencilSimple,
  Warning,
} from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { OCRJob } from "../../types/ocr";
import { DocumentPreview } from "./DocumentPreview";
import { EvidenceSpine } from "./EvidenceSpine";

interface ReviewWorkspaceProps {
  job: OCRJob | null;
  onEdit(id: string, text: string): void;
  onConfirm(id: string): void;
  onReopen(id: string): void;
  onRetry(id: string): void;
}

type ReviewTab = "source" | "result";

const statusCopy = {
  queued: { label: "Đang chờ", detail: "Tài liệu sẽ được xử lý theo thứ tự." },
  processing: { label: "Đang trích xuất", detail: "OCR đang đọc nội dung tài liệu." },
  needs_review: { label: "Cần kiểm tra", detail: "Bản nháp đang chờ HR đối chiếu." },
  confirmed: { label: "Đã xác nhận", detail: "Nội dung đã qua kiểm tra của HR." },
  error: { label: "Cần xử lý", detail: "OCR chưa hoàn tất tài liệu này." },
} as const;

export function ReviewWorkspace({
  job,
  onEdit,
  onConfirm,
  onReopen,
  onRetry,
}: ReviewWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("source");
  const sourceTabRef = useRef<HTMLButtonElement>(null);
  const resultTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setActiveTab("source");
  }, [job?.id]);

  if (!job) return <EmptyReviewWorkspace />;

  function selectTab(tab: ReviewTab, focus = false) {
    setActiveTab(tab);
    if (focus) {
      const target = tab === "source" ? sourceTabRef : resultTabRef;
      target.current?.focus();
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const next =
      event.key === "ArrowRight" || event.key === "End"
        ? "result"
        : event.key === "ArrowLeft" || event.key === "Home"
          ? "source"
          : null;
    if (!next) return;
    event.preventDefault();
    selectTab(next, true);
  }

  const status = statusCopy[job.status];

  return (
    <section className="review-workspace" data-status={job.status} aria-label="Bàn kiểm tra tài liệu">
      <header className="review-workspace__header">
        <div>
          <span className="section-label">Bàn kiểm tra</span>
          <h2 title={job.file.name}>{job.file.name}</h2>
        </div>
        <div className="review-status" data-status={job.status} role="status">
          <span className="review-status__dot" aria-hidden="true" />
          <span>
            <strong>{status.label}</strong>
            <small>{status.detail}</small>
          </span>
        </div>
      </header>

      <div className="review-tabs" role="tablist" aria-label="Chế độ đối chiếu">
        <button
          ref={sourceTabRef}
          id="source-tab"
          type="button"
          role="tab"
          aria-controls="source-panel"
          aria-selected={activeTab === "source"}
          tabIndex={activeTab === "source" ? 0 : -1}
          onClick={() => selectTab("source")}
          onKeyDown={handleTabKeyDown}
        >
          Tài liệu gốc
        </button>
        <button
          ref={resultTabRef}
          id="result-tab"
          type="button"
          role="tab"
          aria-controls="result-panel"
          aria-selected={activeTab === "result"}
          tabIndex={activeTab === "result" ? 0 : -1}
          onClick={() => selectTab("result")}
          onKeyDown={handleTabKeyDown}
        >
          Kết quả OCR
        </button>
      </div>

      <div className="review-panes">
        <div
          id="source-panel"
          className={`review-panel review-panel--source${activeTab === "source" ? " is-active" : ""}`}
          role="tabpanel"
          aria-labelledby="source-tab"
          tabIndex={0}
        >
          <DocumentPreview job={job} />
        </div>

        <EvidenceSpine status={job.status} />

        <div
          id="result-panel"
          className={`review-panel review-panel--result${activeTab === "result" ? " is-active" : ""}`}
          role="tabpanel"
          aria-labelledby="result-tab"
          tabIndex={0}
        >
          <ResultPanel
            job={job}
            onEdit={onEdit}
            onConfirm={onConfirm}
            onReopen={onReopen}
            onRetry={onRetry}
          />
        </div>
      </div>
    </section>
  );
}

function EmptyReviewWorkspace() {
  return (
    <section className="review-placeholder" aria-label="Bàn kiểm tra tài liệu">
      <div className="empty-prism" aria-hidden="true">
        <span className="empty-prism__document empty-prism__document--back" />
        <span className="empty-prism__trace" />
        <span className="empty-prism__document empty-prism__document--front" />
      </div>
      <span className="section-label">Bàn kiểm tra</span>
      <h2>Bắt đầu từ bằng chứng gốc</h2>
      <p>Thêm ảnh tài liệu để so sánh nguồn, chỉnh bản OCR và xác nhận kết quả.</p>
      <div className="empty-prism__legend" aria-hidden="true">
        <span>Nguồn</span>
        <i />
        <span>Kiểm tra</span>
        <i />
        <span>Xác nhận</span>
      </div>
    </section>
  );
}

interface ResultPanelProps {
  job: OCRJob;
  onEdit(id: string, text: string): void;
  onConfirm(id: string): void;
  onReopen(id: string): void;
  onRetry(id: string): void;
}

function ResultPanel({ job, onEdit, onConfirm, onReopen, onRetry }: ResultPanelProps) {
  if (job.status === "queued") {
    return (
      <StateMessage
        icon={<HourglassMedium size={26} aria-hidden="true" />}
        title="Đang chờ đến lượt"
        body="Hệ thống xử lý từng tài liệu để giữ luồng kiểm tra rõ ràng."
      />
    );
  }

  if (job.status === "processing") return <ProcessingMessage job={job} />;

  if (job.status === "error") {
    return (
      <StateMessage
        tone="error"
        icon={<Warning size={26} aria-hidden="true" />}
        title="Chưa thể trích xuất"
        body={`${job.errorMessage ?? "Dịch vụ OCR chưa thể xử lý tài liệu này."} Đã thử ${job.attemptCount + 1} lần.`}
        action={
          <button className="primary-button" type="button" onClick={() => onRetry(job.id)}>
            <ArrowClockwise size={17} aria-hidden="true" />
            Thử lại OCR
          </button>
        }
      />
    );
  }

  return (
    <ReviewEditor
      job={job}
      onEdit={onEdit}
      onConfirm={onConfirm}
      onReopen={onReopen}
    />
  );
}

function ProcessingMessage({ job }: { job: OCRJob }) {
  const [elapsed, setElapsed] = useState(() =>
    job.startedAt ? Math.max(0, Math.floor((Date.now() - job.startedAt) / 1000)) : 0,
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed(
        job.startedAt
          ? Math.max(0, Math.floor((Date.now() - job.startedAt) / 1000))
          : 0,
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [job.startedAt]);

  return (
    <StateMessage
      tone="processing"
      icon={<FileSearchIcon size={26} aria-hidden="true" />}
      title="Đang trích xuất văn bản"
      body={`Bước hiện tại: đọc bố cục và ký tự · ${elapsed} giây`}
    />
  );
}

interface StateMessageProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: "neutral" | "processing" | "error";
  action?: React.ReactNode;
}

function StateMessage({
  icon,
  title,
  body,
  tone = "neutral",
  action,
}: StateMessageProps) {
  return (
    <div className="state-message" data-tone={tone}>
      <span className="state-message__icon">{icon}</span>
      <span className="section-label">Trạng thái OCR</span>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

interface ReviewEditorProps {
  job: OCRJob;
  onEdit(id: string, text: string): void;
  onConfirm(id: string): void;
  onReopen(id: string): void;
}

function ReviewEditor({ job, onEdit, onConfirm, onReopen }: ReviewEditorProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const copyResetTimer = useRef<number | null>(null);
  const copyGeneration = useRef(0);
  const confirmed = job.status === "confirmed";
  const empty = job.editedText.trim().length === 0;

  useEffect(() => {
    copyGeneration.current += 1;
    setCopyState("idle");
    return () => {
      copyGeneration.current += 1;
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
        copyResetTimer.current = null;
      }
    };
  }, [job.id]);

  async function copyText() {
    const generation = copyGeneration.current;
    try {
      await navigator.clipboard.writeText(job.editedText);
      if (generation !== copyGeneration.current) return;
      setCopyState("copied");
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
      copyResetTimer.current = window.setTimeout(() => {
        setCopyState("idle");
        copyResetTimer.current = null;
      }, 1800);
    } catch {
      if (generation !== copyGeneration.current) return;
      setCopyState("error");
    }
  }

  function downloadText() {
    const blob = new Blob([job.editedText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${job.file.name.replace(/\.[^.]+$/, "")}_ocr.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="review-editor">
      <div className="panel-heading">
        <div>
          <span className="section-label">Bản làm việc</span>
          <h3>{confirmed ? "Nội dung đã xác nhận" : "Kiểm tra nội dung OCR"}</h3>
        </div>
        <span className={`review-boundary${confirmed ? " is-confirmed" : ""}`}>
          {confirmed ? <CheckCircle size={16} weight="fill" aria-hidden="true" /> : <PencilSimple size={16} aria-hidden="true" />}
          {confirmed ? "Đã xác nhận" : "AI tạo · HR kiểm tra"}
        </span>
      </div>

      {empty && (
        <div className="empty-result-warning" role="status">
          <Warning size={18} aria-hidden="true" />
          <span>
            <strong>Không phát hiện được văn bản đáng tin cậy</strong>
            <small>Kiểm tra ảnh gốc và nhập thủ công nếu cần.</small>
          </span>
        </div>
      )}

      <label className="editor-field">
        <span className="visually-hidden">Nội dung sau kiểm tra</span>
        <textarea
          aria-label="Nội dung sau kiểm tra"
          value={job.editedText}
          readOnly={confirmed}
          onChange={(event) => onEdit(job.id, event.target.value)}
          spellCheck={false}
        />
      </label>

      <div className="mobile-readonly-result" aria-label="Nội dung OCR chỉ đọc">
        <pre>{job.editedText || "Không có nội dung OCR."}</pre>
      </div>

      <details className="original-text">
        <summary>Xem bản OCR gốc</summary>
        <pre>{job.originalText || "Không có nội dung OCR gốc."}</pre>
      </details>

      <div className="review-utilities">
        <button type="button" onClick={copyText} disabled={empty} aria-label="Sao chép văn bản">
          {copyState === "copied" ? <Check size={17} aria-hidden="true" /> : <Clipboard size={17} aria-hidden="true" />}
          {copyState === "copied" ? "Đã sao chép" : "Sao chép"}
        </button>
        <button type="button" onClick={downloadText} disabled={empty} aria-label="Tải xuống TXT">
          <DownloadSimple size={17} aria-hidden="true" />
          Tải TXT
        </button>
        {copyState === "error" && <span role="alert">Không thể sao chép. Hãy sao chép thủ công.</span>}
      </div>

      <footer className="review-actions">
        <p>
          <Info size={16} aria-hidden="true" />
          Xác nhận chỉ áp dụng trong phiên hiện tại và không ghi vào hồ sơ nhân sự.
        </p>
        {confirmed ? (
          <button className="secondary-button" type="button" onClick={() => onReopen(job.id)}>
            <PencilSimple size={17} aria-hidden="true" />
            Mở lại để sửa
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={() => onConfirm(job.id)}>
            <Check size={17} aria-hidden="true" />
            Xác nhận nội dung
          </button>
        )}
      </footer>
    </div>
  );
}
