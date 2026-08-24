import { useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowUpRight, FileImage } from "@phosphor-icons/react";

interface UploadLauncherProps {
  onFiles(files: FileList | File[]): void;
  compact?: boolean;
}

const acceptedTypes = "image/png,image/jpeg,image/jpg,image/webp";

export function UploadLauncher({ onFiles, compact = false }: UploadLauncherProps) {
  const [dragging, setDragging] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) onFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) onFiles(event.dataTransfer.files);
  }

  return (
    <label
      className={`upload-launcher${compact ? " is-compact" : ""}${dragging ? " is-dragging" : ""}`}
      onDragEnter={() => setDragging(true)}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        className="visually-hidden"
        type="file"
        accept={acceptedTypes}
        multiple
        aria-label="Chọn tài liệu để OCR"
        onChange={handleChange}
      />
      <span className="upload-launcher__icon" aria-hidden="true">
        <FileImage size={22} weight="duotone" />
      </span>
      <span className="upload-launcher__copy">
        <strong>{compact ? "Thêm tài liệu" : "Đưa tài liệu vào bàn kiểm tra"}</strong>
        <span>
          {compact
            ? "PNG, JPG, WEBP · tối đa 10 MB"
            : "Kéo thả hoặc chọn tối đa 5 ảnh PNG, JPG, WEBP"}
        </span>
      </span>
      <ArrowUpRight
        className="upload-launcher__arrow"
        size={18}
        aria-hidden="true"
      />
    </label>
  );
}
