"use client";

import React, { useState } from "react";
import { MessageSquarePlus, FileSpreadsheet, Sparkles, ArrowLeft, ShieldCheck, FolderCheck } from "lucide-react";
import { toast } from "sonner";
import type {
    FieldDefinition,
    DocumentGenerationResult,
    UserProfile,
    OCRJob,
} from "../types";
import AdvisoryGuidanceChat from "./advisory-guidance-chat";
import AdvisoryFieldForm from "./advisory-field-form";
import AdvisoryA4ReviewWorkspace from "./advisory-a4-review-workspace";
import { saveDocument } from "../services/saved-documents-store";

interface AdvisoryFlowPanelProps {
    userProfile: UserProfile;
    onDocumentReady: (job: OCRJob) => void;
    onViewHistory?: () => void;
}

export default function AdvisoryFlowPanel({
    userProfile,
    onDocumentReady,
    onViewHistory,
}: AdvisoryFlowPanelProps) {
    const [step, setStep] = useState<"chat" | "form" | "preview">("chat");
    const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
    const [generationResult, setGenerationResult] = useState<DocumentGenerationResult | null>(null);

    function handleResolved(
        docType: string,
        _requiredFields: FieldDefinition[],
        _steps: string[]
    ) {
        setSelectedDocType(docType);
        setStep("form");
    }

    function handleGenerated(result: DocumentGenerationResult) {
        setGenerationResult(result);
        setStep("preview");

        // Automatically archive into Created Files store
        try {
            const cleanFileName = `${(result.doc_type || "VanBan").replace(/[\/\s]+/g, "_")}_ND30.docx`;
            saveDocument({
                title: result.export_payload?.subject || `${result.doc_type} - ${userProfile.full_name || "Mới"}`,
                doc_type: result.doc_type,
                file_name: cleanFileName,
                export_payload: result.export_payload,
                preview_markdown: result.preview_markdown,
                status: "issued",
                source: "advisory",
                signatory_name: result.export_payload?.signatory_name || userProfile.full_name,
                company_name: result.export_payload?.company_name || userProfile.organization,
                department: result.export_payload?.department || userProfile.department,
            });
        } catch (e) {
            console.warn("Auto-save document failed:", e);
        }

        toast.success("Đã hoàn tất soạn thảo! Đang nạp vào Bàn thẩm định thể thức A4.");
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Stepper tracker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#1A233A]/60 p-4 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#36DDAB] to-[#5B6CF0] text-[#092E30] shadow-md shadow-[#36DDAB]/20">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-[#ECF0F7]">
                            Quy trình Soạn thảo Văn bản Hành chính (Nghị định 30)
                        </h2>
                        <p className="text-xs text-[#94A3B8]">
                            AI dẫn dắt từ tình huống thực tế đến văn bản pháp lý hoàn chỉnh
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs flex-wrap">
                    <button
                        onClick={() => {
                            if (step === "form" || step === "preview") setStep("chat");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                            step === "chat"
                                ? "bg-[#5B6CF0]/20 text-[#7C8FFF] border border-[#5B6CF0]/40 font-bold shadow-sm"
                                : "text-[#94A3B8] bg-white/[0.04] hover:text-white"
                        }`}
                    >
                        <MessageSquarePlus className="h-3.5 w-3.5" />
                        1. Trợ lý tư vấn
                    </button>

                    <span className="text-[#64748B]">→</span>

                    <button
                        onClick={() => {
                            if (step === "preview" && selectedDocType) setStep("form");
                        }}
                        disabled={!selectedDocType}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                            step === "form"
                                ? "bg-[#36DDAB]/20 text-[#36DDAB] border border-[#36DDAB]/40 font-bold shadow-sm"
                                : "text-[#94A3B8] bg-white/[0.04] disabled:opacity-40"
                        }`}
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        2. Điền thông tin
                    </button>

                    <span className="text-[#64748B]">→</span>

                    <span
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                            step === "preview"
                                ? "bg-gradient-to-r from-[#10B981]/25 to-[#36DDAB]/25 text-[#36DDAB] border border-[#36DDAB]/50 font-bold shadow-md shadow-[#36DDAB]/20"
                                : "text-[#94A3B8] bg-white/[0.04]"
                        }`}
                    >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        3. Bàn thẩm định thể thức A4
                    </span>

                    {onViewHistory && (
                        <button
                            onClick={onViewHistory}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#36DDAB] bg-[#36DDAB]/10 hover:bg-[#36DDAB]/20 border border-[#36DDAB]/30 transition-all ml-auto"
                            title="Xem lại các file đã tạo"
                        >
                            <FolderCheck className="h-3.5 w-3.5" />
                            <span>📁 File đã tạo</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Step 1: Chat guidance */}
            {step === "chat" && (
                <AdvisoryGuidanceChat onResolved={handleResolved} />
            )}

            {/* Step 2: Field Form */}
            {step === "form" && selectedDocType && (
                <div className="space-y-4">
                    <button
                        onClick={() => setStep("chat")}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Quay lại bước trò chuyện với AI</span>
                    </button>

                    <AdvisoryFieldForm
                        docType={selectedDocType}
                        userProfile={userProfile}
                        onGenerated={handleGenerated}
                        onCancel={() => setStep("chat")}
                    />
                </div>
            )}

            {/* Step 3: Bàn thẩm định thể thức A4 */}
            {step === "preview" && generationResult && (
                <AdvisoryA4ReviewWorkspace
                    result={generationResult}
                    onBackToForm={() => setStep("form")}
                    onStartNew={() => {
                        setStep("chat");
                        setSelectedDocType(null);
                        setGenerationResult(null);
                    }}
                    onSyncToWorkspace={onDocumentReady}
                />
            )}
        </div>
    );
}
