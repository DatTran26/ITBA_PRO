"use client";

import React, { useReducer, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScanText, Network, Globe } from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";
import PageContainer from "@/components/ui/page-container";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
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

    const pending = state.jobs.filter((j) => j.status === "queued" || j.status === "processing").length;

    const handleSelectBlock = (blockId: string | null) => {
        if (!selectedJob) return;
        dispatch({ type: "block_selected", id: selectedJob.id, blockId });
    };

    return (
        <PageContainer>
            <div className="space-y-6 pb-8">
                <PageBreadcrumb breadcrumbs={[{ label: "Recruitment", href: "/dashboard/recruitment" }, { label: "Vision OCR" }]} />
                <SharedDashboardPageHeader
                    className="mb-6"
                    title="Vision OCR"
                    icon={ScanText}
                    badge={{ label: pending > 0 ? `Đang quét ${pending}` : "Gemini Vision", tone: pending > 0 ? "orange" : "teal" }}
                    description="Trích văn bản in, chữ viết tay và bảng biểu từ ảnh — soi ảnh gốc cạnh bản trích để duyệt từng tài liệu"
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

                {state.jobs.length === 0 ? (
                    <UploadLauncher
                        onFilesSelected={handleFilesSelected}
                        onError={handleValidationError}
                        currentJobCount={0}
                    />
                ) : (
                    /* Bàn soi 3 cột: dải phim | ảnh gốc | bản trích */
                    <div className="grid h-[calc(100vh-13rem)] min-h-[620px] grid-cols-[16rem_minmax(0,1fr)_minmax(0,1.15fr)] gap-4">
                        <div className="flex min-h-0 flex-col gap-3">
                            <OCRJobQueue
                                jobs={state.jobs}
                                selectedJobId={selectedJob?.id ?? null}
                                onSelectJob={(id) => dispatch({ type: "selection_changed", id })}
                                onRemoveJob={(id) => dispatch({ type: "removed", id })}
                                onRetryJob={(id) => dispatch({ type: "retried", id })}
                                onClearAll={() => dispatch({ type: "clear_all" })}
                            />
                            <UploadLauncher
                                compact
                                onFilesSelected={handleFilesSelected}
                                onError={handleValidationError}
                                currentJobCount={state.jobs.length}
                            />
                        </div>
                        <DocumentPreview job={selectedJob} onSelectBlock={handleSelectBlock} />
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
