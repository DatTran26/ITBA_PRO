"use client";

import React, { useReducer, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScanText, Sparkles, Network, Plus, FolderCheck, Globe } from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";
import PageContainer from "@/components/ui/page-container";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import { ocrQueueReducer, initialQueueState } from "./ocr-queue-reducer";
import type { OCRJob, UserProfile } from "./types";
import UploadLauncher from "./components/upload-launcher";
import OCRJobQueue from "./components/ocr-job-queue";
import DocumentPreview from "./components/document-preview";
import ReviewWorkspace from "./components/review-workspace";
import ND30GraphRagModal from "./components/nd30-graph-rag-modal";
import DeepRAGSearchModal from "./components/deep-rag-search-modal";
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
    const [showDeepRagModal, setShowDeepRagModal] = useState(false);
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
        <PageContainer>
            <div className="space-y-6 pb-8">
                <PageBreadcrumb breadcrumbs={[{ label: "Recruitment", href: "/dashboard/recruitment" }, { label: "Vision OCR" }]} />
                <SharedDashboardPageHeader
                    className="mb-6"
                    title="Vision OCR & Decree 30 Studio"
                    icon={ScanText}
                    badge={{ label: stats.processing > 0 ? `Đang quét ${stats.processing}` : "Gemini Vision", tone: stats.processing > 0 ? "orange" : "teal" }}
                    description="Trung tâm Soạn thảo văn bản chuẩn thể thức, Bóc tách OCR và Thẩm định thể thức pháp lý DOWN TOWN HRMS"
                    actions={(
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setShowGraphRagModal(true)} title="Đồ thị tri thức Graph RAG Nghị định 30/2020/NĐ-CP"
                                className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground hover:bg-muted transition-colors">
                                <Network className="h-4 w-4 text-primary" /> Graph RAG NĐ 30
                            </button>
                            <button type="button" onClick={() => setShowDeepRagModal(true)} title="Phân tích chuyên sâu RAG + Web Search Grounding"
                                className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                                <Globe className="h-4 w-4" /> AI Deep RAG & Web
                            </button>
                        </div>
                    )}
                />

                {/* Quick KPI stats */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">Tổng tài liệu:</span>
                        <span className="text-sm font-bold text-foreground">{stats.total}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2">
                        <div className="h-2 w-2 rounded-full bg-warning" />
                        <span className="text-xs text-muted-foreground">Cần duyệt:</span>
                        <span className="text-sm font-bold text-warning">{stats.needsReview}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-xs text-muted-foreground">Đã duyệt:</span>
                        <span className="text-sm font-bold text-success">{stats.confirmed}</span>
                    </div>
                </div>

                {/* Mode Switcher (Unified Entry Hub) */}
                <div className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
                    <button
                        type="button"
                        onClick={() => {
                            setStudioMode("advisory");
                            if (state.jobs.length === 0) setIsDraftingNew(true);
                        }}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                            studioMode === "advisory"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>✍️ Soạn thảo văn bản mới (AI Tư vấn NĐ 30)</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${studioMode === "advisory" ? "bg-white/25" : "bg-background"}`}>
                            Mới
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStudioMode("ocr")}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                            studioMode === "ocr"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <ScanText className="h-4 w-4" />
                        <span>📷 Quét & Số hóa bản scan (Vision OCR)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStudioMode("history")}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                            studioMode === "history"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <FolderCheck className="h-4 w-4" />
                        <span>📁 Các file đã tạo</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${studioMode === "history" ? "bg-white/25" : "bg-background"}`}>
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
                                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
                                    <span className="text-xs text-muted-foreground">Cần tạo thêm văn bản khác?</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsDraftingNew(true)}
                                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
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
        </PageContainer>
    );
}
