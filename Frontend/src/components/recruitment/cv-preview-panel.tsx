"use client";

import { FileText, Upload } from "lucide-react";

const isPdf = (f: File) => f.type === "application/pdf";
const fmtSize = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

interface CvPreviewPanelProps {
    file: File | null;
    previewUrl: string | null;
}

export default function CvPreviewPanel({ file, previewUrl }: CvPreviewPanelProps) {
    return (
        <div className="hidden sm:flex flex-col flex-1 border-l border-muted bg-background" style={{ minHeight: "580px" }}>
            <div className="px-5 py-3 border-b border-warning/15 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                    {file && (
                        <span className="text-[10px] font-bold text-danger px-2 py-0.5 rounded-full bg-danger/10 border border-danger/25 shrink-0">
                            {isPdf(file) ? "PDF" : "DOCX"}
                        </span>
                    )}
                    <span className="text-xs font-semibold text-warning shrink-0">Preview</span>
                    {file && <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">{file.name}</span>}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {!file ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center select-none bg-radial-vignette">
                        <div className="w-16 h-16 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_5%,transparent)]">
                            <Upload className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground">No file selected</p>
                            <p className="text-xs text-muted-foreground mt-1 bg-muted/50 px-3 py-1 rounded-full border border-border">Upload a CV to preview it here</p>
                        </div>
                    </div>
                ) : isPdf(file) && previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full border-none" title="CV Preview" />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-5 p-8 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-border/20 flex items-center justify-center shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_10%,transparent)]">
                            <FileText className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground mb-1.5">Preview không khả dụng</p>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                                DOCX files cannot be previewed in browser. File will be processed by AI after upload.
                            </p>
                        </div>
                        <div className="px-4 py-2.5 bg-background border border-muted rounded-xl">
                            <p className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">{file.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{fmtSize(file.size)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
