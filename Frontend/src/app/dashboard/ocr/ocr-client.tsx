"use client";

import React, { useReducer, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
    ScanText,
    Sparkles,
    CheckCircle2,
    Clock,
    FileText,
    AlertTriangle,
} from "lucide-react";
import { ocrQueueReducer, initialQueueState } from "./ocr-queue-reducer";
import type { OCRJob } from "./types";
import UploadLauncher from "./components/upload-launcher";
import OCRJobQueue from "./components/ocr-job-queue";
import DocumentPreview from "./components/document-preview";
import ReviewWorkspace from "./components/review-workspace";

export default function OCRClient() {
    const [state, dispatch] = useReducer(ocrQueueReducer, initialQueueState);
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-success text-white shadow-lg shadow-primary/25">
                            <ScanText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                Vision OCR Studio
                                <span className="rounded-full bg-primary/20 border border-border/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                    AI Engine
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Trích xuất nội dung văn bản in, chữ viết tay và bảng biểu từ hình ảnh với Google Gemini Vision VLM
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick KPI stats */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-muted/60 px-3.5 py-2 backdrop-blur-md">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">Tổng tài liệu:</span>
                        <span className="text-sm font-bold text-foreground">{stats.total}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-muted/60 px-3.5 py-2 backdrop-blur-md">
                        <div className="h-2 w-2 rounded-full bg-warning" />
                        <span className="text-xs text-muted-foreground">Cần duyệt:</span>
                        <span className="text-sm font-bold text-warning">{stats.needsReview}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-muted/60 px-3.5 py-2 backdrop-blur-md">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-xs text-muted-foreground">Đã duyệt:</span>
                        <span className="text-sm font-bold text-success">{stats.confirmed}</span>
                    </div>
                </div>
            </div>

            {/* Top Area: Upload Launcher */}
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

                        <div className="h-[480px]">
                            <DocumentPreview job={selectedJob} />
                        </div>
                    </div>

                    {/* Right Column: Review & Text Workspace */}
                    <div className="lg:col-span-7 h-[780px]">
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
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
