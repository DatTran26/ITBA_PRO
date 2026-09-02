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
        <div className="hidden sm:flex flex-col flex-1 border-l border-[#1E293B] bg-[#0F172A]" style={{ minHeight: "580px" }}>
            <div className="px-5 py-3 border-b border-[#F59E0B]/15 flex items-center justify-between shrink-0 bg-[#0F172A]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                    {file && (
                        <span className="text-[10px] font-bold text-[#EF4444] px-2 py-0.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/25 shrink-0">
                            {isPdf(file) ? "PDF" : "DOCX"}
                        </span>
                    )}
                    <span className="text-xs font-semibold text-[#F59E0B] shrink-0">Preview</span>
                    {file && <span className="text-[11px] text-[#8B99B0] truncate max-w-[200px]">{file.name}</span>}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {!file ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center select-none bg-radial-vignette">
                        <div className="w-16 h-16 rounded-2xl bg-[#1E293B] border-2 border-dashed border-[#334155] flex items-center justify-center shadow-[0_0_20px_rgba(124,143,255,0.05)]">
                            <Upload className="w-7 h-7 text-[#8B99B0]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#8B99B0]">No file selected</p>
                            <p className="text-xs text-[#4A5570] mt-1 bg-[#1E293B]/50 px-3 py-1 rounded-full border border-white/5">Upload a CV to preview it here</p>
                        </div>
                    </div>
                ) : isPdf(file) && previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full border-none" title="CV Preview" />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-5 p-8 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.1)]">
                            <FileText className="w-10 h-10 text-[#3B82F6]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#C8D0E0] mb-1.5">Preview không khả dụng</p>
                            <p className="text-xs text-[#4A5570] leading-relaxed max-w-[200px]">
                                DOCX files cannot be previewed in browser. File will be processed by AI after upload.
                            </p>
                        </div>
                        <div className="px-4 py-2.5 bg-[#0F1A2E] border border-[#1A2840] rounded-xl">
                            <p className="text-xs text-[#8B99B0] font-medium truncate max-w-[200px]">{file.name}</p>
                            <p className="text-[11px] text-[#4A5570] mt-0.5">{fmtSize(file.size)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
