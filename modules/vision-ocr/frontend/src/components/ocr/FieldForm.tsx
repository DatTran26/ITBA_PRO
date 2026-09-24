import { useEffect, useState } from "react";
import {
  Buildings,
  CheckCircle,
  IdentificationCard,
  Pencil,
  User,
  Warning,
} from "@phosphor-icons/react";
import type { FieldDefinition, FieldResolverResult, UserProfile, ND30ExportPayload } from "../../types/ocr";
import { resolveFields, generateDocument, OCRServiceError } from "../../services/ocrService";

// ─── Group metadata ────────────────────────────────────────────────────────────
const GROUP_META: Record<string, { label: string; icon: React.ReactNode }> = {
  co_quan: { label: "Thông tin cơ quan", icon: <Buildings size={16} weight="fill" /> },
  noi_dung: { label: "Nội dung văn bản", icon: <Pencil size={16} weight="fill" /> },
  ky_duyet: { label: "Người ký & thẩm quyền", icon: <IdentificationCard size={16} weight="fill" /> },
  noi_nhan: { label: "Nơi nhận", icon: <User size={16} weight="fill" /> },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface FieldFormProps {
  docType: string;
  userProfile: UserProfile;
  /** Gọi khi đã tạo xong export_payload. */
  onGenerated: (exportPayload: ND30ExportPayload, docType: string) => void;
}

// ─── Single field input ───────────────────────────────────────────────────────
interface FieldInputProps {
  field: FieldDefinition;
  value: string;
  isPrefilled: boolean;
  onChange: (key: string, value: string) => void;
}

function FieldInput({ field, value, isPrefilled, onChange }: FieldInputProps) {
  const inputId = `field-${field.key}`;

  return (
    <div className={`ff-field${isPrefilled ? " ff-field--prefilled" : ""}`}>
      <label htmlFor={inputId} className="ff-label">
        {field.label}
        {field.required && <span className="ff-required" aria-label="bắt buộc">*</span>}
        {isPrefilled && (
          <span className="ff-badge" title="Tự điền từ hồ sơ tài khoản">
            từ hồ sơ
          </span>
        )}
      </label>

      {field.input_type === "textarea" || field.input_type === "list" ? (
        <textarea
          id={inputId}
          className="ff-textarea"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder || field.description}
          rows={field.input_type === "list" ? 4 : 5}
          aria-describedby={`${inputId}-desc`}
        />
      ) : (
        <input
          id={inputId}
          type={field.input_type === "date" ? "text" : "text"}
          className="ff-input"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder || field.description}
          aria-describedby={`${inputId}-desc`}
        />
      )}

      <p id={`${inputId}-desc`} className="ff-description">
        {field.description}
      </p>
    </div>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────
function FieldGroup({
  groupKey,
  fields,
  values,
  prefilledKeys,
  onChange,
}: {
  groupKey: string;
  fields: FieldDefinition[];
  values: Record<string, string>;
  prefilledKeys: string[];
  onChange: (key: string, value: string) => void;
}) {
  const meta = GROUP_META[groupKey] ?? { label: groupKey, icon: null };
  return (
    <section className="ff-group" aria-labelledby={`group-${groupKey}`}>
      <h3 id={`group-${groupKey}`} className="ff-group-title">
        <span className="ff-group-icon" aria-hidden="true">{meta.icon}</span>
        {meta.label}
      </h3>
      {fields.map((f) => (
        <FieldInput
          key={f.key}
          field={f}
          value={values[f.key] ?? ""}
          isPrefilled={prefilledKeys.includes(f.key)}
          onChange={onChange}
        />
      ))}
    </section>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function FieldForm({ docType, userProfile, onGenerated }: FieldFormProps) {
  const [resolverResult, setResolverResult] = useState<FieldResolverResult | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loadingResolve, setLoadingResolve] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Load Field Resolver khi mount
  useEffect(() => {
    let cancelled = false;
    setLoadingResolve(true);
    setResolveError(null);

    resolveFields(docType, userProfile, {})
      .then((result) => {
        if (cancelled) return;
        setResolverResult(result);
        setValues(result.filled_fields);
      })
      .catch((err) => {
        if (cancelled) return;
        setResolveError(
          err instanceof OCRServiceError
            ? "Không thể tải schema văn bản. Vui lòng thử lại."
            : "Lỗi không xác định.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingResolve(false);
      });

    return () => {
      cancelled = true;
    };
  }, [docType, userProfile]);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Xóa lỗi của field khi user bắt đầu nhập
    if (errors.includes(key)) {
      setErrors((prev) => prev.filter((k) => k !== key));
    }
  }

  function validate(): boolean {
    if (!resolverResult) return false;
    const allFields = [
      ...resolverResult.missing_fields,
      // Lấy required fields từ prefilled (có thể bị xóa)
    ];
    const missingKeys = allFields
      .filter((f) => f.required && !values[f.key]?.trim())
      .map((f) => f.key);
    setErrors(missingKeys);
    return missingKeys.length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await generateDocument(docType, values);
      if (!result.validation_ready && result.missing_required.length > 0) {
        setErrors(result.missing_required);
        return;
      }
      onGenerated(result.export_payload, docType);
    } catch {
      setErrors(["Không thể tạo văn bản. Vui lòng thử lại."]);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (loadingResolve) {
    return (
      <div className="ff-loading" role="status" aria-live="polite">
        <span className="ff-spinner" aria-hidden="true" />
        Đang tải thông tin…
      </div>
    );
  }

  if (resolveError) {
    return (
      <div className="ff-error" role="alert">
        <Warning size={20} />
        {resolveError}
        <button className="ff-retry-btn" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!resolverResult) return null;

  // Gom field theo group
  const allFields: FieldDefinition[] = [
    ...resolverResult.missing_fields,
    // Prefilled fields cũng hiển thị để user review
    ...(resolverResult.filled_fields
      ? Object.keys(resolverResult.filled_fields)
          .filter((k) => resolverResult.prefilled_keys.includes(k))
          .map((k) => {
            // Tìm FieldDef từ required_fields nếu có (schema đã trả về)
            return null; // sẽ bị filter bên dưới
          })
          .filter(Boolean)
      : []),
  ] as FieldDefinition[];

  // Gom unique theo group
  const byGroup: Record<string, FieldDefinition[]> = {};
  const sourceFields: FieldDefinition[] =
    (resolverResult as any).fields || resolverResult.missing_fields || [];
  sourceFields.forEach((f) => {
    if (!byGroup[f.group]) byGroup[f.group] = [];
    byGroup[f.group].push(f);
  });

  // Thêm prefilled vào group tương ứng (nếu schema trả về full fields)
  const groupOrder: Array<FieldDefinition["group"]> = [
    "co_quan",
    "ca_nhan",
    "noi_dung",
    "ky_duyet",
    "noi_nhan",
  ];

  const prefilledCount = resolverResult.prefilled_keys.length;
  const totalRequired = resolverResult.missing_fields.filter((f) => f.required).length;

  return (
    <div className="ff-container">
      {/* Header */}
      <div className="ff-header">
        <h2 className="ff-title">Điền thông tin — {docType}</h2>
        {prefilledCount > 0 && (
          <p className="ff-prefill-note" role="status">
            ✨ Đã tự điền <strong>{prefilledCount} trường</strong> từ hồ sơ tài khoản của bạn.
          </p>
        )}
        {resolverResult.is_complete && (
          <div className="ff-complete-banner" role="status">
            <CheckCircle weight="fill" size={16} />
            Tất cả thông tin đã sẵn sàng — kiểm tra và xác nhận bên dưới.
          </div>
        )}
      </div>

      {/* Error summary */}
      {errors.length > 0 && (
        <div className="ff-error-summary" role="alert">
          <Warning size={16} />
          Vui lòng điền đầy đủ {errors.length} trường bắt buộc còn thiếu.
        </div>
      )}

      {/* Prefilled fields review */}
      {prefilledCount > 0 && (
        <section className="ff-group ff-group--prefilled" aria-labelledby="group-prefilled">
          <h3 id="group-prefilled" className="ff-group-title">
            <span className="ff-group-icon" aria-hidden="true">
              <CheckCircle size={16} weight="fill" />
            </span>
            Thông tin từ hồ sơ (đã tự điền)
          </h3>
          {resolverResult.prefilled_keys.map((key) => (
            <div key={key} className="ff-prefilled-row">
              <span className="ff-prefilled-key">{key.replace(/_/g, " ")}</span>
              <span className="ff-prefilled-value">{values[key] || "—"}</span>
              <button
                className="ff-edit-btn"
                aria-label={`Sửa ${key}`}
                onClick={() => {
                  // Allow editing prefilled value
                  const el = document.getElementById(`field-${key}`);
                  if (el) el.focus();
                }}
              >
                <Pencil size={12} />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Form */}
      <form id="field-form" onSubmit={handleSubmit} noValidate>
        {groupOrder.map((group) => {
          const fields = byGroup[group];
          if (!fields?.length) return null;
          return (
            <FieldGroup
              key={group}
              groupKey={group}
              fields={fields}
              values={values}
              prefilledKeys={resolverResult.prefilled_keys}
              onChange={handleChange}
            />
          );
        })}

        {/* Submit */}
        <div className="ff-actions">
          <button
            id="field-form-submit"
            type="submit"
            className="ff-submit-btn"
            disabled={submitting}
            aria-label="Tạo văn bản xem trước"
          >
            {submitting ? (
              <>
                <span className="ff-spinner ff-spinner--sm" aria-hidden="true" />
                Đang tạo văn bản…
              </>
            ) : (
              <>
                <CheckCircle size={18} weight="fill" />
                Tạo văn bản xem trước
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
