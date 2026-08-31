"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Copy,
    Check,
    Download,
    FileText,
    Eye,
    Edit3,
    Sparkles,
    RotateCcw,
    CheckCircle,
    CheckCircle2,
    Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { OCRJob } from "../types";

interface ReviewWorkspaceProps {
    job: OCRJob | null;
    onTextChange: (id: string, text: string) => void;
    onConfirm: (id: string) => void;
    onReopen: (id: string) => void;
}

export default function ReviewWorkspace({
    job,
    onTextChange,
    onConfirm,
    onReopen,
}: ReviewWorkspaceProps) {
    const [viewMode, setViewMode] = useState<"edit" | "preview" | "diff">("edit");
    const [copied, setCopied] = useState(false);

    if (!job) {
        return (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1A233A]/40 p-8 text-center backdrop-blur-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] text-[#64748B]">
                    <FileText className="h-8 w-8" />
                </div>
                <h4 className="mt-4 text-base font-medium text-[#ECF0F7]">Không gian biên tập OCR</h4>
                <p className="mt-1 text-sm text-[#94A3B8] max-w-xs">
                    Sau khi quét ảnh, kết quả văn bản, bảng biểu sẽ xuất hiện tại đây để bạn kiểm tra và chỉnh sửa.
                </p>
            </div>
        );
    }

    const currentText = job.editedText ?? "";
    const originalText = job.originalText ?? "";
    const isModified = currentText !== originalText;

    const wordsCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
    const charsCount = currentText.length;
    const linesCount = currentText ? currentText.split("\n").length : 0;

    const handleCopy = async () => {
        if (!currentText) return;
        try {
            await navigator.clipboard.writeText(currentText);
            setCopied(true);
            toast.success("Đã sao chép nội dung vào Clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Không thể sao chép văn bản.");
        }
    };

    const handleExport = (format: "txt" | "md") => {
        if (!currentText) return;
        const blob = new Blob([currentText], {
            type: format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const baseName = job.file.name.replace(/\.[^/.]+$/, "");
        a.href = url;
        a.download = `${baseName}_ocr.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Đã tải xuống file .${format}`);
    };

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1A233A]/70 backdrop-blur-md shadow-2xl">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] px-4 py-2.5 bg-[#121A2E]/50 gap-2">
                {/* View Switcher */}
                <div className="flex items-center gap-1 rounded-xl bg-white/[0.05] p-1 border border-white/[0.08]">
                    <button
                        onClick={() => setViewMode("edit")}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                            viewMode === "edit"
                                ? "bg-[#5B6CF0] text-white shadow"
                                : "text-[#94A3B8] hover:text-[#ECF0F7]"
                        }`}
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Biên tập</span>
                    </button>
                    <button
                        onClick={() => setViewMode("preview")}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                            viewMode === "preview"
                                ? "bg-[#5B6CF0] text-white shadow"
                                : "text-[#94A3B8] hover:text-[#ECF0F7]"
                        }`}
                    >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem trước Markdown</span>
                    </button>
                    <button
                        onClick={() => setViewMode("diff")}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                            viewMode === "diff"
                                ? "bg-[#5B6CF0] text-white shadow"
                                : "text-[#94A3B8] hover:text-[#ECF0F7]"
                        }`}
                    >
                        <Layers className="h-3.5 w-3.5" />
                        <span>So sánh gốc</span>
                    </button>
                </div>

                {/* Right Action Tools */}
                <div className="flex items-center gap-1.5">
                    {isModified && (
                        <button
                            onClick={() => onTextChange(job.id, originalText)}
                            title="Khôi phục về văn bản OCR ban đầu"
                            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#ECF0F7] transition-colors"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Khôi phục</span>
                        </button>
                    )}

                    <button
                        onClick={handleCopy}
                        disabled={!currentText}
                        className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#ECF0F7] disabled:opacity-40 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-[#36DDAB]" />
                                <span className="text-[#36DDAB]">Đã chép</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Chép</span>
                            </>
                        )}
                    </button>

                    <div className="relative group">
                        <button
                            disabled={!currentText}
                            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#ECF0F7] disabled:opacity-40 transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Xuất</span>
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden w-32 flex-col rounded-xl border border-white/10 bg-[#1A233A] p-1 shadow-2xl z-30 group-hover:flex">
                            <button
                                onClick={() => handleExport("txt")}
                                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#94A3B8] hover:bg-[#5B6CF0]/20 hover:text-[#ECF0F7] text-left transition-colors"
                            >
                                File văn bản (.txt)
                            </button>
                            <button
                                onClick={() => handleExport("md")}
                                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#94A3B8] hover:bg-[#5B6CF0]/20 hover:text-[#ECF0F7] text-left transition-colors"
                            >
                                Markdown (.md)
                            </button>
                        </div>
                    </div>

                    {job.status === "confirmed" ? (
                        <button
                            onClick={() => onReopen(job.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#36DDAB]/20 border border-[#36DDAB]/30 px-3 py-1 text-xs font-semibold text-[#36DDAB] hover:bg-[#36DDAB]/30 transition-colors"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Đã duyệt (Mở lại)</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => onConfirm(job.id)}
                            disabled={!currentText || job.status === "processing"}
                            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#5B6CF0] to-[#7C8FFF] px-3 py-1 text-xs font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-40 transition-opacity"
                        >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Xác nhận kết quả</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#0D1322]/60 min-h-[340px]">
                {viewMode === "edit" && (
                    <div className="h-full flex flex-col">
                        <textarea
                            value={currentText}
                            onChange={(e) => onTextChange(job.id, e.target.value)}
                            placeholder="Văn bản trích xuất từ ảnh sẽ xuất hiện tại đây..."
                            className="w-full flex-1 resize-none rounded-xl border border-white/[0.06] bg-[#121A2E]/70 p-4 font-mono text-sm leading-relaxed text-[#ECF0F7] placeholder-[#64748B] focus:border-[#5B6CF0] focus:outline-none focus:ring-1 focus:ring-[#5B6CF0]/50"
                            rows={16}
                        />
                    </div>
                )}

                {viewMode === "preview" && (
                    <div className="h-full rounded-xl border border-white/[0.06] bg-[#121A2E]/70 p-6 overflow-y-auto prose prose-invert max-w-none prose-table:border prose-table:border-white/10 prose-th:border prose-th:border-white/10 prose-th:bg-white/[0.05] prose-th:p-2 prose-td:border prose-td:border-white/10 prose-td:p-2">
                        {currentText ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {currentText}
                            </ReactMarkdown>
                        ) : (
                            <p className="text-sm italic text-[#64748B]">Chưa có nội dung để xem trước.</p>
                        )}
                    </div>
                )}

                {viewMode === "diff" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        <div className="flex flex-col rounded-xl border border-white/[0.06] bg-[#121A2E]/70 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] pb-2 border-b border-white/[0.06] mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#5B6CF0]" />
                                <span>OCR Gốc (AI trích xuất)</span>
                            </div>
                            <pre className="flex-1 whitespace-pre-wrap font-mono text-xs text-[#94A3B8] overflow-y-auto leading-relaxed">
                                {originalText || "(Trống)"}
                            </pre>
                        </div>
                        <div className="flex flex-col rounded-xl border border-[#5B6CF0]/20 bg-[#121A2E]/70 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7C8FFF] pb-2 border-b border-white/[0.06] mb-2">
                                <Edit3 className="w-3.5 h-3.5 text-[#36DDAB]" />
                                <span>Bản đã chỉnh sửa (Hiện tại)</span>
                            </div>
                            <pre className="flex-1 whitespace-pre-wrap font-mono text-xs text-[#ECF0F7] overflow-y-auto leading-relaxed">
                                {currentText || "(Trống)"}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2 bg-[#121A2E]/80 text-[11px] text-[#64748B]">
                <div className="flex items-center gap-3">
                    <span>{wordsCount} từ</span>
                    <span>•</span>
                    <span>{charsCount} ký tự</span>
                    <span>•</span>
                    <span>{linesCount} dòng</span>
                </div>
                <div className="flex items-center gap-2">
                    {job.engine && (
                        <span className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-[#7C8FFF] border border-white/[0.06]">
                            Engine: {job.engine}
                        </span>
                    )}
                    {isModified && (
                        <span className="text-[#F59E0B]">● Đã chỉnh sửa</span>
                    )}
                </div>
            </div>
        </div>
    );
}
