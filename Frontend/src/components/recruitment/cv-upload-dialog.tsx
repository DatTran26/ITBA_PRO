"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import CvPreviewPanel from "./cv-preview-panel";
import CustomSelectDropdown from "./custom-select-dropdown";
import CvUploadCreateJdForm from "./cv-upload-create-jd-form";

interface Jd { id: string; title: string | null; department: string | null }
interface CvUploadDialogProps { trigger: React.ReactNode; onSuccess: (applicationId: string) => void }

const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 10_485_760;

/** Animated "Đang xử lý." → ".." → "..." cycling text */
function AnimatedProcessingText() {
    const [dots, setDots] = useState(1);
    useEffect(() => {
        const timer = setInterval(() => setDots((d) => (d % 3) + 1), 500);
        return () => clearInterval(timer);
    }, []);
    return (
        <p className="text-base font-bold text-[#F59E0B] tracking-wide">
            Đang xử lý{".".repeat(dots)}
        </p>
    );
}

export default function CvUploadDialog({ trigger, onSuccess }: CvUploadDialogProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [candidateName, setCandidateName] = useState("");
    const [candidateEmail, setCandidateEmail] = useState("");
    const [jdId, setJdId] = useState("");
    const [jds, setJds] = useState<Jd[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [showCreateJd, setShowCreateJd] = useState(false);
    const [extractingInfo, setExtractingInfo] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!open) {
            if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
            setPreviewUrl(null);
            setCandidateName(""); setCandidateEmail(""); setJdId(""); setFile(null);
            setProgress(0); setShowCreateJd(false);
            setExtractingInfo(false);
            return;
        }
        fetch("/api/recruitment/job-descriptions")
            .then((r) => r.json())
            .then((d) => setJds(d.jobDescriptions ?? []))
            .catch(() => { });
    }, [open]);

    // derived dropdown data
    // departments from existing JDs (added by Admin/Recruiter)
    const deptOptions = [...new Set(jds.map((j) => j.department).filter(Boolean))]
        .map((d) => ({ value: d as string, label: d as string }));

    const jdOptions = jds.map((j) => ({
        value: j.id,
        label: `${j.title ?? j.id}${j.department ? ` — ${j.department}` : ""}`
    }));

    function handleFile(f: File) {
        if (!ALLOWED_TYPES.includes(f.type)) { toast.error("Only PDF and DOCX files are allowed"); return; }
        if (f.size > MAX_SIZE) { toast.error("File size must be under 10MB"); return; }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = f.type === "application/pdf" ? URL.createObjectURL(f) : null;
        objectUrlRef.current = url; setPreviewUrl(url); setFile(f);

        // Clear old data so AI refills from the new CV
        setCandidateName("");
        setCandidateEmail("");

        // AI auto-extract name + email from CV
        aiExtractInfo(f);
    }

    async function aiExtractInfo(f: File) {
        setExtractingInfo(true);
        try {
            const form = new FormData();
            form.append("file", f);
            const res = await fetch("/api/recruitment/cv-extract-info", { method: "POST", body: form });
            if (!res.ok) return;
            const { name, email } = await res.json();
            if (name) setCandidateName(name);
            if (email) setCandidateEmail(email);
            if (name || email) toast.success(`AI tự động nhận diện: ${name || "—"}${email ? ` (${email})` : ""}`);
        } catch { /* silent fail */ }
        finally { setExtractingInfo(false); }
    }
    function clearFile(e?: React.MouseEvent) {
        e?.stopPropagation();
        if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
        setPreviewUrl(null); setFile(null);
    }
    function onDrop(e: React.DragEvent) {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0]; if (f) handleFile(f);
    }

    async function handleSubmit() {
        if (!file || !candidateName.trim()) { toast.error("File and candidate name are required"); return; }
        if (!jdId) { toast.error("Job Description is required for CV Analysis"); return; }
        setLoading(true); setProgress(0);
        const interval = setInterval(() => setProgress((p) => Math.min(p + Math.random() * 12, 88)), 400);
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("candidateName", candidateName.trim());
            if (candidateEmail.trim()) form.append("candidateEmail", candidateEmail.trim());
            if (jdId) form.append("jobDescriptionId", jdId);
            const res = await fetch("/api/recruitment/upload", { method: "POST", body: form });
            if (!res.ok) { const { error } = await res.json(); throw new Error(error ?? "Upload failed"); }
            const { applicationId } = await res.json();
            clearInterval(interval); setProgress(100);
            toast.success("CV uploaded — AI analysis in progress");
            setTimeout(() => { setOpen(false); onSuccess(applicationId); }, 600);
        } catch (err) {
            clearInterval(interval); setProgress(0);
            toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally { setLoading(false); }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-[#0F172A]/98 border-[#8B99B0]/20 text-[#ECF0F7] rounded-2xl p-0 overflow-hidden max-w-none w-[calc(100vw-32px)]"
                style={{ maxWidth: "900px" }}>
                <div className="flex items-stretch relative">
                    {/* ── Full-dialog skeleton overlay ── */}
                    {extractingInfo && (
                        <div className="absolute inset-0 z-[60] bg-[#0A1220]/88 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                            <div className="w-14 h-14 rounded-full border-[3px] border-[#F59E0B]/20 border-t-[#F59E0B] animate-spin" />
                            <AnimatedProcessingText />
                            <div className="flex gap-2 mt-1">
                                <div className="h-1.5 w-10 bg-[#F59E0B]/15 rounded-full overflow-hidden"><div className="h-full bg-[#F59E0B]/70 rounded-full animate-pulse" style={{ width: '60%' }} /></div>
                                <div className="h-1.5 w-8 bg-[#F59E0B]/15 rounded-full overflow-hidden"><div className="h-full bg-[#F59E0B]/50 rounded-full animate-pulse" style={{ width: '45%', animationDelay: '0.4s' }} /></div>
                                <div className="h-1.5 w-14 bg-[#F59E0B]/15 rounded-full overflow-hidden"><div className="h-full bg-[#F59E0B]/60 rounded-full animate-pulse" style={{ width: '35%', animationDelay: '0.8s' }} /></div>
                            </div>
                        </div>
                    )}
                    {/* ── Form column ── */}
                    <div className="flex flex-col w-[420px] shrink-0">
                        <div className="px-6 pt-6 pr-12 shrink-0">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-[#7C8FFF]" /> Upload CV
                                </DialogTitle>
                            </DialogHeader>
                        </div>

                        <div className="px-6 pt-4 pb-2 space-y-4 flex-1 overflow-y-auto">
                            {/* Drop zone / file info */}
                            {!file ? (
                                <div onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)} onDrop={onDrop}
                                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-[#7C8FFF] bg-[#7C8FFF]/5" : "border-[#8B99B0]/25 hover:border-[#8B99B0]/50"}`}>
                                    <Upload className="w-7 h-7 mx-auto mb-2.5 text-[#8B99B0]" />
                                    <p className="text-sm text-[#8B99B0]">Drop file here or click to browse</p>
                                    <p className="text-xs text-[#5A6882] mt-1">PDF or DOCX · max 10 MB</p>
                                    <input ref={fileInputRef} type="file" className="hidden"
                                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 px-4 py-3 bg-[#0C1220] border border-[#7C8FFF]/25 rounded-xl">
                                    <FileText className="w-5 h-5 text-[#7C8FFF] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[#ECF0F7] font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-[#5A6882]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                    </div>
                                    <button onClick={clearFile} disabled={loading} className="text-[#5A6882] hover:text-rose-400 transition-colors cursor-pointer">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs text-[#8B99B0] font-medium">Candidate Name <span className="text-rose-400">*</span></Label>
                                <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Nguyen Van A"
                                    className="w-full bg-[#0C1220]/60 border border-[#8B99B0]/15 text-[#ECF0F7] h-9 px-3 text-sm rounded-lg focus:border-[#7C8FFF]/70 focus:outline-none !ring-0 !outline-none placeholder:text-[#5A6882]/60 transition-all duration-200" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-[#8B99B0] font-medium">Email <span className="text-[#5A6882]">(optional)</span></Label>
                                <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} placeholder="candidate@email.com"
                                    className="w-full bg-[#0C1220]/60 border border-[#8B99B0]/15 text-[#ECF0F7] h-9 px-3 text-sm rounded-lg focus:border-[#7C8FFF]/70 focus:outline-none !ring-0 !outline-none placeholder:text-[#5A6882]/60 transition-all duration-200" />
                            </div>

                            {/* JD section */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-[#8B99B0] font-medium">Job Description <span className="text-rose-400">*</span></Label>
                                    <button type="button" onClick={() => setShowCreateJd((v) => !v)}
                                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${showCreateJd
                                            ? "bg-[#F97316]/15 border-[#F97316]/50 text-[#FB923C]"
                                            : "bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316] hover:bg-[#F97316]/20 hover:border-[#F97316]/60 hover:shadow-[0_0_14px_rgba(249,115,22,0.25)]"
                                            }`}>
                                        {showCreateJd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                        {showCreateJd ? "Huỷ" : "Tạo JD mới"}
                                    </button>
                                </div>
                                {!showCreateJd && (
                                    <CustomSelectDropdown
                                        value={jdId}
                                        onChange={setJdId}
                                        options={jdOptions}
                                        placeholder="Chọn Job Description…"
                                    />
                                )}

                                {showCreateJd && (
                                    <CvUploadCreateJdForm
                                        deptOptions={deptOptions}
                                        onCreated={(jd) => {
                                            setJds((prev) => [jd, ...prev]);
                                            setJdId(jd.id);
                                            setShowCreateJd(false);
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 pt-4 border-t border-[#141F33] space-y-3 shrink-0">
                            {loading && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-[#5A6882]">
                                        <span>Uploading &amp; analyzing…</span><span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-1 bg-[#141F33] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#7C8FFF] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}
                                    className="text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#1B253B] cursor-pointer">Cancel</Button>
                                <Button onClick={handleSubmit} disabled={loading || !file || !candidateName.trim() || !jdId}
                                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 rounded-xl cursor-pointer font-semibold">
                                    {loading ? "Uploading…" : "Upload & Analyze"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ── Preview panel — always visible ── */}
                    <CvPreviewPanel file={file} previewUrl={previewUrl} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
