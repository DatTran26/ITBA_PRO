import {
  ArrowClockwise,
  Check,
  CheckCircle,
  Clipboard,
  DownloadSimple,
  FileDoc,
  FileSearchIcon,
  HourglassMedium,
  Info,
  PencilSimple,
  SealCheck,
  ShieldCheck,
  Sparkle,
  Warning,
} from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ND30ExportPayload, ND30ValidationResult, OCRJob } from "../../types/ocr";
import {
  autoGenerateND30,
  downloadBlob,
  exportND30,
  OCRServiceError,
  validateND30,
} from "../../services/ocrService";
import { DocumentPreview } from "./DocumentPreview";
import { EvidenceSpine } from "./EvidenceSpine";

interface ReviewWorkspaceProps {
  job: OCRJob | null;
  onEdit(id: string, text: string): void;
  onConfirm(id: string): void;
  onReopen(id: string): void;
  onRetry(id: string): void;
  onSelectBlock(jobId: string, blockId: string | null): void;
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
  onSelectBlock,
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
  const hasGrounding = job.blocks.length > 0;

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

      {/* ── Mobile: Tab switcher ──────────────────────────── */}
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
          {hasGrounding && <span className="tab-badge">{job.blocks.length}</span>}
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

      {/* ── Desktop: Side-by-side split pane ─────────────── */}
      <div className="review-panes">
        <div
          id="source-panel"
          className={`review-panel review-panel--source${activeTab === "source" ? " is-active" : ""}`}
          role="tabpanel"
          aria-labelledby="source-tab"
          tabIndex={0}
        >
          <DocumentPreview
            job={job}
            onSelectBlock={(blockId) => onSelectBlock(job.id, blockId)}
          />
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
            onSelectBlock={onSelectBlock}
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
  onSelectBlock(jobId: string, blockId: string | null): void;
}

function ResultPanel({ job, onEdit, onConfirm, onReopen, onRetry, onSelectBlock }: ResultPanelProps) {
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
      onSelectBlock={onSelectBlock}
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

// ─── ND30 Export Dialog ───────────────────────────────────────────────────────

interface ND30ExportDialogProps {
  jobText: string;
  onClose(): void;
}

function ND30ExportDialog({ jobText, onClose }: ND30ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"draft" | "audit" | "preview">("draft");
  const [form, setForm] = useState<ND30ExportPayload>({
    organ_name_upper: "TẬP ĐOÀN CÔNG NGHỆ DOWN-TOWN",
    organ_name: "PHÒNG NHÂN SỰ & HÀNH CHÍNH",
    doc_type: "QUYẾT ĐỊNH",
    company_name: "TẬP ĐOÀN CÔNG NGHỆ DOWN-TOWN",
    department: "PHÒNG NHÂN SỰ & HÀNH CHÍNH",
    doc_number: "45/QĐ-HR",
    doc_code: "45/QĐ-HR",
    location: "Hà Nội",
    date_str: `ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
    location_date: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
    subject: "Về việc tiếp nhận và bổ nhiệm nhân sự chính thức",
    bases: ["Căn cứ Điều lệ tổ chức và hoạt động Công ty;"],
    legal_bases: ["Căn cứ Điều lệ tổ chức và hoạt động Công ty;"],
    articles: [{ title: "Điều 1", content: jobText.slice(0, 300) || "Tiếp nhận nhân sự theo thỏa thuận lao động." }],
    signatory_title: "TỔNG GIÁM ĐỐC",
    signer_title: "TỔNG GIÁM ĐỐC",
    signatory_name: "Nguyễn Văn An",
    signer_name: "Nguyễn Văn An",
    recipients: ["Như Điều 3;", "Lưu: VT, HR."],
  });

  const [exporting, setExporting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ND30ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI Auto-Drafting from OCR text
  async function handleAutoDraft() {
    if (!jobText.trim()) return;
    setIsDrafting(true);
    setError(null);
    try {
      const drafted = await autoGenerateND30(jobText, form.doc_type);
      setForm((prev) => ({
        ...prev,
        organ_name_upper: drafted.organ_name_upper || prev.organ_name_upper,
        organ_name: drafted.organ_name || prev.organ_name,
        company_name: drafted.organ_name || prev.company_name,
        doc_number: drafted.doc_code || prev.doc_number,
        doc_code: drafted.doc_code || prev.doc_code,
        location: drafted.location || prev.location,
        date_str: drafted.date_str || prev.date_str,
        subject: drafted.subject || prev.subject,
        bases: drafted.legal_bases || prev.bases,
        legal_bases: drafted.legal_bases || prev.legal_bases,
        articles: drafted.articles || prev.articles,
        signatory_title: drafted.signer_title || prev.signatory_title,
        signer_title: drafted.signer_title || prev.signer_title,
        signatory_name: drafted.signer_name || prev.signatory_name,
        signer_name: drafted.signer_name || prev.signer_name,
        recipients: drafted.recipients || prev.recipients,
      }));
      // Auto run validation
      handleValidate(drafted);
    } catch {
      setError("AI không thể bóc tách tự động. Bạn vẫn có thể chỉnh sửa thủ công.");
    } finally {
      setIsDrafting(false);
    }
  }

  // Audit Decree 30 Rules & Seal
  async function handleValidate(targetDoc: any = form) {
    setIsValidating(true);
    setError(null);
    try {
      const res = await validateND30({
        organ_name: targetDoc.organ_name || targetDoc.company_name,
        doc_code: targetDoc.doc_code || targetDoc.doc_number,
        location: targetDoc.location || "Hà Nội",
        date_str: targetDoc.date_str || targetDoc.location_date,
        doc_type: targetDoc.doc_type,
        subject: targetDoc.subject,
        legal_bases: targetDoc.legal_bases || targetDoc.bases || [],
        articles: targetDoc.articles || [],
        signer_title: targetDoc.signer_title || targetDoc.signatory_title,
        signer_name: targetDoc.signer_name || targetDoc.signatory_name,
        recipients: targetDoc.recipients || [],
      });
      setValidationResult(res);
    } catch {
      setError("Kiểm định thất bại. Kiểm tra kết nối backend.");
    } finally {
      setIsValidating(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const blob = await exportND30(form);
      const docType = form.doc_type.replace(/\s+/g, "_");
      const num = (form.doc_number || form.doc_code || "").replace(/\//g, "-");
      downloadBlob(blob, `ND30_${docType}${num ? "_" + num : ""}.docx`);
      onClose();
    } catch (err) {
      setError(
        err instanceof OCRServiceError && err.kind === "network"
          ? "Không thể kết nối server. Kiểm tra backend đang chạy."
          : "Xuất file thất bại. Vui lòng thử lại.",
      );
    } finally {
      setExporting(false);
    }
  }

  const DOC_TYPES = ["QUYẾT ĐỊNH", "CÔNG VĂN", "BIÊN BẢN", "BÁO CÁO", "THÔNG BÁO", "TỜ TRÌNH"];

  return (
    <div className="nd30-dialog-overlay" role="dialog" aria-modal="true" aria-label="Xuất văn bản NĐ 30">
      <div className="nd30-dialog" style={{ maxWidth: "780px", width: "95vw" }}>
        <header className="nd30-dialog__header">
          <div>
            <span className="section-label">Thẩm định & Ban hành Pháp quy</span>
            <h3>Chuẩn Nghị định 30/2020/NĐ-CP</h3>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleAutoDraft}
              disabled={isDrafting || !jobText.trim()}
              className="secondary-button"
              style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
              title="Bóc tách tự động các trường từ văn bản OCR"
            >
              <Sparkle size={15} weight="bold" />
              {isDrafting ? "Đang bóc tách..." : "⚡ AI Tự động bóc tách"}
            </button>
            <button type="button" className="nd30-dialog__close" onClick={onClose} aria-label="Đóng">×</button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "4px", padding: "8px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            className={`tab-button${activeTab === "draft" ? " tab-button--active" : ""}`}
            style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "6px", cursor: "pointer" }}
          >
            1. Soạn thảo chi tiết
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("audit");
              handleValidate();
            }}
            className={`tab-button${activeTab === "audit" ? " tab-button--active" : ""}`}
            style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ShieldCheck size={15} />
            2. Thẩm định Thể thức & Con dấu
            {validationResult && (
              <span style={{
                background: validationResult.score >= 85 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)",
                color: validationResult.score >= 85 ? "#34D399" : "#FBBF24",
                padding: "1px 6px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: "bold",
              }}>
                {validationResult.score}/100
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`tab-button${activeTab === "preview" ? " tab-button--active" : ""}`}
            style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "6px", cursor: "pointer" }}
          >
            3. Xem trước A4
          </button>
        </div>

        <div className="nd30-dialog__body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {/* TAB 1: DRAFTING */}
          {activeTab === "draft" && (
            <div className="nd30-form-grid">
              <label className="nd30-field">
                <span>Loại văn bản</span>
                <select
                  value={form.doc_type}
                  onChange={(e) => setForm((f) => ({ ...f, doc_type: e.target.value }))}
                >
                  {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>

              <label className="nd30-field">
                <span>Số văn bản (VD: 45/QĐ-HR)</span>
                <input
                  type="text"
                  value={form.doc_number || form.doc_code || ""}
                  onChange={(e) => setForm((f) => ({ ...f, doc_number: e.target.value, doc_code: e.target.value }))}
                />
              </label>

              <label className="nd30-field nd30-field--full">
                <span>Cơ quan / Doanh nghiệp ban hành</span>
                <input
                  type="text"
                  value={form.company_name || form.organ_name || ""}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value, organ_name: e.target.value }))}
                />
              </label>

              <label className="nd30-field">
                <span>Địa danh, ngày tháng</span>
                <input
                  type="text"
                  value={form.location_date || form.date_str || ""}
                  onChange={(e) => setForm((f) => ({ ...f, location_date: e.target.value, date_str: e.target.value }))}
                />
              </label>

              <label className="nd30-field nd30-field--full">
                <span>Trích yếu nội dung (V/v...)</span>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </label>

              <label className="nd30-field">
                <span>Chức vụ người ký</span>
                <input
                  type="text"
                  value={form.signatory_title || form.signer_title || ""}
                  onChange={(e) => setForm((f) => ({ ...f, signatory_title: e.target.value, signer_title: e.target.value }))}
                />
              </label>

              <label className="nd30-field">
                <span>Họ tên người ký</span>
                <input
                  type="text"
                  value={form.signatory_name || form.signer_name || ""}
                  onChange={(e) => setForm((f) => ({ ...f, signatory_name: e.target.value, signer_name: e.target.value }))}
                />
              </label>
            </div>
          )}

          {/* TAB 2: AUDIT & SEAL VERIFICATION */}
          {activeTab === "audit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {isValidating ? (
                <div style={{ textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.7)" }}>
                  Đang đối chiếu 9 thành phần thể thức và thẩm định con dấu theo Nghị định 30...
                </div>
              ) : validationResult ? (
                <>
                  {/* Summary Bar */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: "12px",
                    background: "rgba(255,255,255,0.03)",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <div style={{ textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "12px" }}>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>ĐIỂM HỢP QUY</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold", color: validationResult.score >= 85 ? "#34D399" : "#FBBF24" }}>
                        {validationResult.score}<span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>/100</span>
                      </div>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: validationResult.is_valid ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                        color: validationResult.is_valid ? "#34D399" : "#F87171",
                      }}>
                        {validationResult.is_valid ? "ĐẠT CHUẨN" : "CẦN HIỆU CHỈNH"}
                      </span>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "bold", color: "#F87171" }}>
                        <SealCheck size={18} weight="fill" />
                        <span>Thẩm định Con dấu & Chữ ký số (Điều 12, 13 NĐ 30)</span>
                      </div>
                      <div style={{ fontSize: "12px", marginTop: "6px", color: "rgba(255,255,255,0.8)" }}>
                        • Hình thức: <strong>{validationResult.seal_status.seal_type}</strong>
                      </div>
                      <div style={{ fontSize: "12px", marginTop: "2px", color: "#38BDF8" }}>
                        • Vị trí: <strong>{validationResult.seal_status.overlap_status}</strong>
                      </div>
                      <div style={{ fontSize: "11px", marginTop: "6px", fontStyle: "italic", color: "rgba(255,255,255,0.5)" }}>
                        {validationResult.seal_status.note}
                      </div>
                    </div>
                  </div>

                  {/* 9 Components Checklist */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {Object.entries(validationResult.components).map(([key, comp]) => (
                      <div key={key} style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "11.5px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: comp.valid ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                        border: `1px solid ${comp.valid ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}>
                        <span>{comp.note}</span>
                        {comp.valid ? (
                          <CheckCircle size={15} weight="fill" style={{ color: "#34D399" }} />
                        ) : (
                          <Warning size={15} weight="fill" style={{ color: "#F87171" }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Issues */}
                  {validationResult.issues.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontSize: "12px", fontWeight: "bold", color: "#FBBF24", marginBottom: "6px" }}>
                        Khuyến nghị hiệu chỉnh ({validationResult.issues.length}):
                      </div>
                      {validationResult.issues.map((iss, i) => (
                        <div key={i} style={{
                          fontSize: "11px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: "rgba(255,255,255,0.03)",
                          borderLeft: "3px solid #F59E0B",
                          marginBottom: "4px",
                        }}>
                          <strong>{iss.message}</strong> — {iss.recommendation} ({iss.citation})
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button type="button" onClick={() => handleValidate()} className="primary-button">
                  Bấm để kiểm định hợp quy
                </button>
              )}
            </div>
          )}

          {/* TAB 3: PREVIEW */}
          {activeTab === "preview" && (
            <div style={{
              background: "#ffffff",
              color: "#000000",
              padding: "32px",
              borderRadius: "6px",
              fontFamily: "'Times New Roman', serif",
              fontSize: "13px",
              lineHeight: "1.5",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", textAlign: "center", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "12px", textTransform: "uppercase" }}>{form.organ_name_upper || form.company_name}</div>
                  <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>{form.organ_name || form.department}</div>
                  <div style={{ fontSize: "12px", fontStyle: "italic" }}>Số: {form.doc_number || form.doc_code}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>Độc lập - Tự do - Hạnh phúc</div>
                  <div style={{ fontSize: "12px", fontStyle: "italic" }}>{form.location_date || form.date_str}</div>
                </div>
              </div>

              <div style={{ textAlign: "center", margin: "20px 0" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
                  {form.doc_type}
                </h3>
                <p style={{ fontSize: "13px", fontWeight: "bold", margin: "4px 0" }}>{form.subject}</p>
              </div>

              <div style={{ margin: "16px 0" }}>
                {form.articles.map((art, idx) => (
                  <p key={idx} style={{ textIndent: "24px", margin: "6px 0" }}>
                    <strong>{art.title}: </strong>{art.content}
                  </p>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: "30px" }}>
                <div style={{ fontSize: "11px" }}>
                  <strong>Nơi nhận:</strong>
                  <ul style={{ paddingLeft: "16px", margin: "4px 0", listStyle: "none" }}>
                    {form.recipients.map((r, i) => <li key={i}>- {r}</li>)}
                  </ul>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>
                    {form.signatory_title || form.signer_title}
                  </div>
                  <div style={{ height: "45px", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626", fontStyle: "italic", fontSize: "11px" }}>
                    (Đã đóng dấu tròn đỏ / Chữ ký số)
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                    {form.signatory_name || form.signer_name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="nd30-error" role="alert">
            <Warning size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <footer className="nd30-dialog__footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleExport}
            disabled={exporting}
          >
            <FileDoc size={17} aria-hidden="true" />
            {exporting ? "Đang tạo file..." : "Ban hành & Tải file Word (.docx)"}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Review Editor ────────────────────────────────────────────────────────────

interface ReviewEditorProps {
  job: OCRJob;
  onEdit(id: string, text: string): void;
  onConfirm(id: string): void;
  onReopen(id: string): void;
  onSelectBlock(jobId: string, blockId: string | null): void;
}

function ReviewEditor({ job, onEdit, onConfirm, onReopen, onSelectBlock }: ReviewEditorProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [showND30Dialog, setShowND30Dialog] = useState(false);
  const copyResetTimer = useRef<number | null>(null);
  const copyGeneration = useRef(0);
  const confirmed = job.status === "confirmed";
  const empty = job.editedText.trim().length === 0;
  const hasBlocks = job.blocks.length > 0;

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
      {/* ── Grounding Block List ──────────────────────────── */}
      {hasBlocks && (
        <div className="block-list" aria-label="Danh sách vùng văn bản">
          <div className="block-list__header">
            <span className="section-label">Vùng văn bản ({job.blocks.length})</span>
            <span className="block-list__hint">Click để đánh dấu vùng trên ảnh</span>
          </div>
          <ul className="block-list__items">
            {job.blocks.map((block) => {
              const isActive = block.id === job.activeBlockId;
              return (
                <li
                  key={block.id}
                  className={`block-item${isActive ? " block-item--active" : ""}`}
                  onClick={() => onSelectBlock(job.id, isActive ? null : block.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectBlock(job.id, isActive ? null : block.id);
                    }
                  }}
                  title={`Độ tin cậy: ${(block.confidence * 100).toFixed(0)}%`}
                >
                  <span className="block-item__text">{block.text}</span>
                  <span className="block-item__conf">
                    {(block.confidence * 100).toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Text Editor ───────────────────────────────────── */}
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

      {/* ── Utility Actions ───────────────────────────────── */}
      <div className="review-utilities">
        <button type="button" onClick={copyText} disabled={empty} aria-label="Sao chép văn bản">
          {copyState === "copied" ? <Check size={17} aria-hidden="true" /> : <Clipboard size={17} aria-hidden="true" />}
          {copyState === "copied" ? "Đã sao chép" : "Sao chép"}
        </button>
        <button type="button" onClick={downloadText} disabled={empty} aria-label="Tải xuống TXT">
          <DownloadSimple size={17} aria-hidden="true" />
          Tải TXT
        </button>
        <button
          type="button"
          className="nd30-export-btn"
          onClick={() => setShowND30Dialog(true)}
          disabled={empty}
          aria-label="Xuất văn bản Word chuẩn Nghị định 30"
          title="Xuất file .docx chuẩn thể thức NĐ 30/2020/NĐ-CP"
        >
          <FileDoc size={17} aria-hidden="true" />
          Xuất Word NĐ 30
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

      {/* ── ND30 Export Dialog ────────────────────────────── */}
      {showND30Dialog && (
        <ND30ExportDialog
          jobText={job.editedText}
          onClose={() => setShowND30Dialog(false)}
        />
      )}
    </div>
  );
}
