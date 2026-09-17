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
    CheckCircle,
    CheckCircle2,
    Stamp,
    ShieldCheck,
    FileCheck,
    AlertTriangle,
    XCircle,
    X,
    Building2,
    Calendar,
    Hash,
    UserCheck,
    Send,
    Network,
    Globe,
    Bot,
} from "lucide-react";
import { toast } from "sonner";
import type { OCRJob } from "../types";
import ND30GraphRagModal from "./nd30-graph-rag-modal";
import DeepRAGSearchModal from "./deep-rag-search-modal";
import AIDraftingCopilot from "./ai-drafting-copilot";

interface ReviewWorkspaceProps {
    job: OCRJob | null;
    onTextChange: (id: string, text: string) => void;
    onConfirm: (id: string) => void;
    onReopen: (id: string) => void;
    onSelectBlock?: (blockId: string | null) => void;
    onOpenGraphRag?: () => void;
}

interface ND30DocumentData {
    organ_name_upper?: string;
    organ_name: string;
    doc_code: string;
    location: string;
    date_str: string;
    doc_type: string;
    subject: string;
    legal_bases: string[];
    articles: { title: string; content: string }[];
    signer_title: string;
    signer_name: string;
    recipients: string[];
}

interface ND30ValidationResult {
    score: number;
    is_valid: boolean;
    seal_status: {
        has_seal: boolean;
        seal_type: string;
        overlap_status: string;
        is_compliant: boolean;
        note: string;
    };
    components: {
        quoc_hieu: { valid: boolean; note: string };
        co_quan: { valid: boolean; note: string };
        so_hieu: { valid: boolean; note: string };
        dia_danh_ngay_thang: { valid: boolean; note: string };
        trich_yeu: { valid: boolean; note: string };
        noi_dung: { valid: boolean; note: string };
        nguoi_ky: { valid: boolean; note: string };
        con_dau: { valid: boolean; note: string };
        noi_nhan: { valid: boolean; note: string };
    };
    issues: {
        component: string;
        severity: "error" | "warning" | "info";
        message: string;
        recommendation: string;
        citation: string;
    }[];
}

const DEFAULT_ND30_DOC: ND30DocumentData = {
    organ_name_upper: "TẬP ĐOÀN CÔNG NGHỆ DOWN-TOWN",
    organ_name: "PHÒNG NHÂN SỰ & HÀNH CHÍNH",
    doc_code: "12/QĐ-HR",
    location: "Hà Nội",
    date_str: "ngày 15 tháng 09 năm 2026",
    doc_type: "QUYẾT ĐỊNH",
    subject: "Về việc tiếp nhận và bổ nhiệm nhân sự chính thức",
    legal_bases: [
        "Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20 tháng 11 năm 2019;",
        "Căn cứ Điều lệ tổ chức và hoạt động của Công ty;",
        "Xét đề nghị của Trưởng phòng Nhân sự.",
    ],
    articles: [
        {
            title: "Điều 1.",
            content: "Tiếp nhận và bổ nhiệm nhân sự hoàn thành thời gian thử việc theo quy định.",
        },
        {
            title: "Điều 2.",
            content: "Mức lương, phụ cấp và các chế độ đãi ngộ thực hiện theo Thỏa ước lao động tập thể.",
        },
        {
            title: "Điều 3.",
            content: "Phòng Nhân sự, Phòng Kế toán và các cá nhân có tên chịu trách nhiệm thi hành Quyết định này.",
        },
    ],
    signer_title: "GIÁM ĐỐC ĐIỀU HÀNH",
    signer_name: "Nguyễn Văn An",
    recipients: [
        "Như Điều 3;",
        "Ban Tổng Giám đốc (để b/c);",
        "Lưu: VT, HR (02b).",
    ],
};

export default function ReviewWorkspace({
    job,
    onTextChange,
    onConfirm,
    onReopen,
    onSelectBlock,
    onOpenGraphRag,
}: ReviewWorkspaceProps) {
    const [viewMode, setViewMode] = useState<"edit" | "preview" | "diff">("edit");
    const [copied, setCopied] = useState(false);

    // Decree 30 Studio states
    const [showND30Modal, setShowND30Modal] = useState(false);
    const [showInternalGraphRagModal, setShowInternalGraphRagModal] = useState(false);
    const [showDeepRagModal, setShowDeepRagModal] = useState(false);
    const [showCopilot, setShowCopilot] = useState(true);
    const [nd30Tab, setNd30Tab] = useState<"draft" | "audit" | "preview">("draft");
    const [nd30Data, setNd30Data] = useState<ND30DocumentData>(DEFAULT_ND30_DOC);
    const [isDrafting, setIsDrafting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [validationResult, setValidationResult] = useState<ND30ValidationResult | null>(null);

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

    // Helper: Đồng bộ thông minh từ Text (Editor / Copilot) sang cấu trúc ND 30
    const parseTextToND30 = (text: string, prevDoc: ND30DocumentData): ND30DocumentData => {
        if (!text.trim()) return prevDoc;
        const textLower = text.toLowerCase();

        // 1. Loại văn bản
        let docType = prevDoc.doc_type || "QUYẾT ĐỊNH";
        if (textLower.includes("quyết định") || textLower.includes("quyet dinh")) docType = "QUYẾT ĐỊNH";
        else if (textLower.includes("thông báo")) docType = "THÔNG BÁO";
        else if (textLower.includes("tờ trình")) docType = "TỜ TRÌNH";
        else if (textLower.includes("công văn")) docType = "CÔNG VĂN";
        else if (textLower.includes("biên bản")) docType = "BIÊN BẢN";

        // 2. Cơ quan ban hành
        let organName = prevDoc.organ_name;
        let organNameUpper = prevDoc.organ_name_upper;
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        for (const line of lines.slice(0, 8)) {
            const upper = line.toUpperCase();
            if (upper.includes("CÔNG TY") || upper.includes("TẬP ĐOÀN") || upper.includes("HỘI ĐỒNG") || upper.includes("ỦY BAN") || upper.includes("TỔNG CÔNG TY")) {
                organNameUpper = line.toUpperCase();
                organName = line;
                break;
            }
        }

        // 3. Số hiệu văn bản
        const soMatch = text.match(/(?:số|s[oố]):?\s*([0-9]+(?:\/[A-Z0-9\-]+)?)/i);
        const docCode = soMatch ? (soMatch[1].includes("/") ? soMatch[1] : `${soMatch[1]}/QĐ-HĐQT`) : prevDoc.doc_code;

        // 4. Trích yếu
        const subjectMatch = text.match(/(?:về việc|ve viec):?\s*([^\n\.]+)/i);
        const subject = subjectMatch ? `Về việc ${subjectMatch[1].trim()}` : prevDoc.subject;

        // 5. Căn cứ pháp lý
        const basesMatches = text.match(/(?:căn cứ|can cu|xét|xet)[^\n;\.]+/gi);
        const legalBases = basesMatches && basesMatches.length > 0
            ? basesMatches.map(b => b.trim().replace(/^[\-\~=\s]+/, ""))
            : prevDoc.legal_bases;

        // 6. Các Điều khoản
        const articles: { title: string; content: string }[] = [];
        const artMatches = Array.from(text.matchAll(/(Điều\s+\d+[\.:]?\s*)([^\n]+(?:\n(?!(?:Điều\s+\d+|Nơi nhận|NƠI NHẬN|Chủ tịch|Tổng Giám đốc)).+)*)/gi));
        if (artMatches.length > 0) {
            artMatches.forEach(m => {
                articles.push({
                    title: m[1].trim().replace(/[\.:]$/, ""),
                    content: m[2].trim()
                });
            });
        }

        // 7. Người ký & Thẩm quyền
        let signerTitle = prevDoc.signer_title;
        if (textLower.includes("chủ tịch hội đồng quản trị") || textLower.includes("hội đồng quản trị")) {
            signerTitle = "CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ";
        } else if (textLower.includes("tổng giám đốc")) {
            signerTitle = "TỔNG GIÁM ĐỐC";
        } else if (textLower.includes("giám đốc")) {
            signerTitle = "GIÁM ĐỐC";
        }

        // Tìm họ tên người được bổ nhiệm hoặc người ký
        let signerName = prevDoc.signer_name;
        const nameMatch = text.match(/(?:ông|bổ nhiệm ông|ông\/bà):?\s*([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)+)/i);
        if (nameMatch) {
            // Tên người có mặt trong quyết định
            const extractedPerson = nameMatch[1].trim();
            if (extractedPerson.length > 3 && !extractedPerson.toLowerCase().includes("chủ tịch")) {
                // Giữ tên người ký ở cuối hoặc bổ nhiệm
                signerName = extractedPerson;
            }
        }

        // 8. Nơi nhận
        let recipients = prevDoc.recipients;
        const noiNhanIdx = text.toLowerCase().indexOf("nơi nhận");
        if (noiNhanIdx !== -1) {
            const noiNhanBlock = text.slice(noiNhanIdx);
            const rMatches = Array.from(noiNhanBlock.matchAll(/[\-\•]\s*([^\n;]+)/g));
            if (rMatches.length > 0) {
                recipients = rMatches.map(r => r[1].trim());
            }
        }

        return {
            organ_name_upper: organNameUpper,
            organ_name: organName,
            doc_code: docCode,
            location: prevDoc.location || "Hà Nội",
            date_str: prevDoc.date_str || "ngày 15 tháng 09 năm 2026",
            doc_type: docType,
            subject: subject,
            legal_bases: legalBases,
            articles: articles.length > 0 ? articles : prevDoc.articles,
            signer_title: signerTitle,
            signer_name: signerName,
            recipients: recipients,
        };
    };

    // Helper: Tạo lại văn bản Text từ dữ liệu có cấu trúc ND30
    const buildTextFromND30 = (doc: ND30DocumentData): string => {
        let str = `${doc.organ_name_upper || doc.organ_name}\n`;
        str += `Số: ${doc.doc_code}\n\n`;
        str += `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n`;
        str += `${doc.location ? `${doc.location}, ` : ""}${doc.date_str}\n\n`;
        str += `${doc.doc_type}\n`;
        str += `${doc.subject}\n\n`;

        if (doc.legal_bases?.length) {
            doc.legal_bases.forEach(b => {
                str += `- ${b}\n`;
            });
            str += "\n";
        }

        if (doc.articles?.length) {
            doc.articles.forEach(art => {
                str += `${art.title}: ${art.content}\n\n`;
            });
        }

        str += `Nơi nhận:\n`;
        if (doc.recipients?.length) {
            doc.recipients.forEach(r => {
                str += `- ${r}\n`;
            });
        }
        str += `\n${doc.signer_title}\n(Ký, ghi rõ họ tên và đóng dấu)\n\n${doc.signer_name}`;
        return str;
    };

    // Open ND30 Studio with automatic synchronization from current text
    const handleOpenND30Modal = () => {
        // Tự động đồng bộ nội dung đang sửa ở Workspace vào hồ sơ ND 30
        const syncedDoc = parseTextToND30(currentText, nd30Data);
        setNd30Data(syncedDoc);
        setShowND30Modal(true);
        handleValidateND30(syncedDoc);
        toast.info("Đã đồng bộ nội dung văn bản từ Workspace sang Hồ sơ Nghị định 30!");
    };

    // AI Auto-Drafting from OCR Text
    const handleAutoDraftND30 = async () => {
        if (!currentText) {
            toast.error("Vui lòng có nội dung OCR trước khi tạo tự động.");
            return;
        }

        setIsDrafting(true);
        try {
            const res = await fetch("/api/ocr/nd30/auto-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ocr_text: currentText,
                    document_type: nd30Data.doc_type || "QUYẾT ĐỊNH",
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Lỗi tạo tự động");
            }

            const drafted = await res.json();
            const formattedDraft: ND30DocumentData = {
                organ_name_upper: drafted.organ_name_upper || DEFAULT_ND30_DOC.organ_name_upper,
                organ_name: drafted.organ_name || DEFAULT_ND30_DOC.organ_name,
                doc_code: drafted.doc_code || DEFAULT_ND30_DOC.doc_code,
                location: drafted.location || DEFAULT_ND30_DOC.location,
                date_str: drafted.date_str || DEFAULT_ND30_DOC.date_str,
                doc_type: drafted.doc_type || DEFAULT_ND30_DOC.doc_type,
                subject: drafted.subject || DEFAULT_ND30_DOC.subject,
                legal_bases: Array.isArray(drafted.legal_bases) && drafted.legal_bases.length > 0
                    ? drafted.legal_bases
                    : DEFAULT_ND30_DOC.legal_bases,
                articles: Array.isArray(drafted.articles) && drafted.articles.length > 0
                    ? drafted.articles
                    : DEFAULT_ND30_DOC.articles,
                signer_title: drafted.signer_title || DEFAULT_ND30_DOC.signer_title,
                signer_name: drafted.signer_name || DEFAULT_ND30_DOC.signer_name,
                recipients: Array.isArray(drafted.recipients) && drafted.recipients.length > 0
                    ? drafted.recipients
                    : DEFAULT_ND30_DOC.recipients,
            };

            setNd30Data(formattedDraft);
            toast.success("AI đã bóc tách và soạn thảo chuẩn NĐ 30 thành công!");
            // Auto trigger validation
            handleValidateND30(formattedDraft);
        } catch (error: any) {
            console.error("Auto draft error:", error);
            toast.error(error.message || "Không thể soạn thảo tự động.");
        } finally {
            setIsDrafting(false);
        }
    };

    // Validation & Seal Audit
    const handleValidateND30 = async (targetDoc: ND30DocumentData = nd30Data) => {
        setIsValidating(true);
        try {
            const res = await fetch("/api/ocr/nd30/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(targetDoc),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Lỗi kiểm định");
            }

            const result: ND30ValidationResult = await res.json();
            setValidationResult(result);
        } catch (error: any) {
            console.error("Validate error:", error);
            toast.error("Không thể kiểm định văn bản.");
        } finally {
            setIsValidating(false);
        }
    };

    // Official Promulgation / DOCX Export
    const handleExportND30Docx = async () => {
        setIsExporting(true);
        try {
            const res = await fetch("/api/ocr/export-nd30", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nd30Data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Lỗi xuất văn bản DOCX");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const slug = (nd30Data.doc_type || "van-ban").toLowerCase().replace(/\s+/g, "-");
            a.href = url;
            a.download = `ND30-${slug}-${nd30Data.doc_code.replace(/[\/\\]/g, "_")}.docx`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Đã ban hành và tải văn bản Word (.docx) chuẩn Nghị định 30!");
        } catch (error: any) {
            console.error("Export DOCX error:", error);
            toast.error(error.message || "Không thể xuất file Word.");
        } finally {
            setIsExporting(false);
        }
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
                        <span>Xem trước</span>
                    </button>
                    <button
                        onClick={() => setViewMode("diff")}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                            viewMode === "diff"
                                ? "bg-[#5B6CF0] text-white shadow"
                                : "text-[#94A3B8] hover:text-[#ECF0F7]"
                        }`}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Đối chiếu</span>
                    </button>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2">
                    {/* Decree 30 Studio Button */}
                    <button
                        onClick={handleOpenND30Modal}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D97706]/20 to-[#F59E0B]/30 border border-[#F59E0B]/50 px-3 py-1 text-xs font-semibold text-[#FBBF24] hover:bg-[#F59E0B]/40 hover:text-white transition-all shadow-sm"
                        title="Tạo file tự động, thẩm định con dấu & ban hành chuẩn Nghị định 30/2020/NĐ-CP"
                    >
                        <Stamp className="h-3.5 w-3.5 text-[#F59E0B]" />
                        <span>Văn bản NĐ 30</span>
                        <span className="ml-0.5 rounded-full bg-[#F59E0B]/20 px-1 py-0.2 text-[9px] font-bold text-[#FCD34D]">AI</span>
                    </button>

                    {/* Graph RAG Knowledge Graph Button */}
                    <button
                        onClick={() => onOpenGraphRag ? onOpenGraphRag() : setShowInternalGraphRagModal(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/30 border border-[#8B5CF6]/50 px-3 py-1 text-xs font-semibold text-[#C4B5FD] hover:bg-[#8B5CF6]/40 hover:text-white transition-all shadow-sm"
                        title="Xem Đồ thị tri thức Graph RAG Nghị định 30/2020/NĐ-CP (DemoT3)"
                    >
                        <Network className="h-3.5 w-3.5 text-[#A5B4FC]" />
                        <span>Graph RAG</span>
                        <span className="ml-0.5 rounded-full bg-[#8B5CF6]/30 px-1 py-0.2 text-[9px] font-bold text-[#DDD6FE]">DemoT3</span>
                    </button>

                    {/* AI Deep RAG + Web Search Grounding Button */}
                    <button
                        onClick={() => setShowDeepRagModal(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 border border-pink-500/50 px-3 py-1 text-xs font-bold text-white hover:opacity-90 transition-all shadow-md shadow-purple-500/20"
                        title="AI Deep RAG + Tìm kiếm Web: Tự động hiểu văn bản là gì, đối chiếu RAG NĐ 30 xem thiếu gì, tìm kiếm căn cứ mới nhất trên mạng và tổng hợp bản hoàn thiện 100%"
                    >
                        <Globe className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
                        <span>Deep RAG & Web</span>
                        <span className="ml-0.5 rounded-full bg-pink-500/40 px-1 py-0.2 text-[9px] font-black text-pink-200">AI PRO</span>
                    </button>

                    {/* AI Drafting Copilot Toggle Button */}
                    <button
                        onClick={() => setShowCopilot(!showCopilot)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold transition-all shadow-sm ${
                            showCopilot
                                ? "bg-gradient-to-r from-indigo-600 to-pink-600 text-white border-pink-400 shadow-indigo-500/25"
                                : "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                        }`}
                        title="Bật/Tắt Trợ lý AI Soạn thảo & Hiệu chỉnh thông minh"
                    >
                        <Bot className="h-3.5 w-3.5" />
                        <span>AI Soạn Thảo</span>
                        <span className="ml-0.5 rounded-full bg-white/20 px-1 py-0.2 text-[9px] font-black">
                            {showCopilot ? "ON" : "OFF"}
                        </span>
                    </button>

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
                        <div className="absolute right-0 top-full mt-1 hidden w-36 flex-col rounded-xl border border-white/10 bg-[#1A233A] p-1 shadow-2xl z-30 group-hover:flex">
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
                            <button
                                onClick={handleOpenND30Modal}
                                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#FBBF24] hover:bg-[#F59E0B]/20 text-left transition-colors border-t border-white/[0.06] mt-1 pt-1.5"
                            >
                                <Stamp className="h-3 w-3" />
                                Word NĐ 30 (.docx)
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
                {/* Visual Grounding Block Highlights */}
                {job.blocks && job.blocks.length > 0 && (
                    <div className="mb-3 rounded-xl border border-white/[0.08] bg-[#121A2E]/90 p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-[#94A3B8]">
                                Vùng văn bản phát hiện ({job.blocks.length}) • Click để soi vị trí trên ảnh
                            </span>
                            {job.activeBlockId && (
                                <button
                                    onClick={() => onSelectBlock?.(null)}
                                    className="text-[10px] text-[#7C8FFF] hover:underline"
                                >
                                    Bỏ chọn vùng
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {job.blocks.map((b) => {
                                const isSelected = job.activeBlockId === b.id;
                                return (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => onSelectBlock?.(isSelected ? null : b.id)}
                                        className={`rounded-lg px-2 py-1 text-[11px] transition-all max-w-[220px] truncate border ${
                                            isSelected
                                                ? "bg-[#5B6CF0] text-white border-[#7C8FFF] shadow-md"
                                                : "bg-white/[0.04] text-[#94A3B8] border-white/[0.06] hover:bg-white/[0.08] hover:text-[#ECF0F7]"
                                        }`}
                                        title={b.text}
                                    >
                                        {b.text.slice(0, 28) || "(khối văn bản)"}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewMode === "edit" && (
                    <div className="h-full flex flex-col">
                        {showCopilot && (
                            <AIDraftingCopilot
                                currentText={currentText}
                                onApplyText={(newText) => {
                                    onTextChange(job.id, newText);
                                    // Tự động đồng bộ sang bộ dữ liệu NĐ 30
                                    const synced = parseTextToND30(newText, nd30Data);
                                    setNd30Data(synced);
                                    toast.success("Đã đồng bộ sang bộ hồ sơ Nghị định 30!");
                                }}
                                isOpen={showCopilot}
                                onClose={() => setShowCopilot(false)}
                            />
                        )}
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

            {/* ========================================================================= */}
            {/* DECREE 30 STUDIO MODAL: Auto-Drafting, Audit & Seal Verification, Export */}
            {/* ========================================================================= */}
            {showND30Modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="flex flex-col h-[92vh] w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#1E293B]/70">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                                    <Stamp className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-white tracking-wide">
                                            Trung tâm Thẩm định & Ban hành Nghị định 30/2020/NĐ-CP
                                        </h3>
                                        <span className="rounded bg-[#5B6CF0]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7C8FFF] border border-[#5B6CF0]/30">
                                            Chuẩn Pháp Quy
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#94A3B8]">
                                        Tự động hóa bóc tách cấu trúc 9 thành phần thể thức, thẩm định con dấu và phát hành văn bản hành chính.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInternalGraphRagModal(true)}
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/30 border border-[#8B5CF6]/40 px-3 py-1.5 text-xs font-semibold text-[#C4B5FD] hover:bg-[#8B5CF6]/40 hover:text-white transition-colors"
                                >
                                    <Network className="h-3.5 w-3.5 text-[#A5B4FC]" />
                                    <span>Tra cứu Đồ thị Graph RAG</span>
                                </button>
                                <button
                                    onClick={() => setShowND30Modal(false)}
                                    className="rounded-lg p-2 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Tabs Navigation & Header Actions */}
                        <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-6 py-2.5 bg-[#141E33]">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setNd30Tab("draft")}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                                        nd30Tab === "draft"
                                            ? "bg-[#5B6CF0] text-white shadow-lg shadow-[#5B6CF0]/20"
                                            : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <Edit3 className="h-4 w-4" />
                                    <span>1. Soạn thảo & Bóc tách AI</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setNd30Tab("audit");
                                        handleValidateND30();
                                    }}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                                        nd30Tab === "audit"
                                            ? "bg-[#5B6CF0] text-white shadow-lg shadow-[#5B6CF0]/20"
                                            : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>2. Kiểm định Thể thức & Con dấu</span>
                                    {validationResult && (
                                        <span
                                            className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                                validationResult.score >= 85
                                                    ? "bg-[#10B981]/20 text-[#34D399]"
                                                    : validationResult.score >= 60
                                                    ? "bg-[#F59E0B]/20 text-[#FBBF24]"
                                                    : "bg-[#EF4444]/20 text-[#F87171]"
                                            }`}
                                        >
                                            {validationResult.score}/100
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setNd30Tab("preview")}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                                        nd30Tab === "preview"
                                            ? "bg-[#5B6CF0] text-white shadow-lg shadow-[#5B6CF0]/20"
                                            : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <FileCheck className="h-4 w-4" />
                                    <span>3. Xem trước Văn bản & Ban hành</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleAutoDraftND30}
                                    disabled={isDrafting}
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    <Sparkles className={`h-3.5 w-3.5 ${isDrafting ? "animate-spin" : ""}`} />
                                    <span>{isDrafting ? "AI đang bóc tách..." : "⚡ AI Tự động bóc tách từ OCR"}</span>
                                </button>
                                <button
                                    onClick={handleExportND30Docx}
                                    disabled={isExporting}
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    <Download className={`h-3.5 w-3.5 ${isExporting ? "animate-bounce" : ""}`} />
                                    <span>{isExporting ? "Đang xuất..." : "📥 Ban hành File Word (.docx)"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-[#0B1120]">
                            {/* TAB 1: DRAFTING / EDITING */}
                            {nd30Tab === "draft" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="rounded-xl border border-white/10 bg-[#151F33] p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                                                <Building2 className="h-4 w-4 text-[#5B6CF0]" />
                                                <span>Cơ quan ban hành</span>
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-[#64748B] block mb-1">Cơ quan cấp trên (In hoa đứng)</label>
                                                <input
                                                    type="text"
                                                    value={nd30Data.organ_name_upper || ""}
                                                    onChange={(e) => setNd30Data({ ...nd30Data, organ_name_upper: e.target.value })}
                                                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-1.5 text-xs text-white uppercase focus:border-[#5B6CF0] focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-[#64748B] block mb-1">Cơ quan ban hành trực tiếp (In hoa đậm)</label>
                                                <input
                                                    type="text"
                                                    value={nd30Data.organ_name}
                                                    onChange={(e) => setNd30Data({ ...nd30Data, organ_name: e.target.value })}
                                                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-1.5 text-xs text-white uppercase font-bold focus:border-[#5B6CF0] focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-[#151F33] p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                                                <Hash className="h-4 w-4 text-[#5B6CF0]" />
                                                <span>Số hiệu & Địa danh</span>
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-[#64748B] block mb-1">Số, ký hiệu văn bản (Ví dụ: 12/QĐ-HR)</label>
                                                <input
                                                    type="text"
                                                    value={nd30Data.doc_code}
                                                    onChange={(e) => setNd30Data({ ...nd30Data, doc_code: e.target.value })}
                                                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-1.5 text-xs text-white focus:border-[#5B6CF0] focus:outline-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[11px] text-[#64748B] block mb-1">Địa danh</label>
                                                    <input
                                                        type="text"
                                                        value={nd30Data.location}
                                                        onChange={(e) => setNd30Data({ ...nd30Data, location: e.target.value })}
                                                        className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-1.5 text-xs text-white focus:border-[#5B6CF0] focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] text-[#64748B] block mb-1">Ngày tháng ban hành</label>
                                                    <input
                                                        type="text"
                                                        value={nd30Data.date_str}
                                                        onChange={(e) => setNd30Data({ ...nd30Data, date_str: e.target.value })}
                                                        className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-1.5 text-xs text-white focus:border-[#5B6CF0] focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-[#151F33] p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                                                <UserCheck className="h-4 w-4 text-[#5B6CF0]" />
                                                <span>Người ký & Thẩm quyền</span>
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-[#64748B] block mb-1">Chức vụ người ký (In hoa đậm)</label>
                                                <input
                                                    type="text"
                                                    value={nd30Data.signer_title}
                                                    onChange={(e) => setNd30Data({ ...nd30Data, signer_title: e.target.value })}
                                                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-1.5 text-xs text-white uppercase font-bold focus:border-[#5B6CF0] focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-[#64748B] block mb-1">Họ và tên người ký (Đậm, in hoa/thường)</label>
                                                <input
                                                    type="text"
                                                    value={nd30Data.signer_name}
                                                    onChange={(e) => setNd30Data({ ...nd30Data, signer_name: e.target.value })}
                                                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-1.5 text-xs text-white font-bold focus:border-[#5B6CF0] focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Type & Subject */}
                                    <div className="rounded-xl border border-white/10 bg-[#151F33] p-4 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="text-[11px] text-[#64748B] block mb-1 font-semibold">Tên loại văn bản</label>
                                                <select
                                                    value={nd30Data.doc_type}
                                                    onChange={(e) => setNd30Data({ ...nd30Data, doc_type: e.target.value })}
                                                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2 text-xs text-white font-bold focus:border-[#5B6CF0] focus:outline-none"
                                                >
                                                    <option value="QUYẾT ĐỊNH">QUYẾT ĐỊNH</option>
                                                    <option value="THÔNG BÁO">THÔNG BÁO</option>
                                                    <option value="TỜ TRÌNH">TỜ TRÌNH</option>
                                                    <option value="BIÊN BẢN">BIÊN BẢN</option>
                                                    <option value="CÔNG VĂN">CÔNG VĂN</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-[11px] text-[#64748B] block mb-1 font-semibold">Trích yếu nội dung</label>
                                                <input
                                                    type="text"
                                                    value={nd30Data.subject}
                                                    onChange={(e) => setNd30Data({ ...nd30Data, subject: e.target.value })}
                                                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2 text-xs text-white font-medium focus:border-[#5B6CF0] focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legal bases & Articles */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-white/10 bg-[#151F33] p-4 space-y-2">
                                            <label className="text-xs font-semibold text-[#94A3B8] block">
                                                Căn cứ pháp lý (Mỗi dòng một căn cứ)
                                            </label>
                                            <textarea
                                                value={nd30Data.legal_bases.join("\n")}
                                                onChange={(e) =>
                                                    setNd30Data({
                                                        ...nd30Data,
                                                        legal_bases: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                                                    })
                                                }
                                                rows={5}
                                                className="w-full rounded-lg border border-white/10 bg-[#0F172A] p-3 font-mono text-xs text-white leading-relaxed focus:border-[#5B6CF0] focus:outline-none"
                                            />
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-[#151F33] p-4 space-y-2">
                                            <label className="text-xs font-semibold text-[#94A3B8] block">
                                                Nơi nhận (Mỗi dòng một nơi nhận)
                                            </label>
                                            <textarea
                                                value={nd30Data.recipients.join("\n")}
                                                onChange={(e) =>
                                                    setNd30Data({
                                                        ...nd30Data,
                                                        recipients: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                                                    })
                                                }
                                                rows={5}
                                                className="w-full rounded-lg border border-white/10 bg-[#0F172A] p-3 font-mono text-xs text-white leading-relaxed focus:border-[#5B6CF0] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Articles Section */}
                                    <div className="rounded-xl border border-white/10 bg-[#151F33] p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-[#94A3B8]">
                                                Các Điều khoản nội dung chính
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const nextNum = nd30Data.articles.length + 1;
                                                    setNd30Data({
                                                        ...nd30Data,
                                                        articles: [
                                                            ...nd30Data.articles,
                                                            { title: `Điều ${nextNum}.`, content: "" },
                                                        ],
                                                    });
                                                }}
                                                className="rounded-lg bg-[#5B6CF0]/20 px-2.5 py-1 text-xs text-[#7C8FFF] hover:bg-[#5B6CF0]/30 transition-colors"
                                            >
                                                + Thêm Điều khoản
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {nd30Data.articles.map((art, idx) => (
                                                <div key={idx} className="flex gap-2 items-start">
                                                    <input
                                                        type="text"
                                                        value={art.title}
                                                        onChange={(e) => {
                                                            const newArts = [...nd30Data.articles];
                                                            newArts[idx].title = e.target.value;
                                                            setNd30Data({ ...nd30Data, articles: newArts });
                                                        }}
                                                        className="w-24 rounded-lg border border-white/10 bg-[#0F172A] px-2.5 py-2 text-xs font-bold text-white focus:border-[#5B6CF0] focus:outline-none"
                                                    />
                                                    <textarea
                                                        value={art.content}
                                                        onChange={(e) => {
                                                            const newArts = [...nd30Data.articles];
                                                            newArts[idx].content = e.target.value;
                                                            setNd30Data({ ...nd30Data, articles: newArts });
                                                        }}
                                                        rows={2}
                                                        placeholder="Nội dung điều khoản..."
                                                        className="flex-1 rounded-lg border border-white/10 bg-[#0F172A] p-2 text-xs text-white leading-relaxed focus:border-[#5B6CF0] focus:outline-none"
                                                    />
                                                    {nd30Data.articles.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newArts = nd30Data.articles.filter((_, i) => i !== idx);
                                                                setNd30Data({ ...nd30Data, articles: newArts });
                                                            }}
                                                            className="rounded-lg p-2 text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: AUDIT & SEAL VERIFICATION */}
                            {nd30Tab === "audit" && (
                                <div className="space-y-6">
                                    {isValidating ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5B6CF0] border-t-transparent mb-4" />
                                            <h4 className="text-sm font-semibold text-white">Đang thẩm định 9 thành phần và con dấu...</h4>
                                            <p className="text-xs text-[#94A3B8] mt-1">Đối chiếu theo quy định tại Nghị định 30/2020/NĐ-CP</p>
                                        </div>
                                    ) : validationResult ? (
                                        <>
                                            {/* Score & Seal Status Summary Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Score Card */}
                                                <div className="rounded-2xl border border-white/10 bg-[#151F33] p-5 flex flex-col items-center justify-center text-center">
                                                    <span className="text-xs font-semibold text-[#94A3B8]">ĐIỂM HỢP QUY THỂ THỨC</span>
                                                    <div className="my-2 flex items-baseline gap-1">
                                                        <span
                                                            className={`text-4xl font-extrabold ${
                                                                validationResult.score >= 85
                                                                    ? "text-[#34D399]"
                                                                    : validationResult.score >= 60
                                                                    ? "text-[#FBBF24]"
                                                                    : "text-[#F87171]"
                                                            }`}
                                                        >
                                                            {validationResult.score}
                                                        </span>
                                                        <span className="text-sm text-[#64748B]">/100</span>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            validationResult.is_valid
                                                                ? "bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30"
                                                                : "bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30"
                                                        }`}
                                                    >
                                                        {validationResult.is_valid
                                                            ? "ĐẠT CHUẨN BAN HÀNH"
                                                            : "CẦN BỔ SUNG / HIỆU CHỈNH"}
                                                    </span>
                                                </div>

                                                {/* Seal Audit Card */}
                                                <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#151F33] p-5">
                                                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Stamp className="h-5 w-5 text-[#EF4444]" />
                                                            <h4 className="text-sm font-bold text-white">
                                                                Thẩm định Con dấu & Chữ ký số (Điều 12, 13 NĐ 30)
                                                            </h4>
                                                        </div>
                                                        <span
                                                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                validationResult?.seal_status?.is_compliant
                                                                    ? "bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30"
                                                                    : "bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30"
                                                            }`}
                                                        >
                                                            {validationResult?.seal_status?.is_compliant ? "Con dấu chuẩn" : "Con dấu cần lưu ý"}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div className="rounded-xl bg-[#0F172A] p-3 border border-white/5">
                                                            <span className="text-[#64748B] block mb-1">Loại con dấu / hình thức:</span>
                                                            <span className="font-semibold text-white">
                                                                {validationResult?.seal_status?.seal_type || "Dấu tròn pháp nhân cơ quan"}
                                                            </span>
                                                        </div>
                                                        <div className="rounded-xl bg-[#0F172A] p-3 border border-white/5">
                                                            <span className="text-[#64748B] block mb-1">Vị trí đóng dấu & trùm chữ ký:</span>
                                                            <span className="font-semibold text-[#38BDF8]">
                                                                {validationResult?.seal_status?.overlap_status || "Trùm 1/3 chữ ký về phía bên trái"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className="mt-3 text-xs text-[#94A3B8] italic">
                                                        💡 Ghi chú: {validationResult?.seal_status?.note || "Đóng dấu trùm lên khoảng 1/3 chữ ký về phía bên trái theo Khoản 2 Điều 33 Nghị định 30/2020/NĐ-CP."}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 9 Mandatory Components Checklist */}
                                            <div className="rounded-2xl border border-white/10 bg-[#151F33] p-5">
                                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                    <FileCheck className="h-4 w-4 text-[#5B6CF0]" />
                                                    <span>Danh mục 9 thành phần thể thức bắt buộc theo Nghị định 30</span>
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {Object.entries(
                                                        validationResult?.components || {
                                                            quoc_hieu: { valid: true, note: "Quốc hiệu và Tiêu ngữ đầy đủ chuẩn xác." },
                                                            co_quan: { valid: Boolean(nd30Data.organ_name), note: nd30Data.organ_name || "Chưa có tên cơ quan" },
                                                            so_hieu: { valid: Boolean(nd30Data.doc_code), note: nd30Data.doc_code || "Chưa có số ký hiệu" },
                                                            dia_danh_ngay_thang: { valid: Boolean(nd30Data.date_str), note: nd30Data.date_str || "Chưa có ngày tháng" },
                                                            trich_yeu: { valid: Boolean(nd30Data.subject), note: nd30Data.subject || "Chưa có trích yếu" },
                                                            noi_dung: { valid: Boolean(nd30Data.articles?.length), note: `${nd30Data.articles?.length || 0} điều khoản` },
                                                            nguoi_ky: { valid: Boolean(nd30Data.signer_name), note: nd30Data.signer_name || "Chưa có người ký" },
                                                            con_dau: { valid: true, note: "Con dấu pháp nhân cơ quan" },
                                                            noi_nhan: { valid: Boolean(nd30Data.recipients?.length), note: `${nd30Data.recipients?.length || 0} nơi nhận` },
                                                        }
                                                    ).map(([key, comp]: [string, any]) => {
                                                        const labelMap: Record<string, string> = {
                                                            quoc_hieu: "1. Quốc hiệu & Tiêu ngữ",
                                                            co_quan: "2. Tên cơ quan ban hành",
                                                            so_hieu: "3. Số, ký hiệu văn bản",
                                                            dia_danh_ngay_thang: "4. Địa danh, ngày tháng",
                                                            trich_yeu: "5. Tên loại & Trích yếu",
                                                            noi_dung: "6. Nội dung (căn cứ, điều)",
                                                            nguoi_ky: "7. Chức vụ & Họ tên người ký",
                                                            con_dau: "8. Con dấu / Chữ ký số",
                                                            noi_nhan: "9. Nơi nhận văn bản",
                                                        };

                                                        return (
                                                            <div
                                                                key={key}
                                                                className={`rounded-xl border p-3 flex flex-col justify-between ${
                                                                    comp?.valid
                                                                        ? "border-[#10B981]/20 bg-[#10B981]/5"
                                                                        : "border-[#EF4444]/20 bg-[#EF4444]/5"
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-xs font-semibold text-white">
                                                                        {labelMap[key] || key}
                                                                    </span>
                                                                    {comp?.valid ? (
                                                                        <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                                                                    ) : (
                                                                        <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-[#94A3B8]">
                                                                    {comp?.note || "Đang kiểm định"}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Issues & Recommendations */}
                                            {validationResult.issues.length > 0 && (
                                                <div className="rounded-2xl border border-white/10 bg-[#151F33] p-5 space-y-3">
                                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                                                        <span>Các khuyến nghị hiệu chỉnh thể thức ({validationResult.issues.length})</span>
                                                    </h4>

                                                    <div className="space-y-2">
                                                        {validationResult.issues.map((issue, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="rounded-xl border border-white/5 bg-[#0F172A] p-3 text-xs flex items-start gap-3"
                                                            >
                                                                {issue.severity === "error" ? (
                                                                    <XCircle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                                                                )}
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-white">{issue.message}</span>
                                                                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[#64748B]">
                                                                            {issue.citation}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[#94A3B8]">{issue.recommendation}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-12 text-[#94A3B8] text-sm">
                                            Bấm nút &quot;Kiểm định Thể thức&quot; để đối chiếu văn bản.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: VISUAL PRINT PREVIEW & PROMULGATION */}
                            {nd30Tab === "preview" && (
                                <div className="flex justify-center">
                                    {/* A4 Paper Simulation conforming to ND30 */}
                                    <div className="w-full max-w-3xl rounded-lg bg-white p-12 text-black shadow-2xl font-serif text-[14px] leading-normal select-text min-h-[900px] border border-gray-300">
                                        {/* Header Table (2 Columns) */}
                                        <div className="grid grid-cols-2 gap-4 pb-6">
                                            {/* Left Column: Cơ quan ban hành & Số hiệu */}
                                            <div className="text-center space-y-1">
                                                {nd30Data.organ_name_upper && (
                                                    <p className="text-[12px] uppercase font-normal tracking-wide text-gray-800">
                                                        {nd30Data.organ_name_upper}
                                                    </p>
                                                )}
                                                <p className="text-[13px] uppercase font-bold text-black border-b border-black inline-block pb-0.5 px-2">
                                                    {nd30Data.organ_name}
                                                </p>
                                                <p className="text-[13px] italic pt-1 text-gray-800">
                                                    Số: {nd30Data.doc_code}
                                                </p>
                                            </div>

                                            {/* Right Column: Quốc hiệu & Tiêu ngữ + Địa danh ngày tháng */}
                                            <div className="text-center space-y-1">
                                                <p className="text-[12px] uppercase font-bold tracking-wider text-black">
                                                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                                </p>
                                                <p className="text-[13px] font-bold text-black border-b border-black inline-block pb-0.5 px-3">
                                                    Độc lập - Tự do - Hạnh phúc
                                                </p>
                                                <p className="text-[13px] italic pt-1 text-gray-800">
                                                    {nd30Data.location}, {nd30Data.date_str}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Document Title & Subject */}
                                        <div className="text-center my-6 space-y-2">
                                            <h2 className="text-[16px] font-bold uppercase tracking-wide text-black">
                                                {nd30Data.doc_type}
                                            </h2>
                                            <p className="text-[14px] font-bold text-gray-900 max-w-xl mx-auto">
                                                {nd30Data.subject}
                                            </p>
                                        </div>

                                        {/* Legal Bases */}
                                        <div className="my-6 space-y-1 text-justify italic text-[13.5px]">
                                            {nd30Data.legal_bases.map((base, i) => (
                                                <p key={i} className="leading-relaxed">
                                                    {base}
                                                </p>
                                            ))}
                                        </div>

                                        {/* Decision Header */}
                                        <div className="text-center font-bold my-4 uppercase text-[14px]">
                                            QUYẾT ĐỊNH:
                                        </div>

                                        {/* Articles */}
                                        <div className="space-y-3 my-6 text-justify text-[14px]">
                                            {nd30Data.articles.map((art, i) => (
                                                <p key={i} className="leading-relaxed indent-8">
                                                    <strong className="font-bold">{art.title} </strong>
                                                    {art.content}
                                                </p>
                                            ))}
                                        </div>

                                        {/* Footer Table: Nơi nhận (Trái) & Chữ ký + Con dấu (Phải) */}
                                        <div className="grid grid-cols-2 gap-4 mt-12 pt-4">
                                            {/* Recipients */}
                                            <div className="text-[11.5px] space-y-1">
                                                <p className="font-bold italic">Nơi nhận:</p>
                                                <ul className="list-none space-y-0.5 pl-2 text-gray-800">
                                                    {nd30Data.recipients.map((rec, i) => (
                                                        <li key={i}>- {rec}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Signer & Seal Simulation */}
                                            <div className="text-center space-y-1 relative">
                                                <p className="text-[13px] uppercase font-bold tracking-wide text-black">
                                                    {nd30Data.signer_title}
                                                </p>
                                                <p className="text-[12px] italic text-gray-500 pb-12">
                                                    (Ký, ghi rõ họ tên và đóng dấu)
                                                </p>

                                                {/* Visual Red Seal Representation */}
                                                <div className="absolute top-6 left-6 flex items-center justify-center h-20 w-20 rounded-full border-2 border-[#DC2626]/70 text-[#DC2626] font-bold text-[9px] uppercase tracking-tighter rotate-[-12deg] pointer-events-none opacity-80">
                                                    <div className="text-center leading-tight">
                                                        <span>★ ĐÃ ĐÓNG DẤU ★</span>
                                                        <br />
                                                        <span>{nd30Data.organ_name.slice(0, 16)}</span>
                                                    </div>
                                                </div>

                                                <p className="text-[14px] font-bold text-black pt-4">
                                                    {nd30Data.signer_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 bg-[#1E293B]/70">
                            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                                <Stamp className="h-4 w-4 text-[#F59E0B]" />
                                <span>Tiêu chuẩn ban hành: Nghị định 30/2020/NĐ-CP • Khổ A4 (210 × 297 mm) • Times New Roman</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        const syncedText = buildTextFromND30(nd30Data);
                                        onTextChange(job.id, syncedText);
                                        setShowND30Modal(false);
                                        toast.success("Đã đồng bộ dữ liệu NĐ 30 ra Trình Soạn Thảo Workspace!");
                                    }}
                                    className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                                    title="Đồng bộ các chỉnh sửa trong modal này ra trình soạn thảo văn bản"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Đồng bộ ra Workspace</span>
                                </button>
                                <button
                                    onClick={() => setShowND30Modal(false)}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleExportND30Docx}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] px-5 py-2 text-xs font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>Ban hành văn bản DOCX</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ND30 Graph RAG Knowledge Graph Visualizer Modal */}
            <ND30GraphRagModal
                isOpen={showInternalGraphRagModal}
                onClose={() => setShowInternalGraphRagModal(false)}
            />

            {/* AI Deep RAG + Web Search Grounding Modal */}
            {showDeepRagModal && (
                <DeepRAGSearchModal
                    isOpen={showDeepRagModal}
                    onClose={() => setShowDeepRagModal(false)}
                    ocrText={currentText}
                    onApplyToWorkspace={(newText) => {
                        onTextChange(job.id, newText);
                    }}
                    onApplyToND30Studio={(perfectedDoc) => {
                        if (perfectedDoc) {
                            setNd30Data({
                                organ_name_upper: perfectedDoc.company_name || DEFAULT_ND30_DOC.organ_name_upper,
                                organ_name: perfectedDoc.department || DEFAULT_ND30_DOC.organ_name,
                                doc_code: perfectedDoc.doc_number || DEFAULT_ND30_DOC.doc_code,
                                location: perfectedDoc.location_date?.split(",")[0]?.trim() || DEFAULT_ND30_DOC.location,
                                date_str: perfectedDoc.location_date || DEFAULT_ND30_DOC.date_str,
                                doc_type: perfectedDoc.doc_type || DEFAULT_ND30_DOC.doc_type,
                                subject: perfectedDoc.subject || DEFAULT_ND30_DOC.subject,
                                legal_bases: perfectedDoc.bases || DEFAULT_ND30_DOC.legal_bases,
                                articles: perfectedDoc.articles || DEFAULT_ND30_DOC.articles,
                                signer_title: perfectedDoc.signatory_title || DEFAULT_ND30_DOC.signer_title,
                                signer_name: perfectedDoc.signatory_name || DEFAULT_ND30_DOC.signer_name,
                                recipients: perfectedDoc.recipients || DEFAULT_ND30_DOC.recipients,
                            });
                        }
                    }}
                />
            )}
        </div>
    );
}
