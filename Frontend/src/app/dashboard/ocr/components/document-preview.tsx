"use client";

import React, { useState, useRef } from "react";
import {
    ZoomIn,
    ZoomOut,
    RotateCw,
    RotateCcw,
    FileImage,
    Sparkles,
} from "lucide-react";
import type { OCRJob } from "../types";

interface DocumentPreviewProps {
    job: OCRJob | null;
    onSelectBlock?: (blockId: string | null) => void;
}

export default function DocumentPreview({ job, onSelectBlock }: DocumentPreviewProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [showBBoxes, setShowBBoxes] = useState(true);
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const activeRectRef = useRef<SVGRectElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

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
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
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

    const blocks = job.blocks || [];
    const hasBlocks = blocks.length > 0;
    const activeBlock = blocks.find((b) => b.id === job.activeBlockId);

    const handleImgClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!hasBlocks || !imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        const rx = (e.clientX - rect.left) / rect.width;
        const ry = (e.clientY - rect.top) / rect.height;

        const hit = [...blocks].reverse().find(
            (b) =>
                rx >= b.bbox.x &&
                rx <= b.bbox.x + b.bbox.w &&
                ry >= b.bbox.y &&
                ry <= b.bbox.y + b.bbox.h
        );

        onSelectBlock?.(hit?.id ?? null);
    };

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {/* Header / Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-border px-4 py-3 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileImage className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground" title={job.file.name}>
                            {job.file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                                {formatFileSize(job.file.size)} • {job.file.type.replace("image/", "").toUpperCase()}
                            </span>
                            {hasBlocks && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.2 border border-success/30 text-[10px] font-semibold text-success">
                                    <Sparkles className="w-2.5 h-2.5" /> {blocks.length} vùng Grounding
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Control Tools */}
                <div className="flex items-center gap-1">
                    {hasBlocks && (
                        <button
                            onClick={() => setShowBBoxes(!showBBoxes)}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                                showBBoxes
                                    ? "bg-primary/20 text-primary border-primary/40"
                                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                            }`}
                            title="Bật/Tắt khung viền văn bản"
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${showBBoxes ? "bg-success" : "bg-muted-foreground"}`} />
                            Khung BBox
                        </button>
                    )}

                    <div className="flex items-center gap-1 rounded-xl bg-muted p-1 border border-border">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            title="Thu nhỏ"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
                        >
                            <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                        <div className="h-3 w-[1px] bg-muted mx-0.5" />
                        <button
                            onClick={handleRotate}
                            title="Xoay 90°"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <RotateCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={handleReset}
                            title="Đặt lại góc & kích thước"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Viewer Canvas Area */}
            <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative flex flex-1 items-center justify-center overflow-hidden bg-muted/40 p-4 min-h-0 select-none ${
                    zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                }`}
            >
                {/* Background grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage: `radial-gradient(var(--primary) 1px, transparent 1px)`,
                        backgroundSize: "20px 20px",
                    }}
                />

                {/* Status Overlay while processing */}
                {job.status === "processing" && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
                        <div className="relative">
                            <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-foreground animate-pulse">
                            Đang quét OCR và tính toán tọa độ Bounding Box...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Hệ thống phân tích cấu trúc văn bản & vị trí trường dữ liệu</p>
                    </div>
                )}

                {/* Image element with transform and SVG overlay */}
                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        transition: isDragging ? "none" : "transform 0.2s ease-out",
                    }}
                    className="relative max-h-full max-w-full origin-center flex items-center justify-center"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        ref={imgRef}
                        src={job.previewUrl}
                        alt={job.file.name}
                        draggable={false}
                        onClick={handleImgClick}
                        className="max-h-full w-auto max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-border"
                        style={{ cursor: hasBlocks ? "crosshair" : "default" }}
                    />

                    {/* SVG Bounding-Box Overlay */}
                    {hasBlocks && showBBoxes && (
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-auto rounded-lg"
                            viewBox="0 0 1 1"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            {blocks.map((block) => {
                                const isActive = block.id === job.activeBlockId;
                                const { x, y, w, h } = block.bbox;

                                return (
                                    <rect
                                        key={block.id}
                                        ref={isActive ? activeRectRef : undefined}
                                        x={x}
                                        y={y}
                                        width={w}
                                        height={h}
                                        className={`transition-all duration-150 cursor-pointer ${
                                            isActive
                                                ? "fill-warning/25 stroke-warning stroke-[0.005] animate-pulse"
                                                : "fill-success/10 stroke-success/60 stroke-[0.002] hover:fill-primary/25 hover:stroke-primary hover:stroke-[0.004]"
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectBlock?.(isActive ? null : block.id);
                                        }}
                                    >
                                        <title>{`${block.text} (${Math.round(block.confidence * 100)}%)`}</title>
                                    </rect>
                                );
                            })}
                        </svg>
                    )}
                </div>

                {/* Active Block HUD Badge */}
                {activeBlock && (
                    <div className="absolute bottom-4 left-4 z-20 max-w-md rounded-xl border border-warning/40 bg-card/90 p-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5 mb-1.5">
                            <span className="text-[11px] font-semibold text-warning flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Tọa độ được chọn
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                                Độ tin cậy: {Math.round(activeBlock.confidence * 100)}%
                            </span>
                        </div>
                        <p className="text-xs text-foreground line-clamp-2 font-mono bg-muted p-1.5 rounded">
                            {activeBlock.text}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
