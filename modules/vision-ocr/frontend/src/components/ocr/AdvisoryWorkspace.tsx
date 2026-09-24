import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  ChatsCircle,
  DownloadSimple,
  FileText,
  ListChecks,
} from "@phosphor-icons/react";
import type {
  AdvisoryStep,
  FieldDefinition,
  ND30ExportPayload,
  UserProfile,
} from "../../types/ocr";
import { GuidanceChat } from "./GuidanceChat";
import { FieldForm } from "./FieldForm";
import { DocumentPreview } from "./DocumentPreview";
import {
  downloadBlob,
  exportND30,
  OCRServiceError,
  validateND30,
} from "../../services/ocrService";

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS: { key: AdvisoryStep; label: string; icon: React.ReactNode }[] = [
  { key: "guidance", label: "Tư vấn", icon: <ChatsCircle size={16} weight="fill" /> },
  { key: "field_form", label: "Điền thông tin", icon: <ListChecks size={16} weight="fill" /> },
  { key: "preview", label: "Xem trước", icon: <FileText size={16} weight="fill" /> },
  { key: "export", label: "Xuất file", icon: <DownloadSimple size={16} weight="fill" /> },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface AdvisoryWorkspaceProps {
  /** Hồ sơ user từ Supabase auth session — dùng để Field Resolver tự điền. */
  userProfile: UserProfile;
}

// ─── Progress stepper ─────────────────────────────────────────────────────────
function Stepper({ current }: { current: AdvisoryStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <nav className="aw-stepper" aria-label="Tiến trình tạo văn bản">
      <ol className="aw-steps">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = step.key === current;
          return (
            <li
              key={step.key}
              className={`aw-step${active ? " aw-step--active" : ""}${done ? " aw-step--done" : ""}`}
              aria-current={active ? "step" : undefined}
            >
              <span className="aw-step-icon" aria-hidden="true">
                {done ? <CheckCircle size={16} weight="fill" /> : step.icon}
              </span>
              <span className="aw-step-label">{step.label}</span>
              {i < STEPS.length - 1 && <span className="aw-step-connector" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AdvisoryWorkspace({ userProfile }: AdvisoryWorkspaceProps) {
  const [step, setStep] = useState<AdvisoryStep>("guidance");
  const [docType, setDocType] = useState<string | null>(null);
  const [processSteps, setProcessSteps] = useState<string[]>([]);
  const [exportPayload, setExportPayload] = useState<ND30ExportPayload | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [validationScore, setValidationScore] = useState<number | null>(null);

  // ── Luồng A Handlers ────────────────────────────────────────────────────────

  function handleGuidanceResolved(
    resolvedDocType: string,
    _requiredFields: FieldDefinition[],
    steps: string[],
  ) {
    setDocType(resolvedDocType);
    setProcessSteps(steps);
    setStep("field_form");
  }

  function handleFieldFormGenerated(payload: ND30ExportPayload, _dt: string) {
    setExportPayload(payload);
    setStep("preview");

    // Validate ngay khi có payload — chạy nền
    validateND30(payload as unknown as Record<string, unknown>)
      .then((res) => setValidationScore(res.score ?? null))
      .catch(() => {});
  }

  async function handleExport() {
    if (!exportPayload) return;
    setExportLoading(true);
    setExportError(null);
    try {
      const blob = await exportND30(exportPayload);
      const docTypeSafe = (docType ?? "VanBan").replace(/\s+/g, "_");
      downloadBlob(blob, `${docTypeSafe}_NĐ30.docx`);
      setStep("export");
    } catch (err) {
      setExportError(
        err instanceof OCRServiceError
          ? "Không thể tải file. Vui lòng thử lại."
          : "Lỗi xuất file.",
      );
    } finally {
      setExportLoading(false);
    }
  }

  function handleBack() {
    if (step === "field_form") setStep("guidance");
    else if (step === "preview") setStep("field_form");
    else if (step === "export") setStep("preview");
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="aw-container" role="main" aria-label="Tạo văn bản mới từ đầu">
      <Stepper current={step} />

      <div className="aw-body">
        {/* Back button */}
        {step !== "guidance" && (
          <button className="aw-back-btn" onClick={handleBack} aria-label="Quay lại bước trước">
            <ArrowLeft size={16} />
            Quay lại
          </button>
        )}

        {/* Step content */}
        {step === "guidance" && (
          <GuidanceChat onResolved={handleGuidanceResolved} />
        )}

        {step === "field_form" && docType && (
          <FieldForm
            docType={docType}
            userProfile={userProfile}
            onGenerated={handleFieldFormGenerated}
          />
        )}

        {step === "preview" && exportPayload && (
          <div className="aw-preview-wrap">
            {/* Validation score badge */}
            {validationScore !== null && (
              <div
                className={`aw-score-badge${validationScore >= 80 ? " aw-score-badge--good" : " aw-score-badge--warn"}`}
                role="status"
                aria-live="polite"
              >
                <CheckCircle size={14} weight="fill" />
                Điểm thể thức NĐ30:{" "}
                <strong>{validationScore}/100</strong>
                {validationScore >= 80 && " — Đạt chuẩn"}
              </div>
            )}

            <DocumentPreview nd30Data={exportPayload} />

            <div className="aw-preview-actions">
              <button
                id="advisory-export-btn"
                className="aw-export-btn"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <>
                    <span className="ff-spinner ff-spinner--sm" aria-hidden="true" />
                    Đang xuất…
                  </>
                ) : (
                  <>
                    <DownloadSimple size={18} weight="bold" />
                    Xuất file Word (.docx)
                  </>
                )}
              </button>
              {exportError && (
                <p className="aw-export-error" role="alert">
                  {exportError}
                </p>
              )}
            </div>
          </div>
        )}

        {step === "export" && (
          <div className="aw-done" role="status" aria-live="polite">
            <CheckCircle size={48} weight="fill" className="aw-done-icon" />
            <h2 className="aw-done-title">Xuất file thành công!</h2>
            <p className="aw-done-desc">
              File <strong>{(docType ?? "VanBan").replace(/\s+/g, "_")}_NĐ30.docx</strong> đã được
              tải xuống. Văn bản được tạo từ template chuẩn Nghị định 30/2020/NĐ-CP.
            </p>
            {validationScore !== null && (
              <p className="aw-done-score">
                Điểm thể thức: <strong>{validationScore}/100</strong>
              </p>
            )}
            {processSteps.length > 0 && (
              <div className="aw-process-guide">
                <h3>Các bước tiếp theo:</h3>
                <ol>
                  {processSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
            <button
              id="advisory-new-doc-btn"
              className="aw-new-btn"
              onClick={() => {
                setStep("guidance");
                setDocType(null);
                setExportPayload(null);
                setValidationScore(null);
                setExportError(null);
              }}
            >
              Tạo văn bản mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
