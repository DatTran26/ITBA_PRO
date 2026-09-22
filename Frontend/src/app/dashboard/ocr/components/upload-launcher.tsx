"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, AlertCircle, FileText, Sparkles } from "lucide-react";
import type { OCRJob } from "../types";

interface UploadLauncherProps {
    onFilesSelected: (jobs: OCRJob[]) => void;
    onError: (msg: string) => void;
    currentJobCount: number;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export default function UploadLauncher({
    onFilesSelected,
    onError,
    currentJobCount,
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

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />

            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
                    isDragging
                        ? "border-border bg-primary/10 scale-[1.008] shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_25%,transparent)]"
                        : "border-border bg-muted/60 hover:border-border/60 hover:bg-muted/90 hover:shadow-xl"
                }`}
            >
                {/* Decorative background glow */}
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />
                <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-success/10 blur-2xl pointer-events-none group-hover:bg-success/15 transition-all" />

                <div className="flex flex-col items-center justify-center px-6 py-10 text-center relative z-10">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 to-success/20 border border-border group-hover:scale-110 group-hover:border-border/40 transition-all duration-300 shadow-lg">
                        <UploadCloud className="h-8 w-8 text-primary group-hover:text-primary transition-colors" />
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-foreground transition-colors flex items-center gap-2">
                        <span>Tải lên hình ảnh tài liệu để quét OCR</span>
                        <Sparkles className="w-4 h-4 text-success" />
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground max-w-md">
                        Kéo và thả file ảnh vào đây, hoặc{" "}
                        <span className="text-primary font-medium underline underline-offset-4 decoration-primary/50 group-hover:text-primary">
                            chọn từ máy tính
                        </span>
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 border border-white/[0.06]">
                            <ImageIcon className="w-3.5 h-3.5 text-primary" /> PNG, JPG, JPEG, WEBP
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 border border-white/[0.06]">
                            <FileText className="w-3.5 h-3.5 text-success" /> Tối đa 10 MB / ảnh
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 border border-white/[0.06]">
                            <AlertCircle className="w-3.5 h-3.5 text-warning" /> Tối đa 5 ảnh / phiên
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
