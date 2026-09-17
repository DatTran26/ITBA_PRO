"use client";

import React, { useReducer, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    ScanText,
    Sparkles,
    CheckCircle2,
    Clock,
    FileText,
    AlertTriangle,
    Network,
    Globe,
} from "lucide-react";
import { ocrQueueReducer, initialQueueState } from "./ocr-queue-reducer";
import type { OCRJob } from "./types";
import UploadLauncher from "./components/upload-launcher";
import OCRJobQueue from "./components/ocr-job-queue";
import DocumentPreview from "./components/document-preview";
import ReviewWorkspace from "./components/review-workspace";
import ND30GraphRagModal from "./components/nd30-graph-rag-modal";
import DeepRAGSearchModal from "./components/deep-rag-search-modal";

export default function OCRClient() {
    const [state, dispatch] = useReducer(ocrQueueReducer, initialQueueState);
    const [showGraphRagModal, setShowGraphRagModal] = useState(false);
    const [showDeepRagModal, setShowDeepRagModal] = useState(false);
    const isProcessingRef = useRef(false);

    // Sequential Queue Processing Engine
    useEffect(() => {
        if (isProcessingRef.current) return;

        const nextJob = state.jobs.find((j) => j.status === "queued");
        if (!nextJob) return;

        isProcessingRef.current = true;
        dispatch({
            type: "processing_started",
            id: nextJob.id,
            startedAt: Date.now(),
        });

        const runScan = async () => {
            try {
                const formData = new FormData();
                formData.append("file", nextJob.file);

                const response = await fetch("/api/ocr/scan", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    const message = errData.error || `Quét thất bại (${response.status})`;
                    dispatch({ type: "failed", id: nextJob.id, message });
                    toast.error(`Lỗi OCR (${nextJob.file.name}): ${message}`);
                } else {
                    const data = await response.json();
                    dispatch({
                        type: "completed",
                        id: nextJob.id,
                        text: data.text || "",
                        engine: data.engine,
                        blocks: data.blocks || [],
                    });
                    toast.success(`Đã quét xong: ${nextJob.file.name}`);
                }
            } catch (err: any) {
                const message = err?.message || "Lỗi mạng hoặc kết nối máy chủ";
                dispatch({ type: "failed", id: nextJob.id, message });
                toast.error(`Lỗi OCR (${nextJob.file.name}): ${message}`);
            } finally {
                isProcessingRef.current = false;
            }
        };

        runScan();
    }, [state.jobs]);

    const handleFilesSelected = (newJobs: OCRJob[]) => {
        dispatch({ type: "jobs_added", jobs: newJobs });
        toast.info(`Đã thêm ${newJobs.length} ảnh vào hàng đợi OCR`);
    };

    const handleValidationError = (msg: string) => {
        dispatch({ type: "validation_error_set", message: msg });
        toast.warning(msg);
    };

    const selectedJob =
        state.jobs.find((j) => j.id === state.selectedJobId) ??
        state.jobs[0] ??
        null;

    const handleSelectBlock = (blockId: string | null) => {
        if (!selectedJob) return;
        dispatch({ type: "block_selected", id: selectedJob.id, blockId });
    };

    // Summary statistics
    const stats = {
        total: state.jobs.length,
        processing: state.jobs.filter((j) => j.status === "processing" || j.status === "queued").length,
        needsReview: state.jobs.filter((j) => j.status === "needs_review").length,
        confirmed: state.jobs.filter((j) => j.status === "confirmed").length,
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5B6CF0] to-[#36DDAB] text-white shadow-lg shadow-[#5B6CF0]/25">
                            <ScanText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#ECF0F7] flex items-center gap-2">
                                Vision OCR Studio
                                <span className="rounded-full bg-[#5B6CF0]/20 border border-[#5B6CF0]/30 px-2.5 py-0.5 text-xs font-semibold text-[#7C8FFF]">
                                    AI Engine & Grounding
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                                Trích xuất nội dung văn bản, Visual Grounding khoanh vùng tài liệu và Xuất văn bản chuẩn Nghị định 30 (.docx)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick KPI stats */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#1A233A]/60 px-3.5 py-2 backdrop-blur-md">
                        <div className="h-2 w-2 rounded-full bg-[#5B6CF0]" />
                        <span className="text-xs text-[#94A3B8]">Tổng tài liệu:</span>
                        <span className="text-sm font-bold text-[#ECF0F7]">{stats.total}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#1A233A]/60 px-3.5 py-2 backdrop-blur-md">
                        <div className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                        <span className="text-xs text-[#94A3B8]">Cần duyệt:</span>
                        <span className="text-sm font-bold text-[#FBBF24]">{stats.needsReview}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#1A233A]/60 px-3.5 py-2 backdrop-blur-md">
                        <div className="h-2 w-2 rounded-full bg-[#36DDAB]" />
                        <span className="text-xs text-[#94A3B8]">Đã duyệt:</span>
                        <span className="text-sm font-bold text-[#36DDAB]">{stats.confirmed}</span>
                    </div>

                    {/* Graph RAG Decree 30 Button */}
                    <button
                        onClick={() => setShowGraphRagModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-[#6366F1]/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/15"
                        title="Xem Đồ thị tri thức Graph RAG Nghị định 30/2020/NĐ-CP (DemoT3)"
                    >
                        <Network className="h-4 w-4" />
                        <span>🕸️ Graph RAG NĐ 30</span>
                        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                            DemoT3
                        </span>
                    </button>

                    {/* AI Deep RAG + Web Search Grounding Button */}
                    <button
                        onClick={() => setShowDeepRagModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all border border-pink-400/30"
                        title="Phân tích chuyên sâu RAG + Web Search Grounding: Hiểu văn bản là gì, thiếu sót gì và tổng hợp văn bản hoàn thiện"
                    >
                        <Globe className="h-4 w-4 text-sky-300 animate-pulse" />
                        <span>✨ AI Deep RAG & Web</span>
                        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-black text-pink-200">
                            PRO
                        </span>
                    </button>
                </div>
            </div>

            {/* Upload Zone */}
            <UploadLauncher
                onFilesSelected={handleFilesSelected}
                onError={handleValidationError}
                currentJobCount={state.jobs.length}
            />

            {/* Main Area: Queue List & Split Review Workspace */}
            {state.jobs.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Queue & Selected Image Preview */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <OCRJobQueue
                            jobs={state.jobs}
                            selectedJobId={selectedJob?.id ?? null}
                            onSelectJob={(id) => dispatch({ type: "selection_changed", id })}
                            onRemoveJob={(id) => dispatch({ type: "removed", id })}
                            onRetryJob={(id) => dispatch({ type: "retried", id })}
                            onClearAll={() => dispatch({ type: "clear_all" })}
                        />

                        <div className="h-[520px]">
                            <DocumentPreview
                                job={selectedJob}
                                onSelectBlock={handleSelectBlock}
                            />
                        </div>
                    </div>

                    {/* Right Column: Review & Text Workspace */}
                    <div className="lg:col-span-7 h-[820px]">
                        <ReviewWorkspace
                            job={selectedJob}
                            onTextChange={(id, text) => dispatch({ type: "text_edited", id, text })}
                            onConfirm={(id) => {
                                dispatch({ type: "confirmed", id });
                                toast.success("Đã xác nhận kết quả tài liệu");
                            }}
                            onReopen={(id) => {
                                dispatch({ type: "reopened", id });
                                toast.info("Đã mở lại để chỉnh sửa");
                            }}
                            onSelectBlock={handleSelectBlock}
                            onOpenGraphRag={() => setShowGraphRagModal(true)}
                        />
                    </div>
                </div>
            )}

            {/* ND30 Graph RAG Knowledge Graph Visualizer Modal */}
            <ND30GraphRagModal
                isOpen={showGraphRagModal}
                onClose={() => setShowGraphRagModal(false)}
            />

            {/* AI Deep RAG + Web Search Grounding Modal */}
            {showDeepRagModal && (
                <DeepRAGSearchModal
                    isOpen={showDeepRagModal}
                    onClose={() => setShowDeepRagModal(false)}
                    ocrText={selectedJob?.editedText || selectedJob?.originalText || "CÔNG TY CỔ PHẦN CÔNG NGHỆ\nQUYẾT ĐỊNH\nVề việc tiếp nhận và bổ nhiệm Trưởng phòng Kỹ thuật\nĐiều 1: Tiếp nhận và bổ nhiệm ông Nguyễn Văn A giữ chức Trưởng phòng Kỹ thuật kể từ ngày 01/04/2026.\nĐiều 2: Các bộ phận liên quan chịu trách nhiệm thi hành.\nTổng Giám đốc ký tên."}
                    onApplyToWorkspace={(newText) => {
                        if (selectedJob) {
                            dispatch({ type: "text_edited", id: selectedJob.id, text: newText });
                        }
                    }}
                />
            )}
        </div>
    );
}
