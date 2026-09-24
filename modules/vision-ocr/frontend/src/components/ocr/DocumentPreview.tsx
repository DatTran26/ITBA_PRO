import { FileImage, FileText } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import type { GroundedBlock, OCRJob, ND30ExportPayload } from "../../types/ocr";

export interface DocumentPreviewProps {
  job?: OCRJob;
  nd30Data?: ND30ExportPayload;
  onSelectBlock?: (blockId: string | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function A4DocumentPreview({ nd30Data }: { nd30Data: ND30ExportPayload }) {
  const organName = nd30Data.organ_name_upper || nd30Data.company_name || "CƠ QUAN / TỔ CHỨC";
  const dept = nd30Data.department;
  const docNumber = nd30Data.doc_number || nd30Data.doc_code || ".../QĐ-UBND";
  const locDate =
    nd30Data.location_date ||
    `${nd30Data.location || "Hà Nội"}, ${nd30Data.date_str || "ngày ... tháng ... năm ..."}`;
  const signerTitle = nd30Data.signatory_title || nd30Data.signer_title || "THỦ TRƯỞNG ĐƠN VỊ";
  const signerName = nd30Data.signatory_name || nd30Data.signer_name || "";

  return (
    <div className="document-preview document-preview--a4">
      <div className="panel-heading">
        <div>
          <span className="section-label">Xem trước định dạng</span>
          <h3>Văn bản chuẩn Nghị định 30</h3>
        </div>
        <div className="panel-heading-meta">
          <span className="file-type-badge">
            <FileText size={15} aria-hidden="true" />
            {nd30Data.doc_type}
          </span>
        </div>
      </div>

      <div className="document-stage a4-sheet-container">
        <div className="a4-sheet">
          {/* Header: 2 cột */}
          <div className="a4-header">
            <div className="a4-col-left">
              <div className="a4-organ-name">{organName}</div>
              {dept && <div className="a4-sub-organ">{dept}</div>}
              <div className="a4-divider" />
              <div className="a4-doc-number">Số: {docNumber}</div>
            </div>
            <div className="a4-col-right">
              <div className="a4-national-name">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="a4-national-motto">Độc lập - Tự do - Hạnh phúc</div>
              <div className="a4-divider" />
              <div className="a4-location-date">{locDate}</div>
            </div>
          </div>

          {/* Tiêu đề & trích yếu */}
          <div className="a4-title-block">
            <h2 className="a4-doc-type">{nd30Data.doc_type}</h2>
            {nd30Data.subject && <div className="a4-subject">{nd30Data.subject}</div>}
          </div>

          {/* Căn cứ pháp lý */}
          {nd30Data.legal_bases && nd30Data.legal_bases.length > 0 && (
            <div className="a4-legal-bases">
              {nd30Data.legal_bases.map((base, idx) => (
                <p key={idx} className="a4-base-item">
                  {base}
                </p>
              ))}
            </div>
          )}

          {/* Nội dung các điều khoản */}
          <div className="a4-articles">
            {nd30Data.articles.map((art, idx) => (
              <div key={idx} className="a4-article-item">
                {art.title && <div className="a4-article-title">{art.title}</div>}
                <div className="a4-article-body">{art.content}</div>
              </div>
            ))}
          </div>

          {/* Footer: Nơi nhận & Ký duyệt */}
          <div className="a4-footer">
            <div className="a4-recipients">
              <strong>Nơi nhận:</strong>
              <ul>
                {nd30Data.recipients.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
            <div className="a4-signature-block">
              <div className="a4-signer-title">{signerTitle}</div>
              <div className="a4-signer-placeholder">(Ký, ghi rõ họ tên và đóng dấu)</div>
              {signerName && <div className="a4-signer-name">{signerName}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobDocumentPreview({
  job,
  onSelectBlock,
}: {
  job: OCRJob;
  onSelectBlock?: (blockId: string | null) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const activeRef = useRef<SVGRectElement>(null);
  const hasBlocks = job.blocks.length > 0;

  // Scroll active block into view when activeBlockId changes
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [job.activeBlockId]);

  function handleBlockClick(block: GroundedBlock) {
    const newId = block.id === job.activeBlockId ? null : block.id;
    onSelectBlock?.(newId);
  }

  function handleImgClick(e: React.MouseEvent<HTMLImageElement>) {
    if (!hasBlocks || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;

    // Find topmost block that contains the click point
    const hit = [...job.blocks]
      .reverse()
      .find(
        (b) =>
          rx >= b.bbox.x &&
          rx <= b.bbox.x + b.bbox.w &&
          ry >= b.bbox.y &&
          ry <= b.bbox.y + b.bbox.h,
      );

    onSelectBlock?.(hit?.id ?? null);
  }

  return (
    <div className="document-preview">
      <div className="panel-heading">
        <div>
          <span className="section-label">Bằng chứng nguồn</span>
          <h3>Tài liệu gốc</h3>
        </div>
        <div className="panel-heading-meta">
          <span className="file-type-badge">
            <FileImage size={15} aria-hidden="true" />
            {job.file.name.split(".").pop()?.toUpperCase()}
          </span>
          {hasBlocks && (
            <span
              className="grounding-badge"
              title="Grounding khả dụng — click vào vùng chữ để đánh dấu"
            >
              {job.blocks.length} vùng
            </span>
          )}
        </div>
      </div>

      <div className="document-stage">
        {/* ── Source image ─────────────────────────────────── */}
        {job.previewUrl ? (
          <img
            ref={imgRef}
            src={job.previewUrl}
            alt={`Bản xem trước ${job.file.name}`}
            onClick={handleImgClick}
            style={{ cursor: hasBlocks ? "crosshair" : "default" }}
            draggable={false}
          />
        ) : (
          <div className="empty-preview-placeholder" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
            <p>Văn bản định dạng mẫu Nghị định 30 (không có ảnh scan gốc)</p>
          </div>
        )}

        {/* ── SVG Bounding-Box Overlay ──────────────────────── */}
        {hasBlocks && (
          <svg
            className="bbox-overlay"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {job.blocks.map((block) => {
              const isActive = block.id === job.activeBlockId;
              const { x, y, w, h } = block.bbox;

              return (
                <rect
                  key={block.id}
                  ref={isActive ? activeRef : undefined}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  className={`bbox-rect${isActive ? " bbox-rect--active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBlockClick(block);
                  }}
                >
                  <title>{block.text}</title>
                </rect>
              );
            })}
          </svg>
        )}
      </div>

      <div className="document-metadata">
        <strong title={job.file.name}>{job.file.name}</strong>
        <span>{formatFileSize(job.file.size)}</span>
        {hasBlocks && (
          <span className="grounding-hint">Click vào vùng chữ để đối chiếu</span>
        )}
      </div>
    </div>
  );
}

/**
 * DocumentPreview — Renders either:
 * 1) Source image with SVG bounding-box overlay (Luồng B - OCR)
 * 2) Structured A4 document mockup compliant with Decree 30 (Luồng A - Advisory)
 */
export function DocumentPreview({ job, nd30Data, onSelectBlock }: DocumentPreviewProps) {
  if (nd30Data) {
    return <A4DocumentPreview nd30Data={nd30Data} />;
  }

  if (job) {
    return <JobDocumentPreview job={job} onSelectBlock={onSelectBlock} />;
  }

  return (
    <div className="document-preview">
      <div className="panel-heading">
        <h3>Chưa có tài liệu</h3>
      </div>
    </div>
  );
}
