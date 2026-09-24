"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, AlertCircle, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneByName } from "@/lib/ui/tones";
import type { OCRJob } from "../types";

interface UploadLauncherProps {
    onFilesSelected: (jobs: OCRJob[]) => void;
    onError: (msg: string) => void;
    currentJobCount: number;
    /** Ô thả nhỏ nằm cuối dải phim khi đã có tài liệu. */
    compact?: boolean;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export default function UploadLauncher({
    onFilesSelected,
    onError,
    currentJobCount,
    compact = false,
}: UploadLauncherProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const files = Array.from(fileList);
        const availableSlots = MAX_FILES - currentJobCount;

        if (availableSlots <= 0) {
            onError(`Hàng đợi đã đầy (${MAX_FILES}/${MAX_FILES} ảnh). Vui lòng xử lý hoặc xóa bớt ảnh cũ.`);
            return;
        }

        const selectedFiles = files.slice(0, availableSlots);
        if (files.length > availableSlots) {
            onError(`Chỉ có thể tải thêm tối đa ${availableSlots} ảnh vào hàng đợi.`);
        }

        const validJobs: OCRJob[] = [];

        for (const file of selectedFiles) {
            if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
                onError(`File "${file.name}" không hợp lệ. Chỉ chấp nhận định dạng PNG, JPG, WEBP.`);
                continue;
            }

            if (file.size > MAX_FILE_SIZE) {
                onError(`File "${file.name}" quá lớn (> 10 MB). Vui lòng chọn ảnh nhỏ hơn.`);
                continue;
            }

            const previewUrl = URL.createObjectURL(file);
            const job: OCRJob = {
                id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                file,
                previewUrl,
                status: "queued",
                originalText: "",
                editedText: "",
                confirmedText: null,
                errorMessage: null,
                engine: null,
                attemptCount: 0,
                createdAt: Date.now(),
                startedAt: null,
            };
            validJobs.push(job);
        }

        if (validJobs.length > 0) {
            onFilesSelected(validJobs);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const full = currentJobCount >= MAX_FILES;
    const input = (
        <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
        />
    );
    const dropProps = {
        onClick: () => !full && fileInputRef.current?.click(),
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        role: "button" as const,
        tabIndex: full ? -1 : 0,
        onKeyDown: (e: React.KeyboardEvent) => {
            if (!full && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                fileInputRef.current?.click();
            }
        },
    };

    if (compact) {
        return (
            <div
                {...dropProps}
                aria-disabled={full}
                className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl border-2 border-dashed px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                    full ? "cursor-not-allowed border-border opacity-60" : "cursor-pointer",
                    isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50",
                )}
            >
                {input}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Plus className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                    <span className="block text-xs font-bold text-foreground">{full ? "Hàng đợi đã đầy" : "Thêm ảnh"}</span>
                    <span className="block text-[11px] text-muted-foreground">
                        {currentJobCount}/{MAX_FILES} ảnh · kéo thả hoặc bấm
                    </span>
                </span>
            </div>
        );
    }

    const specs = [
        { icon: ImageIcon, label: "PNG, JPG, JPEG, WEBP", tone: toneByName("blue") },
        { icon: FileText, label: "Tối đa 10 MB / ảnh", tone: toneByName("teal") },
        { icon: AlertCircle, label: `Tối đa ${MAX_FILES} ảnh / phiên`, tone: toneByName("orange") },
    ];

    return (
        <div
            {...dropProps}
            className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50",
            )}
        >
            {input}
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <UploadCloud className="h-8 w-8" />
            </span>
            <h3 className="mt-4 text-base font-bold text-foreground">Thả ảnh tài liệu vào đây để quét OCR</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                hoặc <span className="font-semibold text-primary underline underline-offset-4">chọn từ máy tính</span> — ảnh được quét lần lượt, xong ảnh nào duyệt ảnh đó
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {specs.map(({ icon: Icon, label, tone }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: tone.ink, backgroundColor: tone.bg }}>
                        <Icon className="h-3.5 w-3.5" /> {label}
                    </span>
                ))}
            </div>
        </div>
    );
}
