"use client";

import React, { useReducer, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ScanText } from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";
import PageContainer from "@/components/ui/page-container";
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

    const pending = state.jobs.filter((j) => j.status === "queued" || j.status === "processing").length;

    return (
        <PageContainer>
            <div className="space-y-6 pb-8">
                <SharedDashboardPageHeader
                    className="mb-6"
                    title="Vision OCR"
                    icon={ScanText}
                    badge={{ label: pending > 0 ? `Đang quét ${pending}` : "Gemini Vision", tone: pending > 0 ? "orange" : "teal" }}
                    description="Trích văn bản in, chữ viết tay và bảng biểu từ ảnh — soi ảnh gốc cạnh bản trích để duyệt từng tài liệu"
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
                        <DocumentPreview job={selectedJob} />
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
                )}
            </div>
        </PageContainer>
    );
}
