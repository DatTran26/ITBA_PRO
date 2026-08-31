"use client";

import React from "react";
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Trash2,
    RotateCcw,
    Layers,
    Sparkles,
} from "lucide-react";
import type { OCRJob, OCRJobStatus } from "../types";

interface OCRJobQueueProps {
    jobs: OCRJob[];
    selectedJobId: string | null;
    onSelectJob: (id: string) => void;
    onRemoveJob: (id: string) => void;
    onRetryJob: (id: string) => void;
    onClearAll: () => void;
}

export default function OCRJobQueue({
    jobs,
    selectedJobId,
    onSelectJob,
    onRemoveJob,
    onRetryJob,
    onClearAll,
}: OCRJobQueueProps) {
    if (jobs.length === 0) {
        return null;
    }

    const renderStatusBadge = (status: OCRJobStatus, errorMsg?: string | null) => {
        switch (status) {
            case "queued":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-500/20">
                        <Clock className="h-3 w-3" /> Đang chờ
                    </span>
                );
            case "processing":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#5B6CF0]/20 px-2 py-0.5 text-[10px] font-medium text-[#7C8FFF] border border-[#5B6CF0]/30 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" /> Đang quét...
                    </span>
                );
            case "needs_review":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/20 px-2 py-0.5 text-[10px] font-medium text-[#FBBF24] border border-[#F59E0B]/30">
                        <Sparkles className="h-3 w-3" /> Cần duyệt
                    </span>
                );
            case "confirmed":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#36DDAB]/20 px-2 py-0.5 text-[10px] font-medium text-[#36DDAB] border border-[#36DDAB]/30">
                        <CheckCircle2 className="h-3 w-3" /> Đã xác nhận
                    </span>
                );
            case "error":
                return (
                    <span
                        className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/30"
                        title={errorMsg || "Lỗi xử lý"}
                    >
                        <AlertCircle className="h-3 w-3" /> Lỗi
                    </span>
                );
        }
    };

    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-[#1A233A]/70 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#5B6CF0]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                        Danh sách tài liệu ({jobs.length})
                    </h3>
                </div>
                <button
                    onClick={onClearAll}
                    className="text-[11px] font-medium text-[#64748B] hover:text-rose-400 transition-colors"
                >
                    Xóa tất cả
                </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
                {jobs.map((job, idx) => {
                    const isSelected = job.id === selectedJobId;
                    return (
                        <div
                            key={job.id}
                            onClick={() => onSelectJob(job.id)}
                            className={`group relative flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all duration-200 cursor-pointer border ${
                                isSelected
                                    ? "bg-[#5B6CF0]/15 border-[#5B6CF0]/50 shadow-[0_0_15px_rgba(91,108,240,0.15)] ring-1 ring-[#5B6CF0]/30"
                                    : "bg-[#121A2E]/50 border-white/[0.04] hover:border-white/10 hover:bg-[#121A2E]/80"
                            }`}
                        >
                            {/* Left: Thumbnail & Info */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0D1322]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={job.previewUrl}
                                        alt={job.file.name}
                                        className="h-full w-full object-cover"
                                    />
                                    <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 text-[9px] font-mono text-white/80">
                                        #{idx + 1}
                                    </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-[#ECF0F7]" title={job.file.name}>
                                        {job.file.name}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        {renderStatusBadge(job.status, job.errorMessage)}
                                        {job.engine && (
                                            <span className="text-[10px] text-[#64748B] font-mono">
                                                {job.engine}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                {job.status === "error" && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRetryJob(job.id);
                                        }}
                                        title="Thử lại"
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveJob(job.id);
                                    }}
                                    title="Xóa ảnh"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
