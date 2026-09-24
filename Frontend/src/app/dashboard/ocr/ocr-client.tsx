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
    Plus,
    FolderCheck,
} from "lucide-react";
import { ocrQueueReducer, initialQueueState } from "./ocr-queue-reducer";
import type { OCRJob, UserProfile } from "./types";
import UploadLauncher from "./components/upload-launcher";
import OCRJobQueue from "./components/ocr-job-queue";
import DocumentPreview from "./components/document-preview";
import ReviewWorkspace from "./components/review-workspace";
import ND30GraphRagModal from "./components/nd30-graph-rag-modal";
import AdvisoryFlowPanel from "./components/advisory-flow-panel";
import SavedDocumentsWorkspace from "./components/saved-documents-workspace";
import { useSavedDocuments } from "./services/saved-documents-store";

interface OCRClientProps {
    userProfile?: UserProfile;
}

export default function OCRClient({
    userProfile = {
        full_name: "NGUYỄN VĂN AN",
        organization: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN TOWN",
        department: "Phòng Hành chính - Nhân sự",
        title: "TỔNG GIÁM ĐỐC",
        location: "Hà Nội",
    },
}: OCRClientProps) {
    const [state, dispatch] = useReducer(ocrQueueReducer, initialQueueState);
    const [studioMode, setStudioMode] = useState<"advisory" | "ocr" | "history">("advisory");
    const { count: savedDocsCount } = useSavedDocuments();
    const [isDraftingNew, setIsDraftingNew] = useState(true);
    const [showGraphRagModal, setShowGraphRagModal] = useState(false);
    const isProcessingRef = useRef(false);

    // Sequential Queue Processing Engine for Luồng B (OCR)
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

    const handleAdvisoryDocumentReady = (newJob: OCRJob) => {
        dispatch({ type: "jobs_added", jobs: [newJob] });
        dispatch({ type: "selection_changed", id: newJob.id });
        setIsDraftingNew(false);
        toast.success("Văn bản đã được tạo thành công và nạp vào Bàn thẩm định thể thức!");
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
                                Vision OCR & Decree 30 Studio
                                <span className="rounded-full bg-[#36DDAB]/20 border border-[#36DDAB]/30 px-2.5 py-0.5 text-xs font-semibold text-[#36DDAB]">
                                    Nghị định 30/2020/NĐ-CP
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                                Trung tâm Soạn thảo văn bản chuẩn thể thức, Bóc tách OCR và Thẩm định thể thức pháp lý DOWN TOWN HRMS
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
                </div>
            </div>

            {/* Mode Switcher (Unified Entry Hub) */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#111827]/80 border border-white/[0.08] backdrop-blur-md self-start">
                <button
                    onClick={() => {
                        setStudioMode("advisory");
                        if (state.jobs.length === 0) setIsDraftingNew(true);
                    }}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        studioMode === "advisory"
                            ? "bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] text-white shadow-lg shadow-[#5B6CF0]/25 scale-[1.02]"
                            : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                    <Sparkles className="h-4 w-4 text-emerald-300" />
                    <span>✍️ Soạn thảo văn bản mới (AI Tư vấn NĐ 30)</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        Mới
                    </span>
                </button>

                <button
                    onClick={() => setStudioMode("ocr")}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        studioMode === "ocr"
                            ? "bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] text-white shadow-lg shadow-[#5B6CF0]/25 scale-[1.02]"
                            : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                    <ScanText className="h-4 w-4" />
                    <span>📷 Quét & Số hóa bản scan (Vision OCR)</span>
                </button>

                <button
                    onClick={() => setStudioMode("history")}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        studioMode === "history"
                            ? "bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] text-white shadow-lg shadow-[#5B6CF0]/25 scale-[1.02]"
                            : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                    <FolderCheck className="h-4 w-4 text-emerald-300" />
                    <span>📁 Các file đã tạo</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        {savedDocsCount}
                    </span>
                </button>
            </div>

            {/* ── Mode 1: Advisory Flow (Tạo mới) ── */}
            {studioMode === "advisory" && (isDraftingNew || state.jobs.length === 0) && (
                <AdvisoryFlowPanel
                    userProfile={userProfile}
                    onDocumentReady={handleAdvisoryDocumentReady}
                    onViewHistory={() => setStudioMode("history")}
                />
            )}

            {/* ── Mode 3: Created Files Archive Workspace (Xem lại các file đã tạo) ── */}
            {studioMode === "history" && (
                <SavedDocumentsWorkspace
                    onStartNewDraft={() => {
                        setStudioMode("advisory");
                        setIsDraftingNew(true);
                    }}
                    onSyncToOCRWorkspace={handleAdvisoryDocumentReady}
                />
            )}

            {/* ── Mode 2: OCR Dropzone (Quét ảnh) ── */}
            {studioMode === "ocr" && (
                <UploadLauncher
                    onFilesSelected={handleFilesSelected}
                    onError={handleValidationError}
                    currentJobCount={state.jobs.length}
                />
            )}

            {/* ── UNIFIED REVIEW WORKSPACE (Cả 2 luồng đều hội tụ tại đây) ── */}
            {state.jobs.length > 0 && (!isDraftingNew || studioMode === "ocr") && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
                    {/* Left Column: Queue List & Selected Document Preview */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {/* Quick Action to Draft Another Document when in Advisory Mode */}
                        {studioMode === "advisory" && (
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-[#1A233A]/60 backdrop-blur-md">
                                <span className="text-xs text-[#94A3B8]">Cần tạo thêm văn bản khác?</span>
                                <button
                                    onClick={() => setIsDraftingNew(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] text-xs font-bold text-white shadow-md hover:opacity-90 transition-all"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>+ Soạn văn bản mới</span>
                                </button>
                            </div>
                        )}

                        <OCRJobQueue
                            jobs={state.jobs}
                            selectedJobId={selectedJob?.id ?? null}
                            onSelectJob={(id) => dispatch({ type: "selection_changed", id })}
                            onRemoveJob={(id) => dispatch({ type: "removed", id })}
                            onRetryJob={(id) => dispatch({ type: "retried", id })}
                            onClearAll={() => {
                                dispatch({ type: "clear_all" });
                                if (studioMode === "advisory") setIsDraftingNew(true);
                            }}
                        />

                        <div className="h-[520px]">
                            <DocumentPreview
                                job={selectedJob}
                                onSelectBlock={handleSelectBlock}
                            />
                        </div>
                    </div>

                    {/* Right Column: Review, Decree 30 Validation & Word Export Workspace */}
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
        </div>
    );
}
