import React, { useState, useRef, useCallback } from "react";
import { scanImage } from "../services/ocrService";
import type { OCRScanResponse, OCRScanState } from "../types/ocr";

/* -------------------------------------------------------------------------- */
/*  Accepted image formats                                                     */
/* -------------------------------------------------------------------------- */
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */
export const OCRScannerPage: React.FC = () => {
  /* ── State ─────────────────────────────────────────────────────────────── */
  const [scanState, setScanState] = useState<OCRScanState>("idle");
  const [result, setResult] = useState<OCRScanResponse | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const isValidFile = (file: File): boolean =>
    ACCEPTED_TYPES.includes(file.type);

  const processFile = useCallback(async (file: File) => {
    if (!isValidFile(file)) {
      setErrorMsg("Định dạng không hỗ trợ. Vui lòng chọn PNG, JPG, JPEG hoặc WEBP.");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setFileName(file.name);
    setErrorMsg("");
    setScanState("loading");
    setResult(null);
    setCopySuccess(false);

    try {
      const data = await scanImage(file);
      setResult(data);
      setScanState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi không xác định");
      setScanState("error");
    }
  }, []);

  /* ── Event handlers ────────────────────────────────────────────────────── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleCopy = useCallback(async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setErrorMsg("Không thể sao chép. Vui lòng sao chép thủ công.");
    }
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result?.text) return;
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, "")}_ocr.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, fileName]);

  const handleReset = useCallback(() => {
    setScanState("idle");
    setResult(null);
    setPreview(null);
    setFileName("");
    setErrorMsg("");
    setCopySuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <span className="text-4xl">🔍</span>
            Vision OCR Scanner
          </h1>
          <p className="text-slate-500 mt-2">
            Quét &amp; trích xuất văn bản từ ảnh siêu tốc với AI Vision
          </p>
        </div>

        {/* ── Drop Zone ─────────────────────────────────────────────────── */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed
            transition-all duration-300 ease-in-out
            ${
              isDragOver
                ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-lg shadow-blue-100"
                : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
            }
            ${preview && scanState !== "idle" ? "p-4" : "p-12"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Empty state */}
          {!preview && (
            <div className="text-center">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-lg font-semibold text-slate-700">
                Kéo thả ảnh vào đây hoặc nhấn để chọn file
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Hỗ trợ: PNG, JPG, JPEG, WEBP — Tối đa 10 MB
              </p>
            </div>
          )}

          {/* Image preview */}
          {preview && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 rounded-xl shadow-md object-contain"
              />
              <p className="text-sm text-slate-500 truncate max-w-xs">
                📎 {fileName}
              </p>
            </div>
          )}
        </div>

        {/* ── Loading indicator ─────────────────────────────────────────── */}
        {scanState === "loading" && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 bg-amber-50 text-amber-700 px-6 py-3 rounded-xl border border-amber-200">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="font-medium">
                ⚡ AI Vision đang trích xuất chữ từ ảnh (~5s)...
              </span>
            </div>
          </div>
        )}

        {/* ── Error message ─────────────────────────────────────────────── */}
        {errorMsg && (
          <div className="mt-4 bg-red-50 text-red-700 px-5 py-3 rounded-xl border border-red-200 text-sm">
            ❌ {errorMsg}
          </div>
        )}

        {/* ── Result area ───────────────────────────────────────────────── */}
        {scanState === "done" && result && (
          <div className="mt-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopy}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${
                    copySuccess
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }
                `}
              >
                {copySuccess ? "✅ Đã sao chép!" : "📋 Sao chép Văn bản"}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  bg-white text-slate-700 border border-slate-300 hover:bg-slate-50
                  transition-colors duration-200"
              >
                💾 Tải file .TXT
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  bg-blue-600 text-white hover:bg-blue-700
                  transition-colors duration-200"
              >
                🔄 Quét ảnh khác
              </button>
            </div>

            {/* Extracted text */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-700">
                  📝 Văn bản trích xuất
                </h2>
                <span className="text-xs text-slate-400">
                  {result.text.length.toLocaleString()} ký tự
                </span>
              </div>
              <textarea
                readOnly
                value={result.text}
                rows={14}
                className="w-full px-5 py-4 text-sm text-slate-800 leading-relaxed
                  resize-y font-mono bg-slate-50/50 focus:outline-none rounded-b-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
