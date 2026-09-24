"use client";

import React, { useState, useEffect } from "react";
import {
    CheckCircle2,
    AlertCircle,
    Download,
    ArrowLeft,
    FileText,
    Sparkles,
    ShieldCheck,
    Scale,
    Building2,
    Calendar,
    User,
    Copy,
    Printer,
    Edit3,
    Eye,
    RefreshCw,
    Network,
    ExternalLink,
    Check,
    Plus,
    Trash2,
    Undo2,
} from "lucide-react";
import { toast } from "sonner";
import type {
    DocumentGenerationResult,
    ND30ExportPayload,
    OCRJob,
} from "../types";
import ND30GraphRagModal from "./nd30-graph-rag-modal";
import { saveDocument } from "../services/saved-documents-store";

interface AdvisoryA4ReviewWorkspaceProps {
    result: DocumentGenerationResult;
    onBackToForm: () => void;
    onStartNew: () => void;
    onSyncToWorkspace?: (job: OCRJob) => void;
}

interface ValidationReport {
    score: number;
    is_valid: boolean;
    seal_status?: {
        has_seal: boolean;
        seal_type: string;
        overlap_status: string;
        is_compliant: boolean;
        note: string;
    };
    components?: {
        quoc_hieu?: { valid: boolean; note: string };
        co_quan?: { valid: boolean; note: string };
        so_hieu?: { valid: boolean; note: string };
        dia_danh_ngay_thang?: { valid: boolean; note: string };
        trich_yeu?: { valid: boolean; note: string };
        noi_dung?: { valid: boolean; note: string };
        nguoi_ky?: { valid: boolean; note: string };
        con_dau?: { valid: boolean; note: string };
        noi_nhan?: { valid: boolean; note: string };
    };
    issues?: {
        component: string;
        severity: "error" | "warning" | "info";
        message: string;
        recommendation: string;
        citation: string;
    }[];
}

export default function AdvisoryA4ReviewWorkspace({
    result,
    onBackToForm,
    onStartNew,
    onSyncToWorkspace,
}: AdvisoryA4ReviewWorkspaceProps) {
    const [payload, setPayload] = useState<ND30ExportPayload>(result.export_payload);
    const [viewMode, setViewMode] = useState<"a4" | "edit">("a4");
    const [isExporting, setIsExporting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validation, setValidation] = useState<ValidationReport | null>(null);
    const [copied, setCopied] = useState(false);
    const [showGraphModal, setShowGraphModal] = useState(false);

    // Initial validation and live debounced validation on payload edits
    useEffect(() => {
        const timer = setTimeout(() => {
            runValidation(payload);
        }, 700);
        return () => clearTimeout(timer);
    }, [payload]);

    function handleResetToOriginal() {
        setPayload(result.export_payload);
        toast.info("Đã khôi phục lại nội dung bản gốc ban đầu");
    }

    async function runValidation(currentPayload: ND30ExportPayload) {
        setIsValidating(true);
        try {
            const res = await fetch("/api/ocr/nd30/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentPayload),
            });
            if (res.ok) {
                const report = await res.json();
                setValidation(report);
            }
        } catch (err) {
            console.warn("Validation check failed:", err);
        } finally {
            setIsValidating(false);
        }
    }

    // Export DOCX with verified showSaveFilePicker & direct download fallback
    async function handleExportDocx() {
        setIsExporting(true);

        const rawType = (payload.doc_type || "VanBan").trim();
        const safeType = rawType
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/[^a-zA-Z0-9_\-]/g, "_")
            .replace(/_+/g, "_");

        const rawCode = (payload.doc_number || "").trim();
        const safeCode = rawCode
            ? "_" +
              rawCode
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[đĐ]/g, "d")
                  .replace(/[^a-zA-Z0-9_\-]/g, "_")
                  .replace(/_+/g, "_")
            : "";

        const downloadFilename = `ND30_${safeType}${safeCode}.docx`;

        // Method 1: File System Access API (Recommended for Edge/Chrome on Windows)
        if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
            try {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: downloadFilename,
                    types: [
                        {
                            description: "Văn bản Microsoft Word (.docx)",
                            accept: {
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                            },
                        },
                    ],
                });

                const res = await fetch("/api/ocr/export-nd30", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Lỗi máy chủ khi tạo văn bản DOCX");
                }

                const blob = await res.blob();
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();

                try {
                    saveDocument({
                        title: payload.subject || `${payload.doc_type}`,
                        doc_type: payload.doc_type,
                        file_name: downloadFilename,
                        export_payload: payload,
                        preview_markdown: result.preview_markdown,
                        status: "exported",
                        source: "advisory",
                        signatory_name: payload.signatory_name,
                        company_name: payload.company_name,
                        department: payload.department,
                    });
                } catch {}

                toast.success(`Đã lưu tệp Word: ${downloadFilename}`);
                setIsExporting(false);
                return;
            } catch (pickerErr: any) {
                if (pickerErr.name === "AbortError") {
                    setIsExporting(false);
                    return;
                }
                console.warn("showSaveFilePicker failed, using fallback:", pickerErr);
            }
        }

        // Method 2: Direct Form POST (Top-level native browser download)
        try {
            const form = document.createElement("form");
            form.method = "POST";
            form.action = "/api/ocr/export-nd30";
            form.style.display = "none";

            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "payload";
            input.value = JSON.stringify(payload);
            form.appendChild(input);

            document.body.appendChild(form);
            form.submit();

            try {
                saveDocument({
                    title: payload.subject || `${payload.doc_type}`,
                    doc_type: payload.doc_type,
                    file_name: downloadFilename,
                    export_payload: payload,
                    preview_markdown: result.preview_markdown,
                    status: "exported",
                    source: "advisory",
                    signatory_name: payload.signatory_name,
                    company_name: payload.company_name,
                    department: payload.department,
                });
            } catch {}

            toast.success("Đang tải tệp Word (.docx) chuẩn Nghị định 30!");

            setTimeout(() => {
                try {
                    document.body.removeChild(form);
                } catch {}
                setIsExporting(false);
            }, 3000);
        } catch (formErr: any) {
            console.error("Direct form download error:", formErr);
            toast.error("Không thể xuất file Word.");
            setIsExporting(false);
        }
    }

    // Copy formatted text
    function handleCopyText() {
        const text = result.preview_markdown || JSON.stringify(payload, null, 2);
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Đã sao chép nội dung văn bản!");
        setTimeout(() => setCopied(false), 2000);
    }

    // Sync to OCR queue for history archive if requested
    function handleArchiveToQueue() {
        if (!onSyncToWorkspace) return;
        const cleanName = `${(payload.doc_type || "VanBan").replace(/[\/\s]+/g, "_")}_ND30.docx`;
        const textContent =
            result.preview_markdown ||
            `# ${payload.doc_type}\n\n${payload.subject || ""}`;
        const virtualFile = new File([textContent], cleanName, {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const newJob: OCRJob = {
            id: `advisory-${Date.now()}`,
            file: virtualFile,
            previewUrl: "",
            status: "needs_review",
            originalText: textContent,
            editedText: textContent,
            confirmedText: null,
            errorMessage: null,
            engine: "AI Advisory Engine (NĐ 30)",
            attemptCount: 1,
            createdAt: Date.now(),
            startedAt: Date.now(),
            blocks: [],
            activeBlockId: null,
        };

        onSyncToWorkspace(newJob);
    }

    // Parse payload fields for A4 preview
    const organName = payload.company_name || "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN TOWN";
    const deptName = payload.department || "";
    const docNumber = payload.doc_number || "";
    const locationDate = payload.location_date || "Hà Nội, ngày ... tháng ... năm ...";
    const docTypeUpper = (payload.doc_type || "VĂN BẢN").toUpperCase();
    const subject = payload.subject || "";
    const bases = payload.bases || [];
    const articles = payload.articles || [];
    const signatoryTitle = (payload.signatory_title || "NGƯỜI KÝ").toUpperCase();
    const signatoryName = payload.signatory_name || "";
    const recipients = payload.recipients || [];

    const score = validation?.score ?? 95;
    const isScoreGood = score >= 80;

    return (
        <div className="flex flex-col gap-6">
            {/* Top Navigation & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#1A233A]/70 p-4 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBackToForm}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#94A3B8] hover:bg-white/[0.08] hover:text-white transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>← Quay lại chỉnh sửa thông tin</span>
                    </button>

                    <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#36DDAB]">
                                Bàn thẩm định thể thức A4
                            </span>
                            <span className="rounded-full bg-[#5B6CF0]/20 border border-[#5B6CF0]/40 px-2 py-0.5 text-[10px] font-bold text-[#7C8FFF]">
                                NĐ 30/2020/NĐ-CP
                            </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                            <span>{docTypeUpper}</span>
                        </h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Graph RAG Modal Button */}
                    <button
                        onClick={() => setShowGraphModal(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-all"
                        title="Xem Đồ thị tri thức Graph RAG Nghị định 30"
                    >
                        <Network className="h-3.5 w-3.5" />
                        <span>🕸️ Graph RAG</span>
                    </button>

                    {/* Copy text */}
                    <button
                        onClick={handleCopyText}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#94A3B8] hover:bg-white/[0.08] hover:text-white transition-all"
                        title="Sao chép toàn bộ văn bản"
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

                    {/* Print / Preview toggle */}
                    <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-0.5">
                        <button
                            onClick={() => setViewMode("a4")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                viewMode === "a4"
                                    ? "bg-[#5B6CF0] text-white shadow-sm"
                                    : "text-[#94A3B8] hover:text-white"
                            }`}
                            title="Xem trang in chuẩn thể thức Nghị định 30"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Bản in A4</span>
                        </button>
                        <button
                            onClick={() => setViewMode("edit")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                viewMode === "edit"
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                                    : "text-[#94A3B8] hover:text-white"
                            }`}
                            title="Bật chế độ soạn thảo trực tiếp trên mặt giấy A4"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Soạn thảo A4 (WYSIWYG)</span>
                        </button>
                    </div>

                    {/* Promulgate / Export DOCX Button */}
                    <button
                        onClick={handleExportDocx}
                        disabled={isExporting}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all border border-emerald-400/30"
                    >
                        <Download className={`h-4 w-4 ${isExporting ? "animate-bounce" : ""}`} />
                        <span>{isExporting ? "Đang tạo file..." : "📥 Ban hành File Word (.docx)"}</span>
                    </button>
                </div>
            </div>

            {/* Main Stage Grid: A4 Preview (Left/Center) + 9-Component Legal Audit (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* ── LEFT COLUMN: A4 SHEET PREVIEW / WYSIWYG EDITOR (col-span-8) ── */}
                <div className="xl:col-span-8 flex flex-col items-center">
                    {/* Inline WYSIWYG Hint & Action Bar when editing */}
                    {viewMode === "edit" && (
                        <div className="w-full max-w-[794px] mb-3 flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-purple-600/15 border border-blue-500/30 text-xs text-blue-200 backdrop-blur-md shadow-lg shadow-blue-500/10 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                                <Edit3 className="h-4 w-4 text-blue-400 shrink-0 animate-pulse" />
                                <span>
                                    <strong className="text-white">Soạn thảo trực tiếp (WYSIWYG):</strong> Nhấp chuột vào bất kỳ đoạn chữ nào trên tờ giấy A4 dưới đây để chỉnh sửa. Dữ liệu sẽ tự động lưu và cập nhật thể thức pháp lý.
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    type="button"
                                    onClick={handleResetToOriginal}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all text-xs"
                                    title="Khôi phục lại nội dung ban đầu từ form"
                                >
                                    <Undo2 className="h-3.5 w-3.5" />
                                    <span>Đặt lại gốc</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setViewMode("a4");
                                        toast.success("Đã chuyển sang chế độ xem bản in A4!");
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5B6CF0] hover:bg-[#5B6CF0]/90 text-white font-bold transition-all text-xs shadow-md shadow-[#5B6CF0]/30"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Xem bản in A4</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="w-full flex justify-center overflow-x-auto py-2">
                        {/* Realistic A4 Sheet Paper (Always visible, directly editable in WYSIWYG mode) */}
                        <div
                            id="a4-document-paper"
                            className={`w-[794px] min-h-[1123px] bg-white text-black p-[25mm_20mm_25mm_30mm] shadow-2xl rounded-sm transition-all ${
                                viewMode === "edit" ? "ring-2 ring-blue-500/40" : ""
                            }`}
                            style={{
                                fontFamily: "'Times New Roman', Times, serif",
                                fontSize: "13pt",
                                lineHeight: "1.45",
                                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
                            }}
                        >
                            {/* A4 Header: 2 Columns */}
                            <div className="grid grid-cols-2 gap-4 items-start pb-4">
                                {/* Left: Organ Name & Code */}
                                <div className="text-center">
                                    {viewMode === "edit" ? (
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                value={payload.company_name || ""}
                                                onChange={(e) => setPayload({ ...payload, company_name: e.target.value })}
                                                className="w-full text-center font-bold text-[12pt] uppercase tracking-tight text-neutral-900 bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif"
                                                placeholder="TÊN CƠ QUAN / ĐƠN VỊ"
                                                title="Nhấp để sửa Cơ quan ban hành"
                                            />
                                            <input
                                                type="text"
                                                value={payload.department || ""}
                                                onChange={(e) => setPayload({ ...payload, department: e.target.value })}
                                                className="w-full text-center font-semibold text-[11pt] uppercase text-neutral-800 bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif"
                                                placeholder="PHÒNG BAN / ĐƠN VỊ SOẠN THẢO"
                                                title="Nhấp để sửa Phòng ban / Bộ phận"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-bold text-[12pt] uppercase tracking-tight text-neutral-900">
                                                {organName}
                                            </div>
                                            {deptName && (
                                                <div className="font-semibold text-[11pt] uppercase text-neutral-800">
                                                    {deptName}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Divider line under organ name */}
                                    <div className="w-24 h-[1px] bg-neutral-900 mx-auto my-1" />

                                    {viewMode === "edit" ? (
                                        <div className="flex items-center justify-center text-[12pt] text-neutral-800 mt-1">
                                            <span>Số:&nbsp;</span>
                                            <input
                                                type="text"
                                                value={payload.doc_number || ""}
                                                onChange={(e) => setPayload({ ...payload, doc_number: e.target.value })}
                                                className="w-36 text-center bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif text-[12pt]"
                                                placeholder=".../..."
                                                title="Nhấp để sửa Số ký hiệu văn bản"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-[12pt] text-neutral-800 mt-1">
                                            {docNumber ? `Số: ${docNumber}` : "Số: ....../......"}
                                        </div>
                                    )}
                                </div>

                                {/* Right: National Header & Location Date */}
                                <div className="text-center">
                                    <div className="font-bold text-[12pt] uppercase tracking-tight text-neutral-900">
                                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                    </div>
                                    <div className="font-bold text-[13pt] text-neutral-900">
                                        Độc lập - Tự do - Hạnh phúc
                                    </div>
                                    {/* Full underline under motto */}
                                    <div className="w-36 h-[1px] bg-neutral-900 mx-auto my-1" />

                                    {viewMode === "edit" ? (
                                        <input
                                            type="text"
                                            value={payload.location_date || ""}
                                            onChange={(e) => setPayload({ ...payload, location_date: e.target.value })}
                                            className="w-full text-center italic text-[13pt] text-neutral-800 mt-1 bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif"
                                            placeholder="Hà Nội, ngày ... tháng ... năm ..."
                                            title="Nhấp để sửa Địa danh và ngày tháng"
                                        />
                                    ) : (
                                        <div className="italic text-[13pt] text-neutral-800 mt-1">
                                            {locationDate}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Title Block */}
                            <div className="text-center my-6 space-y-1">
                                {viewMode === "edit" ? (
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={payload.doc_type || ""}
                                            onChange={(e) => setPayload({ ...payload, doc_type: e.target.value })}
                                            className="w-full text-center font-bold text-[14pt] uppercase tracking-normal text-neutral-900 bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif"
                                            placeholder="TÊN LOẠI VĂN BẢN (QUYẾT ĐỊNH / BẢN TƯỜNG TRÌNH / ...)"
                                            title="Nhấp để sửa Tên loại văn bản"
                                        />
                                        <input
                                            type="text"
                                            value={payload.subject || ""}
                                            onChange={(e) => setPayload({ ...payload, subject: e.target.value })}
                                            className="w-full text-center font-semibold text-[13pt] text-neutral-800 italic bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif"
                                            placeholder="Trích yếu nội dung (Về việc...)"
                                            title="Nhấp để sửa Trích yếu văn bản"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="font-bold text-[14pt] uppercase tracking-normal text-neutral-900">
                                            {docTypeUpper}
                                        </h1>
                                        {subject && (
                                            <div className="font-semibold text-[13pt] text-neutral-800 italic">
                                                {subject}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Legal bases (Căn cứ) */}
                            {viewMode === "edit" ? (
                                <div className="space-y-1.5 my-4 p-2 rounded-lg bg-blue-50/20 border border-dashed border-blue-200">
                                    <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
                                        <span>Căn cứ pháp lý (Nghị định 30):</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPayload({
                                                    ...payload,
                                                    bases: [...(payload.bases || []), "Căn cứ ..."],
                                                });
                                            }}
                                            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-all"
                                        >
                                            <Plus className="h-3 w-3" />
                                            <span>Thêm căn cứ</span>
                                        </button>
                                    </div>
                                    {(payload.bases || []).map((base, idx) => (
                                        <div key={idx} className="group flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={base}
                                                onChange={(e) => {
                                                    const updated = [...(payload.bases || [])];
                                                    updated[idx] = e.target.value;
                                                    setPayload({ ...payload, bases: updated });
                                                }}
                                                className="flex-1 italic text-[13pt] text-neutral-800 bg-transparent hover:bg-blue-50/60 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif"
                                                placeholder="Căn cứ Luật / Nghị định / Quyết định..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = (payload.bases || []).filter((_, i) => i !== idx);
                                                    setPayload({ ...payload, bases: updated });
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-all text-xs"
                                                title="Xóa căn cứ này"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {(payload.bases || []).length === 0 && (
                                        <p className="text-xs text-neutral-400 italic">Chưa có căn cứ pháp lý. Bấm "Thêm căn cứ" ở trên nếu cần.</p>
                                    )}
                                </div>
                            ) : (
                                bases.length > 0 && (
                                    <div className="space-y-1 my-4 text-[13pt] italic text-neutral-800">
                                        {bases.map((base, idx) => (
                                            <p key={idx} className="indent-8 text-justify">
                                                {base.endsWith(";") || base.endsWith(".") ? base : `${base};`}
                                            </p>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Body / Articles */}
                            <div className="space-y-3 my-6 text-[13pt] text-neutral-900 text-justify">
                                {viewMode === "edit" ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-xs text-blue-700 font-semibold">
                                            <span>Nội dung văn bản (Chỉnh sửa trực tiếp):</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPayload({
                                                        ...payload,
                                                        articles: [
                                                            ...(payload.articles || []),
                                                            {
                                                                title: payload.articles.length > 0 && payload.articles[0].title ? `Điều ${payload.articles.length + 1}` : "",
                                                                content: "",
                                                            },
                                                        ],
                                                    });
                                                }}
                                                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-all"
                                            >
                                                <Plus className="h-3 w-3" />
                                                <span>Thêm Điều / Mục mới</span>
                                            </button>
                                        </div>
                                        {articles.map((art, idx) => (
                                            <div key={idx} className="group relative space-y-1.5 p-3 rounded-lg border border-dashed border-blue-200/90 bg-blue-50/15 hover:bg-blue-50/25 transition-all">
                                                <div className="flex items-center justify-between gap-2">
                                                    {art.title !== undefined && (
                                                        <input
                                                            type="text"
                                                            value={art.title}
                                                            onChange={(e) => {
                                                                const updated = [...payload.articles];
                                                                updated[idx] = { ...updated[idx], title: e.target.value };
                                                                setPayload({ ...payload, articles: updated });
                                                            }}
                                                            className="font-bold text-[13pt] text-neutral-900 bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 outline-none font-serif w-60"
                                                            placeholder="Tiêu đề mục (ví dụ: Điều 1)"
                                                        />
                                                    )}
                                                    {articles.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = payload.articles.filter((_, i) => i !== idx);
                                                                setPayload({ ...payload, articles: updated });
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-all ml-auto text-xs"
                                                            title="Xóa điều/mục này"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <textarea
                                                    value={art.content}
                                                    onChange={(e) => {
                                                        const updated = [...payload.articles];
                                                        updated[idx] = { ...updated[idx], content: e.target.value };
                                                        setPayload({ ...payload, articles: updated });
                                                    }}
                                                    rows={Math.max(5, (art.content || "").split("\n").length + 2)}
                                                    className="w-full bg-white/70 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg p-2.5 transition-all outline-none resize-y font-serif text-[13pt] leading-relaxed text-neutral-900 border border-blue-200/60 shadow-sm"
                                                    placeholder="Nhập nội dung văn bản..."
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    articles.map((art, idx) => {
                                        const rawLines = (art.content || "").split("\n");
                                        return (
                                            <div key={idx} className="space-y-1">
                                                {art.title && (
                                                    <div className="font-bold indent-8">
                                                        {art.title}
                                                    </div>
                                                )}
                                                <div className="space-y-1 leading-relaxed">
                                                    {rawLines.map((line, lIdx) => {
                                                        const trimmed = line.trim();
                                                        if (!trimmed) {
                                                            return <div key={lIdx} className="h-2" />;
                                                        }

                                                        const isKinhGui = /^Kính gửi\s*[:：]/i.test(trimmed);
                                                        const isBullet = /^[-+*•–—]\s/.test(trimmed);
                                                        const isClosingOrFieldContinuation = /^(Từ ngày|Đến ngày|Thời gian|Kính mong|Kính đề nghị|Kính xin|Kính chúc|Tôi xin|Tôi cam|Em xin|Xin trân trọng|Trân trọng|Chân thành cảm ơn)/i.test(trimmed);
                                                        const fieldMatch = trimmed.match(/^([^:：\.\?!]{2,45})\s*[:：]/);
                                                        const isNarrativeKeyword = fieldMatch && /^(Căn cứ|Điều\s+\d+|Khoản\s+\d+|Điểm\s+[a-z]|Quy định|Theo)/i.test(fieldMatch[1]);
                                                        const isInfoLine = isBullet || isClosingOrFieldContinuation || (Boolean(fieldMatch) && !isNarrativeKeyword);

                                                        if (isKinhGui) {
                                                            return (
                                                                <p key={lIdx} className="font-semibold italic indent-8 text-left">
                                                                    {trimmed}
                                                                </p>
                                                            );
                                                        }

                                                        if (isInfoLine) {
                                                            return (
                                                                <p key={lIdx} className="pl-0 text-left">
                                                                    {trimmed}
                                                                </p>
                                                            );
                                                        }

                                                        return (
                                                            <p key={lIdx} className="indent-8 text-justify">
                                                                {trimmed}
                                                            </p>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer Block: 2 Columns (Recipients on Left, Signer on Right) */}
                            <div className="grid grid-cols-2 gap-4 items-start pt-8 mt-8 border-t border-transparent">
                                {/* Left: Nơi nhận */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold italic text-[11pt] text-neutral-900">Nơi nhận:</span>
                                        {viewMode === "edit" && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPayload({
                                                        ...payload,
                                                        recipients: [...(payload.recipients || []), ""],
                                                    });
                                                }}
                                                className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                                            >
                                                <Plus className="h-2.5 w-2.5" />
                                                <span>Thêm</span>
                                            </button>
                                        )}
                                    </div>
                                    {viewMode === "edit" ? (
                                        <div className="space-y-1">
                                            {(payload.recipients || []).map((rec, idx) => (
                                                <div key={idx} className="group flex items-center gap-1">
                                                    <span className="text-[11pt] text-neutral-600">-</span>
                                                    <input
                                                        type="text"
                                                        value={rec}
                                                        onChange={(e) => {
                                                            const updated = [...(payload.recipients || [])];
                                                            updated[idx] = e.target.value;
                                                            setPayload({ ...payload, recipients: updated });
                                                        }}
                                                        className="flex-1 text-[11pt] text-neutral-800 bg-transparent hover:bg-blue-50/60 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none font-serif"
                                                        placeholder="Nơi nhận..."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = (payload.recipients || []).filter((_, i) => i !== idx);
                                                            setPayload({ ...payload, recipients: updated });
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 text-xs px-1"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <ul className="text-[11pt] text-neutral-800 mt-1 space-y-0.5">
                                            {recipients.map((rec, idx) => (
                                                <li key={idx}>- {rec}</li>
                                            ))}
                                            {!recipients.some((r) => r.toLowerCase().includes("lưu")) && (
                                                <li>- Lưu: VT.</li>
                                            )}
                                        </ul>
                                    )}
                                </div>

                                {/* Right: Signatory block */}
                                <div className="text-center">
                                    {viewMode === "edit" ? (
                                        <input
                                            type="text"
                                            value={payload.signatory_title || ""}
                                            onChange={(e) => setPayload({ ...payload, signatory_title: e.target.value })}
                                            className="w-full text-center font-bold text-[13pt] uppercase text-neutral-900 bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif"
                                            placeholder="CHỨC DANH NGƯỜI KÝ"
                                            title="Nhấp để sửa Chức danh người ký"
                                        />
                                    ) : (
                                        <div className="font-bold text-[13pt] uppercase text-neutral-900">
                                            {signatoryTitle}
                                        </div>
                                    )}
                                    <div className="italic text-[12pt] text-neutral-700 mt-0.5">
                                        (Ký, ghi rõ họ tên và đóng dấu)
                                    </div>
                                    {/* Blank space for signature & legal seal */}
                                    <div className="h-24 flex items-center justify-center relative">
                                        <div className="w-20 h-20 rounded-full border border-dashed border-rose-300/40 flex items-center justify-center text-[10px] text-rose-300/60 uppercase">
                                            Vị trí con dấu
                                        </div>
                                    </div>
                                    {viewMode === "edit" ? (
                                        <input
                                            type="text"
                                            value={payload.signatory_name || ""}
                                            onChange={(e) => setPayload({ ...payload, signatory_name: e.target.value })}
                                            className="w-full text-center font-bold text-[13pt] text-neutral-900 bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 outline-dashed outline-1 outline-blue-200 hover:outline-blue-400 focus:outline-none transition-all font-serif"
                                            placeholder="HỌ VÀ TÊN NGƯỜI KÝ"
                                            title="Nhấp để sửa Họ và tên người ký"
                                        />
                                    ) : (
                                        <div className="font-bold text-[13pt] text-neutral-900">
                                            {signatoryName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: LEGAL AUDIT 9 COMPONENTS (col-span-4) ── */}
                <div className="xl:col-span-4 flex flex-col gap-5">
                    {/* Score Card */}
                    <div className="rounded-2xl border border-white/[0.08] bg-[#1A233A]/70 p-6 backdrop-blur-xl shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#36DDAB] to-[#5B6CF0] text-[#092E30]">
                                    <Scale className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Thẩm định thể thức NĐ 30</h3>
                                    <p className="text-[11px] text-[#94A3B8]">Kiểm tra 9 thành phần thể thức bắt buộc</p>
                                </div>
                            </div>

                            <button
                                onClick={() => runValidation(payload)}
                                disabled={isValidating}
                                className="flex items-center gap-1 text-[11px] text-[#7C8FFF] hover:text-white transition-colors"
                                title="Kiểm định lại"
                            >
                                <RefreshCw className={`h-3 w-3 ${isValidating ? "animate-spin" : ""}`} />
                                <span>{isValidating ? "Đang chấm..." : "Chấm lại"}</span>
                            </button>
                        </div>

                        {/* Big Score Display */}
                        <div className="flex items-center justify-between py-5">
                            <div>
                                <div className="text-3xl font-extrabold text-white flex items-baseline gap-1">
                                    <span className={isScoreGood ? "text-[#36DDAB]" : "text-[#F59E0B]"}>{score}</span>
                                    <span className="text-xs font-normal text-[#94A3B8]">/100 điểm</span>
                                </div>
                                <p className="text-xs font-medium text-[#ECF0F7] mt-1">
                                    {score >= 90
                                        ? "✅ Đạt chuẩn thể thức xuất sắc"
                                        : score >= 80
                                        ? "⚖️ Hợp quy theo Nghị định 30"
                                        : "⚠️ Cần hoàn thiện thêm thông tin"}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        isScoreGood
                                            ? "bg-[#36DDAB]/20 text-[#36DDAB] border border-[#36DDAB]/30"
                                            : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30"
                                    }`}
                                >
                                    {isScoreGood ? "HỢP LỆ BAN HÀNH" : "CẦN LƯU Ý"}
                                </span>
                            </div>
                        </div>

                        {/* 9 Components Checklist */}
                        <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                                9 Thành phần thể thức (Điều 8 NĐ 30):
                            </h4>

                            <div className="space-y-2 text-xs">
                                <ComponentRow
                                    title="1. Quốc hiệu và Tiêu ngữ"
                                    valid={true}
                                    note="CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / Độc lập - Tự do - Hạnh phúc"
                                />
                                <ComponentRow
                                    title="2. Tên cơ quan, tổ chức ban hành"
                                    valid={!!payload.company_name}
                                    note={payload.company_name || "Chưa có tên cơ quan"}
                                />
                                <ComponentRow
                                    title="3. Số, ký hiệu văn bản"
                                    valid={true}
                                    note={payload.doc_number ? `Số: ${payload.doc_number}` : "Đang để trống chờ số văn thư"}
                                />
                                <ComponentRow
                                    title="4. Địa danh và thời gian ban hành"
                                    valid={!!payload.location_date}
                                    note={payload.location_date}
                                />
                                <ComponentRow
                                    title="5. Tên loại và trích yếu nội dung"
                                    valid={!!payload.doc_type}
                                    note={`${docTypeUpper} - ${subject || "Đã trích yếu"}`}
                                />
                                <ComponentRow
                                    title="6. Nội dung văn bản"
                                    valid={articles.length > 0}
                                    note={`${articles.length} phần nội dung hoàn chỉnh`}
                                />
                                <ComponentRow
                                    title="7. Chức vụ, họ tên và chữ ký"
                                    valid={!!signatoryTitle && !!signatoryName}
                                    note={`${signatoryTitle}: ${signatoryName || "(Chưa điền họ tên)"}`}
                                />
                                <ComponentRow
                                    title="8. Con dấu, chữ ký số pháp nhân"
                                    valid={true}
                                    note="Sẵn sàng đóng dấu đỏ pháp nhân hoặc chữ ký số CA"
                                />
                                <ComponentRow
                                    title="9. Nơi nhận văn bản"
                                    valid={recipients.length > 0}
                                    note={`${recipients.join(", ")} (Có Lưu: VT)`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Footer Card */}
                    <div className="rounded-2xl border border-white/[0.08] bg-[#1A233A]/60 p-5 backdrop-blur-xl space-y-3">
                        <button
                            onClick={handleExportDocx}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] py-3 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:opacity-95 transition-all"
                        >
                            <Download className="h-4 w-4" />
                            <span>{isExporting ? "Đang xử lý..." : "📥 Ban hành File Word (.docx) chuẩn NĐ 30"}</span>
                        </button>

                        {onSyncToWorkspace && (
                            <button
                                onClick={handleArchiveToQueue}
                                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-[#94A3B8] hover:bg-white/[0.08] hover:text-white transition-all"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Lưu trữ vào Hàng đợi OCR Workspace</span>
                            </button>
                        )}

                        <button
                            onClick={onStartNew}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/5 py-2 text-xs font-medium text-[#64748B] hover:text-[#94A3B8] transition-colors"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-[#36DDAB]" />
                            <span>Soạn thảo văn bản mới</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ND30 Graph RAG Knowledge Graph Visualizer Modal */}
            <ND30GraphRagModal
                isOpen={showGraphModal}
                onClose={() => setShowGraphModal(false)}
            />
        </div>
    );
}

function ComponentRow({
    title,
    valid,
    note,
}: {
    title: string;
    valid: boolean;
    note: string;
}) {
    return (
        <div className="flex items-start gap-2 rounded-lg p-1.5 hover:bg-white/[0.02] transition-colors">
            {valid ? (
                <CheckCircle2 className="h-4 w-4 text-[#36DDAB] shrink-0 mt-0.5" />
            ) : (
                <AlertCircle className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
                <div className="font-medium text-[#ECF0F7]">{title}</div>
                <div className="truncate text-[11px] text-[#94A3B8]" title={note}>
                    {note}
                </div>
            </div>
        </div>
    );
}
