"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { flowAt } from "@/lib/ui/tones";
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

    const counts = FLOW.map((f) => jobs.filter((j) => j.status === f.status).length);
    const errors = jobs.filter((j) => j.status === "error").length;

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">Tài liệu ({jobs.length})</h3>
                    <button
                        type="button"
                        onClick={onClearAll}
                        className="text-[11px] font-semibold text-muted-foreground transition-colors hover:text-destructive"
                    >
                        Xóa tất cả
                    </button>
                </div>
                {/* Thanh tiến độ: mỗi đoạn = số tài liệu ở bước đó, màu theo dải flow */}
                <div className="mt-2.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    {FLOW.map((f, i) =>
                        counts[i] > 0 ? (
                            <span key={f.status} style={{ flex: counts[i], backgroundColor: flowAt(i, FLOW.length) }} />
                        ) : null,
                    )}
                    {errors > 0 && <span className="bg-destructive" style={{ flex: errors }} />}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {FLOW.map((f, i) =>
                        counts[i] > 0 ? (
                            <span key={f.status} className="inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: flowAt(i, FLOW.length) }} />
                                {f.label} <b className="text-foreground">{counts[i]}</b>
                            </span>
                        ) : null,
                    )}
                    {errors > 0 && (
                        <span className="inline-flex items-center gap-1 text-destructive">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Lỗi <b>{errors}</b>
                        </span>
                    )}
                </div>
            </div>

            <ul className="flex-1 space-y-2 overflow-y-auto p-2.5">
                {jobs.map((job, idx) => {
                    const isSelected = job.id === selectedJobId;
                    const stage = FLOW.findIndex((f) => f.status === job.status);
                    const color = stage >= 0 ? flowAt(stage, FLOW.length) : "var(--destructive)";
                    const Icon = stage >= 0 ? FLOW[stage].icon : AlertCircle;
                    return (
                        <li key={job.id}>
                            <div
                                role="button"
                                tabIndex={0}
                                aria-current={isSelected}
                                onClick={() => onSelectJob(job.id)}
                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectJob(job.id))}
                                className={cn(
                                    "group relative overflow-hidden rounded-xl border bg-card outline-none transition focus-visible:ring-4 focus-visible:ring-primary/15",
                                    isSelected ? "border-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_15%,transparent)]" : "border-border hover:border-primary/40",
                                )}
                            >
                                <div className="relative h-24 bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={job.previewUrl} alt={job.file.name} className="h-full w-full object-cover" />
                                    <span className="absolute left-1.5 top-1.5 rounded-md bg-card/90 px-1.5 text-[10px] font-bold text-foreground">#{idx + 1}</span>
                                    <span className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                                        {job.status === "error" && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); onRetryJob(job.id); }}
                                                title="Thử lại"
                                                aria-label="Thử lại"
                                                className="grid h-6 w-6 place-items-center rounded-md bg-card/90 text-foreground hover:text-primary"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onRemoveJob(job.id); }}
                                            title="Xóa ảnh"
                                            aria-label="Xóa ảnh"
                                            className="grid h-6 w-6 place-items-center rounded-md bg-card/90 text-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 px-2.5 py-2">
                                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground" title={job.file.name}>
                                        {job.file.name}
                                    </span>
                                    <span
                                        className={cn("inline-flex shrink-0 items-center gap-1 text-[10px] font-bold", stage >= 0 ? "text-muted-foreground" : "text-destructive")}
                                        title={job.status === "error" ? job.errorMessage || "Lỗi xử lý" : undefined}
                                    >
                                        <Icon className={cn("h-3 w-3", job.status === "processing" && "animate-spin")} style={{ color }} />
                                        {stage >= 0 ? FLOW[stage].label : "Lỗi"}
                                    </span>
                                </div>
                                <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: color }} />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

const FLOW: { status: OCRJobStatus; label: string; icon: typeof Clock }[] = [
    { status: "queued", label: "Chờ", icon: Clock },
    { status: "processing", label: "Đang quét", icon: Loader2 },
    { status: "needs_review", label: "Cần duyệt", icon: Sparkles },
    { status: "confirmed", label: "Đã duyệt", icon: CheckCircle2 },
];
