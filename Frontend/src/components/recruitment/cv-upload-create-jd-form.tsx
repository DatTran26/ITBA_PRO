"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Briefcase, ChevronDown, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CustomSelectDropdown from "./custom-select-dropdown";

const IT_POSITIONS = [
    "Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
    "Mobile Developer (iOS)", "Mobile Developer (Android)", "React Native Developer",
    "DevOps Engineer", "Site Reliability Engineer (SRE)", "Cloud Engineer",
    "Data Engineer", "Data Scientist", "Machine Learning Engineer", "AI Engineer",
    "QA Engineer / Tester", "Security Engineer", "Blockchain Developer",
    "System Administrator", "Database Administrator",
    "Technical Lead", "Engineering Manager", "Product Manager", "UI/UX Designer",
    "Scrum Master", "IT Support Engineer", "Network Engineer",
];

const SENIORITY_OPTIONS = [
    { value: "intern", label: "Intern" },
    { value: "junior", label: "Junior" },
    { value: "mid", label: "Mid-level" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Lead / Principal" },
    { value: "manager", label: "Manager" },
];

// keyword map for AI position suggestions
const POSITION_KEYWORDS: Record<string, string[]> = {
    "Frontend Engineer": ["frontend", "front-end", "react", "vue", "angular", "html", "css", "nextjs", "next.js", "svelte", "tailwind", "webpack", "javascript", "typescript", "ui developer"],
    "Backend Engineer": ["backend", "back-end", "node", "nodejs", "python", "java", "spring", "django", "fastapi", "express", "php", "laravel", "api", "rest", "graphql", "microservice"],
    "Full Stack Engineer": ["fullstack", "full-stack", "full stack", "mern", "mean", "cả front", "cả hai"],
    "Mobile Developer (iOS)": ["ios", "swift", "objective-c", "xcode", "iphone", "ipad", "apple"],
    "Mobile Developer (Android)": ["android", "kotlin", "java android", "google play", "apk"],
    "React Native Developer": ["react native", "expo", "cross-platform", "cross platform mobile"],
    "DevOps Engineer": ["devops", "docker", "kubernetes", "k8s", "ci/cd", "jenkins", "terraform", "ansible", "infrastructure", "pipeline"],
    "Site Reliability Engineer (SRE)": ["sre", "reliability", "uptime", "monitoring", "incident", "prometheus", "grafana", "on-call"],
    "Cloud Engineer": ["aws", "gcp", "azure", "cloud", "serverless", "lambda", "s3", "ec2"],
    "Data Engineer": ["data engineer", "data pipeline", "etl", "spark", "kafka", "airflow", "data warehouse", "bigquery", "redshift"],
    "Data Scientist": ["data scientist", "statistics", "analytics", "pandas", "numpy", "visualization", "business intelligence"],
    "Machine Learning Engineer": ["machine learning", "ml", "deep learning", "neural network", "tensorflow", "pytorch", "scikit"],
    "AI Engineer": ["ai engineer", "artificial intelligence", "llm", "gpt", "openai", "nlp", "natural language", "computer vision"],
    "QA Engineer / Tester": ["qa", "quality assurance", "testing", "automation test", "selenium", "cypress", "playwright", "test case", "bug"],
    "Security Engineer": ["security", "cybersecurity", "pentest", "penetration", "vulnerability", "soc", "encryption", "firewall"],
    "Blockchain Developer": ["blockchain", "web3", "solidity", "ethereum", "smart contract", "defi", "nft", "crypto"],
    "System Administrator": ["sysadmin", "system admin", "linux admin", "windows server", "active directory"],
    "Database Administrator": ["dba", "database admin", "mysql", "postgresql", "oracle", "mssql", "mongodb", "redis"],
    "Technical Lead": ["tech lead", "technical lead", "team lead", "architect", "mentor"],
    "Engineering Manager": ["engineering manager", "manage team", "people manager", "em "],
    "Product Manager": ["product manager", " pm ", "roadmap", "stakeholder", "user story", "backlog", "product owner"],
    "UI/UX Designer": ["ui/ux", "ux designer", "ui designer", "figma", "sketch", "prototype", "wireframe", "user research"],
    "Scrum Master": ["scrum", "agile", "sprint", "kanban", "scrum master"],
};

function getSuggestedPositions(text: string): string[] {
    if (text.length < 4) return [];
    const lower = text.toLowerCase();
    const scores = IT_POSITIONS.map((pos) => ({
        pos,
        score: (POSITION_KEYWORDS[pos] ?? []).filter((kw) => lower.includes(kw)).length,
    }));
    return scores.filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(({ pos }) => pos);
}

interface CreatedJd { id: string; title: string; department: string | null }

interface Props {
    deptOptions: { value: string; label: string }[];
    onCreated: (jd: CreatedJd) => void;
}

// Inline "create Job Description" sub-form of the CV upload dialog: JD text + AI parse,
// position combobox (preset + AI suggestions), department/seniority. Split out of
// cv-upload-dialog.tsx; owns its own form state.
export default function CvUploadCreateJdForm({ deptOptions, onCreated }: Props) {
    const [newJdTitle, setNewJdTitle] = useState("");
    const [newJdDept, setNewJdDept] = useState("");
    const [newJdSeniority, setNewJdSeniority] = useState("");
    const [newJdContent, setNewJdContent] = useState("");
    const [creatingJd, setCreatingJd] = useState(false);
    const [aiParsing, setAiParsing] = useState(false);
    const [isPositionOpen, setIsPositionOpen] = useState(false);
    const positionRef = useRef<HTMLDivElement>(null);

    // close position dropdown on outside click
    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (positionRef.current && !positionRef.current.contains(e.target as Node)) setIsPositionOpen(false);
        }
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, []);

    const filteredPositions = IT_POSITIONS.filter((p) =>
        !newJdTitle || p.toLowerCase().includes(newJdTitle.toLowerCase())
    );
    const aiSuggestions = getSuggestedPositions(newJdTitle).filter((p) => !filteredPositions.includes(p));
    const showDropdown = isPositionOpen && (filteredPositions.length > 0 || aiSuggestions.length > 0);

    function selectPosition(pos: string) { setNewJdTitle(pos); setIsPositionOpen(false); }

    async function handleCreateJd() {
        if (!newJdTitle.trim()) return;
        if (newJdContent.length > 20000) { toast.error("JD content too long (max 20,000 chars)"); return; }
        setCreatingJd(true);
        try {
            const res = await fetch("/api/recruitment/job-descriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newJdTitle.trim(), department: newJdDept.trim() || null, seniority: newJdSeniority || null, full_text: newJdContent.trim() || "" }),
            });
            if (!res.ok) { const { error } = await res.json(); throw new Error(error ?? "Failed to create JD"); }
            const { jobDescription } = await res.json();
            onCreated({ id: jobDescription.id, title: newJdTitle.trim(), department: newJdDept.trim() || null });
            toast.success("Job Description created");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create JD");
        } finally { setCreatingJd(false); }
    }

    async function handleAiParse() {
        if (!newJdContent.trim() || newJdContent.trim().length < 10) {
            toast.error("Nhập mô tả công việc trước khi dùng AI (tối thiểu 10 ký tự)");
            return;
        }
        setAiParsing(true);
        try {
            const res = await fetch("/api/recruitment/jd-parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jdText: newJdContent.trim() }),
            });
            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error ?? "AI parsing failed");
            }
            const { title, seniority, cleanedJd } = await res.json();
            if (title) setNewJdTitle(title);
            if (seniority) setNewJdSeniority(seniority);
            if (cleanedJd) setNewJdContent(cleanedJd);
            toast.success(`AI đã nhận diện: ${title || "—"}${seniority ? ` (${seniority})` : ""}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "AI parsing failed");
        } finally { setAiParsing(false); }
    }

    return (
        <div className="relative bg-gradient-to-b from-background to-background border border-warning/30 rounded-2xl overflow-visible shadow-[0_8px_32px_color-mix(in_srgb,var(--warning)_10%,transparent)]">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-warning/80 to-transparent rounded-t-2xl" />
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-warning/10">
                <div className="w-6 h-6 rounded-lg bg-warning/10 border border-warning/25 flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5 text-warning" />
                </div>
                <span className="text-xs font-semibold text-foreground tracking-wide">Tạo Job Description mới</span>
            </div>
            <div className="p-4 space-y-2.5">
                {/* Full JD textarea — FIRST so user can paste JD then AI parse */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Mô tả công việc <span className="text-danger">*</span></Label>
                        <button
                            type="button"
                            onClick={handleAiParse}
                            disabled={aiParsing || !newJdContent.trim() || newJdContent.trim().length < 10}
                            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer bg-gradient-to-r from-primary/10 to-ai/10 border-primary/30 text-primary hover:from-primary/20 hover:to-ai/20 hover:border-primary/60 hover:shadow-[0_0_14px_color-mix(in_srgb,var(--primary)_25%,transparent)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {aiParsing ? (
                                <><span className="w-3 h-3 rounded-full border-2 border-primary/30 border-t-border animate-spin inline-block" />Đang phân tích…</>
                            ) : (
                                <><Wand2 className="w-3 h-3" />AI Auto-detect</>
                            )}
                        </button>
                    </div>
                    <textarea value={newJdContent} onChange={(e) => setNewJdContent(e.target.value)}
                        placeholder="Dán mô tả công việc vào đây, sau đó bấm AI Auto-detect để tự động điền các trường bên dưới…"
                        rows={4}
                        className={`w-full bg-background/70 border text-foreground text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none transition-all ${!newJdContent.trim() ? "border-danger/40" : "border-muted-foreground/15 focus:border-background/50"
                            } placeholder:text-muted-foreground`} />
                    <p className="text-[10px] text-muted-foreground text-right mt-0.5">{newJdContent.length} / 20,000</p>
                </div>

                {/* Position combobox */}
                <div ref={positionRef} className="relative space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Tên vị trí <span className="text-danger">*</span></Label>
                    <div className="relative">
                        <input
                            value={newJdTitle}
                            onChange={(e) => { setNewJdTitle(e.target.value); setIsPositionOpen(true); }}
                            onFocus={() => setIsPositionOpen(true)}
                            placeholder="Ví dụ: Senior Frontend Engineer"
                            className={`w-full h-9 pl-3 pr-8 bg-background/70 border text-foreground text-sm rounded-xl focus:outline-none transition-all ${!newJdTitle.trim() ? "border-danger/40" : "border-muted-foreground/15 focus:border-background/50"
                                } placeholder:text-muted-foreground`}
                        />
                        <button type="button" onClick={() => setIsPositionOpen((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isPositionOpen ? "rotate-180" : ""}`} />
                        </button>
                    </div>

                    {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-muted rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-50 max-h-[220px] overflow-y-auto">
                            {/* AI suggestions */}
                            {aiSuggestions.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI gợi ý</span>
                                    </div>
                                    {aiSuggestions.map((pos) => (
                                        <button key={pos} type="button" onMouseDown={() => selectPosition(pos)}
                                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-primary/12 flex items-center gap-2.5 cursor-pointer transition-colors">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{pos}
                                        </button>
                                    ))}
                                    {filteredPositions.length > 0 && <div className="border-t border-muted mx-3 my-1" />}
                                </div>
                            )}
                            {/* Preset list */}
                            {filteredPositions.length > 0 && (
                                <div>
                                    <div className="px-3 pt-2 pb-1">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vị trí IT</span>
                                    </div>
                                    {filteredPositions.map((pos) => (
                                        <button key={pos} type="button" onMouseDown={() => selectPosition(pos)}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-muted-foreground/8 cursor-pointer transition-colors ${newJdTitle === pos ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Department + Seniority */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Phòng ban</Label>
                        <CustomSelectDropdown
                            value={newJdDept}
                            onChange={setNewJdDept}
                            options={deptOptions}
                            placeholder="Chọn phòng ban…"
                            allowCustomInput
                            accentColor="var(--warning)"
                            placement="top"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Cấp bậc <span className="text-danger">*</span></Label>
                        <CustomSelectDropdown
                            value={newJdSeniority}
                            onChange={setNewJdSeniority}
                            options={SENIORITY_OPTIONS}
                            placeholder="Chọn cấp bậc…"
                            error={!newJdSeniority}
                            placement="top"
                        />
                    </div>
                </div>


                <Button size="sm" onClick={handleCreateJd} disabled={!newJdTitle.trim() || !newJdSeniority || !newJdContent.trim() || creatingJd}
                    className="w-full h-9 bg-gradient-to-r from-success to-success hover:from-success hover:to-success text-white rounded-xl text-xs font-bold cursor-pointer shadow-[0_4px_16px_color-mix(in_srgb,var(--success)_25%,transparent)] hover:shadow-[0_4px_22px_color-mix(in_srgb,var(--success)_40%,transparent)] disabled:opacity-40 disabled:shadow-none transition-all duration-200 border-none">
                    {creatingJd ? (
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border-2 border-border border-t-white animate-spin inline-block" />Đang tạo…
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Tạo &amp; Chọn JD</span>
                    )}
                </Button>
            </div>
        </div>
    );
}
