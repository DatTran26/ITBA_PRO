"use client";

import React, { useState, useRef } from "react";
import {
    ZoomIn,
    ZoomOut,
    RotateCw,
    Maximize2,
    RotateCcw,
    FileImage,
    Sparkles,
} from "lucide-react";
import type { OCRJob } from "../types";

interface DocumentPreviewProps {
    job: OCRJob | null;
}

export default function DocumentPreview({ job }: DocumentPreviewProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setPan({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y,
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (!job) {
        return (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-muted/40 p-8 text-center backdrop-blur-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] text-muted-foreground">
                    <FileImage className="h-8 w-8" />
                </div>
                <h4 className="mt-4 text-base font-medium text-foreground">Chưa chọn tài liệu</h4>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                    Vui lòng chọn một ảnh trong hàng đợi để xem tài liệu gốc và kiểm tra kết quả OCR.
                </p>
            </div>
        );
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-muted/70 backdrop-blur-md shadow-2xl">
            {/* Header / Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-background/50 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-border/20 text-primary shrink-0">
                        <FileImage className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground" title={job.file.name}>
                            {job.file.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {formatFileSize(job.file.size)} • {job.file.type.replace("image/", "").toUpperCase()}
                        </p>
                    </div>
                </div>

                {/* Control Tools */}
                <div className="flex items-center gap-1 rounded-xl bg-white/[0.05] p-1 border border-white/[0.08]">
                    <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        title="Thu nhỏ"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.08] hover:text-foreground disabled:opacity-40 transition-colors"
                    >
                        <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-1.5 text-[11px] font-mono font-medium text-foreground">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 4}
                        title="Phóng to"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.08] hover:text-foreground disabled:opacity-40 transition-colors"
                    >
                        <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <div className="h-3 w-[1px] bg-muted mx-0.5" />
                    <button
                        onClick={handleRotate}
                        title="Xoay 90°"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.08] hover:text-foreground transition-colors"
                    >
                        <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={handleReset}
                        title="Đặt lại góc & kích thước"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.08] hover:text-foreground transition-colors"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Viewer Canvas Area */}
            <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative flex flex-1 items-center justify-center overflow-hidden bg-background p-4 min-h-[380px] select-none ${
                    zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                }`}
            >
                {/* Background grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(var(--primary) 1px, transparent 1px)`,
                        backgroundSize: "20px 20px",
                    }}
                />

                {/* Status Overlay while processing */}
                {job.status === "processing" && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
                        <div className="relative">
                            <div className="h-12 w-12 rounded-full border-2 border-border/20 border-t-border animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-foreground animate-pulse">
                            Đang quét OCR tài liệu qua AI...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Đang phân tích cấu trúc bảng biểu và chữ viết</p>
                    </div>
                )}

                {/* Image element with transform */}
                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        transition: isDragging ? "none" : "transform 0.2s ease-out",
                    }}
                    className="max-h-full max-w-full origin-center flex items-center justify-center"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={job.previewUrl}
                        alt={job.file.name}
                        draggable={false}
                        className="max-h-[600px] w-auto max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-white/10"
                    />
                </div>
            </div>
        </div>
    );
}
