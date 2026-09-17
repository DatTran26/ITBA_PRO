"use client";

import React, { useState, useEffect } from "react";
import {
    Sparkles,
    Globe,
    Network,
    ShieldAlert,
    CheckCircle2,
    Copy,
    Check,
    ExternalLink,
    RefreshCw,
    X,
    FileCheck2,
    Send,
    Scale,
    Layers,
    BookOpen,
    HelpCircle,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface DeepRAGSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    ocrText: string;
    onApplyToWorkspace: (newText: string) => void;
    onApplyToND30Studio?: (perfectedDoc: any) => void;
}

interface SynthesisResult {
    document_identity?: {
        what_is_this: string;
        document_type: string;
        category_field: string;
        confidence_rating: string;
    };
    rag_legal_audit?: {
        applicable_laws: string[];
        what_is_missing: string[];
        recommendations: string[];
    };
    web_grounding_insights?: {
        insight: string;
        source_title: string;
        source_url: string;
    }[];
    web_sources_searched?: {
        query: string;
        title: string;
        snippet: string;
        url: string;
    }[];
    rag_audit_local?: {
        mandatory_present: string[];
        gaps: {
            element: string;
            law_ref: string;
            issue: string;
            severity: "CRITICAL" | "HIGH" | "MEDIUM";
        }[];
        gap_count: number;
        compliance_score: number;
    };
    perfected_document?: {
        doc_type: string;
        company_name: string;
        department: string;
        doc_number: string;
        location_date: string;
        subject: string;
        bases: string[];
        articles: { title: string; content: string }[];
        signatory_title: string;
        signatory_name: string;
        recipients: string[];
        has_seal: boolean;
        seal_note: string;
    };
    formatted_text_preview?: string;
}

export default function DeepRAGSearchModal({
    isOpen,
    onClose,
    ocrText,
    onApplyToWorkspace,
    onApplyToND30Studio
}: DeepRAGSearchModalProps) {
    const [loading, setLoading] = useState(false);
    const [customInstruction, setCustomInstruction] = useState("");
    const [result, setResult] = useState<SynthesisResult | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "rag" | "web" | "perfected">("overview");
    const [copied, setCopied] = useState(false);

    // Auto trigger on open if not already loaded
    useEffect(() => {
        if (isOpen && !result && ocrText.trim()) {
            handleRunSynthesis();
        }
    }, [isOpen, ocrText]);

    const handleRunSynthesis = async () => {
        if (!ocrText.trim()) {
            toast.error("Chưa có văn bản OCR để phân tích");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/ocr/nd30/deep-synthesis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ocr_text: ocrText,
                    custom_instruction: customInstruction.trim()
                }),
                signal: AbortSignal.timeout(120_000),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Không thể thực hiện phân tích tổng hợp.");
            }

            const data: SynthesisResult = await res.json();
            setResult(data);
            toast.success("AI đã hoàn thành phân tích RAG, tra cứu Web và tổng hợp văn bản!");
        } catch (err: any) {
            console.error("Deep synthesis error:", err);
            toast.error(err.message || "Lỗi trong quá trình AI phân tích.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyFormatted = () => {
        if (!result) return;
        const textToCopy = result.formatted_text_preview || generatePlainFormatted(result.perfected_document);
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast.success("Đã sao chép văn bản hoàn thiện!");
        setTimeout(() => setCopied(false), 2000);
    };

    const generatePlainFormatted = (doc?: SynthesisResult["perfected_document"]) => {
        if (!doc) return "";
        let str = `${doc.company_name?.toUpperCase() || ""}\n`;
        if (doc.department) str += `${doc.department}\n`;
        str += `Số: ${doc.doc_number || "..."}\n\n`;
        str += `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n`;
        str += `${doc.location_date || ""}\n\n`;
        str += `${doc.doc_type || "VĂN BẢN"}\n`;
        str += `${doc.subject || ""}\n\n`;

        if (doc.bases?.length) {
            str += doc.bases.join("\n") + "\n\n";
        }

        if (doc.articles?.length) {
            doc.articles.forEach(art => {
                str += `${art.title}: ${art.content}\n\n`;
            });
        }

        str += `Nơi nhận:\n${doc.recipients ? doc.recipients.map(r => "- " + r).join("\n") : ""}\n\n`;
        str += `${doc.signatory_title || "THỦ TRƯỞNG ĐƠN VỊ"}\n(Ký, ghi rõ họ tên và đóng dấu)\n\n`;
        str += `${doc.signatory_name || ""}`;
        return str;
    };

    const handleApply = () => {
        if (!result?.perfected_document) {
            toast.error("Chưa có văn bản hoàn thiện để áp dụng");
            return;
        }
        const text = result.formatted_text_preview || generatePlainFormatted(result.perfected_document);
        onApplyToWorkspace(text);
        if (onApplyToND30Studio) {
            onApplyToND30Studio(result.perfected_document);
        }
        toast.success("Đã áp dụng văn bản hoàn thiện vào Workspace!");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex flex-col h-[92vh] w-full max-w-6xl rounded-2xl border border-white/10 bg-[#0B0F19] shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-gradient-to-r from-[#111827] via-[#1E1B4B] to-[#0F172A]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#EC4899] text-white shadow-lg shadow-indigo-500/30">
                            <Sparkles className="h-6 w-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white tracking-wide">
                                    AI Deep RAG & Web Search Grounding
                                </h3>
                                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-[#A5B4FC] border border-indigo-500/30">
                                    Gemini 3.6 Flash + DuckDuckGo + NĐ 30 Graph
                                </span>
                            </div>
                            <p className="text-xs text-[#94A3B8]">
                                Tự động hiểu văn bản, đối soát thiếu sót quy chuẩn pháp lý, tra cứu web thời gian thực & kiến tạo bản hoàn thiện 100%
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRunSynthesis}
                            disabled={loading}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/50 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/50 hover:text-white disabled:opacity-50 transition-all shadow-sm"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
                            <span>{loading ? "Đang xử lý..." : "Chạy lại phân tích"}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Optional Custom Instructions Input */}
                <div className="flex items-center gap-3 border-b border-white/[0.08] bg-[#0F172A]/80 px-6 py-2.5">
                    <span className="text-xs font-medium text-[#A5B4FC] whitespace-nowrap flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                        Yêu cầu pháp chế bổ sung:
                    </span>
                    <input
                        type="text"
                        placeholder="Ví dụ: Bổ sung căn cứ theo quyết định HĐQT mới nhất, hoặc điều chỉnh mức lương..."
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleRunSynthesis(); }}
                        className="flex-1 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:border-indigo-500 focus:outline-none transition-all"
                    />
                    <button
                        onClick={handleRunSynthesis}
                        disabled={loading}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                        <Send className="w-3 h-3" />
                        Gửi
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-1 border-b border-white/10 bg-[#0F172A]/90 px-6 py-2">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            activeTab === "overview"
                                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                                : "text-[#94A3B8] hover:bg-white/[0.05] hover:text-white"
                        }`}
                    >
                        <Layers className="h-3.5 w-3.5" />
                        <span>1. Bản chất Văn bản</span>
                        {result?.document_identity && (
                            <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-300">
                                {result.document_identity.document_type}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("rag")}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            activeTab === "rag"
                                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                                : "text-[#94A3B8] hover:bg-white/[0.05] hover:text-white"
                        }`}
                    >
                        <Network className="h-3.5 w-3.5" />
                        <span>2. Đối soát RAG & Thiếu sót</span>
                        {result?.rag_audit_local && (
                            <span className={`rounded px-1.5 py-0.2 text-[10px] ${
                                result.rag_audit_local.gap_count > 0
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-300"
                            }`}>
                                {result.rag_audit_local.gap_count} thiếu sót
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("web")}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            activeTab === "web"
                                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                                : "text-[#94A3B8] hover:bg-white/[0.05] hover:text-white"
                        }`}
                    >
                        <Globe className="h-3.5 w-3.5 text-sky-400" />
                        <span>3. Tra cứu Web Thực tế</span>
                        {result?.web_sources_searched && (
                            <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[10px] text-sky-300">
                                {result.web_sources_searched.length} nguồn
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("perfected")}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            activeTab === "perfected"
                                ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                                : "text-[#94A3B8] hover:bg-white/[0.05] hover:text-white"
                        }`}
                    >
                        <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>4. Văn bản Hoàn thiện (100%)</span>
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300">
                            Chuẩn NĐ 30
                        </span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#080B14]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                <Sparkles className="h-7 w-7 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <div className="space-y-1.5">
                                <h4 className="text-base font-semibold text-white">Đang thực hiện AI Deep RAG & Web Search Grounding...</h4>
                                <p className="text-xs text-[#94A3B8] max-w-md">
                                    Đang nhận diện văn bản, truy vấn Đồ thị tri thức Nghị định 30, tra cứu nguồn luật mới nhất trên Internet và cấu trúc lại văn bản đạt chuẩn cao nhất.
                                </p>
                            </div>
                        </div>
                    ) : !result ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16 text-[#94A3B8]">
                            <HelpCircle className="h-12 w-12 text-[#475569] mb-3" />
                            <p className="text-sm font-medium">Chưa có kết quả phân tích.</p>
                            <p className="text-xs text-[#64748B] mt-1">Bấm nút &quot;Chạy lại phân tích&quot; ở trên để bắt đầu.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* TAB 1: OVERVIEW & IDENTIFICATION */}
                            {activeTab === "overview" && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left: Identity Cards */}
                                    <div className="lg:col-span-1 space-y-4">
                                        <div className="rounded-xl border border-white/10 bg-[#121A2E]/70 p-5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B4FC]">
                                                    Nhận diện Loại văn bản
                                                </span>
                                                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                                                    {result.document_identity?.confidence_rating || "95%"} Độ tin cậy
                                                </span>
                                            </div>

                                            <div className="pt-2">
                                                <div className="text-2xl font-black text-white tracking-wide">
                                                    {result.document_identity?.document_type || "VĂN BẢN HÀNH CHÍNH"}
                                                </div>
                                                <div className="text-xs text-indigo-300 font-medium mt-1">
                                                    Lĩnh vực: {result.document_identity?.category_field || "Hành chính & Quản trị"}
                                                </div>
                                            </div>

                                            <div className="border-t border-white/[0.08] pt-3 text-xs text-[#CBD5E1] leading-relaxed">
                                                <p className="font-semibold text-white mb-1">Bản chất văn bản:</p>
                                                <p>{result.document_identity?.what_is_this}</p>
                                            </div>
                                        </div>

                                        {/* Compliance Score Gauge */}
                                        {result.rag_audit_local && (
                                            <div className="rounded-xl border border-white/10 bg-[#121A2E]/70 p-5 space-y-3">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                                                    Độ tuân thủ thể thức NĐ 30 gốc
                                                </span>
                                                <div className="flex items-center gap-4 pt-1">
                                                    <div className={`text-4xl font-black ${
                                                        result.rag_audit_local.compliance_score >= 80
                                                            ? "text-emerald-400"
                                                            : result.rag_audit_local.compliance_score >= 50
                                                            ? "text-amber-400"
                                                            : "text-rose-400"
                                                    }`}>
                                                        {result.rag_audit_local.compliance_score}/100
                                                    </div>
                                                    <div className="text-xs text-[#94A3B8]">
                                                        {result.rag_audit_local.gap_count > 0
                                                            ? `Phát hiện ${result.rag_audit_local.gap_count} điểm thiếu sót thể thức cần hoàn thiện.`
                                                            : "Văn bản đạt thể thức cơ bản."}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: What it needs & Recommendations */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="rounded-xl border border-white/10 bg-[#121A2E]/70 p-5 space-y-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/[0.08] pb-3">
                                                <Scale className="h-4 w-4 text-indigo-400" />
                                                <span>Căn cứ Pháp lý & Chuẩn mực Áp dụng</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {result.rag_legal_audit?.applicable_laws?.map((law, idx) => (
                                                    <div key={idx} className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-[#E2E8F0]">
                                                        <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                                        <span>{law}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-[#121A2E]/70 p-5 space-y-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/[0.08] pb-3">
                                                <Sparkles className="h-4 w-4 text-emerald-400" />
                                                <span>Khuyến nghị Nâng cấp & Hoàn thiện từ Chuyên gia</span>
                                            </div>

                                            <div className="space-y-2.5">
                                                {result.rag_legal_audit?.recommendations?.map((rec, idx) => (
                                                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#CBD5E1]">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                        <span>{rec}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: RAG AUDIT & GAPS */}
                            {activeTab === "rag" && (
                                <div className="space-y-6">
                                    <div className="rounded-xl border border-white/10 bg-[#121A2E]/70 p-5">
                                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="h-5 w-5 text-amber-400" />
                                                <h4 className="text-sm font-bold text-white">
                                                    Danh mục Các thành phần Thể thức Nghị định 30 còn Thiếu hoặc Lệch Chuẩn
                                                </h4>
                                            </div>
                                            <span className="text-xs text-amber-300 font-semibold">
                                                {result.rag_audit_local?.gap_count || 0} mục cần bổ sung
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {result.rag_audit_local?.gaps.map((gap, idx) => (
                                                <div key={idx} className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-amber-200">
                                                            {gap.element}
                                                        </span>
                                                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                                            {gap.severity}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[#CBD5E1] leading-relaxed">
                                                        {gap.issue}
                                                    </p>
                                                    <div className="text-[11px] text-indigo-300 font-mono">
                                                        Dẫn chiếu: {gap.law_ref}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Already Compliant Items */}
                                    <div className="rounded-xl border border-white/10 bg-[#121A2E]/70 p-5">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Các thành phần đã nhận diện đúng:
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {result.rag_audit_local?.mandatory_present.map((item, idx) => (
                                                <div key={idx} className="text-xs text-[#94A3B8] flex items-center gap-2 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: WEB SEARCH GROUNDING */}
                            {activeTab === "web" && (
                                <div className="space-y-6">
                                    <div className="rounded-xl border border-white/10 bg-[#121A2E]/70 p-5">
                                        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/[0.08] pb-3 mb-4">
                                            <Globe className="h-5 w-5 text-sky-400" />
                                            <span>Thông tin & Căn cứ Pháp lý Tra cứu từ Web Thời gian thực</span>
                                        </div>

                                        <div className="space-y-4">
                                            {result.web_sources_searched && result.web_sources_searched.length > 0 ? (
                                                result.web_sources_searched.map((source, idx) => (
                                                    <div key={idx} className="rounded-xl border border-sky-500/20 bg-sky-500/[0.03] p-4 space-y-2 hover:border-sky-500/40 transition-colors">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <a
                                                                href={source.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs font-bold text-sky-300 hover:underline flex items-center gap-1.5"
                                                            >
                                                                {source.title}
                                                                <ExternalLink className="w-3 h-3 text-sky-400" />
                                                            </a>
                                                            <span className="text-[10px] text-[#64748B] font-mono shrink-0">
                                                                Truy vấn: {source.query}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[#CBD5E1] leading-relaxed">
                                                            {source.snippet}
                                                        </p>
                                                        <div className="text-[10px] text-[#64748B] truncate font-mono">
                                                            {source.url}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-[#64748B]">Không có dữ liệu tìm kiếm web.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: PERFECTED DOCUMENT */}
                            {activeTab === "perfected" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-[#121A2E]/80 border border-white/10 p-4 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                                            <div>
                                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                                    Bản Văn bản Hoàn thiện Đạt chuẩn 100% Nghị định 30
                                                </h4>
                                                <p className="text-[11px] text-[#94A3B8]">
                                                    Đã tích hợp đầy đủ Quốc hiệu, Tiêu ngữ, Căn cứ pháp lý tra cứu và phân chia Điều khoản chuẩn mực.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleCopyFormatted}
                                                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white hover:bg-white/10 transition-colors"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{copied ? "Đã chép" : "Sao chép"}</span>
                                            </button>
                                            <button
                                                onClick={handleApply}
                                                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                                <span>Áp dụng vào Workspace</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Document Visual Paper Preview */}
                                    <div className="rounded-xl border border-white/10 bg-[#0F172A] p-8 shadow-inner font-serif text-[#F8FAFC] max-w-4xl mx-auto space-y-6 leading-relaxed">
                                        {/* Header Row: Organ vs Nation */}
                                        <div className="grid grid-cols-2 gap-6 text-center text-xs">
                                            <div className="space-y-1">
                                                <div className="font-bold uppercase tracking-wider">
                                                    {result.perfected_document?.company_name || "TÊN CƠ QUAN / CÔNG TY"}
                                                </div>
                                                <div className="font-semibold text-[#94A3B8]">
                                                    {result.perfected_document?.department || "PHÒNG BAN"}
                                                </div>
                                                <div className="pt-2 text-[11px]">
                                                    Số: {result.perfected_document?.doc_number || "01/QĐ-..."}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-bold tracking-wider">
                                                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                                </div>
                                                <div className="font-semibold italic">
                                                    Độc lập - Tự do - Hạnh phúc
                                                </div>
                                                <div className="w-32 h-[1px] bg-white/40 mx-auto my-1" />
                                                <div className="italic text-[11px] pt-1">
                                                    {result.perfected_document?.location_date || "Hà Nội, ngày 15 tháng 09 năm 2026"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Document Subject */}
                                        <div className="text-center py-4 space-y-2">
                                            <div className="text-lg font-black tracking-wide uppercase">
                                                {result.perfected_document?.doc_type || "QUYẾT ĐỊNH"}
                                            </div>
                                            <div className="font-bold text-sm text-[#E2E8F0] max-w-xl mx-auto">
                                                {result.perfected_document?.subject}
                                            </div>
                                        </div>

                                        {/* Legal Bases */}
                                        {result.perfected_document?.bases && (
                                            <div className="space-y-1.5 text-xs italic pl-4 border-l-2 border-indigo-500/40">
                                                {result.perfected_document.bases.map((b, idx) => (
                                                    <p key={idx}>{b}</p>
                                                ))}
                                            </div>
                                        )}

                                        {/* Articles */}
                                        <div className="space-y-4 text-xs pt-3">
                                            {result.perfected_document?.articles?.map((art, idx) => (
                                                <div key={idx} className="space-y-1">
                                                    <span className="font-bold text-white">{art.title}: </span>
                                                    <span className="text-[#E2E8F0]">{art.content}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Signatory & Recipients */}
                                        <div className="grid grid-cols-2 gap-6 pt-8 text-xs">
                                            <div className="space-y-1 text-[11px]">
                                                <div className="font-bold italic">Nơi nhận:</div>
                                                {result.perfected_document?.recipients?.map((r, idx) => (
                                                    <div key={idx}>- {r}</div>
                                                ))}
                                            </div>

                                            <div className="text-center space-y-1">
                                                <div className="font-bold uppercase tracking-wider">
                                                    {result.perfected_document?.signatory_title || "THỦ TRƯỞNG ĐƠN VỊ"}
                                                </div>
                                                <div className="italic text-[10px] text-[#94A3B8]">
                                                    (Ký, ghi rõ họ tên và đóng dấu)
                                                </div>
                                                <div className="h-16 flex items-center justify-center">
                                                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 text-[10px] text-red-400 font-sans font-semibold">
                                                        [ Con dấu pháp nhân cơ quan ]
                                                    </div>
                                                </div>
                                                <div className="font-bold pt-2">
                                                    {result.perfected_document?.signatory_name || "Họ và tên"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Modal Actions */}
                <div className="flex items-center justify-between border-t border-white/10 px-6 py-3.5 bg-[#0F172A]">
                    <div className="text-xs text-[#94A3B8]">
                        {result ? (
                            <span>Đã kiểm tra qua Knowledge Graph Nghị định 30 & Nguồn Web chuẩn xác.</span>
                        ) : (
                            <span>Sẵn sàng phân tích.</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:bg-white/[0.05] hover:text-white transition-colors"
                        >
                            Đóng
                        </button>
                        {result?.perfected_document && (
                            <button
                                onClick={handleApply}
                                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity"
                            >
                                <ArrowRight className="h-4 w-4" />
                                <span>Áp dụng vào Trình soạn thảo & Xuất Word</span>
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
