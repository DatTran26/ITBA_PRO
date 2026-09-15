"use client";

import React, { useState } from "react";
import {
    Sparkles,
    Send,
    Bot,
    Check,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    FileEdit,
    Scale,
    PlusCircle,
    FileCheck2,
    BookOpen,
    Lightbulb,
    X,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface AIDraftingCopilotProps {
    currentText: string;
    onApplyText: (newText: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

interface CopilotResponse {
    title?: string;
    summary_of_changes?: string;
    suggested_text?: string;
    added_clauses?: string[];
    recommendations?: string[];
}

export default function AIDraftingCopilot({
    currentText,
    onApplyText,
    isOpen,
    onClose
}: AIDraftingCopilotProps) {
    const [instruction, setInstruction] = useState("");
    const [loading, setLoading] = useState(false);
    const [lastHistoryText, setLastHistoryText] = useState<string | null>(null);
    const [result, setResult] = useState<CopilotResponse | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    const QUICK_ACTIONS = [
        {
            id: "format_nd30",
            label: "Chuẩn hóa NĐ 30",
            icon: Scale,
            color: "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20",
            tooltip: "Rà soát và chuẩn hóa 100% thể thức văn bản hành chính theo NĐ 30"
        },
        {
            id: "add_clause",
            label: "Thêm Điều khoản Hiệu lực & Bảo mật",
            icon: PlusCircle,
            color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20",
            tooltip: "Tự động bổ sung các điều khoản quy định hiệu lực thi hành và trách nhiệm"
        },
        {
            id: "add_legal_bases",
            label: "Bổ sung Căn cứ Luật",
            icon: BookOpen,
            color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20",
            tooltip: "Bổ sung các văn bản luật, nghị định, thông tư hiện hành làm căn cứ pháp lý"
        },
        {
            id: "rewrite_professional",
            label: "Trau chuốt Văn phong Pháp chế",
            icon: Sparkles,
            color: "text-pink-400 border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20",
            tooltip: "Viết lại câu chữ trang trọng, gãy gọn, chuẩn ngôn ngữ hành chính"
        },
        {
            id: "shorten_summary",
            label: "Rút gọn Công văn",
            icon: FileCheck2,
            color: "text-sky-400 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20",
            tooltip: "Cô đọng thành bản tóm tắt cho lãnh đạo phê duyệt"
        }
    ];

    const handleExecuteCopilot = async (actionType: string = "custom", customPrompt: string = "") => {
        if (!currentText.trim()) {
            toast.error("Vui lòng có nội dung văn bản trước khi yêu cầu AI soạn thảo.");
            return;
        }

        const promptToSend = customPrompt || instruction;
        setLoading(true);

        try {
            const res = await fetch("/api/ocr/nd30/copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: currentText,
                    instruction: promptToSend.trim(),
                    action_type: actionType
                }),
                signal: AbortSignal.timeout(45_000)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Không thể thực hiện soạn thảo.");
            }

            const data: CopilotResponse = await res.json();
            setResult(data);
            setInstruction("");
            toast.success(data.title || "AI đã soạn thảo xong theo yêu cầu!");
        } catch (err: any) {
            console.error("Copilot request error:", err);
            toast.error(err.message || "Lỗi trong quá trình AI soạn thảo.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!result?.suggested_text) return;
        setLastHistoryText(currentText);
        onApplyText(result.suggested_text);
        toast.success("Đã áp dụng văn bản do AI soạn thảo vào Workspace!");
    };

    const handleUndo = () => {
        if (!lastHistoryText) return;
        onApplyText(lastHistoryText);
        setLastHistoryText(null);
        toast.info("Đã hoàn tác lại văn bản ban đầu.");
    };

    if (!isOpen) return null;

    return (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#0A0E1A] p-4 shadow-xl shadow-indigo-500/10 animate-in slide-in-from-bottom-3 duration-200 mb-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 text-white shadow-md shadow-indigo-500/25">
                        <Bot className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                                AI Drafting Copilot • Trợ Lý Soạn Thảo & Hiệu Chỉnh
                            </h4>
                            <span className="rounded-full bg-indigo-500/20 px-2 py-0.2 text-[9px] font-bold text-indigo-300 border border-indigo-500/30">
                                Gemini 3.6
                            </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8]">
                            Ra lệnh bằng lời để AI viết thêm điều khoản, chuẩn hóa NĐ 30, hoặc chỉnh sửa văn phong tức thì.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {lastHistoryText && (
                        <button
                            onClick={handleUndo}
                            className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
                            title="Hoàn tác văn bản trước khi AI chỉnh sửa"
                        >
                            <RotateCcw className="h-3 w-3" />
                            <span>Hoàn tác</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="rounded-lg p-1 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-3">
                    {/* Quick Action Chips */}
                    <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleExecuteCopilot(action.id)}
                                    disabled={loading}
                                    title={action.tooltip}
                                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all shadow-sm ${action.color} disabled:opacity-50`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Prompt Input */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Nhập yêu cầu soạn thảo... (ví dụ: 'Thêm Điều 3 về phụ cấp 2 triệu đồng', 'Đổi thẩm quyền ký thành Phó Tổng Giám Đốc')"
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !loading && instruction.trim()) {
                                        handleExecuteCopilot("custom", instruction);
                                    }
                                }}
                                className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2 text-xs text-white placeholder-[#64748B] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => handleExecuteCopilot("custom", instruction)}
                            disabled={loading || !instruction.trim()}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:opacity-90 disabled:opacity-40 transition-opacity"
                        >
                            {loading ? (
                                <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                                <Send className="h-3.5 w-3.5" />
                            )}
                            <span>{loading ? "Đang soạn..." : "Thực hiện"}</span>
                        </button>
                    </div>

                    {/* Result Preview Box if available */}
                    {result && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3.5 space-y-2.5 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                                    <Sparkles className="h-4 w-4 text-emerald-400" />
                                    <span>{result.title || "Kết quả AI Soạn thảo"}</span>
                                </div>
                                <button
                                    onClick={handleApply}
                                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-md transition-colors"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Áp dụng vào Văn bản</span>
                                </button>
                            </div>

                            {result.summary_of_changes && (
                                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                                    {result.summary_of_changes}
                                </p>
                            )}

                            {result.added_clauses && result.added_clauses.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {result.added_clauses.map((clause, idx) => (
                                        <span key={idx} className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200 border border-emerald-500/30 font-medium">
                                            + {clause}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {result.recommendations && result.recommendations.length > 0 && (
                                <div className="text-[11px] text-[#94A3B8] italic flex items-center gap-1.5 pt-1 border-t border-white/[0.06]">
                                    <Lightbulb className="h-3 w-3 text-amber-400 shrink-0" />
                                    <span>Lưu ý: {result.recommendations[0]}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
