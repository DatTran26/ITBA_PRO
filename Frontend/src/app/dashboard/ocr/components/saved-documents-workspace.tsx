"use client";

import React, { useState, useMemo } from "react";
import {
    FileText,
    Download,
    Eye,
    Trash2,
    Search,
    Calendar,
    Building2,
    UserCheck,
    CheckCircle2,
    Clock,
    Plus,
    Copy,
    Check,
    ArrowLeft,
    Sparkles,
    Filter,
    Layers,
    LayoutGrid,
    List,
    AlertCircle,
    FileSpreadsheet,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { SavedND30Document, DocumentGenerationResult, OCRJob } from "../types";
import {
    useSavedDocuments,
    exportSavedDocumentAsDocx,
} from "../services/saved-documents-store";
import AdvisoryA4ReviewWorkspace from "./advisory-a4-review-workspace";

interface SavedDocumentsWorkspaceProps {
    onStartNewDraft: () => void;
    onSyncToOCRWorkspace?: (job: OCRJob) => void;
}

const DOC_TYPE_BADGE_COLORS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    "GIẤY NGHỈ PHÉP": {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        iconBg: "from-emerald-600 to-teal-500",
    },
    "QUYẾT ĐỊNH": {
        bg: "bg-indigo-500/10",
        text: "text-indigo-400",
        border: "border-indigo-500/30",
        iconBg: "from-indigo-600 to-blue-500",
    },
    "CÔNG VĂN": {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        iconBg: "from-cyan-600 to-sky-500",
    },
    "BẢN TƯỜNG TRÌNH": {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        iconBg: "from-amber-600 to-orange-500",
    },
    "TỜ TRÌNH": {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/30",
        iconBg: "from-purple-600 to-pink-500",
    },
    "BÁO CÁO": {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
        iconBg: "from-blue-600 to-indigo-500",
    },
    "BIÊN BẢN": {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/30",
        iconBg: "from-rose-600 to-red-500",
    },
    "THÔNG BÁO": {
        bg: "bg-teal-500/10",
        text: "text-teal-400",
        border: "border-teal-500/30",
        iconBg: "from-teal-600 to-emerald-500",
    },
};

export default function SavedDocumentsWorkspace({
    onStartNewDraft,
    onSyncToOCRWorkspace,
}: SavedDocumentsWorkspaceProps) {
    const { documents, count, remove, clearAll } = useSavedDocuments();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [selectedDocForReview, setSelectedDocForReview] = useState<SavedND30Document | null>(null);
    const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
    const [exportingDocId, setExportingDocId] = useState<string | null>(null);

    // List of unique doc types present in documents
    const availableTypes = useMemo(() => {
        const types = new Set<string>();
        documents.forEach((d) => {
            if (d.doc_type) types.add(d.doc_type);
        });
        return Array.from(types);
    }, [documents]);

    // Filtered & sorted documents
    const filteredDocuments = useMemo(() => {
        return documents
            .filter((doc) => {
                // Type filter
                if (filterType !== "ALL" && doc.doc_type !== filterType) {
                    return false;
                }

                // Search term
                if (!searchTerm.trim()) return true;
                const term = searchTerm.toLowerCase();
                const subject = (doc.export_payload?.subject || "").toLowerCase();
                const title = (doc.title || "").toLowerCase();
                const fileName = (doc.file_name || "").toLowerCase();
                const company = (doc.company_name || doc.export_payload?.company_name || "").toLowerCase();
                const signatory = (doc.signatory_name || doc.export_payload?.signatory_name || "").toLowerCase();
                const docType = (doc.doc_type || "").toLowerCase();

                return (
                    subject.includes(term) ||
                    title.includes(term) ||
                    fileName.includes(term) ||
                    company.includes(term) ||
                    signatory.includes(term) ||
                    docType.includes(term)
                );
            })
            .sort((a, b) => {
                if (sortBy === "newest") return b.created_at - a.created_at;
                if (sortBy === "oldest") return a.created_at - b.created_at;
                if (sortBy === "name") {
                    return (a.title || a.file_name).localeCompare(b.title || b.file_name);
                }
                return 0;
            });
    }, [documents, filterType, searchTerm, sortBy]);

    // Format timestamp
    const formatTimestamp = (ts: number) => {
        const d = new Date(ts);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        return `${hours}:${mins} - ${day}/${month}/${year}`;
    };

    // Quick download handler
    const handleDownload = async (doc: SavedND30Document, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            setExportingDocId(doc.id);
            toast.loading("Đang xuất tệp Word chuẩn Nghị định 30...", { id: `export-${doc.id}` });
            await exportSavedDocumentAsDocx(doc);
            toast.success(`Đã tải xuống: ${doc.file_name}`, { id: `export-${doc.id}` });
        } catch (err: any) {
            toast.error(`Lỗi tải tệp: ${err.message}`, { id: `export-${doc.id}` });
        } finally {
            setExportingDocId(null);
        }
    };

    // Copy document text
    const handleCopy = (doc: SavedND30Document, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const text =
            doc.preview_markdown ||
            `${doc.doc_type}\n\n${doc.export_payload?.subject || ""}\n${doc.export_payload?.location_date || ""}\n\n${(
                doc.export_payload?.articles || []
            )
                .map((a) => `${a.title}:\n${a.content}`)
                .join("\n\n")}`;

        navigator.clipboard.writeText(text);
        setCopiedDocId(doc.id);
        toast.success("Đã sao chép nội dung văn bản!");
        setTimeout(() => setCopiedDocId(null), 2000);
    };

    // Delete single document
    const handleDelete = (doc: SavedND30Document, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (confirm(`Bạn có chắc chắn muốn xóa văn bản "${doc.title || doc.file_name}" khỏi danh sách lưu trữ?`)) {
            remove(doc.id);
            toast.info("Đã xóa văn bản khỏi danh sách.");
            if (selectedDocForReview?.id === doc.id) {
                setSelectedDocForReview(null);
            }
        }
    };

    // If a document is currently selected for full A4 review, render the review workspace
    if (selectedDocForReview) {
        const generationResult: DocumentGenerationResult = {
            status: "ready",
            doc_type: selectedDocForReview.doc_type,
            validation_ready: true,
            missing_required: [],
            export_payload: selectedDocForReview.export_payload,
            preview_markdown: selectedDocForReview.preview_markdown || "",
        };

        return (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                {/* Back to archive header banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#1A233A]/80 backdrop-blur-md shadow-lg">
                    <button
                        onClick={() => setSelectedDocForReview(null)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-sm font-semibold text-white transition-all"
                    >
                        <ArrowLeft className="h-4 w-4 text-[#36DDAB]" />
                        <span>Quay lại Danh sách các file đã tạo</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#94A3B8]">Đang xem lại:</span>
                        <span className="text-xs font-bold text-[#36DDAB] bg-[#36DDAB]/10 px-2.5 py-1 rounded-md border border-[#36DDAB]/20">
                            {selectedDocForReview.file_name}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleDownload(selectedDocForReview)}
                            disabled={exportingDocId === selectedDocForReview.id}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Tải Word (.docx)</span>
                        </button>
                    </div>
                </div>

                {/* Render the full Decree 30 A4 Review & Validation Workspace */}
                <AdvisoryA4ReviewWorkspace
                    result={generationResult}
                    onBackToForm={() => setSelectedDocForReview(null)}
                    onStartNew={onStartNewDraft}
                    onSyncToWorkspace={onSyncToOCRWorkspace}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Top KPI & Summary Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-white/[0.08] bg-[#1A233A]/60 backdrop-blur-xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#36DDAB]">
                            <Layers className="h-3.5 w-3.5" />
                            Kho Lưu Trữ Văn Bản Nghị Định 30
                        </span>
                        <span className="rounded-full bg-[#36DDAB]/20 border border-[#36DDAB]/30 px-2 py-0.5 text-[10px] font-extrabold text-[#36DDAB]">
                            {count} tệp đã tạo
                        </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                        Danh sách các file văn bản đã tạo
                    </h2>
                    <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                        Xem lại thể thức mô phỏng A4, kiểm tra tính pháp lý và tải xuống bản Word (.docx) bất cứ lúc nào
                    </p>
                </div>

                {/* Quick actions on header */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={onStartNewDraft}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#5B6CF0]/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Soạn văn bản mới với AI</span>
                    </button>

                    {count > 0 && (
                        <button
                            onClick={() => {
                                if (confirm("Bạn có chắc muốn xóa toàn bộ lịch sử các file đã tạo? Hành động này không thể hoàn tác.")) {
                                    clearAll();
                                    toast.info("Đã dọn sạch kho lưu trữ.");
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-rose-500/10 hover:border-rose-500/30 text-xs font-semibold text-[#94A3B8] hover:text-rose-300 transition-all"
                            title="Xóa tất cả các file đã lưu"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Dọn sạch</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#111827]/60 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#94A3B8]">Tổng tài liệu</span>
                        <FileText className="h-4 w-4 text-[#5B6CF0]" />
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">{count}</div>
                    <span className="text-[10px] text-[#36DDAB] font-medium">Sẵn sàng xem & tải</span>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#111827]/60 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#94A3B8]">Đã xuất Word DOCX</span>
                        <Download className="h-4 w-4 text-[#36DDAB]" />
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                        {documents.filter((d) => d.status === "exported").length}
                    </div>
                    <span className="text-[10px] text-[#94A3B8]">Chuẩn font & căn lề NĐ 30</span>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#111827]/60 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#94A3B8]">Số loại văn bản</span>
                        <Filter className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">{availableTypes.length}</div>
                    <span className="text-[10px] text-[#94A3B8]">Đa dạng biểu mẫu</span>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#111827]/60 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#94A3B8]">Chuẩn thể thức NĐ 30</span>
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
                    <span className="text-[10px] text-emerald-500/80 font-medium">Đã thẩm định 8 tiêu chuẩn</span>
                </div>
            </div>

            {/* Filter, Search & View Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.08] bg-[#111827]/80 backdrop-blur-md">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên file, trích yếu, người ký, cơ quan..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1A233A]/80 border border-white/[0.08] text-xs sm:text-sm text-white placeholder-[#64748B] focus:border-[#5B6CF0] outline-none transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Filter and View toggles */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Doc Type Selector */}
                    <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                        <Filter className="h-3.5 w-3.5" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-[#1A233A] border border-white/[0.08] text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#5B6CF0] cursor-pointer"
                        >
                            <option value="ALL">Tất cả loại ({documents.length})</option>
                            {availableTypes.map((t) => (
                                <option key={t} value={t}>
                                    {t} ({documents.filter((d) => d.doc_type === t).length})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Selector */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-[#1A233A] border border-white/[0.08] text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#5B6CF0] cursor-pointer"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="name">Tên A-Z</option>
                    </select>

                    {/* View Switcher */}
                    <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#1A233A] p-0.5">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md transition-all ${
                                viewMode === "grid"
                                    ? "bg-[#5B6CF0] text-white"
                                    : "text-[#94A3B8] hover:text-white"
                            }`}
                            title="Chế độ thẻ trực quan"
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded-md transition-all ${
                                viewMode === "table"
                                    ? "bg-[#5B6CF0] text-white"
                                    : "text-[#94A3B8] hover:text-white"
                            }`}
                            title="Chế độ bảng chi tiết"
                        >
                            <List className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredDocuments.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 sm:p-16 rounded-2xl border border-dashed border-white/[0.12] bg-[#111827]/40 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-[#94A3B8] mb-4">
                        <FileText className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-bold text-white">
                        {searchTerm || filterType !== "ALL"
                            ? "Không tìm thấy văn bản phù hợp"
                            : "Chưa có văn bản nào trong kho lưu trữ"}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mt-1 mb-5">
                        {searchTerm || filterType !== "ALL"
                            ? "Hãy thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc để xem toàn bộ danh sách."
                            : "Bạn có thể bắt đầu tạo văn bản mới chuẩn Nghị định 30 thông qua Trợ lý AI hoặc quét số hóa OCR."}
                    </p>
                    <button
                        onClick={onStartNewDraft}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#5B6CF0]/25 hover:opacity-90 transition-all"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>Bắt đầu tạo văn bản ngay</span>
                    </button>
                </div>
            )}

            {/* ── View Mode 1: Interactive Cards Grid ── */}
            {filteredDocuments.length > 0 && viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredDocuments.map((doc) => {
                        const style =
                            DOC_TYPE_BADGE_COLORS[doc.doc_type] || {
                                bg: "bg-blue-500/10",
                                text: "text-blue-400",
                                border: "border-blue-500/30",
                                iconBg: "from-blue-600 to-indigo-500",
                            };

                        const payload = doc.export_payload || ({} as any);
                        const organ = doc.company_name || payload.company_name || "Cơ quan ban hành";
                        const dept = doc.department || payload.department || "";
                        const subject = payload.subject || doc.title || "Văn bản hành chính chuẩn Nghị định 30";
                        const signatory = doc.signatory_name || payload.signatory_name || "Thủ trưởng cơ quan";
                        const sigTitle = payload.signatory_title || "Người ký";

                        return (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDocForReview(doc)}
                                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#1A233A]/60 backdrop-blur-xl p-5 hover:border-[#5B6CF0]/50 hover:bg-[#1A233A]/80 transition-all shadow-lg hover:shadow-[#5B6CF0]/10 cursor-pointer"
                            >
                                <div>
                                    {/* Card Top: Badges & Date */}
                                    <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-3.5 mb-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${style.iconBg} text-white shadow-md`}
                                            >
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <span
                                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                                                >
                                                    {doc.doc_type}
                                                </span>
                                                <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatTimestamp(doc.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#36DDAB] bg-[#36DDAB]/10 px-2 py-0.5 rounded-full border border-[#36DDAB]/25">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {doc.status === "exported" ? "Đã xuất DOCX" : "Chuẩn NĐ 30"}
                                        </span>
                                    </div>

                                    {/* File name & Subject */}
                                    <h4 className="text-sm font-bold text-white group-hover:text-[#7C8FFF] transition-colors line-clamp-2">
                                        {subject}
                                    </h4>
                                    <p className="text-xs font-mono text-[#36DDAB]/80 mt-1 truncate">
                                        📄 {doc.file_name}
                                    </p>

                                    {/* Metadata snippets */}
                                    <div className="mt-3.5 space-y-1.5 text-xs text-[#94A3B8] border-t border-white/[0.04] pt-3">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <Building2 className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
                                            <span className="truncate">
                                                {organ} {dept ? `(${dept})` : ""}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 truncate">
                                            <UserCheck className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
                                            <span className="truncate">
                                                {sigTitle}: <strong className="text-white font-medium">{signatory}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Bottom Actions */}
                                <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setSelectedDocForReview(doc)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5B6CF0]/20 hover:bg-[#5B6CF0]/30 text-xs font-bold text-[#7C8FFF] border border-[#5B6CF0]/40 transition-all"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>Xem lại A4</span>
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={(e) => handleCopy(doc, e)}
                                            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#94A3B8] hover:text-white transition-all"
                                            title="Sao chép nội dung"
                                        >
                                            {copiedDocId === doc.id ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </button>

                                        <button
                                            onClick={(e) => handleDownload(doc, e)}
                                            disabled={exportingDocId === doc.id}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-bold text-emerald-400 border border-emerald-500/40 transition-all"
                                            title="Tải tệp Word (.docx)"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            <span>Word</span>
                                        </button>

                                        <button
                                            onClick={(e) => handleDelete(doc, e)}
                                            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 text-[#64748B] hover:text-rose-400 transition-all"
                                            title="Xóa văn bản"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── View Mode 2: Detailed Table View ── */}
            {filteredDocuments.length > 0 && viewMode === "table" && (
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1A233A]/60 backdrop-blur-xl shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="border-b border-white/[0.08] bg-[#111827]/60 text-[11px] uppercase tracking-wider text-[#94A3B8]">
                                <tr>
                                    <th className="px-4 py-3.5 font-bold">Văn bản / Trích yếu</th>
                                    <th className="px-4 py-3.5 font-bold">Loại biểu mẫu</th>
                                    <th className="px-4 py-3.5 font-bold">Cơ quan & Người ký</th>
                                    <th className="px-4 py-3.5 font-bold">Thời gian tạo</th>
                                    <th className="px-4 py-3.5 font-bold">Trạng thái</th>
                                    <th className="px-4 py-3.5 font-bold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filteredDocuments.map((doc) => {
                                    const style =
                                        DOC_TYPE_BADGE_COLORS[doc.doc_type] || {
                                            bg: "bg-blue-500/10",
                                            text: "text-blue-400",
                                            border: "border-blue-500/30",
                                        };

                                    const payload = doc.export_payload || ({} as any);

                                    return (
                                        <tr
                                            key={doc.id}
                                            onClick={() => setSelectedDocForReview(doc)}
                                            className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-white group-hover:text-[#7C8FFF] transition-colors line-clamp-1">
                                                    {payload.subject || doc.title}
                                                </div>
                                                <div className="text-[11px] font-mono text-[#36DDAB]/80 mt-0.5">
                                                    📄 {doc.file_name}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                                                >
                                                    {doc.doc_type}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="text-white truncate max-w-[200px]">
                                                    {doc.company_name || payload.company_name}
                                                </div>
                                                <div className="text-[11px] text-[#94A3B8] truncate">
                                                    {payload.signatory_title || "Người ký"}: {doc.signatory_name || payload.signatory_name}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[#94A3B8]">
                                                {formatTimestamp(doc.created_at)}
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#36DDAB] bg-[#36DDAB]/10 px-2 py-0.5 rounded-full border border-[#36DDAB]/20">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Đã thẩm định A4
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedDocForReview(doc)}
                                                        className="px-2.5 py-1 rounded-md bg-[#5B6CF0]/20 hover:bg-[#5B6CF0]/30 text-xs font-bold text-[#7C8FFF] border border-[#5B6CF0]/30 transition-all"
                                                        title="Xem lại thể thức khổ A4"
                                                    >
                                                        Xem A4
                                                    </button>

                                                    <button
                                                        onClick={(e) => handleDownload(doc, e)}
                                                        className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-bold text-emerald-400 border border-emerald-500/30 transition-all"
                                                        title="Tải file Word (.docx)"
                                                    >
                                                        Tải DOCX
                                                    </button>

                                                    <button
                                                        onClick={(e) => handleDelete(doc, e)}
                                                        className="p-1 rounded-md hover:bg-rose-500/20 text-[#64748B] hover:text-rose-400 transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
