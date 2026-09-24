"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Bot,
    User,
    Send,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import type { FieldDefinition, GuidanceResponse } from "../types";
import { chatGuidance } from "../services/advisory-service";

interface AdvisoryGuidanceChatProps {
    onResolved: (
        docType: string,
        requiredFields: FieldDefinition[],
        processSteps: string[]
    ) => void;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const INITIAL_MESSAGE =
    "Xin chào! Tôi là Trợ lý Văn thư AI của DOWN TOWN. Tôi có thể giúp bạn xác định đúng loại văn bản theo Nghị định 30/2020/NĐ-CP và hướng dẫn soạn thảo chuẩn thể thức.\n\nBạn đang gặp vấn đề gì hoặc cần tạo loại giấy tờ nào?";

const QUICK_SUGGESTIONS = [
    "Tôi bị tai nạn trên đường đi làm, cần viết giấy gì?",
    "Tôi muốn làm đơn xin nghỉ phép việc riêng 2 ngày",
    "Tôi cần viết báo cáo tiến độ dự án tuần này",
    "Cần làm công văn gửi đối tác về lịch họp",
    "Tôi muốn soạn tờ trình xin phê duyệt ngân sách",
];

export default function AdvisoryGuidanceChat({ onResolved }: AdvisoryGuidanceChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "init",
            role: "assistant",
            content: INITIAL_MESSAGE,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [resolvedInfo, setResolvedInfo] = useState<{
        docType: string;
        fields: FieldDefinition[];
        steps: string[];
    } | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    async function handleSend(textToSend?: string) {
        const text = (textToSend ?? input).trim();
        if (!text || loading) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
            timestamp: new Date(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const history = newMessages
                .filter((m) => m.id !== "init")
                .map((m) => ({ role: m.role, content: m.content }));

            const response: GuidanceResponse = await chatGuidance(text, history);

            const assistantMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: "assistant",
                content: response.message,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMsg]);

            if (response.is_resolved && response.doc_type) {
                setResolvedInfo({
                    docType: response.doc_type,
                    fields: response.required_fields,
                    steps: response.process_steps,
                });
            }
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content: "Xin lỗi, hiện tôi đang gặp sự cố kết nối tới AI Engine. Bạn có thể thử lại sau giây lát.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[520px] rounded-2xl border border-white/[0.08] bg-[#1A233A]/60 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Messages body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((m) => {
                    const isAi = m.role === "assistant";
                    return (
                        <div
                            key={m.id}
                            className={`flex gap-3 max-w-[85%] ${
                                isAi ? "self-start" : "ml-auto flex-row-reverse"
                            }`}
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                    isAi
                                        ? "bg-gradient-to-tr from-[#5B6CF0] to-[#36DDAB] text-white shadow-md shadow-[#5B6CF0]/20"
                                        : "bg-[#2A375A] text-[#ECF0F7]"
                                }`}
                            >
                                {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </div>

                            <div
                                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                                    isAi
                                        ? "bg-[#111827]/80 text-[#ECF0F7] border border-white/[0.08] rounded-tl-sm shadow-sm"
                                        : "bg-[#5B6CF0] text-white rounded-tr-sm shadow-md shadow-[#5B6CF0]/25"
                                }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex gap-3 self-start max-w-[85%]">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#5B6CF0] to-[#36DDAB] text-white">
                            <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-[#111827]/80 px-4 py-3 text-sm text-[#94A3B8] flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-[#36DDAB]" />
                            <span>Trợ lý AI đang suy nghĩ và tra cứu Nghị định 30...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Resolved Banner */}
            {resolvedInfo && (
                <div className="mx-4 sm:mx-6 mb-3 p-4 rounded-xl border border-[#36DDAB]/30 bg-[#36DDAB]/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[#36DDAB]/20 flex items-center justify-center text-[#36DDAB]">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                Đã xác định:
                                <span className="text-[#36DDAB] uppercase tracking-wide">
                                    {resolvedInfo.docType}
                                </span>
                            </div>
                            <p className="text-xs text-[#94A3B8]">
                                Biểu mẫu gồm {resolvedInfo.fields.length} trường thông tin chuẩn thể thức
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            onResolved(
                                resolvedInfo.docType,
                                resolvedInfo.fields,
                                resolvedInfo.steps
                            )
                        }
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#36DDAB] to-[#29b88d] px-4 py-2.5 text-xs font-bold text-[#092E30] shadow-lg shadow-[#36DDAB]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span>Tiến hành điền thông tin</span>
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Quick suggestion chips */}
            {messages.length <= 2 && !resolvedInfo && (
                <div className="px-4 sm:px-6 pb-2 flex flex-wrap gap-2">
                    {QUICK_SUGGESTIONS.map((sug, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(sug)}
                            className="rounded-full border border-white/[0.08] bg-[#111827]/60 px-3 py-1 text-xs text-[#94A3B8] hover:border-[#5B6CF0]/40 hover:text-white hover:bg-[#5B6CF0]/10 transition-all text-left"
                        >
                            {sug}
                        </button>
                    ))}
                </div>
            )}

            {/* Input area */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
                className="flex items-center gap-2 border-t border-white/[0.08] bg-[#111827]/90 p-3 sm:p-4"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Mô tả nhu cầu soạn thảo hoặc vấn đề bạn đang gặp..."
                    disabled={loading}
                    className="flex-1 rounded-xl border border-white/[0.1] bg-[#1A233A]/80 px-4 py-2.5 text-sm text-[#ECF0F7] placeholder-[#64748B] outline-none focus:border-[#5B6CF0] focus:ring-1 focus:ring-[#5B6CF0] transition-all"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5B6CF0] to-[#36DDAB] text-white shadow-lg shadow-[#5B6CF0]/25 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="h-4 w-4" />
                </button>
            </form>
        </div>
    );
}
