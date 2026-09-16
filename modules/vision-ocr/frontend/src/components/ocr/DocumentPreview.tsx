import { FileImage } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import type { GroundedBlock, OCRJob } from "../../types/ocr";

interface DocumentPreviewProps {
  job: OCRJob;
  onSelectBlock?: (blockId: string | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * DocumentPreview — Renders the source image with an interactive SVG bounding-box overlay.
 *
 * When OCR grounding blocks are available (PaddleOCR path), each text region is
 * drawn as a translucent rect on top of the image. Clicking a rect highlights it
 * and notifies the parent via ``onSelectBlock``, which the parent uses to focus
 * the corresponding field in the ReviewEditor.
 *
 * The SVG uses ``viewBox="0 0 100 100"`` with ``preserveAspectRatio="none"`` so
 * that normalized 0-1 bbox values map directly to percentages.
 */
export function DocumentPreview({ job, onSelectBlock }: DocumentPreviewProps) {
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
            <span className="grounding-badge" title="Grounding khả dụng — click vào vùng chữ để đánh dấu">
              {job.blocks.length} vùng
            </span>
          )}
        </div>
      </div>

      <div className="document-stage">
        {/* ── Source image ─────────────────────────────────── */}
        <img
          ref={imgRef}
          src={job.previewUrl}
          alt={`Bản xem trước ${job.file.name}`}
          onClick={handleImgClick}
          style={{ cursor: hasBlocks ? "crosshair" : "default" }}
          draggable={false}
        />

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
          <span className="grounding-hint">
            Click vào vùng chữ để đối chiếu
          </span>
        )}
      </div>
    </div>
  );
}
